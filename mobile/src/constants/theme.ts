/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#24231F',
    background: '#F5F3EE',
    backgroundSecondary: '#ECE9E1',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EFE6D9',
    card: '#FFFFFF',
    textSecondary: '#6E6B63',
    primary: '#795438',
    primaryText: '#795438',
    accent: '#D6AE55',
    success: '#4F7F46',
    warning: '#9A681A',
    error: '#B45048',
    border: '#DEDAD0',
  },
  dark: {
    text: '#FFFFFF',
    background: '#10110F',
    backgroundSecondary: '#1B1C19',
    backgroundElement: '#25251F',
    backgroundSelected: '#3A3327',
    card: '#25251F',
    textSecondary: '#A6A69F',
    primary: '#795438',
    primaryText: '#D6AE55',
    accent: '#D6AE55',
    success: '#86B879',
    warning: '#E2B55A',
    error: '#E58B83',
    border: '#3B3B34',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Radii = {
  small: 10,
  medium: 14,
  large: 20,
  pill: 999,
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  seven: 96,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
