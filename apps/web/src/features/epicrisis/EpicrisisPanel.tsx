import { Badge, Button, Card, Center, Group, Loader, Stack, Text } from '@mantine/core';
import { IconFileText, IconRefresh, IconSparkles } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { useEpicrisis, useGenerateEpicrisis } from '../../lib/queries';
import type { EpicrisisContent } from '../../lib/types';
import classes from './EpicrisisPanel.module.css';

export function EpicrisisPanel({ episodeId }: { episodeId: string }) {
  const { t } = useTranslation();
  const { data: doc, isLoading } = useEpicrisis(episodeId);
  const generate = useGenerateEpicrisis(episodeId);

  const onGenerate = async () => {
    try {
      await generate.mutateAsync();
      notifications.show({ color: 'teal', message: t('epicrisis.title') });
    } catch (e) {
      notifications.show({ color: 'red', message: (e as Error).message });
    }
  };

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  const content = doc?.content as EpicrisisContent | undefined;

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Group gap="xs">
          <IconFileText size={22} color="var(--mantine-color-teal-6)" />
          <Text fw={600} fz="lg">
            {t('epicrisis.title')}
          </Text>
        </Group>
        <Button
          variant={doc ? 'light' : 'filled'}
          leftSection={doc ? <IconRefresh size={18} /> : <IconSparkles size={18} />}
          onClick={onGenerate}
          loading={generate.isPending}
        >
          {generate.isPending
            ? t('epicrisis.generating')
            : doc
              ? t('epicrisis.regenerate')
              : t('epicrisis.generate')}
        </Button>
      </Group>

      {!doc ? (
        <Card withBorder radius="md" p="xl">
          <Text c="dimmed" ta="center">
            {t('epicrisis.empty')}
          </Text>
        </Card>
      ) : (
        <Card withBorder radius="md" padding="lg">
          {content?.summary && (
            <Group gap="sm" mb="md">
              <Badge color="teal" variant="light" size="lg">
                {content.summary.improved} {t('epicrisis.improved')}
              </Badge>
              <Badge color="red" variant="light" size="lg">
                {content.summary.declined} {t('epicrisis.declined')}
              </Badge>
              <Badge color="gray" variant="light" size="lg">
                {content.summary.unchanged} {t('epicrisis.unchanged')}
              </Badge>
              <Badge color="blue" variant="light" size="lg">
                {content.summary.sessions} {t('epicrisis.sessions')}
              </Badge>
            </Group>
          )}
          {content?.generatedAt && (
            <Text fz="xs" c="dimmed" mb="sm">
              {t('epicrisis.generatedAt', {
                date: new Date(content.generatedAt).toLocaleString(),
              })}
            </Text>
          )}
          <pre className={classes.report}>{doc.renderedText}</pre>
        </Card>
      )}
    </Stack>
  );
}
