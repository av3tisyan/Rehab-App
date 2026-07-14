import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { DB } from '../db/db.module';
import type { Database } from '../db/client';
import { encounters, episodes, type Encounter } from '../db/schema';
import type { AuthUser } from '../common/auth-user';
import type { CreateEncounterDto, UpdateEncounterDto } from './dto/encounter.dto';

@Injectable()
export class EncountersService {
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

  async listByEpisode(user: AuthUser, episodeId: string): Promise<Encounter[]> {
    return this.db
      .select()
      .from(encounters)
      .where(
        and(
          eq(encounters.episodeId, episodeId),
          eq(encounters.clinicId, user.clinicId),
          isNull(encounters.deletedAt),
        ),
      )
      .orderBy(desc(encounters.encounterDate));
  }

  async get(user: AuthUser, id: string): Promise<Encounter> {
    const [row] = await this.db
      .select()
      .from(encounters)
      .where(
        and(
          eq(encounters.id, id),
          eq(encounters.clinicId, user.clinicId),
          isNull(encounters.deletedAt),
        ),
      )
      .limit(1);
    if (!row) throw new NotFoundException('Encounter not found');
    return row;
  }

  async create(user: AuthUser, dto: CreateEncounterDto): Promise<Encounter> {
    await this.assertEpisode(user, dto.episodeId);
    const [row] = await this.db
      .insert(encounters)
      .values({
        clinicId: user.clinicId,
        episodeId: dto.episodeId,
        clinicianId: user.userId,
        ...(dto.encounterDate && { encounterDate: new Date(dto.encounterDate) }),
        sessionNumber: dto.sessionNumber ?? null,
        subjective: dto.subjective ?? null,
        notes: dto.notes ?? null,
      })
      .returning();
    return row!;
  }

  async update(user: AuthUser, id: string, dto: UpdateEncounterDto): Promise<Encounter> {
    await this.get(user, id);
    const [row] = await this.db
      .update(encounters)
      .set({
        ...(dto.encounterDate !== undefined && { encounterDate: new Date(dto.encounterDate) }),
        ...(dto.sessionNumber !== undefined && { sessionNumber: dto.sessionNumber }),
        ...(dto.subjective !== undefined && { subjective: dto.subjective }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        updatedAt: new Date(),
      })
      .where(and(eq(encounters.id, id), eq(encounters.clinicId, user.clinicId)))
      .returning();
    return row!;
  }

  async softDelete(user: AuthUser, id: string): Promise<{ id: string; deleted: true }> {
    await this.get(user, id);
    await this.db
      .update(encounters)
      .set({ deletedAt: new Date() })
      .where(and(eq(encounters.id, id), eq(encounters.clinicId, user.clinicId)));
    return { id, deleted: true };
  }
}
