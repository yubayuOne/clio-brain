import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { RichField } from '@/components/ui/RichField';
import { Row } from '@/components/ui/Row';
import { KIND_LABEL, cleanTitle, formatWhen, htmlToText, normalizeUrl, parseTags, toHtml } from '@/lib/text';
import { incoming, outgoing, useData } from '@/store/data';
import { useUi } from '@/store/ui';
import { colors, shadow } from '@/theme/tokens';
import { useDraft } from './useDraft';

/** The body saves itself this long after the last change (ticking a checkbox fires no blur). */
const BODY_SAVE_DELAY = 600;

/** An editor with no text is stored as an empty body, so "has a note" checks keep working. */
const bodyToSave = (html: string): string => (htmlToText(html).trim() ? html : '');

/**
 * Full-screen edit form. Fields save when editing ends (the body shortly after each change); leaving the form marks an
 * Inbox item as processed. No labels or helper text: placeholders name each field
 * and accessibilityLabel carries the name for screen readers.
 */
export function EditScreen({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const item = useData((s) => s.items.find((i) => i.id === id));
  const out = useData(useShallow((s) => outgoing(s, id)));
  const inc = useData(useShallow((s) => incoming(s, id)));
  const items = useData((s) => s.items);
  const boards = useData((s) => s.boards);
  const update = useData((s) => s.updateItem);

  const {
    title,
    body,
    setTitle,
    changeTitle,
    changeBody,
    editor,
    undo: undoDraft,
    canUndo,
  } = useDraft({
    title: item?.title ?? '',
    body: item?.body ? toHtml(item.body) : '',
  });
  const [url, setUrl] = useState(item?.url ?? '');
  const [tags, setTags] = useState(item?.tags.join(', ') ?? '');

  useEffect(() => {
    const t = setTimeout(() => {
      const next = bodyToSave(body);
      if (next !== useData.getState().items.find((i) => i.id === id)?.body) update(id, { body: next });
    }, BODY_SAVE_DELAY);
    return () => clearTimeout(t);
  }, [body, id, update]);

  if (!item) return null;
  const board = boards.find((b) => b.id === item.boardId);
  const titleOf = (x: string) => items.find((i) => i.id === x)?.title ?? '';

  // Saves every field at once: a field still being typed in has not fired onEndEditing yet.
  const save = () => {
    update(id, {
      title: cleanTitle(title),
      body: bodyToSave(body),
      url: normalizeUrl(url),
      tags: parseTags(tags),
      processed: true,
    });
    useUi.getState().open({ kind: 'preview', id });
  };
  const remove = () =>
    useUi.getState().ask('Delete this item?', () => {
      const gone = useData.getState().deleteItem(id);
      useUi.getState().close();
      if (gone) useUi.getState().offerUndo('Item deleted', () => useData.getState().restore(gone));
    });
  const undo = () => {
    const prev = undoDraft();
    if (prev) update(id, { title: cleanTitle(prev.title), body: bodyToSave(prev.body) });
  };
  const openThread = (a: string, b: string) => useUi.getState().open({ kind: 'thread', a, b, returnTo: id });

  return (
    <View className="absolute inset-0 bg-ink" style={{ paddingTop: insets.top + 10 }}>
      <View className="mb-2.5 w-full max-w-2xl flex-row items-center justify-between self-center px-4">
        <IconButton icon="back" label="Back" variant="dark" onPress={save} />
        <Text className="font-head text-xs uppercase tracking-widest text-dim">{KIND_LABEL[item.type]}</Text>
        <View className="flex-row items-center gap-2">
          <IconButton icon="undo" label="Undo" variant="dark" disabled={!canUndo} onPress={undo} />
          <Button label="Save" variant="primary" block={false} onPress={save} />
          <IconButton icon="trash" label="Delete" variant="darkDanger" onPress={remove} />
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}
      >
        <View className="w-full max-w-2xl self-center rounded-card bg-paper p-4" style={shadow.raised}>
          <Field
            headline
            multiline
            accessibilityLabel="Title"
            placeholder="Title"
            value={title}
            onChangeText={changeTitle}
            onEndEditing={() => {
              const t = cleanTitle(title);
              setTitle(t);
              update(id, { title: t });
            }}
            className="mb-2"
          />

          {item.type === 'link' ? (
            <View className="mb-2 flex-row items-start gap-2">
              <View className="flex-1">
                <Field
                  accessibilityLabel="Link URL"
                  placeholder="https://..."
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={url}
                  onChangeText={setUrl}
                  onEndEditing={() => {
                    const u = normalizeUrl(url);
                    setUrl(u);
                    update(id, { url: u });
                  }}
                />
              </View>
              {item.url ? (
                <IconButton icon="external" label="Open link" onPress={() => Linking.openURL(item.url)} />
              ) : null}
            </View>
          ) : null}

          {item.type === 'file' ? (
            <View className="mb-2 flex-row items-center gap-2 self-start border border-dashed border-rule px-2.5 py-2">
              <Icon name="file" size={16} color={colors.mute} />
              <Text numberOfLines={1} className="font-mono text-sm text-text">
                {item.fileName || 'Unnamed file'}
              </Text>
            </View>
          ) : null}

          <View className="mb-2">
            <RichField
              ref={editor}
              tall
              accessibilityLabel="Body"
              placeholder="Write a note"
              defaultValue={body}
              onChangeHtml={changeBody}
            />
          </View>

          <View className="flex-row items-start gap-2">
            <View className="flex-1">
              <Field
                accessibilityLabel="Tag"
                placeholder="Tags, comma separated"
                autoCapitalize="none"
                value={tags}
                onChangeText={setTags}
                onEndEditing={() => update(id, { tags: parseTags(tags) })}
              />
            </View>
            {boards.length > 1 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Folder: ${board?.name ?? ''}. Move`}
                onPress={() => useUi.getState().setMoving(true)}
                className="h-12 w-[40%] flex-row items-center justify-between border-b border-rule bg-field px-2"
              >
                <Text numberOfLines={1} className="flex-1 font-mono text-base text-text">
                  {board?.name}
                </Text>
                <Icon name="down" size={16} color={colors.text} />
              </Pressable>
            ) : null}
          </View>

          <View className="mt-1.5 border-t border-rule">
            <Row
              icon="bell"
              title={item.remindAt ? formatWhen(item.remindAt) : 'Add reminder'}
              muted={!item.remindAt}
              accessibilityLabel={item.remindAt ? `Reminder: ${formatWhen(item.remindAt)}. Change` : 'Add reminder'}
              onPress={() => useUi.getState().setReminding(true)}
              last
            />
          </View>

          <View accessibilityLabel="Threads" className="mt-1.5 border-t border-rule">
            {out.map((t) => (
              <Row
                key={`o${t.toId}`}
                icon="arrowRight"
                title={titleOf(t.toId)}
                meta={t.label}
                accessibilityLabel={`Edit thread to ${titleOf(t.toId)}`}
                onPress={() => openThread(id, t.toId)}
              />
            ))}
            {inc.map((t) => (
              <Row
                key={`i${t.fromId}`}
                icon="arrowLeft"
                title={titleOf(t.fromId)}
                meta={t.label}
                accessibilityLabel={`Edit thread from ${titleOf(t.fromId)}`}
                onPress={() => openThread(t.fromId, id)}
              />
            ))}
            <Row icon="plus" title="Connect" muted last onPress={() => useUi.getState().setPicker(true)} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
