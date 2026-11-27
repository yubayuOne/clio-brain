import { useState } from 'react';
import { Text } from 'react-native';
import { Label } from '@/components/ui/Label';
import { Row } from '@/components/ui/Row';
import { Sheet, SheetHeader } from '@/components/ui/Sheet';
import { parseBackup, toBackupJson } from '@/lib/backup';
import { pickTextFile, shareTextFile } from '@/lib/files';
import { disconnectDrive, driveAccount, driveAvailable } from '@/lib/google';
import { formatTime } from '@/lib/text';
import { useData } from '@/store/data';
import { useUi } from '@/store/ui';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** App settings: back up all data to a JSON file, or restore from one. */
export function SettingsSheet() {
  const [error, setError] = useState('');
  const [account, setAccount] = useState(driveAccount);
  const [syncing, setSyncing] = useState(false);
  const lastSync = useData((s) => s.lastSync);
  const close = () => useUi.getState().close();

  const sync = async () => {
    setSyncing(true);
    await useData.getState().syncDrive(true);
    setAccount(driveAccount());
    setSyncing(false);
  };
  const disconnect = async () => {
    await disconnectDrive();
    setAccount(null);
  };

  const exportData = async () => {
    setError('');
    const { boards, items, threads, tombstones } = useData.getState();
    const name = `clio-brain-${new Date().toISOString().slice(0, 10)}.json`;
    try {
      if (!(await shareTextFile(name, toBackupJson({ boards, items, threads, tombstones })))) {
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

      <Label className="mb-1 mt-5">Sync by QR</Label>
      <Row icon="qr" title="Send by QR" onPress={() => useUi.getState().open({ kind: 'qrSend' })} />
      <Row icon="camera" title="Scan QR" onPress={() => useUi.getState().open({ kind: 'qrScan' })} last />
      <Text className="mt-2 font-mono text-sm text-mute">
        Merges the other phone&apos;s notes into this one. Do it both ways to make the phones match.
      </Text>

      {driveAvailable() ? (
        <>
          <Label className="mb-1 mt-5">Google Drive</Label>
          <Row
            icon="cloud"
            title={syncing ? 'Syncing...' : account ? 'Sync now' : 'Connect Google Drive'}
            meta={account ?? undefined}
            onPress={() => void sync()}
            last={!account}
          />
          {account ? <Row icon="close" title="Disconnect" onPress={() => void disconnect()} last /> : null}
          <Text
            accessibilityLiveRegion="polite"
            className={`mt-2 min-h-5 font-mono text-sm ${lastSync && !lastSync.ok ? 'text-red' : 'text-mute'}`}
          >
            {lastSync
              ? `${lastSync.message} ${lastSync.ok ? `at ${formatTime(lastSync.at)}` : ''}`.trim()
              : 'Keeps folders, cards, threads and reminders the same on every phone signed in to the same Google account. Attached files are not synced.'}
          </Text>
        </>
      ) : null}
    </Sheet>
  );
}
