import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useRef, useState } from 'react';
import { Linking, Text, useWindowDimensions, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Sheet, SheetHeader } from '@/components/ui/Sheet';
import { parseBackup } from '@/lib/backup';
import { FrameCollector } from '@/lib/qrsync';
import { useData } from '@/store/data';
import { useUi } from '@/store/ui';

/** Reads the QR loop from "Send by QR" on another phone and merges that data into this one. */
export function QrScanSheet() {
  const { width, height } = useWindowDimensions();
  const size = Math.min(width - 32, height * 0.5, 420);
  const [permission, requestPermission] = useCameraPermissions();
  const collector = useRef(new FrameCollector());
  const busy = useRef(false);
  const [progress, setProgress] = useState({ received: 0, total: 0 });
  const [error, setError] = useState('');
  const back = () => useUi.getState().open({ kind: 'settings' });

  const startOver = (message: string) => {
    collector.current = new FrameCollector();
    setProgress({ received: 0, total: 0 });
    setError(message);
    busy.current = false;
  };

  // Fires many times per second, also for codes already read; FrameCollector ignores repeats.
  const onScan = async ({ data }: BarcodeScanningResult) => {
    const c = collector.current;
    if (busy.current || !c.add(data)) return;
    setError('');
    setProgress({ received: c.received, total: c.total });
    if (!c.complete) return;
    busy.current = true;
    const json = c.result();
    const backup = json ? parseBackup(json) : null;
    if (!backup) return startOver('Those codes did not hold Clio Brain data. Scan again.');
    if (!(await useData.getState().mergeIn(backup))) return startOver('The data could not be merged. Nothing changed.');
    useUi.getState().close();
    useUi.getState().flash('Notes merged from the other phone');
  };

  return (
    <Sheet onDismiss={back}>
      <SheetHeader title="Scan QR" onBack={back} />
      {!permission ? null : !permission.granted ? (
        <View className="gap-3">
          <Text className="font-mono text-sm text-text">
            {permission.canAskAgain
              ? 'The camera is needed to read the codes.'
              : 'Camera access is off for Clio Brain. Turn it on in system settings.'}
          </Text>
          <Button
            label={permission.canAskAgain ? 'Allow camera' : 'Open settings'}
            variant="primary"
            onPress={() => void (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
          />
        </View>
      ) : (
        <View className="items-center">
          <View className="overflow-hidden rounded-ctl" style={{ width: size, height: size }}>
            <CameraView
              style={{ width: size, height: size }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={(r) => void onScan(r)}
            />
          </View>
          <Text accessibilityLiveRegion="polite" className="mt-3 font-mono text-sm text-text">
            {progress.total ? `Read ${progress.received} of ${progress.total} codes` : 'Point the camera at the codes'}
          </Text>
        </View>
      )}
      <Text accessibilityLiveRegion="assertive" className="mt-2 min-h-5 font-mono text-sm text-red">
        {error}
      </Text>
    </Sheet>
  );
}
