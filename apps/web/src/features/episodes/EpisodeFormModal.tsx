import { Button, Group, Modal, Stack, TextInput, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { useCreateEpisode } from '../../lib/queries';
import type { Episode } from '../../lib/types';

interface Props {
  patientId: string;
  opened: boolean;
  onClose: () => void;
  onCreated: (ep: Episode) => void;
}

export function EpisodeFormModal({ patientId, opened, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const create = useCreateEpisode();

  const form = useForm({
    initialValues: { title: '', diagnosis: '', primaryComplaint: '' },
    validate: { title: (v) => (v.trim() ? null : t('episodes.episodeTitle')) },
  });

  const submit = form.onSubmit(async (values) => {
    try {
      const ep = await create.mutateAsync({
        patientId,
        title: values.title.trim(),
        ...(values.diagnosis && { diagnosis: values.diagnosis }),
        ...(values.primaryComplaint && { primaryComplaint: values.primaryComplaint }),
      });
      form.reset();
      onClose();
      onCreated(ep);
    } catch (e) {
      notifications.show({ color: 'red', message: (e as Error).message });
    }
  });

  return (
    <Modal opened={opened} onClose={onClose} title={t('episodes.new')} centered>
      <form onSubmit={submit}>
        <Stack gap="md">
          <TextInput
            size="md"
            label={t('episodes.episodeTitle')}
            withAsterisk
            placeholder="Right shoulder rehab"
            {...form.getInputProps('title')}
          />
          <TextInput
            size="md"
            label={t('episodes.diagnosis')}
            {...form.getInputProps('diagnosis')}
          />
          <Textarea
            size="md"
            label={t('episodes.complaint')}
            autosize
            minRows={2}
            {...form.getInputProps('primaryComplaint')}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={create.isPending}>
              {t('episodes.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
