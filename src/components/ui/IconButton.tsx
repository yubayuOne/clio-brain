import { Pressable } from 'react-native';
import { colors } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';

type Variant = 'outline' | 'primary' | 'danger' | 'dark' | 'darkDanger' | 'dock';

interface Props {
  icon: IconName;
  /** Spoken name; required because the button has no visible text. */
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: 44 | 48;
  pressed?: boolean;
  disabled?: boolean;
}

const styles: Record<Variant, { box: string; color: string }> = {
  outline: { box: 'border-text bg-transparent', color: colors.text },
  primary: { box: 'border-red bg-red', color: colors.paper },
  danger: { box: 'border-red bg-transparent', color: colors.red },
  dark: { box: 'border-line bg-glass', color: colors.paper },
  darkDanger: { box: 'border-red-light bg-glass', color: colors.redLight },
  dock: { box: 'border-line bg-ink', color: colors.paper },
};

export function IconButton({ icon, label, onPress, variant = 'outline', size = 48, pressed, disabled }: Props) {
  const s = pressed ? { box: 'border-paper bg-paper', color: colors.text } : styles[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: pressed, disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={size === 44 ? 2 : 0}
      style={{ width: size, height: size }}
      className={`items-center justify-center rounded-ctl border active:opacity-80 ${s.box} ${disabled ? 'opacity-40' : ''}`}
    >
      <Icon name={icon} size={24} color={s.color} />
    </Pressable>
  );
}
