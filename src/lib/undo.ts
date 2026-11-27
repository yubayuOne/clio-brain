import type { Board, Item, Thread } from '@/types';

/** What a delete removed, kept so the Undo snackbar can put it back. */
export interface Removed {
  boards: Board[];
  items: Item[];
  threads: Thread[];
}

/**
 * The part of `removed` that can go back next to `current` without breaking the store's rules:
 * no duplicate ids, items only on existing boards, threads only between existing items of one
 * board and one per pair. Restored records get a fresh updatedAt so a sync keeps them over the
 * tombstones the delete left.
 */
export function restorable(current: Removed, removed: Removed, now: number): Removed {
  const boardIds = new Set(current.boards.map((b) => b.id));
  const boards = removed.boards.filter((b) => !boardIds.has(b.id)).map((b) => ({ ...b, updatedAt: now }));
  boards.forEach((b) => boardIds.add(b.id));

  const itemBoard = new Map(current.items.map((i) => [i.id, i.boardId]));
  const items = removed.items
    .filter((i) => boardIds.has(i.boardId) && !itemBoard.has(i.id))
    .map((i) => ({ ...i, updatedAt: now }));
  items.forEach((i) => itemBoard.set(i.id, i.boardId));

  const pairs = new Set(current.threads.map((t) => [t.fromId, t.toId].sort().join('|')));
  const threads: Thread[] = [];
  for (const t of removed.threads) {
    const key = [t.fromId, t.toId].sort().join('|');
    const board = itemBoard.get(t.fromId);
    if (!board || board !== itemBoard.get(t.toId) || t.fromId === t.toId || pairs.has(key)) continue;
    pairs.add(key);
    threads.push({ ...t, updatedAt: now });
  }
  return { boards, items, threads };
}
