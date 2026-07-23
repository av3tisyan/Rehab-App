import {
  ActionIcon,
  Anchor,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Menu,
  Modal,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import {
  IconCircleCheck,
  IconClipboardPlus,
  IconCalendar,
  IconChartLine,
  IconDotsVertical,
  IconFileText,
  IconListDetails,
  IconNotes,
  IconPlayerPause,
  IconRefresh,
  IconTargetArrow,
  IconX,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { lazy, Suspense, useState } from 'react';
import type { EpisodeStatus } from '@rehab/shared';
import { useCreateEncounter, useEncounters, useEpisode, useUpdateEpisode } from '../../lib/queries';
import { AnamnesisPanel } from '../anamnesis/AnamnesisPanel';
import { EpicrisisPanel } from '../epicrisis/EpicrisisPanel';
import { GoalsPanel } from '../goals/GoalsPanel';

const STATUS_COLOR: Record<EpisodeStatus, string> = {
  active: 'teal',
  discharged: 'gray',
  on_hold: 'yellow',
  cancelled: 'red',
};

// Lazy-loaded so recharts is only fetched when the Progress tab is opened.
const ComparisonView = lazy(() =>
  import('../comparison/ComparisonView').then((m) => ({ default: m.ComparisonView })),
);

export function EpisodeDetailPage() {
  const { episodeId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: episode, isLoading } = useEpisode(episodeId);
  const { data: encounters } = useEncounters(episodeId);
  const createEncounter = useCreateEncounter();
  const updateEpisode = useUpdateEpisode();
  const [dischargeOpen, setDischargeOpen] = useState(false);

  const changeStatus = async (status: EpisodeStatus, extra: Record<string, unknown> = {}) => {
    if (!episode) return;
    try {
      await updateEpisode.mutateAsync({ id: episode.id, body: { status, ...extra } });
      notifications.show({ color: 'teal', message: t('episodes.statusUpdated') });
    } catch (e) {
      notifications.show({ color: 'red', message: (e as Error).message });
    }
  };

  if (isLoading || !episode) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    );
  }

  const startSession = async () => {
    try {
      const nextNumber = (encounters?.length ?? 0) + 1;
      const enc = await createEncounter.mutateAsync({
        episodeId: episode.id,
        sessionNumber: nextNumber,
      });
      navigate(`/episodes/${episode.id}/assessment/${enc.id}`);
    } catch (e) {
      notifications.show({ color: 'red', message: (e as Error).message });
    }
  };

  return (
    <Container size="lg" py="xl">
      <Breadcrumbs mb="md">
        <Anchor onClick={() => navigate('/patients')}>{t('patients.title')}</Anchor>
        <Anchor onClick={() => navigate(`/patients/${episode.patientId}`)}>
          {t('episodes.title')}
        </Anchor>
        <Text>{episode.title}</Text>
      </Breadcrumbs>

      <Group justify="space-between" align="flex-end" mb="xl" wrap="nowrap">
        <div>
          <Group gap="sm" align="center">
            <Title order={1}>{episode.title}</Title>
            <Badge color={STATUS_COLOR[episode.status]} variant="light" size="lg">
              {t(`episodes.status.${episode.status}`)}
            </Badge>
          </Group>
          {episode.diagnosis && <Text c="dimmed">{episode.diagnosis}</Text>}
          {episode.dischargedAt && (
            <Text c="dimmed" fz="sm" mt={4}>
              {t('episodes.dischargedOn', {
                date: new Date(episode.dischargedAt).toLocaleDateString(),
              })}
            </Text>
          )}
        </div>
        <Group gap="xs" wrap="nowrap">
          <Button
            size="md"
            leftSection={<IconClipboardPlus size={20} />}
            onClick={startSession}
            loading={createEncounter.isPending}
            disabled={episode.status === 'discharged' || episode.status === 'cancelled'}
          >
            {t('encounters.startSession')}
          </Button>
          <Menu position="bottom-end" width={210}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" size="xl" aria-label={t('episodes.caseActions')}>
                <IconDotsVertical size={22} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {(episode.status === 'active' || episode.status === 'on_hold') && (
                <>
                  <Menu.Item
                    leftSection={<IconCircleCheck size={16} />}
                    onClick={() => setDischargeOpen(true)}
                  >
                    {t('episodes.discharge')}
                  </Menu.Item>
                  {episode.status === 'active' ? (
                    <Menu.Item
                      leftSection={<IconPlayerPause size={16} />}
                      onClick={() => changeStatus('on_hold')}
                    >
                      {t('episodes.putOnHold')}
                    </Menu.Item>
                  ) : (
                    <Menu.Item
                      leftSection={<IconRefresh size={16} />}
                      onClick={() => changeStatus('active')}
                    >
                      {t('episodes.reactivate')}
                    </Menu.Item>
                  )}
                  <Menu.Item
                    color="red"
                    leftSection={<IconX size={16} />}
                    onClick={() => changeStatus('cancelled')}
                  >
                    {t('episodes.cancelCase')}
                  </Menu.Item>
                </>
              )}
              {(episode.status === 'discharged' || episode.status === 'cancelled') && (
                <Menu.Item
                  leftSection={<IconRefresh size={16} />}
                  onClick={() => changeStatus('active', { dischargedAt: null })}
                >
                  {t('episodes.reopen')}
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Tabs defaultValue="sessions" keepMounted={false}>
        <Tabs.List mb="lg">
          <Tabs.Tab value="sessions" leftSection={<IconListDetails size={18} />}>
            {t('comparison.sessions')}
          </Tabs.Tab>
          <Tabs.Tab value="progress" leftSection={<IconChartLine size={18} />}>
            {t('comparison.progress')}
          </Tabs.Tab>
          <Tabs.Tab value="goals" leftSection={<IconTargetArrow size={18} />}>
            {t('goals.tab')}
          </Tabs.Tab>
          <Tabs.Tab value="anamnesis" leftSection={<IconNotes size={18} />}>
            {t('anamnesis.title')}
          </Tabs.Tab>
          <Tabs.Tab value="epicrisis" leftSection={<IconFileText size={18} />}>
            {t('epicrisis.title')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="sessions">
          {!encounters || encounters.length === 0 ? (
            <Card withBorder radius="md" p="xl">
              <Text c="dimmed" ta="center">
                {t('encounters.empty')}
              </Text>
            </Card>
          ) : (
            <Stack gap="sm">
              {encounters.map((enc) => (
                <Card
                  key={enc.id}
                  withBorder
                  radius="md"
                  padding="lg"
                  className="hoverCard"
                  onClick={() => navigate(`/episodes/${episode.id}/assessment/${enc.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <Group wrap="nowrap">
                    <IconCalendar size={20} color="var(--mantine-color-teal-6)" />
                    <div>
                      <Text fw={600}>
                        {t('encounters.session')} {enc.sessionNumber ?? '—'}
                      </Text>
                      <Text c="dimmed" fz="sm">
                        {new Date(enc.encounterDate).toLocaleDateString()}
                      </Text>
                    </div>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="progress">
          <Suspense
            fallback={
              <Group justify="center" py="xl">
                <Loader />
              </Group>
            }
          >
            <ComparisonView episodeId={episode.id} />
          </Suspense>
        </Tabs.Panel>

        <Tabs.Panel value="goals">
          <GoalsPanel episodeId={episode.id} />
        </Tabs.Panel>

        <Tabs.Panel value="anamnesis">
          <AnamnesisPanel episodeId={episode.id} />
        </Tabs.Panel>

        <Tabs.Panel value="epicrisis">
          <EpicrisisPanel episodeId={episode.id} />
        </Tabs.Panel>
      </Tabs>

      <Modal
        opened={dischargeOpen}
        onClose={() => setDischargeOpen(false)}
        title={t('episodes.discharge')}
        centered
      >
        <Stack gap="md">
          <Text>{t('episodes.dischargeConfirm', { title: episode.title })}</Text>
          <Text fz="sm" c="dimmed">
            {t('episodes.dischargeNote')}
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDischargeOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              color="teal"
              loading={updateEpisode.isPending}
              leftSection={<IconCircleCheck size={18} />}
              onClick={async () => {
                await changeStatus('discharged', {
                  dischargedAt: new Date().toISOString().slice(0, 10),
                });
                setDischargeOpen(false);
              }}
            >
              {t('episodes.discharge')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
