import { Pressable, Text, View } from 'react-native';

interface Option<T extends string> {
  value: T;
  label: string;
  /** Small red count shown after the label. */
  badge?: number;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  /** "dark" floats over the canvas, "paper" sits inside a sheet. */
  tone: 'dark' | 'paper';
  accessibilityLabel: string;
}

/** Segmented tabs, 44px tall. Used for Board/List, Inbox/Type/Tag and item type. */
export function Segmented<T extends string>({ options, value, onChange, tone, accessibilityLabel }: Props<T>) {
  const frame = tone === 'dark' ? 'border-line bg-glass' : 'border-text';
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      className={`flex-row overflow-hidden rounded-ctl border ${frame}`}
    >
      {options.map((o) => {
        const on = o.value === value;
        const bg = on ? (tone === 'dark' ? 'bg-paper' : 'bg-text') : '';
        const ink = on ? (tone === 'dark' ? 'text-text' : 'text-paper') : tone === 'dark' ? 'text-dim' : 'text-text';
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            className={`h-11 min-w-0 flex-1 flex-row items-center justify-center px-2 ${bg}`}
          >
            <Text numberOfLines={1} className={`font-head text-base uppercase tracking-wider ${ink}`}>
              {o.label}
            </Text>
            {o.badge ? (
              <View className="ml-1.5 rounded-sm bg-red px-1.5">
                <Text className="font-head text-xs text-paper">{o.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
