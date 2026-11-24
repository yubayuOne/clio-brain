import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { Segmented } from '@/components/ui/Segmented';
import { currentBoard, useData } from '@/store/data';
import { useUi, type Tab } from '@/store/ui';
import { colors } from '@/theme/tokens';

/** Floating header: brand, folder switcher and the Papan/Daftar tabs. */
export function Header() {
  const insets = useSafeAreaInsets();
  const board = useData(currentBoard);
  const ready = useData((s) => s.status === 'ready');
  const tab = useUi((s) => s.tab);

  return (
    <View pointerEvents="box-none" style={{ paddingTop: insets.top + 10 }}>
      <View pointerEvents="box-none" className="flex-row items-center gap-3 px-4 pb-1.5">
        <View pointerEvents="none" className="flex-row items-center" accessibilityRole="header">
          <Text
            className="font-head-bold text-2xl tracking-[2px] text-paper"
            style={{
              textShadowColor: 'rgba(0,0,0,0.6)',
              textShadowRadius: 3,
              textShadowOffset: { width: 0, height: 1 },
            }}
          >
            CLIO BRAIN
          </Text>
          <View className="ml-1.5 mt-2 h-[9px] w-[9px] rounded-full bg-red" />
        </View>
        {ready && board ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Current folder: ${board.name}. Change folder`}
            onPress={() => useUi.getState().open({ kind: 'folders' })}
            className="ml-auto h-11 max-w-[62%] flex-row items-center gap-2 rounded-ctl border border-line bg-glass px-3 active:opacity-80"
          >
            <Text numberOfLines={1} className="shrink font-head text-base uppercase tracking-wide text-paper">
              {board.name}
            </Text>
            <Icon name="down" size={16} color={colors.paper} />
          </Pressable>
        ) : null}
      </View>
      <View className="mx-4 mb-2.5 mt-0.5">
        <Segmented<Tab>
          tone="dark"
          accessibilityLabel="View"
          value={tab}
          onChange={(t) => useUi.getState().setTab(t)}
          options={[
            { value: 'board', label: 'Board' },
            { value: 'list', label: 'List' },
          ]}
        />
      </View>
    </View>
  );
}
