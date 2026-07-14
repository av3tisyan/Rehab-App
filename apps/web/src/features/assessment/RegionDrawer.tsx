import { useMemo, useState } from 'react';
import { Badge, Divider, Drawer, Group, Tabs, Text } from '@mantine/core';
import { IconActivity, IconBarbell } from '@tabler/icons-react';
import type { BodySide, RomKind } from '@rehab/shared';
import { useTranslation } from 'react-i18next';
import { useMuscleGroups, useRomNorms } from '../../lib/queries';
import type { AssessmentItem } from '../../lib/types';
import type { JointTarget } from './BodyDiagram';
import { RomMotionRow } from './RomMotionRow';
import { MmtRow } from './MmtRow';
import { regionLabel } from '../../i18n/clinical-terms';

interface Props {
  joint: JointTarget | null;
  draft: Map<string, AssessmentItem>;
  onUpsert: (item: AssessmentItem) => void;
  onRemove: (key: string) => void;
  onClose: () => void;
}

function sideLabel(side: BodySide, t: (k: string) => string): string {
  if (side === 'left') return t('assessment.left');
  if (side === 'right') return t('assessment.right');
  return '';
}

export function RegionDrawer({ joint, draft, onUpsert, onRemove, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const { data: allNorms } = useRomNorms();
  const { data: allMuscles } = useMuscleGroups();
  const [kindByMotion, setKindByMotion] = useState<Record<string, RomKind>>({});

  const norms = useMemo(
    () => (allNorms ?? []).filter((n) => joint?.regions.includes(n.bodyRegion)),
    [allNorms, joint],
  );
  const muscles = useMemo(
    () => (allMuscles ?? []).filter((m) => joint?.regions.includes(m.bodyRegion)),
    [allMuscles, joint],
  );

  const side = joint?.side ?? 'not_applicable';

  const title = joint ? (
    <Group gap="xs">
      <Text fw={700} fz="lg">
        {regionLabel(joint.regions[0] ?? null, i18n.language)}
      </Text>
      {sideLabel(side, t) && (
        <Badge variant="light" color={side === 'left' ? 'grape' : 'teal'}>
          {sideLabel(side, t)}
        </Badge>
      )}
    </Group>
  ) : null;

  return (
    <Drawer
      opened={!!joint}
      onClose={onClose}
      position="right"
      size="lg"
      title={title}
      padding="lg"
    >
      <Tabs defaultValue="rom" keepMounted={false}>
        <Tabs.List grow mb="md">
          <Tabs.Tab value="rom" leftSection={<IconActivity size={18} />}>
            {t('assessment.rom')}
          </Tabs.Tab>
          <Tabs.Tab value="mmt" leftSection={<IconBarbell size={18} />}>
            {t('assessment.strength')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="rom">
          {norms.length === 0 ? (
            <Text c="dimmed">—</Text>
          ) : (
            norms.map((norm, i) => {
              const kind = kindByMotion[norm.motion] ?? 'active';
              const key = `ROM|${norm.bodyRegion}|${side}|${norm.motion}_${kind}`;
              const value = draft.get(key)?.primaryValue ?? null;
              return (
                <div key={norm.id}>
                  {i > 0 && <Divider />}
                  <RomMotionRow
                    norm={norm}
                    side={side}
                    kind={kind}
                    value={value}
                    onKindChange={(k) => setKindByMotion((m) => ({ ...m, [norm.motion]: k }))}
                    onChange={(item) => {
                      if (item) onUpsert(item);
                      else onRemove(key);
                    }}
                  />
                </div>
              );
            })
          )}
        </Tabs.Panel>

        <Tabs.Panel value="mmt">
          {muscles.length === 0 ? (
            <Text c="dimmed">—</Text>
          ) : (
            muscles.map((muscle, i) => {
              const key = `MMT|${muscle.bodyRegion}|${side}|${muscle.code}`;
              const value = draft.get(key)?.primaryValue ?? null;
              return (
                <div key={muscle.id}>
                  {i > 0 && <Divider />}
                  <MmtRow
                    muscle={muscle}
                    side={side}
                    value={value}
                    onChange={(item) => item && onUpsert(item)}
                  />
                </div>
              );
            })
          )}
        </Tabs.Panel>
      </Tabs>
    </Drawer>
  );
}
