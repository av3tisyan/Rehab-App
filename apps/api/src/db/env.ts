import { config } from 'dotenv';
import { resolve } from 'node:path';

/**
 * Loads env for standalone scripts (migrate/seed) run outside the Nest runtime.
 * Tries the repo-root .env first, then a local .env, without overriding
 * variables already present in the real environment (e.g. Docker).
 */
export function loadEnv(): void {
  config({ path: resolve(process.cwd(), '../../.env') });
  config({ path: resolve(process.cwd(), '.env') });
}

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env or export it in the environment.',
    );
  }
  return url;
}
