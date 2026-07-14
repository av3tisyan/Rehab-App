import { useState } from 'react';
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
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconActivity,
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDeletePatient, useEpisodes, usePatient } from '../../lib/queries';
import { EpisodeFormModal } from '../episodes/EpisodeFormModal';
import { PatientFormModal } from './PatientFormModal';
import type { EpisodeStatus } from '@rehab/shared';

const STATUS_COLOR: Record<EpisodeStatus, string> = {
  active: 'teal',
  discharged: 'gray',
  on_hold: 'yellow',
  cancelled: 'red',
};

function Biometric({ label, value }: { label: string; value: string }) {
  return (
    <Paper withBorder radius="md" p="md">
      <Text fz="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text fz="xl" fw={700}>
        {value}
      </Text>
    </Paper>
  );
}

export function PatientDetailPage() {
  const { patientId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: patient, isLoading } = usePatient(patientId);
  const { data: episodes } = useEpisodes(patientId);
  const deletePatient = useDeletePatient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading || !patient) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Breadcrumbs mb="md">
        <Anchor onClick={() => navigate('/patients')}>{t('patients.title')}</Anchor>
        <Text>
          {patient.lastName} {patient.firstName}
        </Text>
      </Breadcrumbs>

      <Group justify="space-between" align="flex-start" mb="md" wrap="nowrap">
        <Title order={1}>
          {patient.lastName} {patient.firstName}
        </Title>
        <Menu position="bottom-end" width={190}>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" size="xl" aria-label="Patient actions">
              <IconDotsVertical size={22} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconPencil size={16} />} onClick={() => setEditOpen(true)}>
              {t('patients.edit')}
            </Menu.Item>
            <Menu.Item
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={() => setDeleteOpen(true)}
            >
              {t('patients.remove')}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        <Biometric label={t('patients.heightCm')} value={patient.heightCm ?? '—'} />
        <Biometric
          label={t('patients.dominantHand')}
          value={
            patient.dominantHand
              ? t(`assessment.${patient.dominantHand as 'left' | 'right'}`)
              : '—'
          }
        />
        <Biometric label={t('patients.sex')} value={patient.sex} />
        <Biometric label={t('patients.phone')} value={patient.phone ?? '—'} />
      </SimpleGrid>

      <Group justify="space-between" align="flex-end" mb="md">
        <Title order={3}>{t('episodes.title')}</Title>
        <Button
          variant="light"
          leftSection={<IconPlus size={18} />}
          onClick={() => setCreateOpen(true)}
        >
          {t('episodes.new')}
        </Button>
      </Group>

      {!episodes || episodes.length === 0 ? (
        <Card withBorder radius="md" p="xl">
          <Text c="dimmed" ta="center">
            {t('episodes.empty')}
          </Text>
        </Card>
      ) : (
        <Stack gap="sm">
          {episodes.map((ep) => (
            <Card
              key={ep.id}
              withBorder
              radius="md"
              padding="lg"
              className="hoverCard"
              onClick={() => navigate(`/episodes/${ep.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <Group justify="space-between" wrap="nowrap">
                <Group wrap="nowrap">
                  <IconActivity size={22} color="var(--mantine-color-teal-6)" />
                  <div>
                    <Text fw={600} fz="lg">
                      {ep.title}
                    </Text>
                    {ep.diagnosis && (
                      <Text c="dimmed" fz="sm">
                        {ep.diagnosis}
                      </Text>
                    )}
                  </div>
                </Group>
                <Badge color={STATUS_COLOR[ep.status]} variant="light">
                  {t(`episodes.status.${ep.status}`)}
                </Badge>
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      <EpisodeFormModal
        patientId={patient.id}
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(ep) => navigate(`/episodes/${ep.id}`)}
      />

      <PatientFormModal
        patient={patient}
        opened={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => setEditOpen(false)}
      />

      <Modal
        opened={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t('patients.remove')}
        centered
      >
        <Stack gap="md">
          <Text>
            {t('patients.removeConfirm', {
              name: `${patient.lastName} ${patient.firstName}`,
            })}
          </Text>
          <Text fz="sm" c="dimmed">
            {t('patients.removeNote')}
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              color="red"
              loading={deletePatient.isPending}
              onClick={async () => {
                try {
                  await deletePatient.mutateAsync(patient.id);
                  notifications.show({ color: 'teal', message: t('patients.removed') });
                  navigate('/patients');
                } catch (e) {
                  notifications.show({ color: 'red', message: (e as Error).message });
                }
              }}
            >
              {t('patients.remove')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
