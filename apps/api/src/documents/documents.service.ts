import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { DocumentType } from '@rehab/shared';
import { DB } from '../db/db.module';
import type { Database } from '../db/client';
import { documents, episodes } from '../db/schema';
import type { AuthUser } from '../common/auth-user';
import type { UpsertDocumentDto } from './dto/document.dto';

@Injectable()
export class DocumentsService {
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

  async listByEpisode(user: AuthUser, episodeId: string, type?: DocumentType) {
    return this.db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.episodeId, episodeId),
          eq(documents.clinicId, user.clinicId),
          type ? eq(documents.type, type) : undefined,
          isNull(documents.deletedAt),
        ),
      )
      .orderBy(desc(documents.updatedAt));
  }

  /** Latest non-deleted document of a type for the episode (or null). */
  async getLatest(user: AuthUser, episodeId: string, type: DocumentType) {
    const [row] = await this.listByEpisode(user, episodeId, type);
    return row ?? null;
  }

  /**
   * Single-instance anamnesis/note per type per episode: update the existing
   * one in place, otherwise insert. (Epicrisis versions are created separately.)
   */
  async upsert(user: AuthUser, dto: UpsertDocumentDto) {
    await this.assertEpisode(user, dto.episodeId);
    const existing = await this.getLatest(user, dto.episodeId, dto.type);

    if (existing) {
      const [row] = await this.db
        .update(documents)
        .set({ content: dto.content, title: dto.title ?? existing.title, updatedAt: new Date() })
        .where(and(eq(documents.id, existing.id), eq(documents.clinicId, user.clinicId)))
        .returning();
      return row!;
    }

    const [row] = await this.db
      .insert(documents)
      .values({
        clinicId: user.clinicId,
        episodeId: dto.episodeId,
        type: dto.type,
        title: dto.title ?? null,
        content: dto.content,
        createdBy: user.userId,
      })
      .returning();
    return row!;
  }
}
