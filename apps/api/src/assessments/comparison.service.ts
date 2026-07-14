import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { compareMetric, type Direction } from '@rehab/shared';
import { DB } from '../db/db.module';
import type { Database } from '../db/client';
import { assessmentTypes, episodes } from '../db/schema';
import type { AuthUser } from '../common/auth-user';

export interface MetricComparison {
  bodyRegion: string | null;
  side: string;
  measureKind: string | null;
  baseline: number | null;
  latest: number | null;
  baselineAt: string | null;
  latestAt: string | null;
  delta: number | null;
  pctChange: number | null;
  direction: Direction;
}

export interface TrendSeries {
  bodyRegion: string | null;
  side: string;
  measureKind: string | null;
  points: { value: number; measuredAt: string }[];
}

export interface ComparisonResponse {
  episodeId: string;
  type: { code: string; name: string; unit: string | null; higherIsBetter: boolean; isDirectional: boolean };
  metrics: MetricComparison[];
  series: TrendSeries[];
}

@Injectable()
export class ComparisonService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async compare(
    user: AuthUser,
    episodeId: string,
    typeCode: string,
    bodyRegion?: string,
  ): Promise<ComparisonResponse> {
    await this.assertEpisode(user, episodeId);

    const [type] = await this.db
      .select({
        code: assessmentTypes.code,
        name: assessmentTypes.name,
        unit: assessmentTypes.unit,
        higherIsBetter: assessmentTypes.higherIsBetter,
        isDirectional: assessmentTypes.isDirectional,
      })
      .from(assessmentTypes)
      .where(eq(assessmentTypes.code, typeCode))
      .limit(1);
    if (!type) throw new BadRequestException(`Unknown assessment type "${typeCode}"`);

    const region = bodyRegion ?? null;

    // Baseline (earliest) and latest per (body_region, side, measure_kind).
    const endpoints = await this.db.execute<{
      body_region: string | null;
      side: string;
      measure_kind: string | null;
      baseline: string | null;
      baseline_at: string | null;
      latest: string | null;
      latest_at: string | null;
    }>(sql`
      SELECT body_region, side, measure_kind, baseline, baseline_at, latest, latest_at
      FROM (
        SELECT a.body_region, a.side, a.measure_kind,
               first_value(a.primary_value) OVER w AS baseline,
               first_value(a.measured_at)   OVER w AS baseline_at,
               last_value(a.primary_value)  OVER w AS latest,
               last_value(a.measured_at)    OVER w AS latest_at,
               row_number() OVER w AS rn
        FROM assessments a
        JOIN assessment_types t ON t.id = a.assessment_type_id
        WHERE a.episode_id = ${episodeId}
          AND t.code = ${typeCode}
          AND a.deleted_at IS NULL
          AND a.primary_value IS NOT NULL
          AND (${region}::text IS NULL OR a.body_region = ${region})
        WINDOW w AS (
          PARTITION BY a.body_region, a.side, a.measure_kind
          ORDER BY a.measured_at
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        )
      ) s
      WHERE rn = 1
      ORDER BY body_region, side, measure_kind
    `);

    const typeInfo = { higherIsBetter: type.higherIsBetter, isDirectional: type.isDirectional };
    const metrics: MetricComparison[] = endpoints.rows.map((r) => {
      const baseline = num(r.baseline);
      const latest = num(r.latest);
      const c = compareMetric({ baseline, latest }, typeInfo);
      return {
        bodyRegion: r.body_region,
        side: r.side,
        measureKind: r.measure_kind,
        baseline: c.baseline,
        latest: c.latest,
        baselineAt: r.baseline_at,
        latestAt: r.latest_at,
        delta: c.delta,
        pctChange: c.pctChange,
        direction: c.direction,
      };
    });

    // Full trend series for charting.
    const trend = await this.db.execute<{
      body_region: string | null;
      side: string;
      measure_kind: string | null;
      primary_value: string;
      measured_at: string;
    }>(sql`
      SELECT a.body_region, a.side, a.measure_kind, a.primary_value, a.measured_at
      FROM assessments a
      JOIN assessment_types t ON t.id = a.assessment_type_id
      WHERE a.episode_id = ${episodeId}
        AND t.code = ${typeCode}
        AND a.deleted_at IS NULL
        AND a.primary_value IS NOT NULL
        AND (${region}::text IS NULL OR a.body_region = ${region})
      ORDER BY a.body_region, a.side, a.measure_kind, a.measured_at ASC
    `);

    const series = this.groupSeries(trend.rows);

    return {
      episodeId,
      type: {
        code: type.code,
        name: type.name,
        unit: type.unit,
        higherIsBetter: type.higherIsBetter,
        isDirectional: type.isDirectional,
      },
      metrics,
      series,
    };
  }

  private groupSeries(
    rows: {
      body_region: string | null;
      side: string;
      measure_kind: string | null;
      primary_value: string;
      measured_at: string;
    }[],
  ): TrendSeries[] {
    const map = new Map<string, TrendSeries>();
    for (const r of rows) {
      const key = `${r.body_region ?? ''}|${r.side}|${r.measure_kind ?? ''}`;
      let s = map.get(key);
      if (!s) {
        s = { bodyRegion: r.body_region, side: r.side, measureKind: r.measure_kind, points: [] };
        map.set(key, s);
      }
      s.points.push({ value: Number(r.primary_value), measuredAt: r.measured_at });
    }
    return [...map.values()];
  }

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
    if (!ep) throw new NotFoundException('Episode not found');
  }
}

function num(v: string | null): number | null {
  return v === null ? null : Number(v);
}
