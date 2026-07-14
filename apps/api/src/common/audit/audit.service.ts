import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';
import { DB } from '../../db/db.module';
import type { Database } from '../../db/client';
import { auditLog, users } from '../../db/schema';
import type { AuthUser } from '../auth-user';

export interface AuditEntry {
  clinicId: string | null;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  diff: unknown;
  ipAddress: string | null;
}

export interface AuditListFilters {
  entity?: string;
  entityId?: string;
  action?: string;
  userId?: string;
  from?: string; // ISO date
  to?: string; // ISO date
  limit?: number;
  offset?: number;
}

export interface AuditRow {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  diff: unknown;
  ipAddress: string | null;
  createdAt: string;
}

export interface ChainStatus {
  status: 'intact' | 'tampered';
  rowsChecked: number;
  firstBadId: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject(DB) private readonly db: Database) {}

  /** Best-effort audit write — never throws into the request path. */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.db.insert(auditLog).values({
        clinicId: entry.clinicId,
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        diff: entry.diff ?? null,
        ipAddress: entry.ipAddress,
      });
    } catch (err) {
      this.logger.error(`Failed to write audit log: ${(err as Error).message}`);
    }
  }

  /** Tenant-scoped, filtered, paginated read of the audit trail (admin only). */
  async list(user: AuthUser, filters: AuditListFilters): Promise<AuditRow[]> {
    const conditions: SQL[] = [eq(auditLog.clinicId, user.clinicId)];
    if (filters.entity) conditions.push(eq(auditLog.entity, filters.entity));
    if (filters.entityId) conditions.push(eq(auditLog.entityId, filters.entityId));
    if (filters.action) conditions.push(eq(auditLog.action, filters.action));
    if (filters.userId) conditions.push(eq(auditLog.userId, filters.userId));
    if (filters.from) conditions.push(gte(auditLog.createdAt, new Date(filters.from)));
    if (filters.to) conditions.push(lte(auditLog.createdAt, new Date(filters.to)));

    const limit = Math.min(filters.limit ?? 100, 500);
    const offset = filters.offset ?? 0;

    const rows = await this.db
      .select({
        id: auditLog.id,
        userId: auditLog.userId,
        userEmail: users.email,
        action: auditLog.action,
        entity: auditLog.entity,
        entityId: auditLog.entityId,
        diff: auditLog.diff,
        ipAddress: auditLog.ipAddress,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .leftJoin(users, eq(users.id, auditLog.userId))
      .where(and(...conditions))
      .orderBy(desc(auditLog.id))
      .limit(limit)
      .offset(offset);

    return rows.map((r) => ({
      ...r,
      id: r.id.toString(), // bigint → string for JSON
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /** Runs the DB-side hash-chain integrity check. */
  async verifyChain(): Promise<ChainStatus> {
    const result = await this.db.execute<{
      status: 'intact' | 'tampered';
      rows_checked: string;
      first_bad_id: string | null;
    }>(sql`SELECT * FROM verify_audit_chain()`);
    const row = result.rows[0];
    return {
      status: row?.status ?? 'intact',
      rowsChecked: Number(row?.rows_checked ?? 0),
      firstBadId: row?.first_bad_id ?? null,
    };
  }
}
