import { Badge, Group, Table, Text, ThemeIcon } from '@mantine/core';
import { IconArrowDownRight, IconArrowUpRight, IconMinus } from '@tabler/icons-react';
import type { Direction } from '@rehab/shared';
import { useTranslation } from 'react-i18next';
import type { ComparisonResponse } from '../../lib/types';
import { DIRECTION_META, formatDelta, formatPct } from './direction';
import { measureKindLabel, regionLabel } from '../../i18n/clinical-terms';

function DirIcon({ direction }: { direction: Direction }) {
  const { color } = DIRECTION_META[direction];
  const Icon =
    direction === 'improvement'
      ? IconArrowUpRight
      : direction === 'decline'
        ? IconArrowDownRight
        : IconMinus;
  return (
    <ThemeIcon variant="light" color={color} size="sm" radius="xl">
      <Icon size={14} />
    </ThemeIcon>
  );
}

function sideLabel(side: string, t: (k: string) => string): string {
  if (side === 'left') return t('assessment.left');
  if (side === 'right') return t('assessment.right');
  if (side === 'not_applicable') return '';
  return side;
}

export function ComparisonTable({ data }: { data: ComparisonResponse }) {
  const { t, i18n } = useTranslation();
  const unit = data.type.unit;
  const lang = i18n.language;

  return (
    <Table.ScrollContainer minWidth={640}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('comparison.metric')}</Table.Th>
            <Table.Th ta="right">{t('comparison.baseline')}</Table.Th>
            <Table.Th ta="right">{t('comparison.latest')}</Table.Th>
            <Table.Th ta="right">{t('comparison.delta')}</Table.Th>
            <Table.Th ta="right">{t('comparison.pct')}</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.metrics.map((m, i) => {
            const meta = DIRECTION_META[m.direction];
            const side = sideLabel(m.side, t);
            return (
              <Table.Tr key={`${m.bodyRegion}-${m.side}-${m.measureKind}-${i}`}>
                <Table.Td>
                  <Group gap={6} wrap="nowrap">
                    <Text fw={600}>
                      {m.measureKind ? measureKindLabel(m.measureKind, lang) : data.type.name}
                    </Text>
                    {side && (
                      <Badge size="sm" variant="light" color={m.side === 'left' ? 'grape' : 'teal'}>
                        {side}
                      </Badge>
                    )}
                  </Group>
                  {m.bodyRegion && (
                    <Text fz="xs" c="dimmed">
                      {regionLabel(m.bodyRegion, lang)}
                    </Text>
                  )}
                </Table.Td>
                <Table.Td ta="right">
                  {m.baseline ?? '—'}
                  {m.baseline !== null && unit ? ` ${unit}` : ''}
                </Table.Td>
                <Table.Td ta="right">
                  <Text fw={700}>
                    {m.latest ?? '—'}
                    {m.latest !== null && unit ? ` ${unit}` : ''}
                  </Text>
                </Table.Td>
                <Table.Td ta="right" c={`${meta.color}.7`} fw={600}>
                  {formatDelta(m.delta)}
                </Table.Td>
                <Table.Td ta="right" c={`${meta.color}.7`}>
                  {formatPct(m.pctChange)}
                </Table.Td>
                <Table.Td>
                  <Group gap={6} wrap="nowrap" justify="flex-end">
                    <DirIcon direction={m.direction} />
                    <Text fz="xs" c="dimmed" visibleFrom="sm">
                      {t(meta.labelKey)}
                    </Text>
                  </Group>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
