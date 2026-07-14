import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle config — used only for `drizzle-kit studio` (DB browser).
 * Migrations are hand-authored SQL in src/db/migrations, applied by
 * `pnpm db:migrate`. This is intentionally NOT the migration source.
 */
export default defineConfig({
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://rehab:rehab@localhost:5432/rehab',
  },
});
