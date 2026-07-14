import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';
import { loadEnv, getDatabaseUrl } from './env';

/**
 * Minimal, dependency-light migration runner.
 *
 * Applies every `*.sql` file in ./migrations in filename order, each inside its
 * own transaction, and records it in `schema_migrations` with a checksum. Already
 * applied files are skipped; a checksum mismatch aborts (a committed migration
 * must never be edited — add a new one instead).
 */

const MIGRATIONS_DIR = join(__dirname, 'migrations');

function checksum(sql: string): string {
  return createHash('sha256').update(sql).digest('hex');
}

async function run(): Promise<void> {
  loadEnv();
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   TEXT PRIMARY KEY,
        checksum   TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const applied = new Map<string, string>();
    const rows = await client.query<{ filename: string; checksum: string }>(
      'SELECT filename, checksum FROM schema_migrations',
    );
    for (const r of rows.rows) applied.set(r.filename, r.checksum);

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let count = 0;
    for (const file of files) {
      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
      const sum = checksum(sql);
      const prev = applied.get(file);

      if (prev !== undefined) {
        if (prev !== sum) {
          throw new Error(
            `Migration ${file} was modified after being applied (checksum mismatch). ` +
              'Never edit an applied migration — create a new one.',
          );
        }
        continue;
      }

      process.stdout.write(`Applying ${file} ... `);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)',
          [file, sum],
        );
        await client.query('COMMIT');
        process.stdout.write('done\n');
        count += 1;
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${(err as Error).message}`);
      }
    }

    console.log(count === 0 ? 'No pending migrations.' : `Applied ${count} migration(s).`);
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
