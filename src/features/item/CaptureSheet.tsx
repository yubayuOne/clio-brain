import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/IconButton';
import { Icon } from '@/components/ui/Icon';
import { Label } from '@/components/ui/Label';
import { RichField } from '@/components/ui/RichField';
import { Segmented } from '@/components/ui/Segmented';
import { Sheet, SheetHeader } from '@/components/ui/Sheet';
import { pickAndKeepFile, type PickedFile } from '@/lib/files';
import { KIND_LABEL, hostOf, htmlToText, normalizeUrl } from '@/lib/text';
import { useData } from '@/store/data';
import { useUi, viewOf } from '@/store/ui';
import { colors } from '@/theme/tokens';
import type { ItemType } from '@/types';
import { useDraft } from './useDraft';

const TYPES: ItemType[] = ['note', 'link', 'file'];

/** Quick capture: new items land in the Inbox, in the middle of the current view. */
export function CaptureSheet() {
  const [type, setType] = useState<ItemType>('note');
  const { title, body, changeTitle, changeBody, editor, undo, canUndo } = useDraft({ title: '', body: '' });
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [error, setError] = useState('');
  const close = () => useUi.getState().close();

  const pick = async () => {
    try {
      const f = await pickAndKeepFile();
      if (f) {
        setFile(f);
        setError('');
      }
    } catch {
      setError('The file could not be copied. Try a different file.');
    }
  };

  const save = () => {
    const link = type === 'link' ? normalizeUrl(url) : '';
    const picked = type === 'file' ? file : null;
    const text = htmlToText(body).trim();
    if (!title.trim() && !text && !link && !picked) {
      setError('Add a title, note, or link, or pick a file first.');
      return;
    }
    const name =
      title.trim() ||
      (type === 'link' ? hostOf(link) : type === 'file' ? (picked?.name ?? '') : text.split('\n')[0]?.slice(0, 40)) ||
      '(untitled)';

    const ui = useUi.getState();
    const data = useData.getState();
    const vp = viewOf(ui.views, data.currentBoardId);
    const jitter = () => Math.random() * 60 - 30;
    const item = data.addItem({
      type,
      title: name,
      body: text ? body : '',
      url: link,
      fileName: picked?.name ?? '',
      fileUri: picked?.uri ?? '',
      x: (ui.canvasSize.w / 2 - vp.x) / vp.k - 95 + jitter(),
      y: (ui.canvasSize.h / 2 - vp.y) / vp.k - 60 + jitter(),
    });
    ui.setNewItem(item.id);
    if (ui.tab === 'list') useUi.setState({ group: 'inbox', drill: null });
    close();
  };

  return (
    <Sheet onDismiss={close}>
      <SheetHeader
        title="New item"
        onClose={close}
        actions={<IconButton icon="undo" label="Undo" size={44} disabled={!canUndo} onPress={() => void undo()} />}
      />
      <View className="mb-3">
        <Segmented
          tone="paper"
          accessibilityLabel="Item type"
          value={type}
          onChange={setType}
          options={TYPES.map((t) => ({ value: t, label: KIND_LABEL[t] }))}
        />
      </View>

      {type === 'link' ? (
        <>
          <Label nativeID="capUrl">Link URL</Label>
          <Field
            accessibilityLabelledBy="capUrl"
            placeholder="https://..."
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            value={url}
            onChangeText={setUrl}
            className="mb-3"
          />
        </>
      ) : null}
      {type === 'file' ? (
        <>
          <Label>File</Label>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={file ? `File: ${file.name}. Change file` : 'Pick a file'}
            onPress={pick}
            className="mb-3 min-h-12 flex-row items-center gap-2 border border-dashed border-rule px-3 active:bg-field"
          >
            <Icon name="file" size={20} color={colors.text} />
            <Text numberOfLines={1} className={`flex-1 font-mono text-base ${file ? 'text-text' : 'text-mute'}`}>
              {file ? file.name : 'Pick a file'}
            </Text>
          </Pressable>
        </>
      ) : null}

      <Label nativeID="capTitle">Title (optional)</Label>
      <Field accessibilityLabelledBy="capTitle" value={title} onChangeText={changeTitle} className="mb-3" />
      <Label nativeID="capBody">{type === 'note' ? 'Note' : 'Short note (optional)'}</Label>
      <View className="mb-1">
        <RichField
          ref={editor}
          accessibilityLabel={type === 'note' ? 'Note' : 'Short note'}
          defaultValue=""
          onChangeHtml={changeBody}
          autoFocus={type === 'note'}
        />
      </View>

      <Text accessibilityLiveRegion="assertive" className="mb-1 min-h-5 font-mono text-sm text-red">
        {error}
      </Text>
      <Button label="Pin to board" variant="primary" onPress={save} />
    </Sheet>
  );
}
