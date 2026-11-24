import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/IconButton';
import { Label } from '@/components/ui/Label';
import { Sheet, SheetHeader } from '@/components/ui/Sheet';
import { currentBoard, useData } from '@/store/data';
import { useUi } from '@/store/ui';

/** Create a folder, rename the active one, or delete it (never the last one). */
export function FolderForm({ focus }: { focus: 'new' | 'rename' }) {
  const board = useData(currentBoard);
  const count = useData((s) => s.boards.length);
  const [name, setName] = useState('');
  const [rename, setRename] = useState(board?.name ?? '');
  const [error, setError] = useState('');
  const close = () => useUi.getState().close();
  if (!board) return null;

  const create = () => {
    if (!name.trim()) {
      setError('Enter a folder name first.');
      return;
    }
    useData.getState().createBoard(name);
    useUi.setState({ selectedId: null, connectMode: false, group: 'inbox', drill: null });
    close();
  };
  const remove = () =>
    useUi.getState().ask('Delete this folder and everything in it?', () => {
      useData.getState().deleteBoard(board.id);
      useUi.setState({ selectedId: null, group: 'inbox', drill: null });
      close();
    });

  return (
    <Sheet onDismiss={close}>
      <SheetHeader title="Manage folders" onBack={() => useUi.getState().open({ kind: 'folders' })} />
      <Label className="mb-1.5 mt-2">New folder</Label>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Field
            accessibilityLabel="New folder name"
            placeholder="e.g. Tech business ideas"
            maxLength={40}
            value={name}
            onChangeText={(v) => {
              setName(v);
              setError('');
            }}
            onSubmitEditing={create}
            returnKeyType="done"
            autoFocus={focus === 'new'}
          />
        </View>
        <Button label="Create" variant="primary" block={false} onPress={create} />
      </View>
      <Text accessibilityLiveRegion="assertive" className="min-h-5 font-mono text-sm text-red">
        {error}
      </Text>

      <Label className="mb-1.5 mt-2">Current folder</Label>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Field
            accessibilityLabel="Current folder name"
            maxLength={40}
            value={rename}
            onChangeText={setRename}
            onEndEditing={() =>
              rename.trim() ? useData.getState().renameBoard(board.id, rename) : setRename(board.name)
            }
            autoFocus={focus === 'rename'}
          />
        </View>
        {count > 1 ? <IconButton icon="trash" label="Delete folder" variant="danger" onPress={remove} /> : null}
      </View>
      {count > 1 ? null : <Text className="mt-2 font-mono text-sm text-mute">The last folder cannot be deleted.</Text>}
    </Sheet>
  );
}
