import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, isNull } from 'drizzle-orm';
import type { EpisodeStatus } from '@rehab/shared';
import { DB } from '../db/db.module';
import type { Database } from '../db/client';
import { encounters, episodes, patients } from '../db/schema';
import type { AuthUser } from '../common/auth-user';

export interface DashboardOverview {
  activePatients: number;
  activeCases: number;
  onHoldCases: number;
  dischargedCases: number;
  recentSessions: {
    encounterId: string;
    episodeId: string;
    episodeTitle: string;
    patientId: string;
    patientName: string;
    sessionNumber: number | null;
    encounterDate: string;
  }[];
  recentDischarges: {
    episodeId: string;
    title: string;
    patientId: string;
    patientName: string;
    dischargedAt: string | null;
  }[];
}

@Injectable()
export class DashboardService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async getOverview(user: AuthUser): Promise<DashboardOverview> {
    const clinic = user.clinicId;

    const [[patientsCount], statusCounts, recentSessions, recentDischarges] = await Promise.all([
      this.db
        .select({ n: count() })
        .from(patients)
        .where(and(eq(patients.clinicId, clinic), isNull(patients.deletedAt))),
      this.db
        .select({ status: episodes.status, n: count() })
        .from(episodes)
        .where(and(eq(episodes.clinicId, clinic), isNull(episodes.deletedAt)))
        .groupBy(episodes.status),
      this.db
        .select({
          encounterId: encounters.id,
          episodeId: episodes.id,
          episodeTitle: episodes.title,
          patientId: patients.id,
          firstName: patients.firstName,
          lastName: patients.lastName,
          sessionNumber: encounters.sessionNumber,
          encounterDate: encounters.encounterDate,
        })
        .from(encounters)
        .innerJoin(episodes, eq(episodes.id, encounters.episodeId))
        .innerJoin(patients, eq(patients.id, episodes.patientId))
        .where(
          and(
            eq(encounters.clinicId, clinic),
            isNull(encounters.deletedAt),
            isNull(episodes.deletedAt),
            isNull(patients.deletedAt),
          ),
        )
        .orderBy(desc(encounters.encounterDate))
        .limit(8),
      this.db
        .select({
          episodeId: episodes.id,
          title: episodes.title,
          patientId: patients.id,
          firstName: patients.firstName,
          lastName: patients.lastName,
          dischargedAt: episodes.dischargedAt,
        })
        .from(episodes)
        .innerJoin(patients, eq(patients.id, episodes.patientId))
        .where(
          and(
            eq(episodes.clinicId, clinic),
            eq(episodes.status, 'discharged'),
            isNull(episodes.deletedAt),
            isNull(patients.deletedAt),
          ),
        )
        .orderBy(desc(episodes.dischargedAt))
        .limit(5),
    ]);

    const byStatus = (s: EpisodeStatus): number =>
      statusCounts.find((r) => r.status === s)?.n ?? 0;

    return {
      activePatients: patientsCount?.n ?? 0,
      activeCases: byStatus('active'),
      onHoldCases: byStatus('on_hold'),
      dischargedCases: byStatus('discharged'),
      recentSessions: recentSessions.map((r) => ({
        encounterId: r.encounterId,
        episodeId: r.episodeId,
        episodeTitle: r.episodeTitle,
        patientId: r.patientId,
        patientName: `${r.lastName} ${r.firstName}`,
        sessionNumber: r.sessionNumber,
        encounterDate: r.encounterDate.toISOString(),
      })),
      recentDischarges: recentDischarges.map((r) => ({
        episodeId: r.episodeId,
        title: r.title,
        patientId: r.patientId,
        patientName: `${r.lastName} ${r.firstName}`,
        dischargedAt: r.dischargedAt,
      })),
    };
  }
}
