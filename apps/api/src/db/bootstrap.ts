import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { loadEnv, getDatabaseUrl } from './env';
import * as schema from './schema';
import { clinics, users } from './schema';

/**
 * Creates the first clinic and an admin user if none exist. Idempotent: if an
 * admin already exists it does nothing. Credentials come from env with dev
 * defaults — set BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD in real setups.
 */
async function bootstrap(): Promise<void> {
  loadEnv();
  const pool = new Pool({ connectionString: getDatabaseUrl(), max: 2 });
  const db = drizzle(pool, { schema });

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@rehab.local';
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const clinicName = process.env.BOOTSTRAP_CLINIC_NAME ?? 'Default Clinic';

  try {
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      console.log(`Admin user ${email} already exists — nothing to do.`);
      return;
    }

    const [clinic] = await db.insert(clinics).values({ name: clinicName }).returning();
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await db.insert(users).values({
      clinicId: clinic!.id,
      email,
      passwordHash,
      fullName: 'Administrator',
      role: 'admin',
    });

    const usingDefaultPassword = !process.env.BOOTSTRAP_ADMIN_PASSWORD;
    console.log('Bootstrap complete:');
    console.log(`  Clinic: ${clinicName} (${clinic!.id})`);
    console.log(`  Admin:  ${email}`);
    console.log(
      usingDefaultPassword
        ? '  Password: ChangeMe123!  (DEFAULT — set BOOTSTRAP_ADMIN_PASSWORD and change it!)'
        : '  Password: (as set in BOOTSTRAP_ADMIN_PASSWORD)',
    );
  } finally {
    await pool.end();
  }
}

bootstrap().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
