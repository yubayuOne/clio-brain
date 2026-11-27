import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Label } from '@/components/ui/Label';
import { Sheet, SheetHeader } from '@/components/ui/Sheet';
import { findThread, useData } from '@/store/data';
import { useUi } from '@/store/ui';
import { colors, threadColors } from '@/theme/tokens';

interface Props {
  a: string;
  b: string;
  /** Item whose edit form opened this sheet; we return there when done. */
  returnTo: string | null;
}

/** Edit a thread's label and colour, or cut it. */
export function ThreadSheet({ a, b, returnTo }: Props) {
  const thread = useData((s) => findThread(s, a, b));
  const from = useData((s) => s.items.find((i) => i.id === thread?.fromId));
  const to = useData((s) => s.items.find((i) => i.id === thread?.toId));
  const [label, setLabel] = useState(thread?.label ?? '');

  const leave = () => {
    const ui = useUi.getState();
    if (returnTo && useData.getState().items.some((i) => i.id === returnTo)) ui.open({ kind: 'edit', id: returnTo });
    else ui.close();
  };
  if (!thread || !from || !to) return null;

  const save = () => {
    useData.getState().updateThread(thread.fromId, thread.toId, { label: label.trim() });
    leave();
  };
  const cut = () =>
    useUi.getState().ask('Cut this thread?', () => {
      const gone = useData.getState().cutThread(thread.fromId, thread.toId);
      leave();
      if (gone) useUi.getState().offerUndo('Thread cut', () => useData.getState().restore(gone));
    });

  return (
    <Sheet onDismiss={save}>
      <SheetHeader title="Thread" onClose={save} />
      <View className="mb-2.5 mt-1 flex-row flex-wrap items-center gap-1">
        <Text className="font-mono text-sm text-mute">{from.title}</Text>
        <Icon name="arrowRight" size={16} color={colors.mute} />
        <Text className="font-mono text-sm text-mute">{to.title}</Text>
      </View>

      <Label nativeID="threadLabel">Connection label</Label>
      <Field
        accessibilityLabelledBy="threadLabel"
        placeholder="e.g. alibi, met at"
        value={label}
        onChangeText={setLabel}
        onSubmitEditing={save}
        returnKeyType="done"
        autoFocus
        className="mb-3"
      />

      <Label>Thread color</Label>
      <View accessibilityRole="radiogroup" className="mb-4 mt-2 flex-row gap-3.5">
        {threadColors.map((c) => {
          const on = thread.color === c.value;
          return (
            <Pressable
              key={c.value}
              accessibilityRole="radio"
              accessibilityLabel={c.name}
              accessibilityState={{ checked: on }}
              onPress={() => useData.getState().updateThread(thread.fromId, thread.toId, { color: c.value })}
              className={`h-12 w-12 items-center justify-center rounded-full ${on ? 'border-2 border-text' : ''}`}
            >
              <View className="h-10 w-10 rounded-full border-2 border-text" style={{ backgroundColor: c.value }} />
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <Button label="Done" variant="primary" onPress={save} />
        </View>
        <IconButton icon="trash" label="Cut thread" variant="danger" onPress={cut} />
      </View>
    </Sheet>
  );
}
