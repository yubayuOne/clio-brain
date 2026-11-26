import { useState } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { continueList } from '@/lib/text';
import { colors } from '@/theme/tokens';

interface Props extends TextInputProps {
  /** Large uppercase headline input, used for item titles. */
  headline?: boolean;
  /** Enter on a "1. ", "- " or "- [ ] " line starts the next item. Needs a controlled `value`. */
  lists?: boolean;
}

/**
 * Text field on paper: tinted fill and a bottom rule. 16px text so iOS does not zoom.
 * Callers pass accessibilityLabel when there is no visible label.
 */
export function Field({ headline, multiline, lists, className, onChangeText, onSelectionChange, ...rest }: Props) {
  // Set only right after a list marker is inserted, so the cursor lands after it; then released.
  const [selection, setSelection] = useState<{ start: number; end: number }>();
  const type = headline ? 'font-head-bold text-2xl uppercase leading-7' : 'font-mono text-base';

  const change = (text: string) => {
    const next = lists && rest.value !== undefined ? continueList(rest.value, text) : null;
    if (next) setSelection({ start: next.cursor, end: next.cursor });
    onChangeText?.(next ? next.text : text);
  };

  return (
    <TextInput
      multiline={multiline}
      placeholderTextColor={colors.mute}
      textAlignVertical={multiline ? 'top' : 'center'}
      className={`min-h-12 border-b border-rule bg-field px-2 py-3 text-text ${type} ${className ?? ''}`}
      {...rest}
      onChangeText={change}
      selection={selection}
      onSelectionChange={(e) => {
        if (selection) setSelection(undefined);
        onSelectionChange?.(e);
      }}
    />
  );
}
