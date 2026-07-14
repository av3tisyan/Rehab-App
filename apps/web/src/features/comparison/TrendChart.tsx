import { useMemo } from 'react';
import { useMantineTheme } from '@mantine/core';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import type { ComparisonResponse } from '../../lib/types';
import { measureKindLabel } from '../../i18n/clinical-terms';

const PALETTE = ['#0ca678', '#7048e8', '#e8590c', '#1c7ed6', '#e64980', '#f59f00'];

function seriesKey(
  s: ComparisonResponse['series'][number],
  side: string,
  fallback: string,
  lang: string,
): string {
  const base = s.measureKind ? measureKindLabel(s.measureKind, lang) : fallback;
  return `${base}${side ? ` (${side})` : ''}`;
}

export function TrendChart({ data }: { data: ComparisonResponse }) {
  const theme = useMantineTheme();
  const { t, i18n } = useTranslation();

  const { rows, keys } = useMemo(() => {
    const dateMap = new Map<string, Record<string, number | string>>();
    const keyList: string[] = [];

    for (const s of data.series) {
      const side =
        s.side === 'left'
          ? t('assessment.left')
          : s.side === 'right'
            ? t('assessment.right')
            : '';
      const key = seriesKey(s, side, data.type.name, i18n.language);
      if (!keyList.includes(key)) keyList.push(key);
      for (const p of s.points) {
        const date = new Date(p.measuredAt).toLocaleDateString();
        const row = dateMap.get(date) ?? { date };
        row[key] = p.value;
        dateMap.set(date, row);
      }
    }
    const sorted = [...dateMap.values()].sort(
      (a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime(),
    );
    return { rows: sorted, keys: keyList };
  }, [data, t, i18n.language]);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.gray[2]} />
        <XAxis dataKey="date" fontSize={12} stroke={theme.colors.gray[6]} />
        <YAxis
          fontSize={12}
          stroke={theme.colors.gray[6]}
          unit={data.type.unit ? ` ${data.type.unit}` : ''}
          width={64}
        />
        <Tooltip />
        <Legend />
        {keys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={PALETTE[i % PALETTE.length]}
            strokeWidth={2.5}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
