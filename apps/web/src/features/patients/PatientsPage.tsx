import { useState } from 'react';
import {
  ActionIcon,
  Avatar,
  Card,
  Container,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  Button,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconPlus, IconSearch, IconChevronRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePatients } from '../../lib/queries';
import { PatientFormModal } from './PatientFormModal';
import type { Patient } from '../../lib/types';

function initials(p: Patient): string {
  return `${p.firstName[0] ?? ''}${p.lastName[0] ?? ''}`.toUpperCase();
}

function age(dob: string | null): string {
  if (!dob) return '';
  const years = Math.floor((Date.now() - new Date(dob).getTime()) / 3.156e10);
  return `${years}`;
}

export function PatientsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debounced] = useDebouncedValue(search, 250);
  const [createOpen, setCreateOpen] = useState(false);
  const { data: patients, isLoading } = usePatients(debounced);

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" align="flex-end" mb="lg">
        <div>
          <Title order={1}>{t('patients.title')}</Title>
        </div>
        <Button leftSection={<IconPlus size={18} />} onClick={() => setCreateOpen(true)}>
          {t('patients.new')}
        </Button>
      </Group>

      <TextInput
        size="md"
        mb="lg"
        placeholder={t('patients.search')}
        leftSection={<IconSearch size={18} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        maw={420}
      />

      {isLoading ? (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      ) : !patients || patients.length === 0 ? (
        <Card withBorder radius="md" p="xl">
          <Text c="dimmed" ta="center">
            {t('patients.empty')}
          </Text>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {patients.map((p) => (
            <Card
              key={p.id}
              withBorder
              radius="md"
              padding="lg"
              className="hoverCard"
              onClick={() => navigate(`/patients/${p.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <Group justify="space-between" wrap="nowrap">
                <Group wrap="nowrap">
                  <Avatar color="teal" radius="xl" size={48}>
                    {initials(p)}
                  </Avatar>
                  <div>
                    <Text fw={600} fz="lg">
                      {p.lastName} {p.firstName}
                    </Text>
                    <Text c="dimmed" fz="sm">
                      {[age(p.dateOfBirth), p.phone].filter(Boolean).join(' · ')}
                    </Text>
                  </div>
                </Group>
                <ActionIcon variant="subtle" color="gray" size="lg">
                  <IconChevronRight size={20} />
                </ActionIcon>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <PatientFormModal
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={(p) => navigate(`/patients/${p.id}`)}
      />
    </Container>
  );
}
