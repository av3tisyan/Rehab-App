import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { loadEnv, getDatabaseUrl } from '../env';
import * as schema from '../schema';
import {
  ROM_NORMS,
  MUSCLE_GROUPS,
  OXFORD_SCALE,
  VAS_SCALE,
  type ScalePointSeed,
} from './reference-data';

/**
 * Idempotent seed for clinical reference data (rom_norms, muscle_groups,
 * scale_points). Safe to re-run: inserts skip on conflict with the natural keys.
 * assessment_types is seeded by migration 0002, not here.
 */
async function seed(): Promise<void> {
  loadEnv();
  const pool = new Pool({ connectionString: getDatabaseUrl(), max: 4 });
  const db = drizzle(pool, { schema });

  try {
    const romRows = ROM_NORMS.map((r) => ({
      bodyRegion: r.bodyRegion,
      joint: r.joint,
      motion: r.motion,
      plane: r.plane,
      sideSpecific: r.sideSpecific,
      normalMin: String(r.normalMin),
      normalMax: String(r.normalMax),
      source: 'AAOS (default, review needed)',
    }));
    await db.insert(schema.romNorms).values(romRows).onConflictDoNothing();

    await db.insert(schema.muscleGroups).values(MUSCLE_GROUPS).onConflictDoNothing();

    const scaleRows = [...OXFORD_SCALE, ...VAS_SCALE].map((s: ScalePointSeed) => ({
      scaleCode: s.scaleCode,
      value: String(s.value),
      label: s.label,
      description: s.description,
    }));
    await db.insert(schema.scalePoints).values(scaleRows).onConflictDoNothing();

    const counts = {
      rom_norms: romRows.length,
      muscle_groups: MUSCLE_GROUPS.length,
      scale_points: scaleRows.length,
    };
    console.log('Reference data seeded (idempotent):', counts);
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
