import { createTheme, rem } from '@mantine/core';

/**
 * Tablet-first theme. Touch targets are enlarged so interactive controls
 * comfortably exceed the 44px minimum from the non-functional requirements.
 */
export const theme = createTheme({
  primaryColor: 'teal',
  defaultRadius: 'md',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Armenian", sans-serif',
  components: {
    Button: {
      defaultProps: { size: 'lg' },
      styles: { root: { minHeight: rem(48) } },
    },
    SegmentedControl: {
      styles: { label: { minHeight: rem(44), display: 'flex', alignItems: 'center' } },
    },
  },
});
