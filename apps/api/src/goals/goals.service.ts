import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { DB } from '../db/db.module';
import type { Database } from '../db/client';
import { episodes, treatmentGoals, type TreatmentGoal } from '../db/schema';
import type { AuthUser } from '../common/auth-user';
import type { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';

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

  async listByEpisode(user: AuthUser, episodeId: string): Promise<TreatmentGoal[]> {
    return this.db
      .select()
      .from(treatmentGoals)
      .where(and(eq(treatmentGoals.episodeId, episodeId), eq(treatmentGoals.clinicId, user.clinicId)))
      .orderBy(asc(treatmentGoals.createdAt));
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
