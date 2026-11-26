import { useMemo } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Segmented } from '@/components/ui/Segmented';
import { KIND_LABEL, displayBody } from '@/lib/text';
import { useData } from '@/store/data';
import { useUi, type ListGroup } from '@/store/ui';
import { shadow } from '@/theme/tokens';
import type { Item, ItemType, Thread } from '@/types';

const TYPES: ItemType[] = ['note', 'link', 'file'];

function matches(drill: string, i: Item): boolean {
  if (drill.startsWith('type:')) return i.type === drill.slice(5);
  return i.tags.includes(drill.slice(4));
}

const drillName = (d: string): string =>
  d.startsWith('type:') ? KIND_LABEL[d.slice(5) as ItemType] : `#${d.slice(4)}`;

function ItemRow({ item, threads }: { item: Item; threads: Thread[] }) {
  const sub = item.type === 'link' ? item.url : displayBody(item.body) || item.fileName;
  const count = threads.filter((t) => t.fromId === item.id).length;
  const meta = [item.tags.map((t) => `#${t}`).join(' '), count ? `${count} ${count === 1 ? 'thread' : 'threads'}` : '']
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${KIND_LABEL[item.type]}: ${item.title}${item.processed ? '' : ', in inbox'}`}
      onPress={() => useUi.getState().open({ kind: 'preview', id: item.id })}
      className="mb-3 rounded-card bg-paper px-3.5 py-3 active:opacity-90"
      style={shadow.card}
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-head text-xs uppercase tracking-widest text-red">{KIND_LABEL[item.type]}</Text>
        {item.processed ? null : (
          <View className="rounded-card bg-red px-1.5">
            <Text className="font-head text-xs uppercase tracking-widest text-paper">Inbox</Text>
          </View>
        )}
      </View>
      <Text className="mb-1 mt-1 font-head-bold text-xl uppercase leading-6 text-text">{item.title}</Text>
      {sub ? (
        <Text numberOfLines={2} className="font-mono text-sm text-mute">
          {sub}
        </Text>
      ) : null}
      {meta ? <Text className="mt-1.5 font-mono text-xs text-mute">{meta}</Text> : null}
    </Pressable>
  );
}

function GroupRow({ name, count, onPress }: { name: string; count: number; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${count} ${count === 1 ? 'item' : 'items'}`}
      onPress={onPress}
      className="mb-3 min-h-14 flex-row items-center justify-between rounded-card bg-paper px-3.5 active:opacity-90"
      style={shadow.card}
    >
      <Text numberOfLines={1} className="flex-1 font-head-bold text-xl uppercase text-text">
        {name}
      </Text>
      <View className="rounded-card bg-ink px-2 py-px">
        <Text className="font-mono text-sm text-paper">{count}</Text>
      </View>
    </Pressable>
  );
}

function Empty({ text }: { text: string }) {
  return <Text className="px-3 py-9 text-center font-mono text-sm text-dim">{text}</Text>;
}

type Row = { key: string; item?: Item; group?: { name: string; drill: string; count: number } };

export function ListView() {
  const insets = useSafeAreaInsets();
  const all = useData((s) => s.items);
  const threads = useData((s) => s.threads);
  const boardId = useData((s) => s.currentBoardId);
  const group = useUi((s) => s.group);
  const drill = useUi((s) => s.drill);

  const items = useMemo(() => all.filter((i) => i.boardId === boardId), [all, boardId]);
  const inbox = useMemo(() => items.filter((i) => !i.processed), [items]);

  const { rows, empty } = useMemo((): { rows: Row[]; empty: string } => {
    const newest = (l: Item[]) => [...l].sort((a, b) => b.createdAt - a.createdAt).map((i) => ({ key: i.id, item: i }));
    if (group === 'inbox') return { rows: newest(inbox), empty: 'Inbox is empty. Everything has been processed.' };
    if (drill) return { rows: newest(items.filter((i) => matches(drill, i))), empty: 'No items here yet.' };
    if (group === 'type') {
      return {
        rows: TYPES.map((t) => ({
          key: t,
          group: { name: KIND_LABEL[t], drill: `type:${t}`, count: items.filter((i) => i.type === t).length },
        })),
        empty: '',
      };
    }
    const tags = [...new Set(items.flatMap((i) => i.tags))].sort();
    return {
      rows: tags.map((t) => ({
        key: t,
        group: { name: `#${t}`, drill: `tag:${t}`, count: items.filter((i) => i.tags.includes(t)).length },
      })),
      empty: 'No tags yet. Add tags from the item edit screen.',
    };
  }, [group, drill, items, inbox]);

  const label = (g: ListGroup, base: string) => (group === g && drill ? `‹ ${drillName(drill)}` : base);
  const onChange = (g: ListGroup) => useUi.getState().setGroup(g);

  return (
    <View className="flex-1">
      <View className="mx-4 mb-3">
        <Segmented
          tone="dark"
          accessibilityLabel="List grouping"
          value={group}
          onChange={onChange}
          options={[
            { value: 'inbox', label: 'Inbox', badge: inbox.length },
            { value: 'type', label: label('type', 'Type') },
            { value: 'tag', label: label('tag', 'Tag') },
          ]}
        />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 120 }}
        ListEmptyComponent={empty ? <Empty text={empty} /> : undefined}
        renderItem={({ item: r }) =>
          r.item ? (
            <ItemRow item={r.item} threads={threads} />
          ) : r.group ? (
            <GroupRow
              name={r.group.name}
              count={r.group.count}
              onPress={() => useUi.getState().setDrill(r.group?.drill ?? null)}
            />
          ) : null
        }
      />
    </View>
  );
}
