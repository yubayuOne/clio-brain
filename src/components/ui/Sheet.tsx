import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from './IconButton';

interface HeaderProps {
  title: string;
  onClose?: () => void;
  onBack?: () => void;
  /** Extra icon buttons placed before the close button. */
  actions?: ReactNode;
}

/** Shared sheet header: optional back, title, actions, close. */
export function SheetHeader({ title, onClose, onBack, actions }: HeaderProps) {
  return (
    <View className="mb-3 flex-row items-center gap-2">
      {onBack ? <IconButton icon="back" label="Back" onPress={onBack} size={44} /> : null}
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        className="flex-1 font-head-bold text-2xl uppercase tracking-wide text-text"
      >
        {title}
      </Text>
      {actions}
      {onClose ? <IconButton icon="close" label="Close" onPress={onClose} size={44} /> : null}
    </View>
  );
}

interface SheetProps {
  onDismiss: () => void;
  children: ReactNode;
  /** Fixed 88% height for long lists (folders); otherwise sized to content. */
  tall?: boolean;
  /** Set false when the child manages its own scrolling (FlatList). */
  scroll?: boolean;
}

/** Bottom sheet on a dark scrim. Tapping the scrim dismisses it. */
export function Sheet({ onDismiss, children, tall, scroll = true }: SheetProps) {
  const insets = useSafeAreaInsets();
  const pad = { paddingBottom: insets.bottom + 18 };
  return (
    <View className="absolute inset-0 justify-end">
      <Pressable accessibilityLabel="Close panel" onPress={onDismiss} className="absolute inset-0 bg-ink/70" />
      <View
        accessibilityViewIsModal
        className="rounded-t-sheet bg-paper px-4 pt-[18px]"
        style={[tall ? { height: '88%' } : { maxHeight: '92%' }, scroll ? null : pad]}
      >
        {scroll ? (
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={pad} bounces={false}>
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </View>
    </View>
  );
}
