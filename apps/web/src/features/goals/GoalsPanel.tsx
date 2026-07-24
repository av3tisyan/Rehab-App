import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Group,
  Loader,
  Modal,
  NumberInput,
  Progress,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPlus, IconTargetArrow } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import type { GoalStatus } from '@rehab/shared';
import { useCreateGoal, useGoals, useTrackedMetrics, useUpdateGoal } from '../../lib/queries';
import type { TrackedMetric, TreatmentGoal } from '../../lib/types';
import { measureKindLabel, regionLabel } from '../../i18n/clinical-terms';

const GOAL_STATUSES: GoalStatus[] = ['open', 'achieved', 'partially_achieved', 'not_achieved'];

const STATUS_COLOR: Record<GoalStatus, string> = {
  open: 'blue',
  achieved: 'teal',
  partially_achieved: 'yellow',
  not_achieved: 'red',
};

function metricKey(m: {
  typeCode: string;
  bodyRegion: string | null;
  side: string;
  measureKind: string | null;
}): string {
  return `${m.typeCode}|${m.bodyRegion ?? ''}|${m.side}|${m.measureKind ?? ''}`;
}

/** Progress from baseline toward target (works for both directions, e.g. pain down). */
function progressPct(
  baseline: number | null,
  current: number | null,
  target: number | null,
): number | null {
  if (baseline === null || current === null || target === null || target === baseline) return null;
  const pct = ((current - baseline) / (target - baseline)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function GoalsPanel({ episodeId }: { episodeId: string }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data: goals, isLoading } = useGoals(episodeId);
  const { data: metrics } = useTrackedMetrics(episodeId);
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const [addOpen, setAddOpen] = useState(false);

  const metricLabel = (m: TrackedMetric): string => {
    const parts = [m.typeName];
    if (m.measureKind) parts.push(measureKindLabel(m.measureKind, lang));
    if (m.bodyRegion) parts.push(regionLabel(m.bodyRegion, lang));
    if (m.side === 'left') parts.push(t('assessment.left'));
    else if (m.side === 'right') parts.push(t('assessment.right'));
    return parts.join(' · ');
  };

  const metricByKey = useMemo(
    () => new Map((metrics ?? []).map((m) => [metricKey(m), m])),
    [metrics],
  );

  const metricOptions = useMemo(
    () => (metrics ?? []).map((m) => ({ value: metricKey(m), label: metricLabel(m) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [metrics, lang],
  );

  const form = useForm({
    initialValues: {
      description: '',
      targetValue: '' as number | '',
      targetDate: '',
      metricKey: '' as string,
    },
    validate: { description: (v) => (v.trim() ? null : t('goals.description')) },
  });

  const submit = form.onSubmit(async (values) => {
    const body: Record<string, unknown> = {
      episodeId,
      description: values.description.trim(),
    };
    if (values.targetValue !== '') body.targetValue = values.targetValue;
    if (values.targetDate) body.targetDate = values.targetDate;
    if (values.metricKey) {
      const [typeCode, region, side, measure] = values.metricKey.split('|');
      body.metricTypeCode = typeCode;
      if (region) body.metricBodyRegion = region;
      if (side) body.metricSide = side;
      if (measure) body.metricMeasureKind = measure;
    }
    try {
      await createGoal.mutateAsync(body);
      notifications.show({ color: 'teal', message: t('goals.saved') });
      form.reset();
      setAddOpen(false);
    } catch (e) {
      notifications.show({ color: 'red', message: (e as Error).message });
    }
  });

  const setStatus = async (id: string, status: GoalStatus) => {
    try {
      await updateGoal.mutateAsync({ id, body: { status } });
      notifications.show({ color: 'teal', message: t('goals.statusUpdated') });
    } catch (e) {
      notifications.show({ color: 'red', message: (e as Error).message });
    }
  };

  const statusData = GOAL_STATUSES.map((s) => ({ value: s, label: t(`goals.status.${s}`) }));

  const renderProgress = (g: TreatmentGoal) => {
    if (!g.metricTypeCode) return null;
    const key = `${g.metricTypeCode}|${g.metricBodyRegion ?? ''}|${g.metricSide ?? ''}|${g.metricMeasureKind ?? ''}`;
    const m = metricByKey.get(key);
    const unit = m?.unit ? ` ${m.unit}` : '';
    const target = g.targetValue !== null ? Number(g.targetValue) : null;
    const pct = progressPct(g.baselineValue, g.currentValue, target);
    return (
      <Stack gap={4} mt="xs">
        <Group justify="space-between">
          <Text fz="xs" c="dimmed">
            {m ? metricLabel(m) : g.metricTypeCode}
          </Text>
          <Text fz="sm" fw={600}>
            {t('goals.current')}: {g.currentValue ?? '—'}
            {unit}
            {target !== null ? ` → ${target}${unit}` : ''}
          </Text>
        </Group>
        {pct !== null && <Progress value={pct} color="teal" size="md" radius="xl" />}
      </Stack>
    );
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <IconTargetArrow size={22} color="var(--mantine-color-teal-6)" />
          <Text fw={600} fz="lg">
            {t('goals.title')}
          </Text>
        </Group>
        <Button variant="light" leftSection={<IconPlus size={18} />} onClick={() => setAddOpen(true)}>
          {t('goals.add')}
        </Button>
      </Group>

      {isLoading ? (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      ) : !goals || goals.length === 0 ? (
        <Card withBorder radius="md" p="xl">
          <Text c="dimmed" ta="center">
            {t('goals.empty')}
          </Text>
        </Card>
      ) : (
        <Stack gap="sm">
          {goals.map((g) => (
            <Card key={g.id} withBorder radius="md" padding="lg">
              <Group justify="space-between" align="flex-start" wrap="nowrap" gap="lg">
                <div style={{ flex: 1 }}>
                  <Text fw={600}>{g.description}</Text>
                  {!g.metricTypeCode && (g.targetValue || g.targetDate) && (
                    <Text fz="sm" c="dimmed" mt={2}>
                      {t('goals.target')}
                      {g.targetValue ? `: ${g.targetValue}` : ''}
                      {g.targetDate
                        ? ` (${t('goals.by')} ${new Date(g.targetDate).toLocaleDateString()})`
                        : ''}
                    </Text>
                  )}
                  {renderProgress(g)}
                </div>
                <Select
                  w={200}
                  data={statusData}
                  value={g.status}
                  onChange={(v) => v && setStatus(g.id, v as GoalStatus)}
                  allowDeselect={false}
                  aria-label={t('goals.status.open')}
                  styles={{
                    input: {
                      color: `var(--mantine-color-${STATUS_COLOR[g.status]}-7)`,
                      fontWeight: 600,
                    },
                  }}
                />
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      <Modal opened={addOpen} onClose={() => setAddOpen(false)} title={t('goals.add')} centered>
        <form onSubmit={submit}>
          <Stack gap="md">
            <Textarea
              size="md"
              label={t('goals.description')}
              placeholder={t('goals.descriptionPlaceholder')}
              withAsterisk
              autosize
              minRows={2}
              {...form.getInputProps('description')}
            />
            {metricOptions.length > 0 && (
              <Select
                size="md"
                label={t('goals.linkedMetric')}
                placeholder={t('goals.noMetric')}
                clearable
                data={metricOptions}
                {...form.getInputProps('metricKey')}
              />
            )}
            <Group grow>
              <NumberInput
                size="md"
                label={t('goals.targetValue')}
                {...form.getInputProps('targetValue')}
              />
              <TextInput
                size="md"
                type="date"
                label={t('goals.targetDate')}
                {...form.getInputProps('targetDate')}
              />
            </Group>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setAddOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" loading={createGoal.isPending}>
                {t('goals.create')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
