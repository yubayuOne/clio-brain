import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/IconButton';
import { Label } from '@/components/ui/Label';
import { Row } from '@/components/ui/Row';
import { Sheet, SheetHeader } from '@/components/ui/Sheet';
import { byName } from '@/lib/text';
import { useData } from '@/store/data';
import { useUi } from '@/store/ui';
import type { Board } from '@/types';

type Entry = { key: string; heading?: string; board?: Board };

/** Recent folders only appear once the list is long enough to need them. */
const RECENT_AFTER = 8;

/** Folder switcher. Scales to hundreds of folders: search, recents, A-Z, virtualised list. */
export function FolderSheet() {
  const [q, setQ] = useState('');
  const boards = useData((s) => s.boards);
  const items = useData((s) => s.items);
  const cur = useData((s) => s.currentBoardId);
  const close = () => useUi.getState().close();

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of items) m.set(i.boardId, (m.get(i.boardId) ?? 0) + 1);
    return m;
  }, [items]);

  const query = q.trim().toLowerCase();
  const entries = useMemo((): Entry[] => {
    if (query) {
      const hits = boards.filter((b) => b.name.toLowerCase().includes(query)).sort(byName);
      return hits.length
        ? [
            { key: 'h', heading: `${hits.length} ${hits.length === 1 ? 'result' : 'results'}` },
            ...hits.map((b) => ({ key: b.id, board: b })),
          ]
        : [];
    }
    const all = [...boards].sort(byName).map((b) => ({ key: b.id, board: b }));
    if (boards.length <= RECENT_AFTER) return all;
    const recent = [...boards]
      .sort((a, b) => Number(b.id === cur) - Number(a.id === cur) || b.usedAt - a.usedAt)
      .slice(0, 5)
      .map((b) => ({ key: `r${b.id}`, board: b }));
    return [
      { key: 'hr', heading: 'Recently opened' },
      ...recent,
      { key: 'ha', heading: `All folders (${boards.length})` },
      ...all,
    ];
  }, [boards, query, cur]);

  const pick = (id: string) => {
    if (id !== cur) {
      useData.getState().selectBoard(id);
      useUi.setState({ selectedId: null, connectMode: false, group: 'inbox', drill: null });
    }
    close();
  };

  return (
    <Sheet onDismiss={close} tall scroll={false}>
      <SheetHeader
        title="Folder"
        onClose={close}
        actions={
          <>
            <IconButton
              icon="plus"
              label="New folder"
              size={44}
              onPress={() => useUi.getState().open({ kind: 'folderForm', focus: 'new' })}
            />
            <IconButton
              icon="edit"
              label="Manage current folder"
              size={44}
              onPress={() => useUi.getState().open({ kind: 'folderForm', focus: 'rename' })}
            />
          </>
        }
      />
      <Field
        accessibilityLabel="Search folders"
        placeholder="Search folders"
        value={q}
        onChangeText={setQ}
        returnKeyType="search"
        className="mb-2"
      />
      <FlatList
        data={entries}
        keyExtractor={(e) => e.key}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          query ? (
            <View className="gap-2 pt-1.5">
              <Text className="font-mono text-sm text-mute">No folder with that name.</Text>
              <Button
                label={`Create folder "${q.trim()}"`}
                variant="primary"
                onPress={() => {
                  useData.getState().createBoard(q);
                  close();
                }}
              />
            </View>
          ) : undefined
        }
        renderItem={({ item: e }) =>
          e.heading ? (
            <Label className="mb-1.5 mt-5">{e.heading}</Label>
          ) : e.board ? (
            <Row
              title={e.board.name}
              icon={e.board.id === cur ? 'check' : undefined}
              selected={e.board.id === cur}
              meta={String(counts.get(e.board.id) ?? 0)}
              onPress={() => pick(e.board?.id ?? cur)}
            />
          ) : null
        }
      />
    </Sheet>
  );
}
