import { useImperativeHandle, useRef, useState, type Ref } from 'react';
import { View } from 'react-native';
import {
  EnrichedTextInput,
  type EnrichedTextInputInstance,
  type HtmlStyle,
  type TextShortcut,
} from 'react-native-enriched-html';
import { colors, fonts } from '@/theme/tokens';

export interface RichFieldHandle {
  /** Replaces the whole content (used by undo). */
  setValue: (html: string) => void;
}

interface Props {
  /** Initial HTML; the editor is uncontrolled after mount. */
  defaultValue: string;
  onChangeHtml: (html: string) => void;
  accessibilityLabel: string;
  placeholder?: string;
  autoFocus?: boolean;
  /** Taller editor for the full edit screen. */
  tall?: boolean;
  ref?: Ref<RichFieldHandle>;
}

/**
 * Markdown-style typing instead of a toolbar. Line starts: "- " or "* " bullet, "1. " numbered,
 * "[] " or "[ ] " checklist (not "- [ ] ": "- " already turns the line into a bullet). Inline:
 * **bold**, *italic*, ~~strikethrough~~.
 */
const SHORTCUTS: TextShortcut[] = [
  { trigger: '[] ', style: 'checkbox_list' },
  { trigger: '[ ] ', style: 'checkbox_list' },
  { trigger: '- ', style: 'unordered_list' },
  { trigger: '* ', style: 'unordered_list' },
  { trigger: '1. ', style: 'ordered_list' },
  { trigger: '**', style: 'bold' },
  { trigger: '*', style: 'italic' },
  { trigger: '~~', style: 'strikethrough' },
];

const htmlStyle: HtmlStyle = {
  ul: { bulletColor: colors.text, bulletSize: 6, marginLeft: 4, gapWidth: 12 },
  ol: { markerColor: colors.text, marginLeft: 4, gapWidth: 12 },
  ulCheckbox: { boxColor: colors.text, boxSize: 20, marginLeft: 0, gapWidth: 12 },
};

/**
 * Note body editor: native rich text (react-native-enriched-html) driven by the typing
 * shortcuts above. Enter continues a list and checkboxes tick by tapping them. Content is HTML.
 */
export function RichField({
  defaultValue,
  onChangeHtml,
  accessibilityLabel,
  placeholder,
  autoFocus,
  tall,
  ref,
}: Props) {
  const input = useRef<EnrichedTextInputInstance>(null);
  // Frozen at mount: the native input re-applies defaultValue whenever the prop changes, which
  // would overwrite what the user is typing and move the cursor.
  const [initial] = useState(defaultValue);
  useImperativeHandle(ref, () => ({ setValue: (html) => input.current?.setValue(html) }), []);

  return (
    <View className={`border-b border-rule bg-field px-2 py-3 ${tall ? 'min-h-32' : 'min-h-24'}`}>
      <EnrichedTextInput
        ref={input}
        defaultValue={initial}
        onChangeHtml={(e) => onChangeHtml(e.nativeEvent.value)}
        textShortcuts={SHORTCUTS}
        accessibilityLabel={accessibilityLabel}
        placeholder={placeholder}
        placeholderTextColor={colors.mute}
        autoFocus={autoFocus}
        scrollEnabled={false}
        cursorColor={colors.text}
        style={{ fontFamily: fonts.mono, fontSize: 16, lineHeight: 24, color: colors.text }}
        htmlStyle={htmlStyle}
      />
    </View>
  );
}
