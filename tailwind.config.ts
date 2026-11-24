import type { Config } from 'tailwindcss';
import { colors, fonts } from './src/theme/tokens';

export default {
  content: ['./index.ts', './src/**/*.{ts,tsx}'],
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- nativewind/preset ships CommonJS without types
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: colors.ink,
        ink2: colors.ink2,
        line: colors.line,
        canvas: colors.canvas,
        paper: colors.paper,
        paper2: colors.paper2,
        paper3: colors.paper3,
        text: colors.text,
        mute: colors.mute,
        dim: colors.dim,
        rule: colors.rule,
        red: colors.red,
        'red-light': colors.redLight,
        focus: colors.focus,
        tape: colors.tape,
        field: colors.field,
        glass: colors.glass,
      },
      fontFamily: {
        head: [fonts.head],
        'head-bold': [fonts.headBold],
        mono: [fonts.mono],
        'mono-bold': [fonts.monoBold],
      },
      borderRadius: { card: '2px', ctl: '4px', sheet: '8px' },
    },
  },
  plugins: [],
} satisfies Config;
