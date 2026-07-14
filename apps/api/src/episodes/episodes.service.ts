import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { DB } from '../db/db.module';
import type { Database } from '../db/client';
import { episodes, patients, type Episode } from '../db/schema';
import type { AuthUser } from '../common/auth-user';
import type { CreateEpisodeDto, UpdateEpisodeDto } from './dto/episode.dto';

@Injectable()
export class EpisodesService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async listByPatient(user: AuthUser, patientId: string): Promise<Episode[]> {
    return this.db
      .select()
      .from(episodes)
      .where(
        and(
          eq(episodes.patientId, patientId),
          eq(episodes.clinicId, user.clinicId),
          isNull(episodes.deletedAt),
        ),
      )
      .orderBy(desc(episodes.startedAt));
  }

  async get(user: AuthUser, id: string): Promise<Episode> {
    const [row] = await this.db
      .select()
      .from(episodes)
      .where(
        and(
          eq(episodes.id, id),
          eq(episodes.clinicId, user.clinicId),
          isNull(episodes.deletedAt),
        ),
      )
      .limit(1);
    if (!row) throw new NotFoundException('Episode not found');
    return row;
  }

  async create(user: AuthUser, dto: CreateEpisodeDto): Promise<Episode> {
    // Ensure the referenced patient belongs to the caller's clinic.
    const [patient] = await this.db
      .select({ id: patients.id })
      .from(patients)
      .where(
        and(
          eq(patients.id, dto.patientId),
          eq(patients.clinicId, user.clinicId),
          isNull(patients.deletedAt),
        ),
      )
      .limit(1);
    if (!patient) throw new BadRequestException('Patient not found in this clinic');

    const [row] = await this.db
      .insert(episodes)
      .values({
        clinicId: user.clinicId,
        patientId: dto.patientId,
        title: dto.title,
        primaryComplaint: dto.primaryComplaint ?? null,
        diagnosis: dto.diagnosis ?? null,
        icd10Code: dto.icd10Code ?? null,
        status: dto.status ?? 'active',
        ...(dto.startedAt && { startedAt: dto.startedAt }),
        assignedUserId: user.userId,
      })
      .returning();
    return row!;
  }

  async update(user: AuthUser, id: string, dto: UpdateEpisodeDto): Promise<Episode> {
    await this.get(user, id);
    const [row] = await this.db
      .update(episodes)
      .set({
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.primaryComplaint !== undefined && { primaryComplaint: dto.primaryComplaint }),
        ...(dto.diagnosis !== undefined && { diagnosis: dto.diagnosis }),
        ...(dto.icd10Code !== undefined && { icd10Code: dto.icd10Code }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.startedAt !== undefined && { startedAt: dto.startedAt }),
        ...(dto.dischargedAt !== undefined && { dischargedAt: dto.dischargedAt }),
        updatedAt: new Date(),
      })
      .where(and(eq(episodes.id, id), eq(episodes.clinicId, user.clinicId)))
      .returning();
    return row!;
  }

  async softDelete(user: AuthUser, id: string): Promise<{ id: string; deleted: true }> {
    await this.get(user, id);
    await this.db
      .update(episodes)
      .set({ deletedAt: new Date() })
      .where(and(eq(episodes.id, id), eq(episodes.clinicId, user.clinicId)));
    return { id, deleted: true };
  }
}
