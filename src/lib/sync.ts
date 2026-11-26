import type { Tombstone } from '@/types';
import type { BackupData } from './backup';

/** Threads are one per item pair in either direction, so their tombstone key ignores direction. */
export const threadKey = (a: string, b: string): string => [a, b].sort().join('|');

const tombKey = (t: Pick<Tombstone, 'kind' | 'id'>): string => `${t.kind}:${t.id}`;

export function mergeTombstones(a: Tombstone[], b: Tombstone[]): Tombstone[] {
  const out = new Map<string, Tombstone>();
  for (const t of [...a, ...b]) {
    const cur = out.get(tombKey(t));
    if (!cur || t.deletedAt > cur.deletedAt) out.set(tombKey(t), t);
  }
  return [...out.values()];
}

/** Per key, the record changed last wins; on a tie the first list (this device) wins. */
function newest<T extends { updatedAt: number }>(a: T[], b: T[], key: (x: T) => string): T[] {
  const out = new Map<string, T>();
  for (const x of a) out.set(key(x), x);
  for (const x of b) {
    const cur = out.get(key(x));
    if (!cur || x.updatedAt > cur.updatedAt) out.set(key(x), x);
  }
  return [...out.values()];
}

/**
 * Merges this device's data with the copy from another device (the Drive file).
 * A record survives unless it was deleted at or after its last change; an edit made after a
 * delete on another device brings it back. Items of deleted boards and threads whose ends are
 * gone or on different boards are dropped, so the result keeps the store's invariants.
 */
export function mergeData(local: BackupData, remote: BackupData): BackupData {
  let tombstones = mergeTombstones(local.tombstones, remote.tombstones);
  const deletedAt = new Map(tombstones.map((t) => [tombKey(t), t.deletedAt]));
  const alive = (kind: Tombstone['kind'], id: string, updatedAt: number) =>
    (deletedAt.get(tombKey({ kind, id })) ?? -1) < updatedAt;

  const usedAt = new Map<string, number>();
  for (const b of [...local.boards, ...remote.boards]) usedAt.set(b.id, Math.max(usedAt.get(b.id) ?? 0, b.usedAt));
  const allBoards = newest(local.boards, remote.boards, (b) => b.id).map((b) => ({
    ...b,
    usedAt: usedAt.get(b.id) ?? b.usedAt,
  }));
  let boards = allBoards.filter((b) => alive('board', b.id, b.updatedAt));
  if (boards.length === 0 && allBoards.length > 0) {
    // Each device deleted the folders the other kept: keep the one changed last rather than none.
    const keep = allBoards.reduce((a, b) => (b.updatedAt > a.updatedAt ? b : a));
    boards = [keep];
    tombstones = tombstones.filter((t) => !(t.kind === 'board' && t.id === keep.id));
  }

  const boardIds = new Set(boards.map((b) => b.id));
  const items = newest(local.items, remote.items, (i) => i.id).filter(
    (i) => boardIds.has(i.boardId) && alive('item', i.id, i.updatedAt),
  );
  const itemBoard = new Map(items.map((i) => [i.id, i.boardId]));
  const threads = newest(local.threads, remote.threads, (t) => threadKey(t.fromId, t.toId)).filter((t) => {
    const board = itemBoard.get(t.fromId);
    return (
      board !== undefined &&
      board === itemBoard.get(t.toId) &&
      t.fromId !== t.toId &&
      alive('thread', threadKey(t.fromId, t.toId), t.updatedAt)
    );
  });
  return { boards, items, threads, tombstones };
}

/** Order-independent comparison, to skip writing when nothing changed. */
export function sameData(a: BackupData, b: BackupData): boolean {
  const canon = (d: BackupData) =>
    JSON.stringify([
      [...d.boards].sort((x, y) => x.id.localeCompare(y.id)),
      [...d.items].sort((x, y) => x.id.localeCompare(y.id)),
      [...d.threads].sort((x, y) => threadKey(x.fromId, x.toId).localeCompare(threadKey(y.fromId, y.toId))),
      [...d.tombstones].sort((x, y) => tombKey(x).localeCompare(tombKey(y))),
    ]);
  return canon(a) === canon(b);
}
