/**
 * Extracts the comparable numeric `primary_value` from a measurement.
 *
 * The comparison feature depends on every measurement having a typed number, not
 * free text. When the client sends an explicit `primaryValue` we trust it;
 * otherwise we pull the conventional key out of the JSON payload for known test
 * types, falling back to a generic `value` key. Returns null when no number is
 * found (the caller then rejects the measurement).
 */
const PAYLOAD_KEY_BY_TYPE: Record<string, string> = {
  ROM: 'degrees',
  MMT: 'grade',
  VAS: 'score',
  WEIGHT: 'kg',
  BP_SYS: 'mmHg',
  BP_DIA: 'mmHg',
  HR: 'bpm',
};

export function extractPrimaryValue(
  typeCode: string,
  payload: Record<string, unknown> | undefined,
  explicit: number | undefined,
): number | null {
  if (typeof explicit === 'number' && Number.isFinite(explicit)) return explicit;
  if (!payload) return null;

  const key = PAYLOAD_KEY_BY_TYPE[typeCode];
  const candidate = key !== undefined ? payload[key] : undefined;
  const value = candidate ?? payload['value'];

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
