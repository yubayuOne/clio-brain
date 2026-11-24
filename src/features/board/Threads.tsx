import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import type { Segment } from './geometry';
import { WORLD, labelAngle } from './geometry';

interface Props {
  segments: Segment[];
  titleOf: (id: string) => string;
  onPress: (fromId: string, toId: string) => void;
}

const PAD = 8;

interface LabelProps {
  fromId: string;
  toId: string;
  label: string;
  mx: number;
  my: number;
  angle: number;
  a11y: string;
  onPress: (fromId: string, toId: string) => void;
}

// Primitive props only, so a card drag re-renders just the labels of its own threads.
const ThreadLabel = memo(function ThreadLabel({ fromId, toId, label, mx, my, angle, a11y, onPress }: LabelProps) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: mx - 120,
        top: my - 22,
        width: 240,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: `${angle}deg` }],
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11y}
        onPress={() => onPress(fromId, toId)}
        hitSlop={11}
        className={label ? 'h-[22px] justify-center bg-tape px-2' : 'h-11 w-11'}
      >
        {label ? (
          <Text numberOfLines={1} className="font-mono text-xs text-text">
            {label}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
});

/**
 * Straight threads drawn under the cards. The SVG covers only the bounding box of
 * the threads (a world-sized SVG would allocate a huge bitmap on Android).
 * Each thread is tappable at its midpoint, through its label or a 44pt hit area.
 */
export function Threads({ segments, titleOf, onPress }: Props) {
  if (segments.length === 0) return null;
  const xs = segments.flatMap((s) => [s.x1, s.x2]);
  const ys = segments.flatMap((s) => [s.y1, s.y2]);
  const minX = Math.min(...xs) - PAD;
  const minY = Math.min(...ys) - PAD;
  const w = Math.max(...xs) - minX + PAD;
  const h = Math.max(...ys) - minY + PAD;

  return (
    <>
      <Svg
        width={w}
        height={h}
        pointerEvents="none"
        style={{ position: 'absolute', left: WORLD + minX, top: WORLD + minY }}
      >
        {segments.map((s) => (
          <Line
            key={`${s.thread.fromId}>${s.thread.toId}`}
            x1={s.x1 - minX}
            y1={s.y1 - minY}
            x2={s.x2 - minX}
            y2={s.y2 - minY}
            stroke={s.thread.color}
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}
      </Svg>
      {segments.map((s) => {
        const { fromId, toId, label } = s.thread;
        return (
          <ThreadLabel
            key={`l-${fromId}>${toId}`}
            fromId={fromId}
            toId={toId}
            label={label}
            mx={WORLD + (s.x1 + s.x2) / 2}
            my={WORLD + (s.y1 + s.y2) / 2}
            angle={labelAngle(s)}
            a11y={`Thread from ${titleOf(fromId)} to ${titleOf(toId)}${label ? `, ${label}` : ''}. Edit thread`}
            onPress={onPress}
          />
        );
      })}
    </>
  );
}
