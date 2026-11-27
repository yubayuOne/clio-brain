import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { EnrichedText } from 'react-native-enriched-html';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Label } from '@/components/ui/Label';
import { openFile } from '@/lib/files';
import { KIND_LABEL, formatWhen, toHtml } from '@/lib/text';
import { useShallow } from 'zustand/react/shallow';
import { incoming, outgoing, useData } from '@/store/data';
import { useUi } from '@/store/ui';
import { colors, fonts, shadow } from '@/theme/tokens';
import type { Item, Thread } from '@/types';

function Connections({
  title,
  threads,
  other,
}: {
  title: string;
  threads: Thread[];
  other: (t: Thread) => Item | undefined;
}) {
  const rows = threads.map((t) => ({ t, it: other(t) })).filter((r): r is { t: Thread; it: Item } => !!r.it);
  if (rows.length === 0) return null;
  return (
    <View className="mb-2">
      <Label className="mb-0.5">{title}</Label>
      {rows.map(({ t, it }) => (
        <View key={it.id} className="flex-row flex-wrap items-center gap-2">
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open ${it.title}`}
            onPress={() => useUi.getState().open({ kind: 'preview', id: it.id })}
            className="min-h-11 justify-center border-b border-text px-0.5"
          >
            <Text className="font-mono-bold text-sm text-text">{it.title}</Text>
          </Pressable>
          {t.label ? <Text className="font-mono text-sm text-mute">{t.label}</Text> : null}
        </View>
      ))}
    </View>
  );
}

/** Read-only view of an item, styled like the finished note. Edit opens the form. */
export function PreviewModal({ id }: { id: string }) {
  const item = useData((s) => s.items.find((i) => i.id === id));
  const out = useData(useShallow((s) => outgoing(s, id)));
  const inc = useData(useShallow((s) => incoming(s, id)));
  const items = useData((s) => s.items);
  const close = useUi((s) => s.close);
  if (!item) return null;
  const find = (x: string) => items.find((i) => i.id === x);

  return (
    <View className="absolute inset-0 items-center justify-center">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close preview"
        onPress={close}
        className="absolute inset-0 bg-ink/70"
      />
      <View className="w-[92%] max-w-[390px]" accessibilityViewIsModal>
        <View className="max-h-[78vh] rounded-card bg-paper" style={shadow.raised}>
          <ScrollView contentContainerClassName="px-5 pb-3.5 pt-6" bounces={false}>
            <View className="mb-1 flex-row items-center justify-between">
              <Text className="font-head text-xs uppercase tracking-widest text-red">{KIND_LABEL[item.type]}</Text>
              {item.processed ? null : (
                <View className="rounded-card bg-red px-1.5">
                  <Text className="font-head text-xs uppercase tracking-widest text-paper">Inbox</Text>
                </View>
              )}
            </View>
            <Text
              accessibilityRole="header"
              className="mb-3 mt-0.5 font-head-bold text-[28px] uppercase leading-8 text-text"
            >
              {item.title}
            </Text>

            {item.type === 'link' && item.url ? (
              <Pressable
                accessibilityRole="link"
                onPress={() => Linking.openURL(item.url)}
                className="mb-3 min-h-11 flex-row items-center gap-1"
              >
                <Text className="shrink font-mono text-sm text-red underline">{item.url}</Text>
                <Icon name="external" size={16} color={colors.red} />
              </Pressable>
            ) : null}
            {item.type === 'file' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open file ${item.fileName}`}
                disabled={!item.fileUri}
                onPress={() => openFile(item.fileUri)}
                className="mb-3 min-h-11 flex-row items-center gap-2"
              >
                <Icon name="file" size={16} color={colors.text} />
                <Text className="shrink font-mono text-sm text-text">{item.fileName || '-'}</Text>
              </Pressable>
            ) : null}

            {item.body ? (
              <View className="mb-3.5">
                <EnrichedText
                  style={{ fontFamily: fonts.mono, fontSize: 16, lineHeight: 24, color: colors.text }}
                  htmlStyle={{
                    ul: { bulletColor: colors.text, bulletSize: 6, marginLeft: 4, gapWidth: 12 },
                    ol: { markerColor: colors.text, marginLeft: 4, gapWidth: 12 },
                    ulCheckbox: { boxColor: colors.text, boxSize: 20, marginLeft: 0, gapWidth: 12 },
                  }}
                >
                  {toHtml(item.body)}
                </EnrichedText>
              </View>
            ) : null}
            {item.tags.length ? (
              <Text className="mb-3 font-mono text-sm text-mute">{item.tags.map((t) => `#${t}`).join(' ')}</Text>
            ) : null}
            {item.remindAt ? (
              <View className="mb-3 flex-row items-center gap-1.5">
                <Icon name="bell" size={16} color={colors.red} />
                <Text className="font-mono text-sm text-text">{formatWhen(item.remindAt)}</Text>
              </View>
            ) : null}

            <Connections title="Connects to" threads={out} other={(t) => find(t.toId)} />
            <Connections title="Referenced by" threads={inc} other={(t) => find(t.fromId)} />

            <View className="mt-2.5 flex-row justify-end gap-2">
              <IconButton
                icon="edit"
                label="Edit"
                variant="primary"
                onPress={() => useUi.getState().open({ kind: 'edit', id })}
              />
              <IconButton icon="close" label="Close" onPress={close} />
            </View>
          </ScrollView>
        </View>
        <View pointerEvents="none" className="absolute inset-x-0 -top-[5px] items-center">
          <View className="h-2.5 w-2.5 rounded-full bg-red" />
        </View>
      </View>
    </View>
  );
}
