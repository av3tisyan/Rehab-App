import {
  Card,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconActivity,
  IconCalendar,
  IconCircleCheck,
  IconPlayerPause,
  IconUsers,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '../../lib/queries';

function StatTile({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <Paper withBorder radius="md" p="lg">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div>
          <Text fz="xs" c="dimmed" tt="uppercase" fw={600}>
            {label}
          </Text>
          <Text fz={32} fw={700} lh={1.1} mt={4}>
            {value}
          </Text>
        </div>
        <ThemeIcon variant="light" color={color} size="xl" radius="md">
          {icon}
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="lg">
        {t('dashboard.title')}
      </Title>

      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        <StatTile
          label={t('dashboard.activePatients')}
          value={data.activePatients}
          color="teal"
          icon={<IconUsers size={22} />}
        />
        <StatTile
          label={t('dashboard.activeCases')}
          value={data.activeCases}
          color="teal"
          icon={<IconActivity size={22} />}
        />
        <StatTile
          label={t('dashboard.onHoldCases')}
          value={data.onHoldCases}
          color="yellow"
          icon={<IconPlayerPause size={22} />}
        />
        <StatTile
          label={t('dashboard.dischargedCases')}
          value={data.dischargedCases}
          color="gray"
          icon={<IconCircleCheck size={22} />}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Card withBorder radius="md" padding="lg">
          <Group gap="xs" mb="md">
            <IconCalendar size={20} color="var(--mantine-color-teal-6)" />
            <Title order={4}>{t('dashboard.recentSessions')}</Title>
          </Group>
          {data.recentSessions.length === 0 ? (
            <Text c="dimmed">{t('dashboard.noSessions')}</Text>
          ) : (
            <Stack gap={0}>
              {data.recentSessions.map((s) => (
                <Group
                  key={s.encounterId}
                  justify="space-between"
                  wrap="nowrap"
                  py="sm"
                  className="hoverRow"
                  onClick={() =>
                    navigate(`/episodes/${s.episodeId}/assessment/${s.encounterId}`)
                  }
                  style={{ cursor: 'pointer', borderTop: '1px solid var(--border-subtle)' }}
                >
                  <div>
                    <Text fw={600} fz="sm">
                      {s.patientName}
                    </Text>
                    <Text c="dimmed" fz="xs">
                      {s.episodeTitle} · {t('dashboard.session')} {s.sessionNumber ?? '—'}
                    </Text>
                  </div>
                  <Text c="dimmed" fz="xs" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(s.encounterDate).toLocaleDateString()}
                  </Text>
                </Group>
              ))}
            </Stack>
          )}
        </Card>

        <Card withBorder radius="md" padding="lg">
          <Group gap="xs" mb="md">
            <IconCircleCheck size={20} color="var(--mantine-color-teal-6)" />
            <Title order={4}>{t('dashboard.recentDischarges')}</Title>
          </Group>
          {data.recentDischarges.length === 0 ? (
            <Text c="dimmed">{t('dashboard.noDischarges')}</Text>
          ) : (
            <Stack gap={0}>
              {data.recentDischarges.map((d) => (
                <Group
                  key={d.episodeId}
                  justify="space-between"
                  wrap="nowrap"
                  py="sm"
                  className="hoverRow"
                  onClick={() => navigate(`/episodes/${d.episodeId}`)}
                  style={{ cursor: 'pointer', borderTop: '1px solid var(--border-subtle)' }}
                >
                  <div>
                    <Text fw={600} fz="sm">
                      {d.patientName}
                    </Text>
                    <Text c="dimmed" fz="xs">
                      {d.title}
                    </Text>
                  </div>
                  <Text c="dimmed" fz="xs" style={{ whiteSpace: 'nowrap' }}>
                    {d.dischargedAt ? new Date(d.dischargedAt).toLocaleDateString() : '—'}
                  </Text>
                </Group>
              ))}
            </Stack>
          )}
        </Card>
      </SimpleGrid>
    </Container>
  );
}
