import { Group, NumberInput, SegmentedControl, Slider, Stack, Text } from '@mantine/core';
import type { BodySide, RomKind } from '@rehab/shared';
import { useTranslation } from 'react-i18next';
import type { AssessmentItem, RomNorm } from '../../lib/types';
import { motionLabel } from '../../i18n/clinical-terms';

interface Props {
  norm: RomNorm;
  side: BodySide;
  kind: RomKind;
  value: number | null;
  onChange: (item: AssessmentItem | null, kind: RomKind) => void;
  onKindChange: (kind: RomKind) => void;
}

export function RomMotionRow({ norm, side, kind, value, onChange, onKindChange }: Props) {
  const { t, i18n } = useTranslation();
  const max = Math.max(Number(norm.normalMax), value ?? 0) + 20;

  const setValue = (v: number | null) => {
    if (v === null || Number.isNaN(v)) {
      onChange(null, kind);
      return;
    }
    onChange(
      {
        typeCode: 'ROM',
        bodyRegion: norm.bodyRegion,
        side,
        measureKind: `${norm.motion}_${kind}`,
        primaryValue: v,
        payload: { degrees: v, kind, motion: norm.motion },
      },
      kind,
    );
  };

  return (
    <Stack gap={6} py="xs">
      <Group justify="space-between" wrap="nowrap">
        <Text fw={600}>{motionLabel(norm.motion, i18n.language)}</Text>
        <SegmentedControl
          size="xs"
          value={kind}
          onChange={(v) => onKindChange(v as RomKind)}
          data={[
            { value: 'active', label: t('assessment.active') },
            { value: 'passive', label: t('assessment.passive') },
          ]}
        />
      </Group>
      <Text fz="xs" c="dimmed">
        {t('assessment.normal', { min: Number(norm.normalMin), max: Number(norm.normalMax) })}
      </Text>
      <Group wrap="nowrap" align="center" gap="md">
        <Slider
          flex={1}
          min={0}
          max={max}
          value={value ?? 0}
          onChange={setValue}
          label={(v) => `${v}°`}
          marks={[
            { value: Number(norm.normalMin) },
            { value: Number(norm.normalMax) },
          ]}
          color="teal"
        />
        <NumberInput
          w={96}
          size="md"
          suffix="°"
          min={0}
          max={max}
          value={value ?? ''}
          onChange={(v) => setValue(typeof v === 'number' ? v : v ? Number(v) : null)}
        />
      </Group>
    </Stack>
  );
}
