import { useEffect } from 'react';
import { BackHandler, Pressable, Text, View } from 'react-native';
import { useUi } from '@/store/ui';
import { Button } from './Button';

/** Centred confirmation for every destructive action. Cancel is the safe default. */
export function ConfirmDialog() {
  const confirm = useUi((s) => s.confirm);
  const dismiss = useUi((s) => s.dismissConfirm);

  useEffect(() => {
    if (!confirm) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      dismiss();
      return true;
    });
    return () => sub.remove();
  }, [confirm, dismiss]);

  if (!confirm) return null;
  return (
    <View className="absolute inset-0 items-center justify-center p-6" accessibilityViewIsModal>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cancel"
        onPress={dismiss}
        className="absolute inset-0 bg-ink/70"
      />
      <View accessibilityRole="alert" className="w-full max-w-[320px] rounded-ctl bg-paper p-4">
        <Text className="mb-4 font-head text-lg uppercase tracking-wide text-text">{confirm.message}</Text>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button label="Cancel" onPress={dismiss} />
          </View>
          <View className="flex-1">
            <Button
              label={confirm.confirmLabel ?? 'Delete'}
              variant="danger"
              onPress={() => {
                dismiss();
                confirm.onConfirm();
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
