import { Pressable, Text, View } from 'react-native';
import { colors } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';

interface Props {
  title: string;
  onPress: () => void;
  icon?: IconName;
  /** Right-aligned secondary text (thread label, item type, count). */
  meta?: string;
  muted?: boolean;
  last?: boolean;
  accessibilityLabel?: string;
  selected?: boolean;
}

/** Full-width 48px list row on paper with a hairline divider. */
export function Row({ title, onPress, icon, meta, muted, last, accessibilityLabel, selected }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      className={`min-h-12 flex-row items-center gap-2 px-0.5 active:bg-field ${last ? '' : 'border-b border-rule/50'} ${selected ? 'bg-field' : ''}`}
    >
      {icon ? (
        <View className="w-5 items-center">
          <Icon name={icon} size={icon === 'check' ? 20 : 16} color={selected ? colors.text : colors.mute} />
        </View>
      ) : null}
      <Text numberOfLines={1} className={`flex-1 font-head text-base uppercase ${muted ? 'text-mute' : 'text-text'}`}>
        {title}
      </Text>
      {meta ? (
        <Text numberOfLines={1} className="max-w-[35%] font-mono text-xs text-mute">
          {meta}
        </Text>
      ) : null}
    </Pressable>
  );
}
