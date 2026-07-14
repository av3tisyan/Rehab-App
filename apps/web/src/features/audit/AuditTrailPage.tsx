import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Select,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { IconShieldCheck, IconShieldX, IconLock } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAudit, useVerifyAudit } from '../../lib/queries';

const ACTION_COLOR: Record<string, string> = {
  create: 'teal',
  update: 'blue',
  delete: 'red',
  view: 'gray',
};

const ENTITIES = ['patients', 'episodes', 'encounters', 'assessments', 'documents', 'goals', 'auth'];
const ACTIONS = ['create', 'update', 'delete', 'view'];

export function AuditTrailPage() {
  const { t } = useTranslation();
  const [entity, setEntity] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const { data: rows, isLoading } = useAudit({
    entity: entity ?? undefined,
    action: action ?? undefined,
  });
  const verify = useVerifyAudit();

  const actionLabel = (a: string) => (ACTIONS.includes(a) ? t(`audit.actions.${a}`) : a);

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" align="flex-end" mb="md">
        <Title order={1}>{t('audit.title')}</Title>
        <Button
          variant="light"
          leftSection={<IconShieldCheck size={18} />}
          loading={verify.isPending}
          onClick={() => verify.mutate()}
        >
          {verify.isPending ? t('audit.verifying') : t('audit.verify')}
        </Button>
      </Group>

      {verify.data &&
        (verify.data.status === 'intact' ? (
          <Alert color="teal" icon={<IconShieldCheck size={18} />} mb="md">
            {t('audit.intact', { count: verify.data.rowsChecked })}
          </Alert>
        ) : (
          <Alert color="red" icon={<IconShieldX size={18} />} mb="md">
            {t('audit.tampered', { id: verify.data.firstBadId })}
          </Alert>
        ))}

      <Alert color="gray" variant="light" icon={<IconLock size={16} />} mb="lg">
        {t('audit.immutableNote')}
      </Alert>

      <Group mb="md" gap="sm">
        <Select
          placeholder={t('audit.allEntities')}
          clearable
          value={entity}
          onChange={setEntity}
          data={ENTITIES.map((e) => ({ value: e, label: e }))}
          w={200}
        />
        <Select
          placeholder={t('audit.allActions')}
          clearable
          value={action}
          onChange={setAction}
          data={ACTIONS.map((a) => ({ value: a, label: actionLabel(a) }))}
          w={200}
        />
      </Group>

      {isLoading ? (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      ) : !rows || rows.length === 0 ? (
        <Card withBorder radius="md" p="xl">
          <Text c="dimmed" ta="center">
            {t('audit.empty')}
          </Text>
        </Card>
      ) : (
        <Card withBorder radius="md" padding={0}>
          <Table.ScrollContainer minWidth={720}>
            <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('audit.when')}</Table.Th>
                  <Table.Th>{t('audit.user')}</Table.Th>
                  <Table.Th>{t('audit.action')}</Table.Th>
                  <Table.Th>{t('audit.entity')}</Table.Th>
                  <Table.Th>{t('audit.ip')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((r) => (
                  <Table.Tr key={r.id}>
                    <Table.Td>
                      <Text fz="sm">{new Date(r.createdAt).toLocaleString()}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fz="sm">{r.userEmail ?? '—'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={ACTION_COLOR[r.action] ?? 'gray'} variant="light">
                        {actionLabel(r.action)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text fz="sm" fw={500}>
                        {r.entity}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fz="xs" c="dimmed">
                        {r.ipAddress ?? '—'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card>
      )}
    </Container>
  );
}
