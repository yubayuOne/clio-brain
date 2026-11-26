import type { Board, Item, Thread, Tombstone } from '@/types';

const FORMAT = 'clio-brain-backup';
/** 2 added updatedAt on every record and the tombstones list; version 1 files still import. */
const VERSION = 2;

export interface BackupData {
  boards: Board[];
  items: Item[];
  threads: Thread[];
  tombstones: Tombstone[];
}

/** The exported file, also the Google Drive sync file. Attached files are referenced by URI only. */
export function toBackupJson(data: BackupData, now = Date.now()): string {
  return JSON.stringify({ format: FORMAT, version: VERSION, exportedAt: now, ...data }, null, 2);
}

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === 'string';
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
/** Version 1 records have no updatedAt: treat them as older than any change. */
const updated = (v: Rec): number => (num(v.updatedAt) ? v.updatedAt : 0);

function toBoard(v: unknown): Board | null {
  if (!isRec(v) || !str(v.id) || !v.id || !str(v.name) || !num(v.usedAt) || !num(v.createdAt)) return null;
  return { id: v.id, name: v.name, usedAt: v.usedAt, createdAt: v.createdAt, updatedAt: updated(v) };
}

function toItem(v: unknown): Item | null {
  if (!isRec(v) || !str(v.id) || !v.id || !str(v.boardId)) return null;
  if (v.type !== 'note' && v.type !== 'link' && v.type !== 'file') return null;
  if (![v.title, v.body, v.url, v.fileName, v.fileUri].every(str)) return null;
  if (!Array.isArray(v.tags) || !v.tags.every(str) || typeof v.processed !== 'boolean') return null;
  if (![v.createdAt, v.x, v.y, v.z].every(num) || !(v.remindAt === null || num(v.remindAt))) return null;
  return {
    id: v.id,
    boardId: v.boardId,
    type: v.type,
    title: v.title as string,
    body: v.body as string,
    url: v.url as string,
    fileName: v.fileName as string,
    fileUri: v.fileUri as string,
    tags: v.tags as string[],
    processed: v.processed,
    createdAt: v.createdAt as number,
    remindAt: v.remindAt as number | null,
    x: v.x as number,
    y: v.y as number,
    z: v.z as number,
    updatedAt: updated(v),
  };
}

function toThread(v: unknown): Thread | null {
  if (!isRec(v) || !str(v.fromId) || !str(v.toId) || !str(v.label) || !str(v.color)) return null;
  return { fromId: v.fromId, toId: v.toId, label: v.label, color: v.color, updatedAt: updated(v) };
}

function toTombstone(v: unknown): Tombstone | null {
  if (!isRec(v) || !str(v.id) || !num(v.deletedAt)) return null;
  if (v.kind !== 'board' && v.kind !== 'item' && v.kind !== 'thread') return null;
  return { kind: v.kind, id: v.id, deletedAt: v.deletedAt };
}

function all<T>(list: unknown, conv: (v: unknown) => T | null): T[] | null {
  if (!Array.isArray(list)) return null;
  const out = list.map(conv);
  return out.every((x): x is T => x !== null) ? out : null;
}

/** The rules the store enforces: at least one board, unique ids, items on existing boards,
 * threads between two different items of one board, one thread per pair. */
export function isConsistent({ boards, items, threads }: BackupData): boolean {
  if (boards.length === 0) return false;
  const boardIds = new Set(boards.map((b) => b.id));
  const itemBoard = new Map(items.map((i) => [i.id, i.boardId]));
  if (boardIds.size !== boards.length || itemBoard.size !== items.length) return false;
  if (!items.every((i) => boardIds.has(i.boardId))) return false;
  const pairs = new Set<string>();
  for (const t of threads) {
    const a = itemBoard.get(t.fromId);
    const key = [t.fromId, t.toId].sort().join('\n');
    if (!a || a !== itemBoard.get(t.toId) || t.fromId === t.toId || pairs.has(key)) return false;
    pairs.add(key);
  }
  return true;
}

/**
 * Parses an imported file. Returns null for anything that is not a complete, internally
 * consistent Clio Brain backup, so a bad file can never half-replace the user's data.
 */
export function parseBackup(text: string): BackupData | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRec(raw) || raw.format !== FORMAT || (raw.version !== 1 && raw.version !== VERSION)) return null;
  const boards = all(raw.boards, toBoard);
  const items = all(raw.items, toItem);
  const threads = all(raw.threads, toThread);
  const tombstones = raw.version === 1 ? [] : all(raw.tombstones, toTombstone);
  if (!boards || !items || !threads || !tombstones) return null;
  const data = { boards, items, threads, tombstones };
  return isConsistent(data) ? data : null;
}
