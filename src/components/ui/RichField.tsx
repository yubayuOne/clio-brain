import { useImperativeHandle, useRef, useState, type Ref } from 'react';
import { View } from 'react-native';
import {
  EnrichedTextInput,
  type EnrichedTextInputInstance,
  type HtmlStyle,
  type OnChangeStateEvent,
} from 'react-native-enriched-html';
import { colors, fonts } from '@/theme/tokens';
import { IconButton } from './IconButton';
import type { IconName } from './Icon';

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

type Tool = {
  icon: IconName;
  label: string;
  active: (s: OnChangeStateEvent) => boolean;
  run: (e: EnrichedTextInputInstance) => void;
};

const TOOLS: Tool[] = [
  {
    icon: 'checklist',
    label: 'Checklist',
    active: (s) => s.checkboxList.isActive,
    run: (e) => e.toggleCheckboxList(false),
  },
  {
    icon: 'listBullet',
    label: 'Bulleted list',
    active: (s) => s.unorderedList.isActive,
    run: (e) => e.toggleUnorderedList(),
  },
  {
    icon: 'listNumber',
    label: 'Numbered list',
    active: (s) => s.orderedList.isActive,
    run: (e) => e.toggleOrderedList(),
  },
  { icon: 'bold', label: 'Bold', active: (s) => s.bold.isActive, run: (e) => e.toggleBold() },
  { icon: 'italic', label: 'Italic', active: (s) => s.italic.isActive, run: (e) => e.toggleItalic() },
  {
    icon: 'strike',
    label: 'Strikethrough',
    active: (s) => s.strikeThrough.isActive,
    run: (e) => e.toggleStrikeThrough(),
  },
];

const htmlStyle: HtmlStyle = {
  ul: { bulletColor: colors.text, bulletSize: 6, marginLeft: 4, gapWidth: 12 },
  ol: { markerColor: colors.text, marginLeft: 4, gapWidth: 12 },
  ulCheckbox: { boxColor: colors.text, boxSize: 20, marginLeft: 0, gapWidth: 12 },
};

/**
 * Note body editor: native rich text (react-native-enriched-html) with a small toolbar for
 * checklists, bulleted and numbered lists, bold, italic and strikethrough. Enter continues a
 * list, "- " and "1. " start one, and checkboxes tick by tapping them. Content is HTML.
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
  const [state, setState] = useState<OnChangeStateEvent | null>(null);
  useImperativeHandle(ref, () => ({ setValue: (html) => input.current?.setValue(html) }), []);

  return (
    <View>
      <View accessibilityRole="toolbar" accessibilityLabel="Formatting" className="mb-1 flex-row flex-wrap gap-1">
        {TOOLS.map((t) => (
          <IconButton
            key={t.icon}
            icon={t.icon}
            label={t.label}
            size={44}
            pressed={state ? t.active(state) : false}
            onPress={() => input.current && t.run(input.current)}
          />
        ))}
      </View>
      <View className={`border-b border-rule bg-field px-2 py-3 ${tall ? 'min-h-32' : 'min-h-24'}`}>
        <EnrichedTextInput
          ref={input}
          defaultValue={defaultValue}
          onChangeHtml={(e) => onChangeHtml(e.nativeEvent.value)}
          onChangeState={(e) => setState(e.nativeEvent)}
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
    </View>
  );
}
