import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { DB } from '../db/db.module';
import type { Database } from '../db/client';
import { assessmentTypes, assessments, encounters, type Assessment } from '../db/schema';
import type { AuthUser } from '../common/auth-user';
import type { AssessmentItemDto, CreateAssessmentBulkDto } from './dto/assessment.dto';
import { extractPrimaryValue } from './extract';

interface TypeMeta {
  id: string;
  minValue: number | null;
  maxValue: number | null;
  isComputed: boolean;
}

@Injectable()
export class AssessmentsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  private async getEncounterContext(
    user: AuthUser,
    encounterId: string,
  ): Promise<{ episodeId: string; encounterDate: Date }> {
    const [enc] = await this.db
      .select({
        episodeId: encounters.episodeId,
        encounterDate: encounters.encounterDate,
      })
      .from(encounters)
      .where(
        and(
          eq(encounters.id, encounterId),
          eq(encounters.clinicId, user.clinicId),
          isNull(encounters.deletedAt),
        ),
      )
      .limit(1);
    if (!enc) throw new BadRequestException('Encounter not found in this clinic');
    return { episodeId: enc.episodeId, encounterDate: enc.encounterDate };
  }

  private async loadTypes(codes: string[]): Promise<Map<string, TypeMeta>> {
    const unique = [...new Set(codes)];
    const rows = await this.db
      .select({
        code: assessmentTypes.code,
        id: assessmentTypes.id,
        minValue: assessmentTypes.minValue,
        maxValue: assessmentTypes.maxValue,
        isComputed: assessmentTypes.isComputed,
      })
      .from(assessmentTypes)
      .where(inArray(assessmentTypes.code, unique));

    const map = new Map<string, TypeMeta>();
    for (const r of rows) {
      map.set(r.code, {
        id: r.id,
        minValue: r.minValue !== null ? Number(r.minValue) : null,
        maxValue: r.maxValue !== null ? Number(r.maxValue) : null,
        isComputed: r.isComputed,
      });
    }
    return map;
  }

  async createBulk(user: AuthUser, dto: CreateAssessmentBulkDto): Promise<Assessment[]> {
    if (dto.items.length === 0) throw new BadRequestException('No measurements provided');

    const { episodeId, encounterDate } = await this.getEncounterContext(user, dto.encounterId);
    const types = await this.loadTypes(dto.items.map((i) => i.typeCode));

    const values = dto.items.map((item, idx) =>
      this.buildRow(user, dto.encounterId, episodeId, encounterDate, item, types, idx),
    );

    return this.db.insert(assessments).values(values).returning();
  }

  private buildRow(
    user: AuthUser,
    encounterId: string,
    episodeId: string,
    encounterDate: Date,
    item: AssessmentItemDto,
    types: Map<string, TypeMeta>,
    idx: number,
  ) {
    const meta = types.get(item.typeCode);
    if (!meta) {
      throw new BadRequestException(`Unknown assessment type "${item.typeCode}" (item ${idx})`);
    }
    if (meta.isComputed) {
      throw new BadRequestException(
        `"${item.typeCode}" is computed and cannot be entered directly (item ${idx})`,
      );
    }

    const primaryValue = extractPrimaryValue(item.typeCode, item.payload, item.primaryValue);
    if (primaryValue === null) {
      throw new BadRequestException(
        `Could not determine a numeric value for "${item.typeCode}" (item ${idx})`,
      );
    }
    if (meta.minValue !== null && primaryValue < meta.minValue) {
      throw new BadRequestException(
        `Value ${primaryValue} below minimum ${meta.minValue} for "${item.typeCode}" (item ${idx})`,
      );
    }
    if (meta.maxValue !== null && primaryValue > meta.maxValue) {
      throw new BadRequestException(
        `Value ${primaryValue} above maximum ${meta.maxValue} for "${item.typeCode}" (item ${idx})`,
      );
    }

    return {
      clinicId: user.clinicId,
      encounterId,
      episodeId,
      assessmentTypeId: meta.id,
      bodyRegion: item.bodyRegion ?? null,
      side: item.side ?? 'not_applicable',
      measureKind: item.measureKind ?? null,
      primaryValue: String(primaryValue),
      payload: item.payload ?? {},
      // Default to the encounter's date so baseline/latest order follows visit
      // chronology, even when data is entered after a back-dated visit.
      measuredAt: item.measuredAt ? new Date(item.measuredAt) : encounterDate,
      createdBy: user.userId,
    };
  }

  async listByEncounter(user: AuthUser, encounterId: string): Promise<Assessment[]> {
    return this.db
      .select()
      .from(assessments)
      .where(
        and(
          eq(assessments.encounterId, encounterId),
          eq(assessments.clinicId, user.clinicId),
          isNull(assessments.deletedAt),
        ),
      )
      .orderBy(desc(assessments.measuredAt));
  }

  async listByEpisode(user: AuthUser, episodeId: string): Promise<Assessment[]> {
    return this.db
      .select()
      .from(assessments)
      .where(
        and(
          eq(assessments.episodeId, episodeId),
          eq(assessments.clinicId, user.clinicId),
          isNull(assessments.deletedAt),
        ),
      )
      .orderBy(desc(assessments.measuredAt));
  }

  async softDelete(user: AuthUser, id: string): Promise<{ id: string; deleted: true }> {
    const [row] = await this.db
      .update(assessments)
      .set({ deletedAt: new Date() })
      .where(and(eq(assessments.id, id), eq(assessments.clinicId, user.clinicId)))
      .returning({ id: assessments.id });
    if (!row) throw new BadRequestException('Assessment not found');
    return { id, deleted: true };
  }
}
