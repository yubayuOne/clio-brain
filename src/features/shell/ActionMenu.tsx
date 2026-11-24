import { useEffect, useState } from 'react';
import { BackHandler, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { useData } from '@/store/data';
import { useUi } from '@/store/ui';
import { canvas, colors, shadow } from '@/theme/tokens';

interface Action {
  icon: IconName;
  label: string;
  run: () => void;
}

function tidyBoard() {
  const ui = useUi.getState();
  useData.getState().arrangeBoard();
  ui.setView(useData.getState().currentBoardId, canvas.start);
  ui.select(null);
  ui.flash('Board tidied');
}

/**
 * The single red button. It opens a menu with every global action; while thread mode is
 * on it becomes the way out of it instead.
 */
export function ActionMenu() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const tab = useUi((s) => s.tab);
  const connectMode = useUi((s) => s.connectMode);

  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [open]);

  const ui = useUi.getState();
  const actions: Action[] = [
    { icon: 'plus', label: 'New item', run: () => ui.open({ kind: 'capture' }) },
    ...(tab === 'board'
      ? [
          { icon: 'thread', label: 'Thread mode', run: () => ui.toggleConnect() } as const,
          { icon: 'grid', label: 'Tidy board', run: tidyBoard } as const,
        ]
      : []),
    { icon: 'settings', label: 'Settings', run: () => ui.open({ kind: 'settings' }) },
  ];

  const onMain = () => (connectMode ? ui.toggleConnect() : setOpen(!open));
  const mainLabel = connectMode ? 'Exit thread mode' : open ? 'Close menu' : 'Open menu';

  return (
    <>
      {open ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close menu"
          onPress={() => setOpen(false)}
          className="absolute inset-0 bg-ink/70"
        />
      ) : null}
      {open ? (
        <View className="absolute right-4 items-end gap-3" style={{ bottom: insets.bottom + 84 }}>
          {actions.map((a) => (
            <View key={a.label} className="flex-row items-center gap-3">
              <View className="rounded-card bg-paper px-2.5 py-1" style={shadow.card}>
                <Text className="font-head text-sm uppercase tracking-wider text-text">{a.label}</Text>
              </View>
              <IconButton
                icon={a.icon}
                label={a.label}
                variant="dock"
                onPress={() => {
                  setOpen(false);
                  a.run();
                }}
              />
            </View>
          ))}
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={mainLabel}
        accessibilityState={{ expanded: open }}
        onPress={onMain}
        className={`absolute right-4 h-14 w-14 items-center justify-center rounded-full active:opacity-90 ${connectMode ? 'bg-paper' : 'bg-red'}`}
        style={[shadow.fab, { bottom: insets.bottom + 16 }]}
      >
        <Icon
          name={connectMode || open ? 'close' : 'plus'}
          size={24}
          color={connectMode ? colors.text : colors.paper}
        />
      </Pressable>
    </>
  );
}
