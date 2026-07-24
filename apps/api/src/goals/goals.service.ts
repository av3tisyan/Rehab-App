import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, isNull, type SQL } from 'drizzle-orm';
import { DB } from '../db/db.module';
import type { Database } from '../db/client';
import {
  assessmentTypes,
  assessments,
  episodes,
  treatmentGoals,
  type TreatmentGoal,
} from '../db/schema';
import type { AuthUser } from '../common/auth-user';
import type { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';

export interface GoalWithProgress extends TreatmentGoal {
  currentValue: number | null;
  baselineValue: number | null;
}

export interface TrackedMetric {
  typeCode: string;
  typeName: string;
  unit: string | null;
  bodyRegion: string | null;
  side: string;
  measureKind: string | null;
  latestValue: number | null;
}

@Injectable()
export class GoalsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  private async assertEpisode(user: AuthUser, episodeId: string): Promise<void> {
    const [ep] = await this.db
      .select({ id: episodes.id })
      .from(episodes)
      .where(
        and(
          eq(episodes.id, episodeId),
          eq(episodes.clinicId, user.clinicId),
          isNull(episodes.deletedAt),
        ),
      )
      .limit(1);
    if (!ep) throw new BadRequestException('Episode not found in this clinic');
  }

  async listByEpisode(user: AuthUser, episodeId: string): Promise<GoalWithProgress[]> {
    const goals = await this.db
      .select()
      .from(treatmentGoals)
      .where(
        and(eq(treatmentGoals.episodeId, episodeId), eq(treatmentGoals.clinicId, user.clinicId)),
      )
      .orderBy(asc(treatmentGoals.createdAt));

    return Promise.all(
      goals.map(async (g) => {
        if (!g.metricTypeCode) return { ...g, currentValue: null, baselineValue: null };
        const { baseline, current } = await this.metricEndpoints(episodeId, g);
        return { ...g, currentValue: current, baselineValue: baseline };
      }),
    );
  }

  /** Earliest (baseline) and latest (current) values for a goal's linked metric. */
  private async metricEndpoints(
    episodeId: string,
    g: TreatmentGoal,
  ): Promise<{ baseline: number | null; current: number | null }> {
    const conds: SQL[] = [
      eq(assessments.episodeId, episodeId),
      isNull(assessments.deletedAt),
      eq(assessmentTypes.code, g.metricTypeCode!),
      g.metricBodyRegion
        ? eq(assessments.bodyRegion, g.metricBodyRegion)
        : isNull(assessments.bodyRegion),
      g.metricMeasureKind
        ? eq(assessments.measureKind, g.metricMeasureKind)
        : isNull(assessments.measureKind),
    ];
    if (g.metricSide) conds.push(eq(assessments.side, g.metricSide));

    const rows = await this.db
      .select({ v: assessments.primaryValue, at: assessments.measuredAt })
      .from(assessments)
      .innerJoin(assessmentTypes, eq(assessmentTypes.id, assessments.assessmentTypeId))
      .where(and(...conds))
      .orderBy(asc(assessments.measuredAt));

    if (rows.length === 0) return { baseline: null, current: null };
    const baseline = rows[0]!.v;
    const current = rows[rows.length - 1]!.v;
    return { baseline: baseline !== null ? Number(baseline) : null, current: current !== null ? Number(current) : null };
  }

  /** Distinct metrics that have data in this episode, with their latest value. */
  async getTrackedMetrics(user: AuthUser, episodeId: string): Promise<TrackedMetric[]> {
    await this.assertEpisode(user, episodeId);
    const rows = await this.db
      .select({
        code: assessmentTypes.code,
        name: assessmentTypes.name,
        unit: assessmentTypes.unit,
        bodyRegion: assessments.bodyRegion,
        side: assessments.side,
        measureKind: assessments.measureKind,
        value: assessments.primaryValue,
        at: assessments.measuredAt,
      })
      .from(assessments)
      .innerJoin(assessmentTypes, eq(assessmentTypes.id, assessments.assessmentTypeId))
      .where(and(eq(assessments.episodeId, episodeId), isNull(assessments.deletedAt)))
      .orderBy(asc(assessments.measuredAt));

    // Group into distinct metrics; keep the latest value (rows are asc by date).
    const map = new Map<string, TrackedMetric>();
    for (const r of rows) {
      const key = `${r.code}|${r.bodyRegion ?? ''}|${r.side}|${r.measureKind ?? ''}`;
      map.set(key, {
        typeCode: r.code,
        typeName: r.name,
        unit: r.unit,
        bodyRegion: r.bodyRegion,
        side: r.side,
        measureKind: r.measureKind,
        latestValue: r.value !== null ? Number(r.value) : null,
      });
    }
    return [...map.values()];
  }

  async create(user: AuthUser, dto: CreateGoalDto): Promise<TreatmentGoal> {
    await this.assertEpisode(user, dto.episodeId);
    const [row] = await this.db
      .insert(treatmentGoals)
      .values({
        clinicId: user.clinicId,
        episodeId: dto.episodeId,
        description: dto.description,
        targetValue: dto.targetValue !== undefined ? String(dto.targetValue) : null,
        targetDate: dto.targetDate ?? null,
        status: dto.status ?? 'open',
        metricTypeCode: dto.metricTypeCode ?? null,
        metricBodyRegion: dto.metricBodyRegion ?? null,
        metricSide: dto.metricSide ?? null,
        metricMeasureKind: dto.metricMeasureKind ?? null,
      })
      .returning();
    return row!;
  }

  async update(user: AuthUser, id: string, dto: UpdateGoalDto): Promise<TreatmentGoal> {
    const [row] = await this.db
      .update(treatmentGoals)
      .set({
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.targetValue !== undefined && { targetValue: String(dto.targetValue) }),
        ...(dto.targetDate !== undefined && { targetDate: dto.targetDate }),
        ...(dto.status !== undefined && { status: dto.status }),
        updatedAt: new Date(),
      })
      .where(and(eq(treatmentGoals.id, id), eq(treatmentGoals.clinicId, user.clinicId)))
      .returning();
    if (!row) throw new NotFoundException('Goal not found');
    return row;
  }
}
