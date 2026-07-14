/**
 * Default clinical reference data — PUBLISHED DEFAULTS, REVIEW NEEDED.
 *
 * ROM norms are AAOS-style adult averages; muscle groups follow the standard
 * myotome set; scales are Oxford 0–5 (MMT) and NRS/VAS 0–10 (pain). These are
 * seeded so the app is usable out of the box. A clinician should review and
 * adjust them; every row is flagged `review_needed = true`. Editing here (or via
 * a future admin screen) and re-running `pnpm db:seed` is safe — the seed upserts.
 */

export interface RomNormSeed {
  bodyRegion: string;
  joint: string;
  motion: string;
  plane: string;
  sideSpecific: boolean;
  normalMin: number;
  normalMax: number;
}

export const ROM_NORMS: RomNormSeed[] = [
  // Shoulder (glenohumeral)
  { bodyRegion: 'shoulder', joint: 'glenohumeral', motion: 'flexion', plane: 'sagittal', sideSpecific: true, normalMin: 0, normalMax: 180 },
  { bodyRegion: 'shoulder', joint: 'glenohumeral', motion: 'extension', plane: 'sagittal', sideSpecific: true, normalMin: 0, normalMax: 60 },
  { bodyRegion: 'shoulder', joint: 'glenohumeral', motion: 'abduction', plane: 'frontal', sideSpecific: true, normalMin: 0, normalMax: 180 },
  { bodyRegion: 'shoulder', joint: 'glenohumeral', motion: 'internal_rotation', plane: 'transverse', sideSpecific: true, normalMin: 0, normalMax: 70 },
  { bodyRegion: 'shoulder', joint: 'glenohumeral', motion: 'external_rotation', plane: 'transverse', sideSpecific: true, normalMin: 0, normalMax: 90 },
  // Elbow / forearm
  { bodyRegion: 'elbow', joint: 'humeroulnar', motion: 'flexion', plane: 'sagittal', sideSpecific: true, normalMin: 0, normalMax: 150 },
  { bodyRegion: 'forearm', joint: 'radioulnar', motion: 'supination', plane: 'transverse', sideSpecific: true, normalMin: 0, normalMax: 80 },
  { bodyRegion: 'forearm', joint: 'radioulnar', motion: 'pronation', plane: 'transverse', sideSpecific: true, normalMin: 0, normalMax: 80 },
  // Wrist
  { bodyRegion: 'wrist', joint: 'radiocarpal', motion: 'flexion', plane: 'sagittal', sideSpecific: true, normalMin: 0, normalMax: 80 },
  { bodyRegion: 'wrist', joint: 'radiocarpal', motion: 'extension', plane: 'sagittal', sideSpecific: true, normalMin: 0, normalMax: 70 },
  { bodyRegion: 'wrist', joint: 'radiocarpal', motion: 'radial_deviation', plane: 'frontal', sideSpecific: true, normalMin: 0, normalMax: 20 },
  { bodyRegion: 'wrist', joint: 'radiocarpal', motion: 'ulnar_deviation', plane: 'frontal', sideSpecific: true, normalMin: 0, normalMax: 30 },
  // Hip
  { bodyRegion: 'hip', joint: 'coxofemoral', motion: 'flexion', plane: 'sagittal', sideSpecific: true, normalMin: 0, normalMax: 120 },
  { bodyRegion: 'hip', joint: 'coxofemoral', motion: 'extension', plane: 'sagittal', sideSpecific: true, normalMin: 0, normalMax: 30 },
  { bodyRegion: 'hip', joint: 'coxofemoral', motion: 'abduction', plane: 'frontal', sideSpecific: true, normalMin: 0, normalMax: 45 },
  { bodyRegion: 'hip', joint: 'coxofemoral', motion: 'adduction', plane: 'frontal', sideSpecific: true, normalMin: 0, normalMax: 30 },
  { bodyRegion: 'hip', joint: 'coxofemoral', motion: 'internal_rotation', plane: 'transverse', sideSpecific: true, normalMin: 0, normalMax: 45 },
  { bodyRegion: 'hip', joint: 'coxofemoral', motion: 'external_rotation', plane: 'transverse', sideSpecific: true, normalMin: 0, normalMax: 45 },
  // Knee
  { bodyRegion: 'knee', joint: 'tibiofemoral', motion: 'flexion', plane: 'sagittal', sideSpecific: true, normalMin: 0, normalMax: 135 },
  // Ankle
  { bodyRegion: 'ankle', joint: 'talocrural', motion: 'dorsiflexion', plane: 'sagittal', sideSpecific: true, normalMin: 0, normalMax: 20 },
  { bodyRegion: 'ankle', joint: 'talocrural', motion: 'plantarflexion', plane: 'sagittal', sideSpecific: true, normalMin: 0, normalMax: 50 },
  { bodyRegion: 'ankle', joint: 'subtalar', motion: 'inversion', plane: 'frontal', sideSpecific: true, normalMin: 0, normalMax: 35 },
  { bodyRegion: 'ankle', joint: 'subtalar', motion: 'eversion', plane: 'frontal', sideSpecific: true, normalMin: 0, normalMax: 15 },
  // Cervical spine
  { bodyRegion: 'cervical_spine', joint: 'cervical', motion: 'flexion', plane: 'sagittal', sideSpecific: false, normalMin: 0, normalMax: 45 },
  { bodyRegion: 'cervical_spine', joint: 'cervical', motion: 'extension', plane: 'sagittal', sideSpecific: false, normalMin: 0, normalMax: 45 },
  { bodyRegion: 'cervical_spine', joint: 'cervical', motion: 'lateral_flexion', plane: 'frontal', sideSpecific: true, normalMin: 0, normalMax: 45 },
  { bodyRegion: 'cervical_spine', joint: 'cervical', motion: 'rotation', plane: 'transverse', sideSpecific: true, normalMin: 0, normalMax: 60 },
  // Lumbar spine
  { bodyRegion: 'lumbar_spine', joint: 'lumbar', motion: 'flexion', plane: 'sagittal', sideSpecific: false, normalMin: 0, normalMax: 60 },
  { bodyRegion: 'lumbar_spine', joint: 'lumbar', motion: 'extension', plane: 'sagittal', sideSpecific: false, normalMin: 0, normalMax: 25 },
  { bodyRegion: 'lumbar_spine', joint: 'lumbar', motion: 'lateral_flexion', plane: 'frontal', sideSpecific: true, normalMin: 0, normalMax: 25 },
  { bodyRegion: 'lumbar_spine', joint: 'lumbar', motion: 'rotation', plane: 'transverse', sideSpecific: true, normalMin: 0, normalMax: 30 },
];

export interface MuscleGroupSeed {
  code: string;
  name: string;
  bodyRegion: string;
  relatedJoint: string;
  action: string;
  myotome: string;
}

export const MUSCLE_GROUPS: MuscleGroupSeed[] = [
  { code: 'DELTOID', name: 'Deltoid', bodyRegion: 'shoulder', relatedJoint: 'glenohumeral', action: 'shoulder_abduction', myotome: 'C5' },
  { code: 'BICEPS', name: 'Biceps brachii', bodyRegion: 'elbow', relatedJoint: 'humeroulnar', action: 'elbow_flexion', myotome: 'C5-C6' },
  { code: 'TRICEPS', name: 'Triceps brachii', bodyRegion: 'elbow', relatedJoint: 'humeroulnar', action: 'elbow_extension', myotome: 'C7' },
  { code: 'WRIST_EXT', name: 'Wrist extensors', bodyRegion: 'wrist', relatedJoint: 'radiocarpal', action: 'wrist_extension', myotome: 'C6' },
  { code: 'FINGER_FLEX', name: 'Finger flexors', bodyRegion: 'hand', relatedJoint: 'interphalangeal', action: 'finger_flexion', myotome: 'C8' },
  { code: 'HAND_INTRINSIC', name: 'Hand intrinsics', bodyRegion: 'hand', relatedJoint: 'metacarpophalangeal', action: 'finger_abduction', myotome: 'T1' },
  { code: 'ILIOPSOAS', name: 'Iliopsoas', bodyRegion: 'hip', relatedJoint: 'coxofemoral', action: 'hip_flexion', myotome: 'L2' },
  { code: 'QUADRICEPS', name: 'Quadriceps', bodyRegion: 'knee', relatedJoint: 'tibiofemoral', action: 'knee_extension', myotome: 'L3-L4' },
  { code: 'TIB_ANTERIOR', name: 'Tibialis anterior', bodyRegion: 'ankle', relatedJoint: 'talocrural', action: 'ankle_dorsiflexion', myotome: 'L4' },
  { code: 'EHL', name: 'Extensor hallucis longus', bodyRegion: 'ankle', relatedJoint: 'talocrural', action: 'great_toe_extension', myotome: 'L5' },
  { code: 'GASTROCNEMIUS', name: 'Gastrocnemius / soleus', bodyRegion: 'ankle', relatedJoint: 'talocrural', action: 'ankle_plantarflexion', myotome: 'S1' },
];

export interface ScalePointSeed {
  scaleCode: string;
  value: number;
  label: string;
  description: string | null;
}

// Oxford (MRC) manual muscle testing scale, 0–5.
export const OXFORD_SCALE: ScalePointSeed[] = [
  { scaleCode: 'OXFORD', value: 0, label: '0', description: 'No contraction' },
  { scaleCode: 'OXFORD', value: 1, label: '1', description: 'Flicker or trace of contraction' },
  { scaleCode: 'OXFORD', value: 2, label: '2', description: 'Active movement, gravity eliminated' },
  { scaleCode: 'OXFORD', value: 3, label: '3', description: 'Active movement against gravity' },
  { scaleCode: 'OXFORD', value: 4, label: '4', description: 'Active movement against gravity and some resistance' },
  { scaleCode: 'OXFORD', value: 5, label: '5', description: 'Normal power against full resistance' },
];

// Numeric pain rating scale, 0–10 (anchored descriptions at key points).
export const VAS_SCALE: ScalePointSeed[] = Array.from({ length: 11 }, (_, i) => {
  const anchors: Record<number, string> = {
    0: 'No pain',
    3: 'Mild pain',
    5: 'Moderate pain',
    7: 'Severe pain',
    10: 'Worst imaginable pain',
  };
  return {
    scaleCode: 'VAS',
    value: i,
    label: String(i),
    description: anchors[i] ?? null,
  };
});
