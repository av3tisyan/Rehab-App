import { useEffect } from 'react';
import { Button, Group, Stack, Tabs, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useDocument, useUpsertDocument } from '../../lib/queries';

interface FieldDef {
  key: string;
  labelKey: string;
}

const VITAE_FIELDS: FieldDef[] = [
  { key: 'occupation', labelKey: 'anamnesis.occupation' },
  { key: 'lifestyle', labelKey: 'anamnesis.lifestyle' },
  { key: 'habits', labelKey: 'anamnesis.habits' },
  { key: 'allergies', labelKey: 'anamnesis.allergies' },
];

const MORBI_FIELDS: FieldDef[] = [
  { key: 'onset', labelKey: 'anamnesis.onset' },
  { key: 'mechanism', labelKey: 'anamnesis.mechanism' },
  { key: 'course', labelKey: 'anamnesis.course' },
  { key: 'priorTreatment', labelKey: 'anamnesis.priorTreatment' },
  { key: 'comorbidities', labelKey: 'anamnesis.comorbidities' },
  { key: 'medications', labelKey: 'anamnesis.medications' },
  { key: 'redFlags', labelKey: 'anamnesis.redFlags' },
];

function AnamnesisForm({
  episodeId,
  type,
  fields,
}: {
  episodeId: string;
  type: string;
  fields: FieldDef[];
}) {
  const { t } = useTranslation();
  const { data: doc } = useDocument(episodeId, type);
  const upsert = useUpsertDocument();

  const form = useForm<Record<string, string>>({
    initialValues: Object.fromEntries(fields.map((f) => [f.key, ''])),
  });

  // Pre-fill from the saved document once it loads.
  useEffect(() => {
    if (doc?.content) {
      const values = Object.fromEntries(
        fields.map((f) => [f.key, String(doc.content[f.key] ?? '')]),
      );
      form.setValues(values);
      form.resetDirty(values);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);

  const submit = form.onSubmit(async (values) => {
    try {
      await upsert.mutateAsync({ episodeId, type, content: values });
      notifications.show({ color: 'teal', message: t('anamnesis.saved') });
      form.resetDirty();
    } catch (e) {
      notifications.show({ color: 'red', title: t('anamnesis.saveError'), message: (e as Error).message });
    }
  });

  return (
    <form onSubmit={submit}>
      <Stack gap="md">
        {fields.map((f) => (
          <Textarea
            key={f.key}
            label={t(f.labelKey)}
            autosize
            minRows={2}
            {...form.getInputProps(f.key)}
          />
        ))}
        <Group justify="flex-end">
          <Button
            type="submit"
            leftSection={<IconDeviceFloppy size={18} />}
            loading={upsert.isPending}
            disabled={!form.isDirty()}
          >
            {t('common.save')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

export function AnamnesisPanel({ episodeId }: { episodeId: string }) {
  const { t } = useTranslation();
  return (
    <Tabs defaultValue="morbi" keepMounted={false}>
      <Tabs.List mb="md">
        <Tabs.Tab value="morbi">{t('anamnesis.morbi')}</Tabs.Tab>
        <Tabs.Tab value="vitae">{t('anamnesis.vitae')}</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="morbi">
        <AnamnesisForm episodeId={episodeId} type="anamnesis_morbi" fields={MORBI_FIELDS} />
      </Tabs.Panel>
      <Tabs.Panel value="vitae">
        <AnamnesisForm episodeId={episodeId} type="anamnesis_vitae" fields={VITAE_FIELDS} />
      </Tabs.Panel>
    </Tabs>
  );
}
