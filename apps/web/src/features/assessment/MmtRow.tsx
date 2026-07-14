import { Group, SegmentedControl, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { BodySide } from '@rehab/shared';
import type { AssessmentItem, MuscleGroup } from '../../lib/types';
import { muscleLabel } from '../../i18n/clinical-terms';

interface Props {
  muscle: MuscleGroup;
  side: BodySide;
  value: number | null;
  onChange: (item: AssessmentItem | null) => void;
}

const GRADES = ['0', '1', '2', '3', '4', '5'];

export function MmtRow({ muscle, side, value, onChange }: Props) {
  const { i18n } = useTranslation();
  const setGrade = (v: string) => {
    const grade = Number(v);
    onChange({
      typeCode: 'MMT',
      bodyRegion: muscle.bodyRegion,
      side,
      measureKind: muscle.code,
      primaryValue: grade,
      payload: { grade, muscle: muscle.code },
    });
  };

  return (
    <Stack gap={6} py="xs">
      <Group justify="space-between" wrap="nowrap">
        <div>
          <Text fw={600}>{muscleLabel(muscle.code, i18n.language)}</Text>
          {muscle.myotome && (
            <Text fz="xs" c="dimmed">
              {muscle.myotome}
            </Text>
          )}
        </div>
      </Group>
      <SegmentedControl
        fullWidth
        size="md"
        value={value !== null ? String(value) : ''}
        onChange={setGrade}
        data={GRADES.map((g) => ({ value: g, label: g }))}
        color="teal"
      />
    </Stack>
  );
}
