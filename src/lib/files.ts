import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { uid } from './text';

export interface PickedFile {
  name: string;
  uri: string;
}

/**
 * Lets the user pick any file and copies it into the app's document directory,
 * so it stays available offline even after the original is moved or deleted.
 * Returns null when the user cancels.
 */
export async function pickAndKeepFile(): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
  const asset = res.canceled ? null : res.assets[0];
  if (!asset) return null;
  if (Platform.OS === 'web') return { name: asset.name, uri: asset.uri };
  const dir = new Directory(Paths.document, 'files');
  dir.create({ idempotent: true, intermediates: true });
  const dest = new File(dir, `${uid()}-${asset.name.replace(/[^\w.\- ]+/g, '_')}`);
  await new File(asset.uri).copy(dest);
  return { name: asset.name, uri: dest.uri };
}

/** Opens the system share sheet so the user can view the file in another app. */
export async function openFile(uri: string): Promise<boolean> {
  if (!uri || !(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri);
  return true;
}

/** Writes text to a cache file and opens the share sheet to save or send it. */
export async function shareTextFile(name: string, text: string): Promise<boolean> {
  if (Platform.OS === 'web' || !(await Sharing.isAvailableAsync())) return false;
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  await file.write(text);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: name });
  return true;
}

/** Lets the user pick a file and returns its text, or null when cancelled. */
export async function pickTextFile(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
  const asset = res.canceled ? null : res.assets[0];
  if (!asset) return null;
  if (Platform.OS === 'web') return (await fetch(asset.uri)).text();
  return new File(asset.uri).text();
}
