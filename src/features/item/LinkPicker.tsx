import { useMemo, useState } from 'react';
import { Text } from 'react-native';
import { Field } from '@/components/ui/Field';
import { Row } from '@/components/ui/Row';
import { Sheet, SheetHeader } from '@/components/ui/Sheet';
import { KIND_LABEL } from '@/lib/text';
import { useData } from '@/store/data';
import { useUi } from '@/store/ui';

/** Pick another item on the same board to connect to the item being edited. */
export function LinkPicker({ id }: { id: string }) {
  const [q, setQ] = useState('');
  const all = useData((s) => s.items);
  const threads = useData((s) => s.threads);
  const close = () => useUi.getState().setPicker(false);

  const list = useMemo(() => {
    const me = all.find((i) => i.id === id);
    if (!me) return [];
    const linked = new Set(threads.filter((t) => t.fromId === id || t.toId === id).flatMap((t) => [t.fromId, t.toId]));
    const query = q.trim().toLowerCase();
    return all.filter(
      (x) =>
        x.boardId === me.boardId &&
        x.id !== id &&
        !linked.has(x.id) &&
        (!query || `${x.title} ${x.body}`.toLowerCase().includes(query)),
    );
  }, [all, threads, id, q]);

  return (
    <Sheet onDismiss={close}>
      <SheetHeader title="Connect to" onClose={close} />
      <Field
        accessibilityLabel="Search items"
        placeholder="Search items"
        value={q}
        onChangeText={setQ}
        autoFocus
        className="mb-3"
      />
      {list.length === 0 ? <Text className="py-1.5 font-mono text-sm text-mute">No matching items.</Text> : null}
      {list.map((x, n) => (
        <Row
          key={x.id}
          title={x.title}
          meta={KIND_LABEL[x.type]}
          last={n === list.length - 1}
          onPress={() => {
            useData.getState().connect(id, x.id);
            close();
          }}
        />
      ))}
    </Sheet>
  );
}
