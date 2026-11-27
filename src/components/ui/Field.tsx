import { TextInput, type TextInputProps } from 'react-native';
import { colors } from '@/theme/tokens';

interface Props extends TextInputProps {
  /** Large uppercase headline input, used for item titles. */
  headline?: boolean;
}

/**
 * Text field on paper: tinted fill and a bottom rule. 16px text so iOS does not zoom.
 * Callers pass accessibilityLabel when there is no visible label.
 */
export function Field({ headline, multiline, className, ...rest }: Props) {
  const type = headline ? 'font-head-bold text-2xl uppercase leading-7' : 'font-mono text-base';
  return (
    <TextInput
      multiline={multiline}
      placeholderTextColor={colors.mute}
      textAlignVertical={multiline ? 'top' : 'center'}
      className={`min-h-12 border-b border-rule bg-field px-2 py-3 text-text ${type} ${className ?? ''}`}
      {...rest}
    />
  );
}
