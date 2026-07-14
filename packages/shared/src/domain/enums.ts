/**
 * Domain enums — the single source of truth shared by API and web.
 * These mirror the PostgreSQL ENUM types defined in the database migrations.
 * Keep them in sync with the DDL; a value added here must be added as a
 * migration, and vice versa.
 */

export const USER_ROLES = ['admin', 'clinician'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PATIENT_SEXES = ['male', 'female', 'other', 'unknown'] as const;
export type PatientSex = (typeof PATIENT_SEXES)[number];

export const EPISODE_STATUSES = ['active', 'discharged', 'on_hold', 'cancelled'] as const;
export type EpisodeStatus = (typeof EPISODE_STATUSES)[number];

export const BODY_SIDES = ['left', 'right', 'bilateral', 'not_applicable'] as const;
export type BodySide = (typeof BODY_SIDES)[number];

export const ROM_KINDS = ['active', 'passive'] as const;
export type RomKind = (typeof ROM_KINDS)[number];

export const DOCUMENT_TYPES = [
  'anamnesis_vitae',
  'anamnesis_morbi',
  'epicrisis',
  'note',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const GOAL_STATUSES = [
  'open',
  'achieved',
  'partially_achieved',
  'not_achieved',
] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];
