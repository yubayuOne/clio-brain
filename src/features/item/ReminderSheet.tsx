import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Row } from '@/components/ui/Row';
import { Sheet, SheetHeader } from '@/components/ui/Sheet';
import { formatDay, formatTime } from '@/lib/text';
import { useData } from '@/store/data';
import { useUi } from '@/store/ui';
import { colors } from '@/theme/tokens';

type Part = 'date' | 'time';

/** Takes the picked part (day or clock time) from `picked`, the rest from `base`. */
function merge(base: Date, picked: Date, part: Part): Date {
  const d = new Date(base);
  if (part === 'date') d.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  else d.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return d;
}

/** Next full hour, at least 30 minutes away. */
function defaultTime(): Date {
  const d = new Date(Date.now() + 30 * 60_000);
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

/** Pick a date and time for an item's reminder notification. */
export function ReminderSheet({ id }: { id: string }) {
  const item = useData((s) => s.items.find((i) => i.id === id));
  const [at, setAt] = useState(() => (item?.remindAt ? new Date(item.remindAt) : defaultTime()));
  const [iosPart, setIosPart] = useState<Part | null>(null);
  const [error, setError] = useState('');
  if (!item) return null;

  const close = () => useUi.getState().setReminding(false);
  const change = (picked: Date, part: Part) => {
    setAt((cur) => merge(cur, picked, part));
    setError('');
  };
  const pick = (part: Part) => {
    if (Platform.OS !== 'android') return setIosPart(iosPart === part ? null : part);
    DateTimePickerAndroid.open({
      value: at,
      mode: part,
      is24Hour: true,
      minimumDate: part === 'date' ? new Date() : undefined,
      onValueChange: (_, picked) => change(picked, part),
    });
  };
  const save = async () => {
    if (at.getTime() <= Date.now()) return setError('Pick a time in the future.');
    const alerts = await useData.getState().setReminder(id, at.getTime());
    if (alerts) return close();
    setError(
      'Reminder saved, but notifications are off for Clio Brain. Turn them on in system settings to be alerted.',
    );
  };
  const remove = () =>
    useUi.getState().ask('Remove this reminder?', () => {
      void useData.getState().setReminder(id, null);
      close();
    });

  return (
    <Sheet onDismiss={close}>
      <SheetHeader title="Reminder" onClose={close} />
      <Row
        icon="calendar"
        title={formatDay(at.getTime())}
        accessibilityLabel={`Date: ${formatDay(at.getTime())}. Change date`}
        selected={iosPart === 'date' ? true : undefined}
        onPress={() => pick('date')}
      />
      <Row
        icon="clock"
        title={formatTime(at.getTime())}
        accessibilityLabel={`Time: ${formatTime(at.getTime())}. Change time`}
        selected={iosPart === 'time' ? true : undefined}
        onPress={() => pick('time')}
        last
      />
      {iosPart ? (
        <DateTimePicker
          value={at}
          mode={iosPart}
          display={iosPart === 'date' ? 'inline' : 'spinner'}
          minimumDate={iosPart === 'date' ? new Date() : undefined}
          themeVariant="light"
          accentColor={colors.red}
          onValueChange={(_, picked) => change(picked, iosPart)}
        />
      ) : null}

      <Text accessibilityLiveRegion="polite" className="mt-2 min-h-5 font-mono text-sm text-red">
        {error}
      </Text>

      <View className="mt-2 flex-row items-center gap-2">
        <View className="flex-1">
          <Button label="Save reminder" variant="primary" onPress={save} />
        </View>
        {item.remindAt ? <IconButton icon="trash" label="Remove reminder" variant="danger" onPress={remove} /> : null}
      </View>
    </Sheet>
  );
}
