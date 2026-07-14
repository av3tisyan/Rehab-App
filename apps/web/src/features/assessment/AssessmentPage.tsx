import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Anchor,
  Breadcrumbs,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconDeviceFloppy, IconHandFinger, IconWifiOff } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AssessmentItem } from '../../lib/types';
import { useEpisode, useSaveAssessments } from '../../lib/queries';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { BodyDiagram, JOINTS, type JointTarget } from './BodyDiagram';
import { RegionDrawer } from './RegionDrawer';
import { VasCard } from './VasCard';
import { itemKey, measuredJointIds } from './draft';
import classes from './AssessmentPage.module.css';

const VAS_KEY = 'VAS|||';

export function AssessmentPage() {
  const { episodeId, encounterId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const { data: episode } = useEpisode(episodeId);
  const save = useSaveAssessments(episodeId);

  const [draft, setDraft] = useState<Map<string, AssessmentItem>>(new Map());
  const [selected, setSelected] = useState<JointTarget | null>(null);

  const upsert = useCallback((item: AssessmentItem) => {
    setDraft((prev) => {
      const next = new Map(prev);
      next.set(itemKey(item), item);
      return next;
    });
  }, []);

  const remove = useCallback((key: string) => {
    setDraft((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const measuredIds = useMemo(() => measuredJointIds(JOINTS, draft), [draft]);
  const vas = draft.get(VAS_KEY)?.primaryValue ?? null;
  const count = draft.size;

  const setVas = (score: number) =>
    upsert({ typeCode: 'VAS', primaryValue: score, payload: { score } });

  const onSave = async () => {
    if (!encounterId) return;
    try {
      await save.mutateAsync({ encounterId, items: [...draft.values()] });
      notifications.show({ color: 'teal', message: t('assessment.saved') });
      navigate(`/episodes/${episodeId}`);
    } catch (e) {
      notifications.show({ color: 'red', title: t('assessment.saveError'), message: (e as Error).message });
    }
  };

  return (
    <Container size="lg" py="xl" pb={96}>
      <Breadcrumbs mb="md">
        <Anchor onClick={() => navigate('/patients')}>{t('patients.title')}</Anchor>
        <Anchor onClick={() => navigate(`/episodes/${episodeId}`)}>
          {episode?.title ?? t('episodes.title')}
        </Anchor>
        <Text>{t('assessment.title')}</Text>
      </Breadcrumbs>

      <Title order={1} mb="lg">
        {t('assessment.title')}
      </Title>

      {!online && (
        <Alert color="orange" icon={<IconWifiOff size={18} />} mb="md">
          {t('common.offline')}
        </Alert>
      )}

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card withBorder radius="md" padding="lg">
            <Group gap="xs" mb="sm" c="dimmed">
              <IconHandFinger size={18} />
              <Text fz="sm">{t('assessment.tapJoint')}</Text>
            </Group>
            <BodyDiagram
              activeId={selected?.id ?? null}
              measuredJointIds={measuredIds}
              onSelect={setSelected}
            />
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack gap="lg">
            <VasCard value={vas} onChange={setVas} />
          </Stack>
        </Grid.Col>
      </Grid>

      <RegionDrawer
        joint={selected}
        draft={draft}
        onUpsert={upsert}
        onRemove={remove}
        onClose={() => setSelected(null)}
      />

      <div className={classes.saveBar}>
        <Container size="lg" className={classes.saveInner}>
          <Text fw={500} c={count > 0 ? undefined : 'dimmed'}>
            {t('assessment.pending', { count })}
          </Text>
          <Button
            size="md"
            leftSection={<IconDeviceFloppy size={20} />}
            onClick={onSave}
            disabled={count === 0 || !online}
            loading={save.isPending}
          >
            {save.isPending ? t('assessment.saving') : t('assessment.save')}
          </Button>
        </Container>
      </div>
    </Container>
  );
}
