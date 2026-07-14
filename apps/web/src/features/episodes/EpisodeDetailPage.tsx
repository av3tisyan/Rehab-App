import {
  Anchor,
  Breadcrumbs,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import {
  IconClipboardPlus,
  IconCalendar,
  IconChartLine,
  IconFileText,
  IconListDetails,
  IconNotes,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { lazy, Suspense } from 'react';
import { useCreateEncounter, useEncounters, useEpisode } from '../../lib/queries';
import { AnamnesisPanel } from '../anamnesis/AnamnesisPanel';
import { EpicrisisPanel } from '../epicrisis/EpicrisisPanel';

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

      <Group justify="space-between" align="flex-end" mb="xl">
        <div>
          <Title order={1}>{episode.title}</Title>
          {episode.diagnosis && <Text c="dimmed">{episode.diagnosis}</Text>}
        </div>
        <Button
          size="md"
          leftSection={<IconClipboardPlus size={20} />}
          onClick={startSession}
          loading={createEncounter.isPending}
        >
          {t('encounters.startSession')}
        </Button>
      </Group>

      <Tabs defaultValue="sessions" keepMounted={false}>
        <Tabs.List mb="lg">
          <Tabs.Tab value="sessions" leftSection={<IconListDetails size={18} />}>
            {t('comparison.sessions')}
          </Tabs.Tab>
          <Tabs.Tab value="progress" leftSection={<IconChartLine size={18} />}>
            {t('comparison.progress')}
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

        <Tabs.Panel value="anamnesis">
          <AnamnesisPanel episodeId={episode.id} />
        </Tabs.Panel>

        <Tabs.Panel value="epicrisis">
          <EpicrisisPanel episodeId={episode.id} />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
