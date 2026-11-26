import type { Board, Item, Thread, Tombstone } from '@/types';
import { getDb } from './client';

interface ItemRow {
  id: string;
  board_id: string;
  type: Item['type'];
  title: string;
  body: string;
  url: string;
  file_name: string;
  file_uri: string;
  tags: string;
  processed: number;
  created_at: number;
  remind_at: number | null;
  x: number;
  y: number;
  z: number;
  updated_at: number;
}

function parseTagList(raw: string): string[] {
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

const toItem = (r: ItemRow): Item => ({
  id: r.id,
  boardId: r.board_id,
  type: r.type,
  title: r.title,
  body: r.body,
  url: r.url,
  fileName: r.file_name,
  fileUri: r.file_uri,
  tags: parseTagList(r.tags),
  processed: r.processed === 1,
  createdAt: r.created_at,
  remindAt: r.remind_at,
  x: r.x,
  y: r.y,
  z: r.z,
  updatedAt: r.updated_at,
});

export interface Snapshot {
  boards: Board[];
  items: Item[];
  threads: Thread[];
  tombstones: Tombstone[];
  currentBoardId: string | null;
}

export async function loadAll(): Promise<Snapshot> {
  const db = await getDb();
  const boards = await db.getAllAsync<{
    id: string;
    name: string;
    used_at: number;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM boards');
  const items = await db.getAllAsync<ItemRow>('SELECT * FROM items');
  const threads = await db.getAllAsync<{
    from_id: string;
    to_id: string;
    label: string;
    color: string;
    updated_at: number;
  }>('SELECT * FROM threads');
  const tombstones = await db.getAllAsync<{ kind: Tombstone['kind']; id: string; deleted_at: number }>(
    'SELECT * FROM tombstones',
  );
  const cur = await db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'currentBoard'");
  return {
    boards: boards.map((b) => ({
      id: b.id,
      name: b.name,
      usedAt: b.used_at,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    })),
    items: items.map(toItem),
    threads: threads.map((t) => ({
      fromId: t.from_id,
      toId: t.to_id,
      label: t.label,
      color: t.color,
      updatedAt: t.updated_at,
    })),
    tombstones: tombstones.map((t) => ({ kind: t.kind, id: t.id, deletedAt: t.deleted_at })),
    currentBoardId: cur?.value ?? null,
  };
}

export async function saveSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, value);
}

// Never INSERT OR REPLACE here: REPLACE deletes the old row first, and with foreign keys
// on that cascades (saving a board wiped its items, saving an item wiped its threads).
export async function upsertBoard(b: Board): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO boards (id, name, used_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, used_at = excluded.used_at, updated_at = excluded.updated_at`,
    b.id,
    b.name,
    b.usedAt,
    b.createdAt,
    b.updatedAt,
  );
}

/** Deleting a board cascades to its items and their threads. */
export async function deleteBoard(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM boards WHERE id = ?', id);
}

export async function upsertItem(i: Item): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO items
      (id, board_id, type, title, body, url, file_name, file_uri, tags, processed, created_at, remind_at, x, y, z,
       updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
      board_id = excluded.board_id, type = excluded.type, title = excluded.title, body = excluded.body,
      url = excluded.url, file_name = excluded.file_name, file_uri = excluded.file_uri, tags = excluded.tags,
      processed = excluded.processed, remind_at = excluded.remind_at, x = excluded.x, y = excluded.y, z = excluded.z,
      updated_at = excluded.updated_at`,
    i.id,
    i.boardId,
    i.type,
    i.title,
    i.body,
    i.url,
    i.fileName,
    i.fileUri,
    JSON.stringify(i.tags),
    i.processed ? 1 : 0,
    i.createdAt,
    i.remindAt,
    i.x,
    i.y,
    i.z,
    i.updatedAt,
  );
}

export async function upsertItems(items: Item[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const i of items) await upsertItem(i);
  });
}

/** Deleting an item cascades to every thread touching it. */
export async function deleteItem(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM items WHERE id = ?', id);
}

export async function upsertThread(t: Thread): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO threads (from_id, to_id, label, color, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(from_id, to_id) DO UPDATE SET label = excluded.label, color = excluded.color,
      updated_at = excluded.updated_at`,
    t.fromId,
    t.toId,
    t.label,
    t.color,
    t.updatedAt,
  );
}

export async function deleteThread(fromId: string, toId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM threads WHERE from_id = ? AND to_id = ?', fromId, toId);
}

export async function deleteThreadsOf(itemId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM threads WHERE from_id = ? OR to_id = ?', itemId, itemId);
}

export async function addTombstones(list: Tombstone[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const t of list) await upsertTombstone(t);
  });
}

async function upsertTombstone(t: Tombstone): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO tombstones (kind, id, deleted_at) VALUES (?, ?, ?)
     ON CONFLICT(kind, id) DO UPDATE SET deleted_at = MAX(deleted_at, excluded.deleted_at)`,
    t.kind,
    t.id,
    t.deletedAt,
  );
}

/**
 * Replaces every row in one transaction, so a failed import or sync leaves the old data intact.
 * Settings (the open folder) are kept.
 */
export async function replaceAll(
  boards: Board[],
  items: Item[],
  threads: Thread[],
  tombstones: Tombstone[],
): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM threads; DELETE FROM items; DELETE FROM boards; DELETE FROM tombstones;');
    for (const b of boards) await upsertBoard(b);
    for (const i of items) await upsertItem(i);
    for (const t of threads) await upsertThread(t);
    for (const t of tombstones) await upsertTombstone(t);
  });
}

/** Wipes everything. Used only by the "start a new board" recovery screen. */
export async function resetAll(): Promise<void> {
  const db = await getDb();
  await db.execAsync(
    'DELETE FROM threads; DELETE FROM items; DELETE FROM boards; DELETE FROM settings; DELETE FROM tombstones;',
  );
}
