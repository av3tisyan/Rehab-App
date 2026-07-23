import { useState } from 'react';
import {
  Button,
  Card,
  Group,
  Loader,
  Modal,
  NumberInput,
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
import { useCreateGoal, useGoals, useUpdateGoal } from '../../lib/queries';

// Local list (type-only import from @rehab/shared — its CommonJS build doesn't
// expose runtime named exports to the bundler; the type still enforces the set).
const GOAL_STATUSES: GoalStatus[] = ['open', 'achieved', 'partially_achieved', 'not_achieved'];

const STATUS_COLOR: Record<GoalStatus, string> = {
  open: 'blue',
  achieved: 'teal',
  partially_achieved: 'yellow',
  not_achieved: 'red',
};

export function GoalsPanel({ episodeId }: { episodeId: string }) {
  const { t } = useTranslation();
  const { data: goals, isLoading } = useGoals(episodeId);
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const [addOpen, setAddOpen] = useState(false);

  const form = useForm({
    initialValues: { description: '', targetValue: '' as number | '', targetDate: '' },
    validate: { description: (v) => (v.trim() ? null : t('goals.description')) },
  });

  const submit = form.onSubmit(async (values) => {
    try {
      await createGoal.mutateAsync({
        episodeId,
        description: values.description.trim(),
        ...(values.targetValue !== '' && { targetValue: values.targetValue }),
        ...(values.targetDate && { targetDate: values.targetDate }),
      });
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
                  {(g.targetValue || g.targetDate) && (
                    <Text fz="sm" c="dimmed" mt={2}>
                      {t('goals.target')}
                      {g.targetValue ? `: ${g.targetValue}` : ''}
                      {g.targetDate
                        ? ` (${t('goals.by')} ${new Date(g.targetDate).toLocaleDateString()})`
                        : ''}
                    </Text>
                  )}
                </div>
                <Select
                  w={200}
                  data={statusData}
                  value={g.status}
                  onChange={(v) => v && setStatus(g.id, v as GoalStatus)}
                  allowDeselect={false}
                  aria-label={t('goals.status.open')}
                  styles={{ input: { color: `var(--mantine-color-${STATUS_COLOR[g.status]}-7)`, fontWeight: 600 } }}
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
