import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { type Observable, tap } from 'rxjs';
import type { AuthUser } from '../auth-user';
import { AuditService } from './audit.service';

const METHOD_ACTION: Record<string, string> = {
  POST: 'create',
  PATCH: 'update',
  PUT: 'update',
  DELETE: 'delete',
};

const SENSITIVE_KEYS = new Set(['password', 'passwordHash', 'password_hash', 'refreshToken']);

/**
 * Records an audit_log row after any successful mutating request. Read requests
 * (GET) are not audited here to avoid noise; view-level auditing can be added
 * per-resource where clinically required.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const action = METHOD_ACTION[request.method];
    if (!action) return next.handle();

    const entity = this.entityFromPath(request.path);
    const user = request.user;

    return next.handle().pipe(
      tap((body) => {
        const entityId = this.extractId(body, request);
        void this.audit.record({
          clinicId: user?.clinicId ?? null,
          userId: user?.userId ?? null,
          action,
          entity,
          entityId,
          diff: action === 'delete' ? null : sanitize(request.body),
          ipAddress: request.ip ?? null,
        });
      }),
    );
  }

  private entityFromPath(path: string): string {
    // '/api/patients/123' -> 'patients'
    const segments = path.split('/').filter(Boolean);
    const apiIdx = segments.indexOf('api');
    return segments[apiIdx + 1] ?? 'unknown';
  }

  private extractId(body: unknown, request: Request): string | null {
    if (body && typeof body === 'object' && 'id' in body) {
      const id = (body as { id: unknown }).id;
      if (typeof id === 'string') return id;
    }
    const paramId = (request.params as Record<string, string>)?.id;
    return paramId ?? null;
  }
}

function sanitize(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const clone: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    clone[k] = SENSITIVE_KEYS.has(k) ? '[redacted]' : v;
  }
  return clone;
}
