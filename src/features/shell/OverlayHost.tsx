import { useEffect } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform } from 'react-native';
import { CaptureSheet } from '@/features/item/CaptureSheet';
import { EditScreen } from '@/features/item/EditScreen';
import { LinkPicker } from '@/features/item/LinkPicker';
import { PreviewModal } from '@/features/item/PreviewModal';
import { ReminderSheet } from '@/features/item/ReminderSheet';
import { ThreadSheet } from '@/features/item/ThreadSheet';
import { FolderForm } from '@/features/folders/FolderForm';
import { SettingsSheet } from '@/features/settings/SettingsSheet';
import { FolderSheet } from '@/features/folders/FolderSheet';
import { MoveSheet } from '@/features/folders/MoveSheet';
import { QrScanSheet } from '@/features/qrsync/QrScanSheet';
import { QrSendSheet } from '@/features/qrsync/QrSendSheet';
import { useData } from '@/store/data';
import { useUi, type Overlay } from '@/store/ui';

/** Where the Android back button goes from each overlay. */
function goBack(o: Overlay): void {
  const ui = useUi.getState();
  if (o.kind === 'edit') {
    const it = useData.getState().items.find((i) => i.id === o.id);
    if (it && !it.processed) useData.getState().updateItem(o.id, { processed: true });
    return ui.open({ kind: 'preview', id: o.id });
  }
  if (o.kind === 'thread' && o.returnTo) return ui.open({ kind: 'edit', id: o.returnTo });
  if (o.kind === 'folderForm') return ui.open({ kind: 'folders' });
  if (o.kind === 'qrSend' || o.kind === 'qrScan') return ui.open({ kind: 'settings' });
  ui.close();
}

/** Renders the single open overlay (plus the link picker stacked over the edit form). */
export function OverlayHost() {
  const overlay = useUi((s) => s.overlay);
  const picker = useUi((s) => s.picker);
  const moving = useUi((s) => s.moving);
  const reminding = useUi((s) => s.reminding);

  useEffect(() => {
    if (!overlay) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (useUi.getState().confirm) return false;
      if (useUi.getState().picker) useUi.getState().setPicker(false);
      else if (useUi.getState().moving) useUi.getState().setMoving(false);
      else if (useUi.getState().reminding) useUi.getState().setReminding(false);
      else goBack(overlay);
      return true;
    });
    return () => sub.remove();
  }, [overlay]);

  if (!overlay) return null;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="absolute inset-0">
      {overlay.kind === 'preview' ? <PreviewModal id={overlay.id} /> : null}
      {overlay.kind === 'edit' ? <EditScreen id={overlay.id} /> : null}
      {overlay.kind === 'capture' ? <CaptureSheet /> : null}
      {overlay.kind === 'thread' ? <ThreadSheet a={overlay.a} b={overlay.b} returnTo={overlay.returnTo} /> : null}
      {overlay.kind === 'folders' ? <FolderSheet /> : null}
      {overlay.kind === 'folderForm' ? <FolderForm focus={overlay.focus} /> : null}
      {overlay.kind === 'settings' ? <SettingsSheet /> : null}
      {overlay.kind === 'qrSend' ? <QrSendSheet /> : null}
      {overlay.kind === 'qrScan' ? <QrScanSheet /> : null}
      {overlay.kind === 'edit' && picker ? <LinkPicker id={overlay.id} /> : null}
      {overlay.kind === 'edit' && moving ? <MoveSheet id={overlay.id} /> : null}
      {overlay.kind === 'edit' && reminding ? <ReminderSheet id={overlay.id} /> : null}
    </KeyboardAvoidingView>
  );
}
