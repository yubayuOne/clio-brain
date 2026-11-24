import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { canvas, colors } from '@/theme/tokens';

const AnimatedPattern = Animated.createAnimatedComponent(Pattern);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  x: SharedValue<number>;
  y: SharedValue<number>;
  k: SharedValue<number>;
  width: number;
  height: number;
}

/**
 * Dot grid over the flat canvas color; it pans and scales with the cards. The pattern
 * is anchored to the viewport so the grid never ends.
 * Driven by the canvas shared values so it follows gestures on the UI thread.
 */
export function DotGrid({ x, y, k, width, height }: Props) {
  const dots = useAnimatedProps(() => {
    const s = canvas.gridSize * k.get();
    return { x: x.get() - s / 2, y: y.get() - s / 2, width: s, height: s };
  });
  const dot = useAnimatedProps(() => {
    const s = canvas.gridSize * k.get();
    return { cx: s / 2, cy: s / 2 };
  });

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      <Defs>
        <AnimatedPattern id="dots" patternUnits="userSpaceOnUse" animatedProps={dots}>
          <AnimatedCircle r={canvas.dotRadius} fill={colors.dot} animatedProps={dot} />
        </AnimatedPattern>
      </Defs>
      <Rect width={width} height={height} fill="url(#dots)" />
    </Svg>
  );
}
