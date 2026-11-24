import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { shadow } from '@/theme/tokens';

/** Paper note used for the loading and error screens. */
export function StatusCard({ title, children, action }: { title: string; children: string; action?: ReactNode }) {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <View
        accessibilityLiveRegion="polite"
        className="w-full max-w-[300px] -rotate-1 gap-1.5 rounded-card bg-paper px-5 py-6"
        style={shadow.raised}
      >
        <Text className="text-center font-head-bold text-xl uppercase text-text">{title}</Text>
        <Text className="text-center font-mono text-sm text-text">{children}</Text>
        {action ? <View className="mt-3">{action}</View> : null}
      </View>
    </View>
  );
}
