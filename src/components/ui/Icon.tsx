import Svg, { Path } from 'react-native-svg';

/**
 * One icon family: 24px grid, 2px stroke, round caps. Drawn here so the app
 * carries no icon-font dependency and every glyph matches the prototype.
 */
const PATHS = {
  edit: 'M4 20h4L19 9l-4-4L4 16z',
  trash: 'M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
  close: 'M6 6l12 12M18 6L6 18',
  back: 'M15 5l-7 7 7 7',
  down: 'M6 9l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  arrowRight: 'M4 12h16M14 6l6 6-6 6',
  arrowLeft: 'M20 12H4M10 6l-6 6 6 6',
  check: 'M5 12l5 5 9-10',
  grid: 'M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z',
  thread: 'M3 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0M17 6a2 2 0 1 0 4 0a2 2 0 1 0-4 0M6.5 16.5C9 6 14 19 17.5 7.5',
  file: 'M14 3H6v18h12V7zM14 3v4h4',
  bell: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4',
  clock: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 7v5l3 2',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  settings: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M6 15v4',
  upload: 'M12 15V4M7 9l5-5 5 5M5 20h14',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  checklist: 'M4 4h6v6H4zM4 14h6v6H4zM14 7h6M14 17h6',
} as const;

export type IconName = keyof typeof PATHS;

interface Props {
  name: IconName;
  size?: 16 | 20 | 24;
  color: string;
}

export function Icon({ name, size = 24, color }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path d={PATHS[name]} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
