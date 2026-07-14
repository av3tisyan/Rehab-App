import { AppShell, Badge, Burger, Group, Menu, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconLanguage,
  IconLogout,
  IconShieldLock,
  IconStethoscope,
  IconWifiOff,
} from '@tabler/icons-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../lib/auth-store';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { SUPPORTED_LOCALES, setLocale } from '../i18n';
import classes from './AppLayout.module.css';

export function AppLayout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const clear = useAuthStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);
  const online = useOnlineStatus();
  const [opened, { toggle }] = useDisclosure();

  const logout = () => {
    clear();
    navigate('/login', { replace: true });
  };

  return (
    <AppShell header={{ height: 64 }} padding={0}>
      <AppShell.Header className={classes.header}>
        <Group h="100%" px="lg" justify="space-between" wrap="nowrap">
          <UnstyledButton className={classes.brand} onClick={() => navigate('/patients')}>
            <IconStethoscope size={26} stroke={1.7} />
            <Text fw={700} fz="lg">
              {t('app.name')}
            </Text>
          </UnstyledButton>

          <Group gap="sm" wrap="nowrap">
            {!online && (
              <Badge color="orange" variant="light" leftSection={<IconWifiOff size={14} />}>
                {t('common.offline')}
              </Badge>
            )}

            <Menu position="bottom-end" width={180}>
              <Menu.Target>
                <UnstyledButton className={classes.iconBtn} aria-label={t('nav.language')}>
                  <IconLanguage size={22} />
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{t('nav.language')}</Menu.Label>
                {SUPPORTED_LOCALES.map((l) => (
                  <Menu.Item
                    key={l.code}
                    onClick={() => setLocale(l.code)}
                    fw={i18n.language === l.code ? 700 : 400}
                  >
                    {l.label}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>

            <Menu position="bottom-end" width={200}>
              <Menu.Target>
                <UnstyledButton className={classes.user}>
                  <Text fz="sm" fw={600} visibleFrom="sm">
                    {user?.email}
                  </Text>
                  <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                {user?.role === 'admin' && (
                  <>
                    <Menu.Item
                      leftSection={<IconShieldLock size={16} />}
                      onClick={() => navigate('/audit')}
                    >
                      {t('audit.nav')}
                    </Menu.Item>
                    <Menu.Divider />
                  </>
                )}
                <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={logout}>
                  {t('nav.logout')}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main className={classes.main}>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
