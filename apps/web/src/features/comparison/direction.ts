import type { Direction } from '@rehab/shared';

/** Maps an improvement direction to a Mantine color + i18n label key. */
export const DIRECTION_META: Record<Direction, { color: string; labelKey: string }> = {
  improvement: { color: 'teal', labelKey: 'comparison.improvement' },
  decline: { color: 'red', labelKey: 'comparison.decline' },
  unchanged: { color: 'gray', labelKey: 'comparison.unchanged' },
  neutral: { color: 'gray', labelKey: 'comparison.neutral' },
};

/** Formats a delta with an explicit sign, e.g. +70 or -5. */
export function formatDelta(delta: number | null, unit?: string | null): string {
  if (delta === null) return '—';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta}${unit ? ` ${unit}` : ''}`;
}

export function formatPct(pct: number | null): string {
  if (pct === null) return '—';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct}%`;
}
