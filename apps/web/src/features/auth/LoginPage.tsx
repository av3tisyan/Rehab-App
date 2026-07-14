import { Button, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconStethoscope } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLogin } from '../../lib/queries';
import { ApiError } from '../../lib/api';
import classes from './LoginPage.module.css';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useLogin();
  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : t('auth.email')),
      password: (v) => (v.length > 0 ? null : t('auth.password')),
    },
  });

  const submit = form.onSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      navigate('/patients', { replace: true });
    } catch {
      /* error rendered below */
    }
  });

  const errorMsg =
    login.error instanceof ApiError ? login.error.message : login.isError ? t('auth.failed') : null;

  return (
    <div className={classes.wrap}>
      <div className={classes.panel}>
        <Paper radius="lg" p="xl" shadow="md" className={classes.card}>
          <Stack gap="lg">
            <Stack gap={6} align="center">
              <div className={classes.logo}>
                <IconStethoscope size={30} stroke={1.7} />
              </div>
              <Title order={2}>{t('app.name')}</Title>
              <Text c="dimmed" fz="sm">
                {t('auth.login')}
              </Text>
            </Stack>

            <form onSubmit={submit}>
              <Stack gap="md">
                <TextInput
                  size="md"
                  label={t('auth.email')}
                  placeholder="admin@rehab.local"
                  autoComplete="username"
                  {...form.getInputProps('email')}
                />
                <PasswordInput
                  size="md"
                  label={t('auth.password')}
                  autoComplete="current-password"
                  {...form.getInputProps('password')}
                />
                {errorMsg && (
                  <Text c="red" fz="sm">
                    {errorMsg}
                  </Text>
                )}
                <Button type="submit" size="md" fullWidth loading={login.isPending}>
                  {login.isPending ? t('auth.signingIn') : t('auth.signIn')}
                </Button>
              </Stack>
            </form>
          </Stack>
        </Paper>
      </div>
    </div>
  );
}
