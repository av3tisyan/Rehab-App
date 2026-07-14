import type { UserRole } from '@rehab/shared';

/** The authenticated principal attached to each request by the JWT guard. */
export interface AuthUser {
  userId: string;
  clinicId: string;
  role: UserRole;
  email: string;
}

/** Shape of the signed JWT access-token payload. */
export interface JwtPayload {
  sub: string; // userId
  clinicId: string;
  role: UserRole;
  email: string;
}
