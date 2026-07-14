import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, ilike, isNull, or, type SQL } from 'drizzle-orm';
import { DB } from '../db/db.module';
import type { Database } from '../db/client';
import { patients, type Patient } from '../db/schema';
import type { AuthUser } from '../common/auth-user';
import type { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';

@Injectable()
export class PatientsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async list(user: AuthUser, search?: string): Promise<Patient[]> {
    const filters: SQL[] = [eq(patients.clinicId, user.clinicId), isNull(patients.deletedAt)];
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      const nameMatch = or(ilike(patients.firstName, term), ilike(patients.lastName, term));
      if (nameMatch) filters.push(nameMatch);
    }
    return this.db
      .select()
      .from(patients)
      .where(and(...filters))
      .orderBy(desc(patients.createdAt))
      .limit(200);
  }

  async get(user: AuthUser, id: string): Promise<Patient> {
    const [row] = await this.db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.id, id),
          eq(patients.clinicId, user.clinicId),
          isNull(patients.deletedAt),
        ),
      )
      .limit(1);
    if (!row) throw new NotFoundException('Patient not found');
    return row;
  }

  async create(user: AuthUser, dto: CreatePatientDto): Promise<Patient> {
    const [row] = await this.db
      .insert(patients)
      .values({
        clinicId: user.clinicId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: dto.dateOfBirth ?? null,
        sex: dto.sex ?? 'unknown',
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        referringPhysician: dto.referringPhysician ?? null,
        heightCm: dto.heightCm !== undefined ? String(dto.heightCm) : null,
        bloodType: dto.bloodType ?? null,
        dominantHand: dto.dominantHand ?? null,
        notes: dto.notes ?? null,
        createdBy: user.userId,
      })
      .returning();
    return row!;
  }

  async update(user: AuthUser, id: string, dto: UpdatePatientDto): Promise<Patient> {
    await this.get(user, id); // ensures tenant ownership + existence
    const [row] = await this.db
      .update(patients)
      .set({
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.dateOfBirth !== undefined && { dateOfBirth: dto.dateOfBirth }),
        ...(dto.sex !== undefined && { sex: dto.sex }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.referringPhysician !== undefined && {
          referringPhysician: dto.referringPhysician,
        }),
        ...(dto.heightCm !== undefined && {
          heightCm: (dto.heightCm as number | null) === null ? null : String(dto.heightCm),
        }),
        ...(dto.bloodType !== undefined && { bloodType: dto.bloodType }),
        ...(dto.dominantHand !== undefined && { dominantHand: dto.dominantHand }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        updatedAt: new Date(),
      })
      .where(and(eq(patients.id, id), eq(patients.clinicId, user.clinicId)))
      .returning();
    return row!;
  }

  async softDelete(user: AuthUser, id: string): Promise<{ id: string; deleted: true }> {
    await this.get(user, id);
    await this.db
      .update(patients)
      .set({ deletedAt: new Date() })
      .where(and(eq(patients.id, id), eq(patients.clinicId, user.clinicId)));
    return { id, deleted: true };
  }
}
