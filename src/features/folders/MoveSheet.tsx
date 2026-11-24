import { Text } from 'react-native';
import { Row } from '@/components/ui/Row';
import { Sheet, SheetHeader } from '@/components/ui/Sheet';
import { byName } from '@/lib/text';
import { useData } from '@/store/data';
import { useUi } from '@/store/ui';

/** Move an item to another folder. Its threads are cut because threads stay within a board. */
export function MoveSheet({ id }: { id: string }) {
  const onDone = () => useUi.getState().setMoving(false);
  const boards = useData((s) => s.boards);
  const item = useData((s) => s.items.find((i) => i.id === id));
  if (!item) return null;
  const sorted = [...boards].sort(byName);

  const move = (boardId: string) => {
    onDone();
    if (boardId === item.boardId) return;
    const name = boards.find((b) => b.id === boardId)?.name ?? '';
    useData.getState().moveItemToBoard(id, boardId);
    useUi.getState().close();
    useUi.getState().flash(`Moved to ${name}`);
  };

  return (
    <Sheet onDismiss={onDone}>
      <SheetHeader title="Move to folder" onClose={onDone} />
      <Text className="mb-2 font-mono text-sm text-mute">{"This item's threads will be cut."}</Text>
      {sorted.map((b, n) => (
        <Row
          key={b.id}
          title={b.name}
          icon={b.id === item.boardId ? 'check' : undefined}
          selected={b.id === item.boardId}
          last={n === sorted.length - 1}
          onPress={() => move(b.id)}
        />
      ))}
    </Sheet>
  );
}
