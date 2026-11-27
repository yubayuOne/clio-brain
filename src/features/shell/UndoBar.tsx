import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { useUi } from '@/store/ui';
import { shadow } from '@/theme/tokens';

/** Snackbar after a delete, above every screen; leaves room for the floating button. */
export function UndoBar() {
  const insets = useSafeAreaInsets();
  const undo = useUi((s) => s.undo);
  if (!undo) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      className="absolute left-4 right-24 max-w-md flex-row items-center gap-3 rounded-card bg-paper py-2 pl-4 pr-2"
      style={[shadow.raised, { bottom: insets.bottom + 16 }]}
    >
      <Text numberOfLines={1} className="flex-1 font-mono text-sm text-text">
        {undo.message}
      </Text>
      <Button
        label="Undo"
        block={false}
        onPress={() => {
          useUi.getState().dismissUndo();
          undo.run();
        }}
      />
    </View>
  );
}
