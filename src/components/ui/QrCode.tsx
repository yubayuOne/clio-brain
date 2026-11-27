import { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { create } from 'qrcode';
import { colors } from '@/theme/tokens';

/** A QR code drawn as one SVG path, with the 4-module quiet zone scanners need. */
export function QrCode({ text, size }: { text: string; size: number }) {
  const { n, d } = useMemo(() => {
    const { modules } = create(text, { errorCorrectionLevel: 'L' });
    let path = '';
    for (let y = 0; y < modules.size; y++) {
      for (let x = 0; x < modules.size; x++) if (modules.get(y, x)) path += `M${x} ${y}h1v1h-1z`;
    }
    return { n: modules.size, d: path };
  }, [text]);
  return (
    <Svg width={size} height={size} viewBox={`-4 -4 ${n + 8} ${n + 8}`} accessibilityElementsHidden>
      <Rect x={-4} y={-4} width={n + 8} height={n + 8} fill={colors.paper3} />
      <Path d={d} fill={colors.text} />
    </Svg>
  );
}
