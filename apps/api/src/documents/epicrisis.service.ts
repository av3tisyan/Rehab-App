import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, isNull } from 'drizzle-orm';
import { DB } from '../db/db.module';
import type { Database } from '../db/client';
import {
  assessmentTypes,
  assessments,
  documents,
  encounters,
  episodes,
  patients,
} from '../db/schema';
import type { AuthUser } from '../common/auth-user';
import { ComparisonService, type MetricComparison } from '../assessments/comparison.service';
import { GoalsService } from '../goals/goals.service';

interface EpicrisisSection {
  code: string;
  name: string;
  unit: string | null;
  metrics: MetricComparison[];
}

export interface EpicrisisContent {
  generatedAt: string;
  patient: { name: string; heightCm: string | null; dominantHand: string | null };
  episode: { title: string; diagnosis: string | null; startedAt: string; dischargedAt: string | null };
  summary: { improved: number; declined: number; unchanged: number; sessions: number };
  sections: EpicrisisSection[];
  goals: { description: string; status: string }[];
}

@Injectable()
export class EpicrisisService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly comparison: ComparisonService,
    private readonly goals: GoalsService,
  ) {}

  /** Generates a discharge epicrisis document from all collected data. */
  async generate(user: AuthUser, episodeId: string) {
    const [row] = await this.db
      .select({
        episodeTitle: episodes.title,
        diagnosis: episodes.diagnosis,
        startedAt: episodes.startedAt,
        dischargedAt: episodes.dischargedAt,
        firstName: patients.firstName,
        lastName: patients.lastName,
        heightCm: patients.heightCm,
        dominantHand: patients.dominantHand,
      })
      .from(episodes)
      .innerJoin(patients, eq(patients.id, episodes.patientId))
      .where(
        and(
          eq(episodes.id, episodeId),
          eq(episodes.clinicId, user.clinicId),
          isNull(episodes.deletedAt),
        ),
      )
      .limit(1);
    if (!row) throw new NotFoundException('Episode not found');

    // Distinct assessment types that actually have data for this episode.
    const typesWithData = await this.db
      .selectDistinct({
        code: assessmentTypes.code,
        name: assessmentTypes.name,
        unit: assessmentTypes.unit,
      })
      .from(assessments)
      .innerJoin(assessmentTypes, eq(assessmentTypes.id, assessments.assessmentTypeId))
      .where(and(eq(assessments.episodeId, episodeId), isNull(assessments.deletedAt)));

    const sections: EpicrisisSection[] = [];
    let improved = 0;
    let declined = 0;
    let unchanged = 0;

    for (const type of typesWithData) {
      const result = await this.comparison.compare(user, episodeId, type.code);
      if (result.metrics.length === 0) continue;
      sections.push({ code: type.code, name: type.name, unit: type.unit, metrics: result.metrics });
      for (const m of result.metrics) {
        if (m.direction === 'improvement') improved += 1;
        else if (m.direction === 'decline') declined += 1;
        else if (m.direction === 'unchanged') unchanged += 1;
      }
    }

    const sessions = await this.countSessions(episodeId);
    const goalRows = await this.goals.listByEpisode(user, episodeId);

    const content: EpicrisisContent = {
      generatedAt: new Date().toISOString(),
      patient: {
        name: `${row.lastName} ${row.firstName}`,
        heightCm: row.heightCm,
        dominantHand: row.dominantHand,
      },
      episode: {
        title: row.episodeTitle,
        diagnosis: row.diagnosis,
        startedAt: row.startedAt,
        dischargedAt: row.dischargedAt,
      },
      summary: { improved, declined, unchanged, sessions },
      sections,
      goals: goalRows.map((g) => ({ description: g.description, status: g.status })),
    };

    const renderedText = this.renderProse(content);

    const [doc] = await this.db
      .insert(documents)
      .values({
        clinicId: user.clinicId,
        episodeId,
        type: 'epicrisis',
        title: `Epicrisis — ${row.episodeTitle}`,
        content: content as unknown as Record<string, unknown>,
        renderedText,
        createdBy: user.userId,
      })
      .returning();
    return doc!;
  }

  private async countSessions(episodeId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(encounters)
      .where(and(eq(encounters.episodeId, episodeId), isNull(encounters.deletedAt)));
    return row?.n ?? 0;
  }

  private renderProse(c: EpicrisisContent): string {
    const lines: string[] = [];
    lines.push(`Discharge epicrisis for ${c.patient.name}.`);
    lines.push(`Case: ${c.episode.title}${c.episode.diagnosis ? ` (${c.episode.diagnosis})` : ''}.`);
    lines.push(
      `Course of treatment: ${c.summary.sessions} session(s) from ${c.episode.startedAt}` +
        `${c.episode.dischargedAt ? ` to ${c.episode.dischargedAt}` : ''}.`,
    );
    lines.push('');
    for (const s of c.sections) {
      lines.push(`${s.name}:`);
      for (const m of s.metrics) {
        const label = [m.bodyRegion, m.measureKind, m.side !== 'not_applicable' ? m.side : null]
          .filter(Boolean)
          .join(' ');
        const unit = s.unit ? ` ${s.unit}` : '';
        const change =
          m.delta === null
            ? ''
            : ` (${m.delta > 0 ? '+' : ''}${m.delta}${unit}${m.pctChange !== null ? `, ${m.pctChange}%` : ''}, ${m.direction})`;
        lines.push(`  • ${label || s.name}: ${m.baseline ?? '—'} → ${m.latest ?? '—'}${unit}${change}`);
      }
      lines.push('');
    }
    lines.push(
      `Summary: ${c.summary.improved} improved, ${c.summary.declined} declined, ${c.summary.unchanged} unchanged.`,
    );
    if (c.goals.length > 0) {
      lines.push('');
      lines.push('Treatment goals:');
      for (const g of c.goals) lines.push(`  • ${g.description} — ${g.status}`);
    }
    return lines.join('\n');
  }
}
