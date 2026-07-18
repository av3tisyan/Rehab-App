/**
 * Clinical terminology dictionary — translates the reference-data codes
 * (body regions, ROM motions, MMT muscles) that are stored in English in the
 * database so they render in the active UI language.
 *
 * The Armenian terms follow professional clinical convention (see the project's
 * "Medical Terminology Research" review): native derivations for anatomy/motions,
 * with Greco-Latin loanwords where they are the established clinical form
 * (e.g. Պրոնացիա / Սուպինացիա). Unknown codes fall back to a prettified English
 * label, so nothing breaks if an entry is missing. Edit here; the UI updates.
 */

type Lang = 'en' | 'hy';
type TermMap = Record<string, { en: string; hy: string }>;

const REGIONS: TermMap = {
  shoulder: { en: 'Shoulder', hy: 'Ուս' },
  elbow: { en: 'Elbow', hy: 'Արմունկ' },
  forearm: { en: 'Forearm', hy: 'Նախաբազուկ' },
  wrist: { en: 'Wrist', hy: 'Դաստակ' },
  hand: { en: 'Hand', hy: 'Ձեռք' },
  hip: { en: 'Hip', hy: 'Ազդր' },
  knee: { en: 'Knee', hy: 'Ծունկ' },
  ankle: { en: 'Ankle', hy: 'Կոճ' },
  cervical_spine: { en: 'Cervical spine', hy: 'Պարանոցային ողնաշար' },
  lumbar_spine: { en: 'Lumbar spine', hy: 'Գոտկային ողնաշար' },
};

const MOTIONS: TermMap = {
  flexion: { en: 'Flexion', hy: 'Ճկում' },
  extension: { en: 'Extension', hy: 'Տարածում' },
  abduction: { en: 'Abduction', hy: 'Հեռացում' },
  adduction: { en: 'Adduction', hy: 'Մոտեցում' },
  internal_rotation: { en: 'Internal rotation', hy: 'Ներքին պտույտ' },
  external_rotation: { en: 'External rotation', hy: 'Արտաքին պտույտ' },
  supination: { en: 'Supination', hy: 'Սուպինացիա' },
  pronation: { en: 'Pronation', hy: 'Պրոնացիա' },
  dorsiflexion: { en: 'Dorsiflexion', hy: 'Մեջքային ճկում' },
  plantarflexion: { en: 'Plantarflexion', hy: 'Ներբանային ճկում' },
  inversion: { en: 'Inversion', hy: 'Ներշրջում' },
  eversion: { en: 'Eversion', hy: 'Արտաշրջում' },
  radial_deviation: { en: 'Radial deviation', hy: 'Ճաճանչային շեղում' },
  ulnar_deviation: { en: 'Ulnar deviation', hy: 'Ծղիկային շեղում' },
  lateral_flexion: { en: 'Lateral flexion', hy: 'Կողմնային ճկում' },
  rotation: { en: 'Rotation', hy: 'Պտույտ' },
};

const MUSCLES: TermMap = {
  DELTOID: { en: 'Deltoid', hy: 'Դելտայաձև մկան' },
  BICEPS: { en: 'Biceps brachii', hy: 'Երկգլխանի բազկամկան' },
  TRICEPS: { en: 'Triceps brachii', hy: 'Եռագլխանի բազկամկան' },
  WRIST_EXT: { en: 'Wrist extensors', hy: 'Դաստակի տարածիչներ' },
  FINGER_FLEX: { en: 'Finger flexors', hy: 'Մատների ճկիչներ' },
  HAND_INTRINSIC: { en: 'Hand intrinsics', hy: 'Դաստակի սեփական մկաններ' },
  ILIOPSOAS: { en: 'Iliopsoas', hy: 'Զստագոտկային մկան' },
  QUADRICEPS: { en: 'Quadriceps', hy: 'Քառագլխանի ազդրամկան' },
  TIB_ANTERIOR: { en: 'Tibialis anterior', hy: 'Առաջային սրունքամկան' },
  EHL: { en: 'Extensor hallucis longus', hy: 'Բթամատի երկար տարածիչ' },
  GASTROCNEMIUS: { en: 'Gastrocnemius / soleus', hy: 'Երկգլխանի սրունքամկան' },
};

const KINDS: TermMap = {
  active: { en: 'active', hy: 'ակտիվ' },
  passive: { en: 'passive', hy: 'պասիվ' },
};

function prettify(code: string): string {
  return code.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function lookup(map: TermMap, code: string, lang: Lang): string | null {
  const entry = map[code];
  return entry ? entry[lang] : null;
}

export function regionLabel(code: string | null, lang: string): string {
  if (!code) return '';
  return lookup(REGIONS, code, lang as Lang) ?? prettify(code);
}

export function muscleLabel(code: string, lang: string): string {
  return lookup(MUSCLES, code, lang as Lang) ?? prettify(code);
}

export function motionLabel(code: string, lang: string): string {
  return lookup(MOTIONS, code, lang as Lang) ?? prettify(code);
}

/**
 * Translates a stored `measure_kind`, which is either:
 *  - a ROM composite `motion_active` / `motion_passive`,
 *  - an MMT muscle code (e.g. DELTOID), or
 *  - null (e.g. VAS).
 */
export function measureKindLabel(measureKind: string | null, lang: string): string {
  if (!measureKind) return '';
  const l = lang as Lang;

  const match = /^(.*)_(active|passive)$/.exec(measureKind);
  if (match) {
    const motion = motionLabel(match[1]!, lang);
    const kind = lookup(KINDS, match[2]!, l) ?? match[2]!;
    return `${motion} (${kind})`;
  }
  if (MUSCLES[measureKind]) return muscleLabel(measureKind, lang);
  if (MOTIONS[measureKind]) return motionLabel(measureKind, lang);
  return prettify(measureKind);
}
