import { useCallback, useEffect, useMemo } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  GestureDetector,
  useCompetingGestures,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import { useData } from '@/store/data';
import { useUi } from '@/store/ui';
import { canvas } from '@/theme/tokens';
import type { Item, Thread, Viewport } from '@/types';
import { DotGrid } from './DotGrid';
import { PaperCard } from './PaperCard';
import { Threads } from './Threads';
import { WORLD, segmentsFor } from './geometry';

interface Props {
  items: Item[];
  threads: Thread[];
  vp: Viewport;
  onViewport: (v: Viewport) => void;
  onCardTap: (id: string) => void;
  onThreadTap: (a: string, b: string) => void;
}

/**
 * Infinite board. Cards live in one oversized layer (2 x WORLD square, origin in the
 * middle) that is translated and scaled as a whole. The layer is large on purpose:
 * Android only delivers touches inside a parent's bounds, so a small layer would
 * make cards that were panned away from the origin untouchable.
 */
export function Canvas({ items, threads, vp, onViewport, onCardTap, onThreadTap }: Props) {
  const size = useUi((s) => s.canvasSize);
  const selectedId = useUi((s) => s.selectedId);
  const select = useUi((s) => s.select);
  const placeItem = useData((s) => s.placeItem);
  const commitItem = useData((s) => s.commitItem);
  const bringToFront = useData((s) => s.bringToFront);

  // The viewport lives in shared values so pan/pinch run on the UI thread without
  // re-rendering React every frame; the store only gets the result when all fingers lift.
  const x = useSharedValue(vp.x);
  const y = useSharedValue(vp.y);
  const k = useSharedValue(vp.k);
  const active = useSharedValue(0);

  // External changes (board switch, Tidy) move the shared values; skipped mid-gesture.
  useEffect(() => {
    if (active.get() > 0) return;
    x.set(vp.x);
    y.set(vp.y);
    k.set(vp.k);
  }, [vp, x, y, k, active]);

  const commit = useCallback((nx: number, ny: number, nk: number) => onViewport({ x: nx, y: ny, k: nk }), [onViewport]);
  const begin = () => {
    'worklet';
    active.set(active.get() + 1);
  };
  const end = () => {
    'worklet';
    active.set(active.get() - 1);
    if (active.get() === 0) scheduleOnRN(commit, x.get(), y.get(), k.get());
  };

  // Both gestures apply per-event deltas to the current values instead of offsets from a
  // shared start snapshot, so they compose without jumps when fingers are added or lifted.
  const pan = usePanGesture({
    minDistance: canvas.dragSlop,
    // Track the centroid of all fingers (Android default is the last finger), so a
    // two-finger move pans by the same point pinch zooms around.
    averageTouches: true,
    onActivate: begin,
    onUpdate: (e) => {
      'worklet';
      x.set(x.get() + e.changeX);
      y.set(y.get() + e.changeY);
    },
    onDeactivate: end,
  });
  const pinch = usePinchGesture({
    onActivate: begin,
    onUpdate: (e) => {
      'worklet';
      const nk = Math.min(Math.max(k.get() * e.scaleChange, canvas.minZoom), canvas.maxZoom);
      const r = nk / k.get();
      // Scale around the current focal point: the canvas point under the fingers stays put.
      x.set(e.focalX - (e.focalX - x.get()) * r);
      y.set(e.focalY - (e.focalY - y.get()) * r);
      k.set(nk);
    },
    onDeactivate: end,
  });
  const tap = useTapGesture({ runOnJS: true, onActivate: () => select(null) });
  const move = useSimultaneousGestures(pan, pinch);
  const background = useCompetingGestures(move, tap);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    useUi.setState({ canvasSize: { w: width, h: height } });
  }, []);

  const segments = useMemo(() => segmentsFor(items, threads), [items, threads]);
  const titles = useMemo(() => new Map(items.map((i) => [i.id, i.title])), [items]);
  const titleOf = useCallback((id: string) => titles.get(id) ?? '', [titles]);
  const ordered = useMemo(() => [...items].sort((a, b) => a.z - b.z), [items]);
  const layer = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: k.get() }],
  }));

  return (
    <GestureDetector gesture={background}>
      <View className="absolute inset-0 overflow-hidden bg-canvas" onLayout={onLayout}>
        <DotGrid x={x} y={y} k={k} width={size.w} height={size.h} />
        <Animated.View
          pointerEvents="box-none"
          style={[
            {
              position: 'absolute',
              left: -WORLD,
              top: -WORLD,
              width: WORLD * 2,
              height: WORLD * 2,
              transformOrigin: [WORLD, WORLD, 0],
            },
            layer,
          ]}
        >
          <Threads segments={segments} titleOf={titleOf} onPress={onThreadTap} />
          {ordered.map((it) => (
            <PaperCard
              key={it.id}
              item={it}
              zoom={vp.k}
              selected={selectedId === it.id}
              onTap={onCardTap}
              onDragStart={bringToFront}
              onDrag={placeItem}
              onDragEnd={commitItem}
            />
          ))}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}
