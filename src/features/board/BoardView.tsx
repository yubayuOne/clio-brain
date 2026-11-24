import { useCallback, useMemo } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { findThread, useData } from '@/store/data';
import { useUi, viewOf } from '@/store/ui';
import { shadow } from '@/theme/tokens';
import type { Viewport } from '@/types';
import { Canvas } from './Canvas';

export function BoardView() {
  const insets = useSafeAreaInsets();
  const all = useData((s) => s.items);
  const threads = useData((s) => s.threads);
  const boardId = useData((s) => s.currentBoardId);
  const items = useMemo(() => all.filter((i) => i.boardId === boardId), [all, boardId]);

  const vp = useUi((s) => viewOf(s.views, boardId));
  const connectMode = useUi((s) => s.connectMode);
  const selectedId = useUi((s) => s.selectedId);
  const hint = useUi((s) => s.hint);

  const setViewport = useCallback((v: Viewport) => useUi.getState().setView(boardId, v), [boardId]);

  const onCardTap = useCallback((id: string) => {
    const ui = useUi.getState();
    if (!ui.connectMode) return ui.open({ kind: 'preview', id });
    if (ui.selectedId == null) return ui.select(id);
    if (ui.selectedId === id) return ui.select(null);
    const from = ui.selectedId;
    useData.getState().connect(from, id);
    useUi.setState({ selectedId: null, connectMode: false });
    ui.open({ kind: 'thread', a: from, b: id, returnTo: null });
  }, []);

  const onThreadTap = useCallback((a: string, b: string) => {
    if (findThread(useData.getState(), a, b)) useUi.getState().open({ kind: 'thread', a, b, returnTo: null });
  }, []);

  const status = connectMode
    ? selectedId
      ? 'Tap a second card to draw a thread'
      : 'Thread mode: tap the first card'
    : hint;

  return (
    <View className="absolute inset-0">
      <Canvas
        items={items}
        threads={threads}
        vp={vp}
        onViewport={setViewport}
        onCardTap={onCardTap}
        onThreadTap={onThreadTap}
      />

      {items.length === 0 ? (
        <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
          <View className="w-[270px] max-w-[80%] -rotate-1 rounded-card bg-paper px-4 py-5" style={shadow.raised}>
            <Text className="mb-1.5 text-center font-head-bold text-xl uppercase text-text">Board is empty</Text>
            <Text className="text-center font-mono text-sm text-mute">
              Tap the + button, then New item, to pin your first note, link, or file.
            </Text>
          </View>
        </View>
      ) : null}

      {status ? (
        <View pointerEvents="none" className="absolute left-3 right-3 items-center" style={{ top: insets.top + 124 }}>
          <View accessibilityLiveRegion="polite" className="rounded-card bg-paper px-3 py-2" style={shadow.card}>
            <Text className="text-center font-mono text-sm text-text">{status}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
