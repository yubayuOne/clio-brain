/**
 * Single source of truth for design values. tailwind.config.ts reads these,
 * and code that cannot use className (SVG strokes, shadows) imports them directly.
 * See DESIGN.md for the reasoning behind each value.
 */
export const colors = {
  ink: '#14110F',
  ink2: '#211C18',
  line: '#4A4038',
  canvas: '#1F3D2E',
  paper: '#EFE8D8',
  paper2: '#E2DAC6',
  paper3: '#F6F2E8',
  text: '#1A1612',
  mute: '#5E554A',
  dim: '#A89F90',
  rule: '#8A7F6E',
  red: '#B3261E',
  redLight: '#E8584D',
  focus: '#F2C14E',
  tape: '#EADFB8',
  field: 'rgba(0,0,0,0.05)',
  scrim: 'rgba(10,8,6,0.72)',
  glass: 'rgba(20,17,15,0.82)',
  dot: 'rgba(239,232,216,0.30)',
} as const;

/** Thread colours. The first one is the default. */
export const threadColors = [
  { value: '#E8584D', name: 'Red' },
  { value: '#F2D45C', name: 'Yellow' },
  { value: '#EFE8D8', name: 'White' },
  { value: '#7FB2EA', name: 'Blue' },
] as const;

export const fonts = {
  head: 'Oswald_500Medium',
  headBold: 'Oswald_600SemiBold',
  mono: 'CourierPrime_400Regular',
  monoBold: 'CourierPrime_700Bold',
} as const;

/** Card widths per item type, in canvas units. Threads anchor to the top centre. */
export const cardWidth = { note: 200, link: 178, file: 152 } as const;

export const canvas = {
  gridSize: 24,
  dotRadius: 1.3,
  minZoom: 0.4,
  maxZoom: 2.5,
  /** Initial view: leaves room for the floating header. */
  start: { x: 0, y: 130, k: 1 },
  /** Cards dragged less than this (pt) count as a tap. */
  dragSlop: 6,
} as const;

/** Elevation levels: card on canvas, raised card or popup, dialog. */
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },
  raised: {
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  fab: {
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
} as const;
