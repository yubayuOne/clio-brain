import { memo, useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { GestureDetector, useCompetingGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import { Icon } from '@/components/ui/Icon';
import { KIND_LABEL, fileExt, formatWhen, hostOf, tiltOf } from '@/lib/text';
import { canvas, cardWidth, colors, shadow } from '@/theme/tokens';
import type { Item } from '@/types';
import { WORLD } from './geometry';

interface Props {
  item: Item;
  zoom: number;
  selected: boolean;
  onTap: (id: string) => void;
  onDragStart: (id: string) => void;
  onDrag: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string) => void;
}

const surface: Record<Item['type'], string> = { note: colors.paper, link: colors.paper2, file: colors.paper3 };

function TypeLine({ item }: { item: Item }) {
  return (
    <View className="mb-1 flex-row items-center justify-between">
      <Text className="font-head text-xs uppercase tracking-widest text-red">{KIND_LABEL[item.type]}</Text>
      {item.processed ? null : (
        <View className="rounded-card bg-red px-1.5">
          <Text className="font-head text-xs uppercase tracking-widest text-paper">Inbox</Text>
        </View>
      )}
    </View>
  );
}

function Tags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return <Text className="mt-1.5 font-mono text-xs text-mute">{tags.map((t) => `#${t}`).join(' ')}</Text>;
}

function Reminder({ at }: { at: number | null }) {
  if (!at) return null;
  return (
    <View className="mt-1.5 flex-row items-center gap-1">
      <Icon name="bell" size={16} color={colors.red} />
      <Text className="font-mono text-xs text-mute">{formatWhen(at)}</Text>
    </View>
  );
}

function CardBody({ item }: { item: Item }) {
  if (item.type === 'file') {
    return (
      <>
        <TypeLine item={item} />
        <View className="mb-2 h-20 items-center justify-center bg-ink2">
          <Text className="font-head-bold text-3xl tracking-widest text-paper">{fileExt(item.fileName)}</Text>
        </View>
        <Text numberOfLines={2} className="font-mono text-xs leading-4 text-text">
          {item.title}
        </Text>
        <Tags tags={item.tags} />
        <Reminder at={item.remindAt} />
      </>
    );
  }
  return (
    <>
      {item.type === 'link' ? (
        <View className="mb-2">
          <View className="border-t border-text" />
          <View className="mt-px border-t border-text" />
          <Text
            numberOfLines={1}
            className="py-0.5 text-center font-head-bold text-sm uppercase tracking-wide text-text"
          >
            {hostOf(item.url) || 'link'}
          </Text>
          <View className="border-t border-text" />
        </View>
      ) : null}
      <TypeLine item={item} />
      <Text numberOfLines={2} className="font-head-bold text-lg uppercase leading-5 text-text">
        {item.title}
      </Text>
      {item.body ? (
        <Text numberOfLines={3} className="mt-1.5 font-mono text-xs leading-4 text-mute">
          {item.body}
        </Text>
      ) : null}
      <Tags tags={item.tags} />
      <Reminder at={item.remindAt} />
    </>
  );
}

/**
 * A paper card pinned to the board. Drag moves it (in canvas units, so the
 * finger stays on the card at any zoom); a tap opens it or picks it in thread mode.
 */
export const PaperCard = memo(function PaperCard({
  item,
  zoom,
  selected,
  onTap,
  onDragStart,
  onDrag,
  onDragEnd,
}: Props) {
  const origin = useRef({ x: 0, y: 0 });
  const live = useRef({ item, zoom });
  useEffect(() => {
    live.current = { item, zoom };
  }, [item, zoom]);

  const drag = usePanGesture({
    runOnJS: true,
    minDistance: canvas.dragSlop,
    maxPointers: 1,
    onActivate: () => {
      origin.current = { x: live.current.item.x, y: live.current.item.y };
      onDragStart(item.id);
    },
    onUpdate: (e) => {
      const k = live.current.zoom;
      onDrag(item.id, origin.current.x + e.translationX / k, origin.current.y + e.translationY / k);
    },
    onDeactivate: () => onDragEnd(item.id),
  });
  const tap = useTapGesture({ runOnJS: true, onActivate: () => onTap(item.id) });
  const gesture = useCompetingGestures(drag, tap);

  const label = `${KIND_LABEL[item.type]}: ${item.title}${item.processed ? '' : ', in inbox'}${item.remindAt ? `, reminder ${formatWhen(item.remindAt)}` : ''}`;
  const pad =
    item.type === 'file' ? 'px-2.5 pb-3 pt-3.5' : item.type === 'link' ? 'px-3 pb-3 pt-3.5' : 'px-3 pb-3 pt-4';

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Double tap to open"
        accessibilityState={{ selected }}
        onAccessibilityTap={() => onTap(item.id)}
        className={`absolute rounded-card ${pad}`}
        style={[
          shadow.card,
          {
            left: WORLD + item.x,
            top: WORLD + item.y,
            width: cardWidth[item.type],
            zIndex: item.z,
            backgroundColor: surface[item.type],
            // Pivot on the pin, like paper hanging from one pin: the pin stays exactly
            // where threads attach no matter the tilt.
            transformOrigin: ['50%', 0, 0],
            transform: [{ rotate: `${tiltOf(item.id)}deg` }],
          },
        ]}
      >
        {selected ? <View pointerEvents="none" className="absolute -inset-1 rounded-ctl border-4 border-red" /> : null}
        <View pointerEvents="none" className="absolute inset-x-0 -top-[5px] items-center">
          <View className="h-2.5 w-2.5 rounded-full bg-red" />
        </View>
        <CardBody item={item} />
      </View>
    </GestureDetector>
  );
});
