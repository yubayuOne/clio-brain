import { useState } from 'react';
import { Text } from 'react-native';
import { Label } from '@/components/ui/Label';
import { Row } from '@/components/ui/Row';
import { Sheet, SheetHeader } from '@/components/ui/Sheet';
import { parseBackup, toBackupJson } from '@/lib/backup';
import { pickTextFile, shareTextFile } from '@/lib/files';
import { useData } from '@/store/data';
import { useUi } from '@/store/ui';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** App settings: back up all data to a JSON file, or restore from one. */
export function SettingsSheet() {
  const [error, setError] = useState('');
  const close = () => useUi.getState().close();

  const exportData = async () => {
    setError('');
    const { boards, items, threads } = useData.getState();
    const name = `clio-brain-${new Date().toISOString().slice(0, 10)}.json`;
    try {
      if (!(await shareTextFile(name, toBackupJson({ boards, items, threads })))) {
        setError('Export is not available on this device.');
      }
    } catch {
      setError('The export file could not be created.');
    }
  };

  const importData = async () => {
    setError('');
    let text: string | null;
    try {
      text = await pickTextFile();
    } catch {
      return setError('The file could not be read.');
    }
    if (text == null) return;
    const data = parseBackup(text);
    if (!data) return setError('This file is not a Clio Brain backup.');
    useUi.getState().ask(
      `Replace all data with this backup? ${plural(data.boards.length, 'folder')}, ${plural(data.items.length, 'item')}.`,
      async () => {
        if (!(await useData.getState().importBackup(data))) {
          return setError('Import failed. Your data was not changed.');
        }
        useUi.setState({ selectedId: null, connectMode: false, group: 'inbox', drill: null });
        close();
        useUi.getState().flash('Data imported');
      },
      'Replace',
    );
  };

  return (
    <Sheet onDismiss={close}>
      <SheetHeader title="Settings" onClose={close} />
      <Label>Data</Label>
      <Row icon="upload" title="Export data" onPress={exportData} />
      <Row icon="download" title="Import data" onPress={importData} last />
      <Text className="mt-2 font-mono text-sm text-mute">
        Backups hold folders, cards, threads and reminders. Attached files stay on this device.
      </Text>
      {error ? (
        <Text accessibilityLiveRegion="polite" className="mt-2 font-mono text-sm text-red">
          {error}
        </Text>
      ) : null}
    </Sheet>
  );
}
