import { Pressable, Text } from 'react-native';

type Variant = 'primary' | 'outline' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  /** Stretch to the parent width (default) or size to the label. */
  block?: boolean;
  disabled?: boolean;
}

const box: Record<Variant, string> = {
  primary: 'bg-red border-red',
  outline: 'bg-transparent border-text',
  danger: 'bg-transparent border-red',
};
const ink: Record<Variant, string> = { primary: 'text-paper', outline: 'text-text', danger: 'text-red' };

/** Text button. Height 48, radius 4, uppercase Oswald, used on paper surfaces. */
export function Button({ label, onPress, variant = 'outline', block = true, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`h-12 items-center justify-center rounded-ctl border px-4 active:opacity-80 ${box[variant]} ${block ? 'self-stretch' : 'self-start'} ${disabled ? 'opacity-50' : ''}`}
    >
      <Text className={`font-head text-base uppercase tracking-wider ${ink[variant]}`}>{label}</Text>
    </Pressable>
  );
}
