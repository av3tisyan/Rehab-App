import type {
  BodySide,
  Direction,
  EpisodeStatus,
  PatientSex,
  UserRole,
} from '@rehab/shared';

export interface AuthUser {
  userId: string;
  clinicId: string;
  role: UserRole;
  email: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  sex: PatientSex;
  phone: string | null;
  email: string | null;
  referringPhysician: string | null;
  heightCm: string | null;
  bloodType: string | null;
  dominantHand: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Episode {
  id: string;
  patientId: string;
  title: string;
  primaryComplaint: string | null;
  diagnosis: string | null;
  icd10Code: string | null;
  status: EpisodeStatus;
  startedAt: string;
  dischargedAt: string | null;
}

export interface Encounter {
  id: string;
  episodeId: string;
  encounterDate: string;
  sessionNumber: number | null;
  subjective: string | null;
  notes: string | null;
}

export interface AssessmentType {
  id: string;
  code: string;
  name: string;
  unit: string | null;
  minValue: string | null;
  maxValue: string | null;
  higherIsBetter: boolean;
  isDirectional: boolean;
  isComputed: boolean;
}

export interface RomNorm {
  id: string;
  bodyRegion: string;
  joint: string;
  motion: string;
  plane: string | null;
  sideSpecific: boolean;
  normalMin: string;
  normalMax: string;
  unit: string;
}

export interface MuscleGroup {
  id: string;
  code: string;
  name: string;
  bodyRegion: string;
  relatedJoint: string | null;
  action: string | null;
  myotome: string | null;
}

export interface ScalePoint {
  id: string;
  scaleCode: string;
  value: string;
  label: string;
  description: string | null;
}

/** Matches AssessmentItemDto on the API. */
export interface AssessmentItem {
  typeCode: string;
  bodyRegion?: string;
  side?: BodySide;
  measureKind?: string;
  primaryValue?: number;
  payload?: Record<string, unknown>;
  measuredAt?: string;
}

export interface MetricComparison {
  bodyRegion: string | null;
  side: string;
  measureKind: string | null;
  baseline: number | null;
  latest: number | null;
  baselineAt: string | null;
  latestAt: string | null;
  delta: number | null;
  pctChange: number | null;
  direction: Direction;
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

export interface DocumentRow {
  id: string;
  episodeId: string;
  type: 'anamnesis_vitae' | 'anamnesis_morbi' | 'epicrisis' | 'note';
  title: string | null;
  content: Record<string, unknown>;
  renderedText: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TreatmentGoal {
  id: string;
  episodeId: string;
  description: string;
  targetValue: string | null;
  targetDate: string | null;
  status: 'open' | 'achieved' | 'partially_achieved' | 'not_achieved';
}

export interface EpicrisisContent {
  generatedAt: string;
  patient: { name: string; heightCm: string | null; dominantHand: string | null };
  episode: { title: string; diagnosis: string | null; startedAt: string; dischargedAt: string | null };
  summary: { improved: number; declined: number; unchanged: number; sessions: number };
  sections: {
    code: string;
    name: string;
    unit: string | null;
    metrics: MetricComparison[];
  }[];
  goals: { description: string; status: string }[];
}

export interface ComparisonResponse {
  episodeId: string;
  type: {
    code: string;
    name: string;
    unit: string | null;
    higherIsBetter: boolean;
    isDirectional: boolean;
  };
  metrics: MetricComparison[];
  series: {
    bodyRegion: string | null;
    side: string;
    measureKind: string | null;
    points: { value: number; measuredAt: string }[];
  }[];
}
