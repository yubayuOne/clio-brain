import { useEffect, useMemo, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { QrCode } from '@/components/ui/QrCode';
import { Sheet, SheetHeader } from '@/components/ui/Sheet';
import { toBackupJson } from '@/lib/backup';
import { toFrames } from '@/lib/qrsync';
import { useData } from '@/store/data';
import { useUi } from '@/store/ui';

/** Time each code stays on screen; long enough for the other phone's camera to catch it. */
const FRAME_MS = 450;

/** Shows this phone's data as a loop of QR codes for "Scan QR" on another phone. */
export function QrSendSheet() {
  const { width, height } = useWindowDimensions();
  const size = Math.min(width - 64, height * 0.55, 380);
  const frames = useMemo(() => {
    const { boards, items, threads, tombstones } = useData.getState();
    return toFrames(toBackupJson({ boards, items, threads, tombstones }));
  }, []);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (frames.length < 2) return;
    const t = setInterval(() => setN((i) => (i + 1) % frames.length), FRAME_MS);
    return () => clearInterval(t);
  }, [frames.length]);
  const back = () => useUi.getState().open({ kind: 'settings' });

  return (
    <Sheet onDismiss={back}>
      <SheetHeader title="Send by QR" onBack={back} />
      <View className="items-center">
        <QrCode text={frames[n] ?? ''} size={size} />
        <Text accessibilityLiveRegion="polite" className="mt-3 font-mono text-sm text-text">
          {`Code ${n + 1} of ${frames.length}`}
        </Text>
      </View>
      <Text className="mt-3 font-mono text-sm text-mute">
        On the other phone open Settings, Scan QR, and point it here until it has every code. Attached files are not
        sent.
      </Text>
    </Sheet>
  );
}
