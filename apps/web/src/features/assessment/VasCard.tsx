import { Card, Group, Slider, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconMoodSmile } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface Props {
  value: number | null;
  onChange: (score: number) => void;
}

const PAIN_COLOR = (v: number): string =>
  v <= 3 ? 'teal' : v <= 6 ? 'yellow' : 'red';

export function VasCard({ value, onChange }: Props) {
  const { t } = useTranslation();
  const v = value ?? 0;
  return (
    <Card withBorder radius="md" padding="lg">
      <Group mb="xs" gap="xs">
        <ThemeIcon variant="light" color={PAIN_COLOR(v)} size="lg" radius="md">
          <IconMoodSmile size={20} />
        </ThemeIcon>
        <Text fw={600}>{t('assessment.painLevel')}</Text>
      </Group>
      <Slider
        min={0}
        max={10}
        step={1}
        value={v}
        onChange={onChange}
        color={PAIN_COLOR(v)}
        size="xl"
        marks={[
          { value: 0, label: '0' },
          { value: 5, label: '5' },
          { value: 10, label: '10' },
        ]}
        label={(x) => `${x}`}
        mb="sm"
      />
      <Group justify="space-between">
        <Text fz="xs" c="dimmed">
          {t('assessment.noPain')}
        </Text>
        <Text fz="xs" c="dimmed">
          {t('assessment.worstPain')}
        </Text>
      </Group>
    </Card>
  );
}
