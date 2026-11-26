import { authorizedFetch } from './google';

const FILES = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const NAME = 'clio-brain.json';

export class DriveError extends Error {
  constructor(readonly status: number) {
    super(`Google Drive request failed (${status})`);
  }
}

export interface DriveFile {
  id: string;
  /** Increases on every change to the file; used to notice another device's upload. */
  version: string;
}

async function ok(res: Response): Promise<Response> {
  if (!res.ok) throw new DriveError(res.status);
  return res;
}

/**
 * The sync file in the app's hidden Drive folder, or null before the first upload.
 * shortcut: if two devices make their first upload at the same moment, two files exist; the
 * oldest is used and the other is ignored. Delete extras here if that ever shows up.
 */
export async function findSyncFile(): Promise<DriveFile | null> {
  const q = encodeURIComponent(`name = '${NAME}' and trashed = false`);
  const res = await ok(
    await authorizedFetch(`${FILES}?spaces=appDataFolder&q=${q}&orderBy=createdTime&fields=files(id,version)`),
  );
  const { files } = (await res.json()) as { files?: DriveFile[] };
  return files?.[0] ?? null;
}

export async function downloadSyncFile(id: string): Promise<string> {
  return (await ok(await authorizedFetch(`${FILES}/${id}?alt=media`))).text();
}

export async function uploadSyncFile(id: string | null, json: string): Promise<void> {
  if (id) {
    await ok(
      await authorizedFetch(`${UPLOAD}/${id}?uploadType=media`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: json,
      }),
    );
    return;
  }
  const boundary = `clio-brain-${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify({ name: NAME, parents: ['appDataFolder'] }),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    json,
    `--${boundary}--`,
  ].join('\r\n');
  await ok(
    await authorizedFetch(`${UPLOAD}?uploadType=multipart`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    }),
  );
}
