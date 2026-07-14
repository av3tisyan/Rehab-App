/**
 * Drizzle schema — the type-safe query layer.
 *
 * The hand-authored SQL files in ./migrations are the AUTHORITATIVE source for
 * DDL (partial indexes, GIN, citext, RLS-readiness). This file mirrors the same
 * tables/columns so queries and inferred types stay in sync. When you change a
 * migration, update the matching definition here.
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  customType,
  date,
  index,
  inet,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// citext isn't built into drizzle; model it as a custom text-backed type.
const citext = customType<{ data: string }>({
  dataType() {
    return 'citext';
  },
});

// ---- Enums (mirror the CREATE TYPE statements) ----
export const userRoleEnum = pgEnum('user_role', ['admin', 'clinician']);
export const patientSexEnum = pgEnum('patient_sex', ['male', 'female', 'other', 'unknown']);
export const episodeStatusEnum = pgEnum('episode_status', [
  'active',
  'discharged',
  'on_hold',
  'cancelled',
]);
export const bodySideEnum = pgEnum('body_side', [
  'left',
  'right',
  'bilateral',
  'not_applicable',
]);
export const romKindEnum = pgEnum('rom_kind', ['active', 'passive']);
export const documentTypeEnum = pgEnum('document_type', [
  'anamnesis_vitae',
  'anamnesis_morbi',
  'epicrisis',
  'note',
]);
export const goalStatusEnum = pgEnum('goal_status', [
  'open',
  'achieved',
  'partially_achieved',
  'not_achieved',
]);

const createdAt = timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();
const deletedAt = timestamp('deleted_at', { withTimezone: true });

// ---- Tenancy & identity ----
export const clinics = pgTable('clinics', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  locale: text('locale').notNull().default('hy'),
  timezone: text('timezone').notNull().default('Asia/Yerevan'),
  createdAt,
  updatedAt,
});

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clinicId: uuid('clinic_id')
      .notNull()
      .references(() => clinics.id, { onDelete: 'restrict' }),
    email: citext('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    fullName: text('full_name').notNull(),
    role: userRoleEnum('role').notNull().default('clinician'),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [unique('users_clinic_email_uq').on(t.clinicId, t.email), index('idx_users_clinic').on(t.clinicId)],
);

// ---- Patients ----
export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clinicId: uuid('clinic_id')
    .notNull()
    .references(() => clinics.id, { onDelete: 'restrict' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  dateOfBirth: date('date_of_birth'),
  sex: patientSexEnum('sex').notNull().default('unknown'),
  phone: text('phone'),
  email: citext('email'),
  referringPhysician: text('referring_physician'),
  heightCm: numeric('height_cm', { precision: 5, scale: 1 }),
  bloodType: text('blood_type'),
  dominantHand: text('dominant_hand'),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt,
  updatedAt,
  deletedAt,
});

// ---- Episodes ----
export const episodes = pgTable('episodes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clinicId: uuid('clinic_id')
    .notNull()
    .references(() => clinics.id, { onDelete: 'restrict' }),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  primaryComplaint: text('primary_complaint'),
  diagnosis: text('diagnosis'),
  icd10Code: text('icd10_code'),
  status: episodeStatusEnum('status').notNull().default('active'),
  startedAt: date('started_at').notNull().default(sql`CURRENT_DATE`),
  dischargedAt: date('discharged_at'),
  assignedUserId: uuid('assigned_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt,
  updatedAt,
  deletedAt,
});

// ---- Encounters ----
export const encounters = pgTable('encounters', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clinicId: uuid('clinic_id')
    .notNull()
    .references(() => clinics.id, { onDelete: 'restrict' }),
  episodeId: uuid('episode_id')
    .notNull()
    .references(() => episodes.id, { onDelete: 'cascade' }),
  clinicianId: uuid('clinician_id').references(() => users.id, { onDelete: 'set null' }),
  encounterDate: timestamp('encounter_date', { withTimezone: true }).notNull().defaultNow(),
  sessionNumber: integer('session_number'),
  subjective: text('subjective'),
  notes: text('notes'),
  createdAt,
  updatedAt,
  deletedAt,
});

// ---- Assessment catalog ----
export const assessmentTypes = pgTable('assessment_types', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  unit: text('unit'),
  minValue: numeric('min_value'),
  maxValue: numeric('max_value'),
  higherIsBetter: boolean('higher_is_better').notNull().default(true),
  isDirectional: boolean('is_directional').notNull().default(true),
  isComputed: boolean('is_computed').notNull().default(false),
  schema: jsonb('schema'),
  createdAt,
});

// ---- Assessments (measurements) ----
export const assessments = pgTable('assessments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clinicId: uuid('clinic_id')
    .notNull()
    .references(() => clinics.id, { onDelete: 'restrict' }),
  encounterId: uuid('encounter_id')
    .notNull()
    .references(() => encounters.id, { onDelete: 'cascade' }),
  episodeId: uuid('episode_id')
    .notNull()
    .references(() => episodes.id, { onDelete: 'cascade' }),
  assessmentTypeId: uuid('assessment_type_id')
    .notNull()
    .references(() => assessmentTypes.id, { onDelete: 'restrict' }),
  bodyRegion: text('body_region'),
  side: bodySideEnum('side').notNull().default('not_applicable'),
  measureKind: text('measure_kind'),
  primaryValue: numeric('primary_value'),
  payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
  measuredAt: timestamp('measured_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt,
  updatedAt,
  deletedAt,
});

// ---- Documents ----
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clinicId: uuid('clinic_id')
    .notNull()
    .references(() => clinics.id, { onDelete: 'restrict' }),
  episodeId: uuid('episode_id')
    .notNull()
    .references(() => episodes.id, { onDelete: 'cascade' }),
  encounterId: uuid('encounter_id').references(() => encounters.id, { onDelete: 'set null' }),
  type: documentTypeEnum('type').notNull(),
  title: text('title'),
  content: jsonb('content').notNull().default(sql`'{}'::jsonb`),
  renderedText: text('rendered_text'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt,
  updatedAt,
  deletedAt,
});

// ---- Treatment goals ----
export const treatmentGoals = pgTable('treatment_goals', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clinicId: uuid('clinic_id')
    .notNull()
    .references(() => clinics.id, { onDelete: 'restrict' }),
  episodeId: uuid('episode_id')
    .notNull()
    .references(() => episodes.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  targetValue: numeric('target_value'),
  targetDate: date('target_date'),
  status: goalStatusEnum('status').notNull().default('open'),
  createdAt,
  updatedAt,
});

// ---- Clinical reference data (global catalog) ----
export const romNorms = pgTable('rom_norms', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  bodyRegion: text('body_region').notNull(),
  joint: text('joint').notNull(),
  motion: text('motion').notNull(),
  plane: text('plane'),
  sideSpecific: boolean('side_specific').notNull().default(true),
  normalMin: numeric('normal_min').notNull().default('0'),
  normalMax: numeric('normal_max').notNull(),
  unit: text('unit').notNull().default('deg'),
  source: text('source'),
  reviewNeeded: boolean('review_needed').notNull().default(true),
  createdAt,
});

export const muscleGroups = pgTable('muscle_groups', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  bodyRegion: text('body_region').notNull(),
  relatedJoint: text('related_joint'),
  action: text('action'),
  myotome: text('myotome'),
  reviewNeeded: boolean('review_needed').notNull().default(true),
  createdAt,
});

export const scalePoints = pgTable('scale_points', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  scaleCode: text('scale_code').notNull(),
  value: numeric('value').notNull(),
  label: text('label').notNull(),
  description: text('description'),
  createdAt,
});

// ---- Audit log (bigint identity; high-volume, no UUID needed) ----
export const auditLog = pgTable('audit_log', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().generatedAlwaysAsIdentity(),
  clinicId: uuid('clinic_id'),
  userId: uuid('user_id'),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: uuid('entity_id'),
  diff: jsonb('diff'),
  ipAddress: inet('ip_address'),
  createdAt,
  // Hash-chain columns are set by a DB trigger (see migration 0004); the app
  // never writes them. Present here only so selects are typed.
  prevHash: text('prev_hash'),
  rowHash: text('row_hash'),
});

// ---- Inferred types for the app ----
export type Clinic = typeof clinics.$inferSelect;
export type User = typeof users.$inferSelect;
export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
export type Episode = typeof episodes.$inferSelect;
export type Encounter = typeof encounters.$inferSelect;
export type AssessmentType = typeof assessmentTypes.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type NewAssessment = typeof assessments.$inferInsert;
export type RomNorm = typeof romNorms.$inferSelect;
export type MuscleGroup = typeof muscleGroups.$inferSelect;
export type ScalePoint = typeof scalePoints.$inferSelect;
export type TreatmentGoal = typeof treatmentGoals.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
