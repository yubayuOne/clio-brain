import { CourierPrime_400Regular } from '@expo-google-fonts/courier-prime/400Regular';
import { CourierPrime_700Bold } from '@expo-google-fonts/courier-prime/700Bold';
import { Oswald_500Medium } from '@expo-google-fonts/oswald/500Medium';
import { Oswald_600SemiBold } from '@expo-google-fonts/oswald/600SemiBold';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, type ReactNode } from 'react';
import { AppState, Linking, Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Icon } from '@/components/ui/Icon';
import { BoardView } from '@/features/board/BoardView';
import { ListView } from '@/features/list/ListView';
import { ActionMenu } from '@/features/shell/ActionMenu';
import { Header } from '@/features/shell/Header';
import { OverlayHost } from '@/features/shell/OverlayHost';
import { StatusCard } from '@/features/shell/StatusCard';
import { UndoBar } from '@/features/shell/UndoBar';
import { useReminderTaps } from '@/lib/reminders';
import { widgetModule } from '@/lib/widget';
import { useData } from '@/store/data';
import { useUi } from '@/store/ui';
import { colors, shadow } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function SaveNotice() {
  const insets = useSafeAreaInsets();
  const failed = useData((s) => s.saveFailed);
  if (!failed) return null;
  return (
    <View
      className="absolute left-3 right-3 flex-row items-center gap-3 rounded-ctl bg-paper py-1 pl-3"
      style={[shadow.raised, { bottom: insets.bottom + 84 }]}
    >
      <Text accessibilityRole="alert" className="flex-1 font-mono text-sm text-red">
        Your last change could not be saved to the device.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss notice"
        onPress={() => useData.getState().dismissSaveError()}
        className="h-11 w-11 items-center justify-center"
      >
        <Icon name="close" size={20} color={colors.text} />
      </Pressable>
    </View>
  );
}

/** In landscape the camera cutout sits on a side; inset everything from it once, here. */
function SafeSides({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-ink" style={{ paddingLeft: insets.left, paddingRight: insets.right }}>
      {children}
    </View>
  );
}

function Workspace() {
  const status = useData((s) => s.status);
  const tab = useUi((s) => s.tab);

  const openItem = useCallback((itemId: string) => {
    const data = useData.getState();
    const item = data.items.find((i) => i.id === itemId);
    if (!item) return;
    if (item.boardId !== data.currentBoardId) data.selectBoard(item.boardId);
    useUi.getState().open({ kind: 'preview', id: itemId });
  }, []);
  useReminderTaps(status === 'ready', openItem);

  // Google Drive sync: on start, when the app comes back, and when it is left so the last edits
  // go up. Silent, and a no-op until an account is connected in Settings.
  useEffect(() => {
    if (status !== 'ready') return;
    void useData.getState().syncDrive(false);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' || s === 'background') void useData.getState().syncDrive(false);
    });
    return () => sub.remove();
  }, [status]);

  // Widget taps arrive as cliobrain://item/<id> or cliobrain://capture.
  useEffect(() => {
    if (status !== 'ready') return;
    const handle = (url: string | null | undefined) => {
      const m = url ? /^cliobrain:\/\/(?:item\/([^/?#]+)|(capture))/.exec(url) : null;
      if (m?.[1]) openItem(decodeURIComponent(m[1]));
      else if (m?.[2]) useUi.getState().open({ kind: 'capture' });
    };
    Linking.getInitialURL()
      .then(handle)
      .catch(() => undefined);
    const sub = Linking.addEventListener('url', (e) => handle(e.url));
    return () => sub.remove();
  }, [status, openItem]);

  if (status === 'loading') {
    return <StatusCard title="Opening board">One moment, getting your notes ready.</StatusCard>;
  }
  if (status === 'error') {
    return (
      <StatusCard
        title="Data could not be read"
        action={<Button label="Start a new board" variant="primary" onPress={() => useData.getState().resetAll()} />}
      >
        The database on this device could not be opened. You can start a new board, but your old data will be erased.
      </StatusCard>
    );
  }
  return (
    <>
      {tab === 'board' ? <BoardView /> : null}
      <View pointerEvents="box-none" className={tab === 'board' ? 'absolute inset-x-0 top-0' : 'flex-1'}>
        <Header />
        {tab === 'list' ? <ListView /> : null}
      </View>
      <ActionMenu />
      <SaveNotice />
    </>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Oswald_500Medium,
    Oswald_600SemiBold,
    CourierPrime_400Regular,
    CourierPrime_700Bold,
  });

  useEffect(() => widgetModule()?.startWidgetSync(), []);
  useEffect(() => {
    void useData.getState().load();
  }, []);

  const fontsDone = fontsLoaded || !!fontError;
  useEffect(() => {
    if (fontsDone) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsDone]);

  if (!fontsDone) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.ink }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SafeSides>
          <Workspace />
          <OverlayHost />
          <UndoBar />
          <ConfirmDialog />
        </SafeSides>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
