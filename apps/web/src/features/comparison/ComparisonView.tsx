import { useMemo, useState } from 'react';
import {
  Card,
  Center,
  Group,
  Loader,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconChartLine } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useComparison } from '../../lib/queries';
import type { ComparisonResponse } from '../../lib/types';
import { ComparisonTable } from './ComparisonTable';
import { TrendChart } from './TrendChart';
import { regionLabel } from '../../i18n/clinical-terms';

const TYPE_OPTIONS = ['ROM', 'MMT', 'VAS', 'WEIGHT', 'BP_SYS', 'HR'];

export function ComparisonView({ episodeId }: { episodeId: string }) {
  const { t, i18n } = useTranslation();
  const [typeCode, setTypeCode] = useState('ROM');
  const [region, setRegion] = useState<string>('all');
  const { data, isLoading } = useComparison(episodeId, typeCode);

  const regions = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const m of data.metrics) if (m.bodyRegion) set.add(m.bodyRegion);
    return [...set];
  }, [data]);

  const filtered: ComparisonResponse | undefined = useMemo(() => {
    if (!data) return undefined;
    if (region === 'all') return data;
    return {
      ...data,
      metrics: data.metrics.filter((m) => m.bodyRegion === region),
      series: data.series.filter((s) => s.bodyRegion === region),
    };
  }, [data, region]);

  return (
    <Stack gap="lg">
      <Group justify="space-between" wrap="wrap" gap="sm">
        <SegmentedControl
          value={typeCode}
          onChange={(v) => {
            setTypeCode(v);
            setRegion('all');
          }}
          data={TYPE_OPTIONS.map((c) => ({ value: c, label: c }))}
        />
        {regions.length > 1 && (
          <SegmentedControl
            size="sm"
            value={region}
            onChange={setRegion}
            data={[
              { value: 'all', label: '★' },
              ...regions.map((r) => ({ value: r, label: regionLabel(r, i18n.language) })),
            ]}
          />
        )}
      </Group>

      {isLoading ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : !filtered || filtered.metrics.length === 0 ? (
        <Card withBorder radius="md" p="xl">
          <Text c="dimmed" ta="center">
            {t('comparison.noData')}
          </Text>
        </Card>
      ) : (
        <>
          <Card withBorder radius="md" padding="lg">
            <Title order={4} mb="md">
              {t('comparison.title')} · {filtered.type.name}
            </Title>
            <ComparisonTable data={filtered} />
          </Card>

          <Card withBorder radius="md" padding="lg">
            <Group gap="xs" mb="md">
              <IconChartLine size={20} color="var(--mantine-color-teal-6)" />
              <Title order={4}>{t('comparison.trend')}</Title>
            </Group>
            <TrendChart data={filtered} />
          </Card>
        </>
      )}
    </Stack>
  );
}
