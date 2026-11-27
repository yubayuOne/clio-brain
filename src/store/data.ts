import { create } from 'zustand';
import * as repo from '@/db/repo';
import { isConsistent, parseBackup, toBackupJson, type BackupData } from '@/lib/backup';
import { DriveError, downloadSyncFile, findSyncFile, uploadSyncFile } from '@/lib/drive';
import { connectDrive } from '@/lib/google';
import { mergeData, mergeTombstones, sameData, threadKey } from '@/lib/sync';
import { seedData } from '@/db/seed';
import { threadColors } from '@/theme/tokens';
import type { Board, Item, ItemType, Thread, Tombstone } from '@/types';
import { cancelAllReminders, cancelReminder, scheduleReminder } from '@/lib/reminders';
import { uid } from '@/lib/text';
import { restorable, type Removed } from '@/lib/undo';

export type LoadStatus = 'loading' | 'ready' | 'error';

export interface SyncResult {
  ok: boolean;
  /** Empty for a silent background sync that found no connected account. */
  message: string;
  at: number;
}

export interface NewItem {
  type: ItemType;
  title: string;
  body: string;
  url: string;
  fileName: string;
  fileUri: string;
  x: number;
  y: number;
}

interface DataState {
  status: LoadStatus;
  /** Set when a write to SQLite fails; the UI shows a notice. */
  saveFailed: boolean;
  boards: Board[];
  items: Item[];
  threads: Thread[];
  /** Deletions remembered for sync, so other devices drop the same records. */
  tombstones: Tombstone[];
  currentBoardId: string;
  /** Outcome of the last Google Drive sync, shown in Settings. */
  lastSync: SyncResult | null;

  load: () => Promise<void>;
  resetAll: () => Promise<void>;
  /** Replaces all data with an imported backup. Resolves false (old data kept) if writing fails. */
  importBackup: (data: BackupData) => Promise<boolean>;
  dismissSaveError: () => void;
  /**
   * Merges this device with the Google Drive copy and uploads the result. `interactive` may show
   * Google's sign-in; background syncs pass false and do nothing when no account is connected.
   */
  syncDrive: (interactive: boolean) => Promise<SyncResult>;

  addItem: (draft: NewItem) => Item;
  updateItem: (id: string, patch: Partial<Omit<Item, 'id'>>) => void;
  /**
   * Saves the reminder time (null clears it) and schedules the notification.
   * Resolves false when the reminder is saved but the phone will not alert.
   */
  setReminder: (id: string, at: number | null) => Promise<boolean>;
  /** Updates position in memory only; call commitItem when the drag ends. */
  placeItem: (id: string, x: number, y: number) => void;
  commitItem: (id: string) => void;
  bringToFront: (id: string) => void;
  /** Returns what was removed, for the Undo snackbar; null if the item does not exist. */
  deleteItem: (id: string) => Removed | null;
  moveItemToBoard: (id: string, boardId: string) => void;
  arrangeBoard: () => void;

  connect: (fromId: string, toId: string) => boolean;
  updateThread: (fromId: string, toId: string, patch: Partial<Pick<Thread, 'label' | 'color'>>) => void;
  cutThread: (fromId: string, toId: string) => Removed | null;

  createBoard: (name: string) => string;
  renameBoard: (id: string, name: string) => void;
  deleteBoard: (id: string) => Removed | null;
  /** Puts back what a delete removed (as far as it still fits), with its reminders. */
  restore: (removed: Removed) => void;
  selectBoard: (id: string) => void;
}

/** Fire-and-forget write; failures flip saveFailed so the user is told. */
function persist(p: Promise<unknown>): void {
  p.catch(() => useData.setState({ saveFailed: true }));
}

/** Records deletions in memory and storage. */
function bury(list: Tombstone[]): void {
  if (list.length === 0) return;
  useData.setState((s) => ({ tombstones: mergeTombstones(s.tombstones, list) }));
  persist(repo.addTombstones(list));
}

const threadGone = (t: Thread, deletedAt: number): Tombstone => ({
  kind: 'thread',
  id: threadKey(t.fromId, t.toId),
  deletedAt,
});

function rescheduleAll(items: Item[]): void {
  cancelAllReminders();
  const now = Date.now();
  for (const i of items) if (i.remindAt && i.remindAt > now) void scheduleReminder(i.id, i.title, i.remindAt);
}

let syncing: Promise<SyncResult> | null = null;

async function runSync(interactive: boolean): Promise<SyncResult> {
  const result = (ok: boolean, message: string): SyncResult => ({ ok, message, at: Date.now() });
  const auth = await connectDrive(interactive);
  if (!auth.ok) return result(false, auth.message);
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const s = useData.getState();
      const local: BackupData = { boards: s.boards, items: s.items, threads: s.threads, tombstones: s.tombstones };
      const file = await findSyncFile();
      const remote = file ? parseBackup(await downloadSyncFile(file.id)) : null;
      // Never overwrite a Drive file we cannot read: it may hold another device's data.
      if (file && !remote) return result(false, 'The Google Drive copy could not be read. Nothing was changed.');
      const merged = remote ? mergeData(local, remote) : local;
      if (!isConsistent(merged))
        return result(false, 'Sync stopped: the merged data was inconsistent. Nothing was changed.');

      if (!remote || !sameData(merged, remote)) {
        // Another device uploaded since we downloaded: merge again with its version.
        if (file && (await findSyncFile())?.version !== file.version) continue;
        await uploadSyncFile(file?.id ?? null, toBackupJson(merged));
      }
      // Edits made on this device while syncing would be lost by applying `merged`: merge again.
      const now = useData.getState();
      if (
        now.boards !== s.boards ||
        now.items !== s.items ||
        now.threads !== s.threads ||
        now.tombstones !== s.tombstones
      ) {
        continue;
      }
      if (!sameData(merged, local)) {
        await repo.replaceAll(merged.boards, merged.items, merged.threads, merged.tombstones);
        const cur = merged.boards.some((b) => b.id === now.currentBoardId) ? now.currentBoardId : merged.boards[0]?.id;
        useData.setState({ ...merged, currentBoardId: cur ?? '' });
        rescheduleAll(merged.items);
      }
      return result(true, `Synced with ${auth.email}`);
    }
    return result(false, 'Your data kept changing during sync. Try again.');
  } catch (e) {
    if (e instanceof DriveError) return result(false, `Google Drive refused the sync (${e.status}). Try again later.`);
    return result(false, 'Sync failed, check the internet connection. Your data is safe on this device.');
  }
}

const nextZ = (items: Item[]): number => items.reduce((m, i) => Math.max(m, i.z), 1) + 1;

export const useData = create<DataState>((set, get) => ({
  status: 'loading',
  saveFailed: false,
  boards: [],
  items: [],
  threads: [],
  tombstones: [],
  currentBoardId: '',
  lastSync: null,

  load: async () => {
    set({ status: 'loading' });
    try {
      let snap = await repo.loadAll();
      if (snap.boards.length === 0) {
        const seed = seedData();
        await repo.upsertBoard(seed.board);
        await repo.upsertItems(seed.items);
        for (const t of seed.threads) await repo.upsertThread(t);
        snap = await repo.loadAll();
      }
      const cur = snap.boards.some((b) => b.id === snap.currentBoardId) ? snap.currentBoardId : snap.boards[0]?.id;
      set({
        status: 'ready',
        boards: snap.boards,
        items: snap.items,
        threads: snap.threads,
        tombstones: snap.tombstones,
        currentBoardId: cur ?? '',
      });
    } catch {
      set({ status: 'error' });
    }
  },

  resetAll: async () => {
    set({ status: 'loading' });
    try {
      await repo.resetAll();
      cancelAllReminders();
      await get().load();
    } catch {
      set({ status: 'error' });
    }
  },

  importBackup: async (data) => {
    try {
      await repo.replaceAll(data.boards, data.items, data.threads, data.tombstones);
    } catch {
      return false;
    }
    rescheduleAll(data.items);
    await get().load();
    return true;
  },

  dismissSaveError: () => set({ saveFailed: false }),

  syncDrive: (interactive) => {
    syncing ??= runSync(interactive)
      .then((r) => {
        // A background sync with no account connected says nothing; keep the last real outcome.
        if (r.ok || r.message) set({ lastSync: r });
        return r;
      })
      .finally(() => {
        syncing = null;
      });
    return syncing;
  },

  addItem: (draft) => {
    const item: Item = {
      ...draft,
      id: uid(),
      boardId: get().currentBoardId,
      tags: [],
      processed: false,
      createdAt: Date.now(),
      remindAt: null,
      z: nextZ(get().items),
      updatedAt: Date.now(),
    };
    set((s) => ({ items: [...s.items, item] }));
    persist(repo.upsertItem(item));
    return item;
  },

  updateItem: (id, patch) => {
    let next: Item | undefined;
    set((s) => ({
      items: s.items.map((i) => {
        if (i.id !== id) return i;
        next = { ...i, ...patch, updatedAt: Date.now() };
        return next;
      }),
    }));
    if (!next) return;
    persist(repo.upsertItem(next));
    // The notification shows the title, so keep a pending one in sync.
    if (patch.title !== undefined && next.remindAt && next.remindAt > Date.now()) {
      void scheduleReminder(id, next.title, next.remindAt);
    }
  },

  setReminder: async (id, at) => {
    const it = get().items.find((i) => i.id === id);
    if (!it) return true;
    const next: Item = { ...it, remindAt: at, updatedAt: Date.now() };
    set((s) => ({ items: s.items.map((i) => (i.id === id ? next : i)) }));
    persist(repo.upsertItem(next));
    if (at == null) {
      cancelReminder(id);
      return true;
    }
    return scheduleReminder(id, next.title, at);
  },

  placeItem: (id, x, y) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, x, y } : i)) })),

  commitItem: (id) => {
    const it = get().items.find((i) => i.id === id);
    if (!it) return;
    const next = { ...it, updatedAt: Date.now() };
    set((s) => ({ items: s.items.map((i) => (i.id === id ? next : i)) }));
    persist(repo.upsertItem(next));
  },

  bringToFront: (id) => {
    const z = nextZ(get().items);
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, z } : i)) }));
  },

  deleteItem: (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return null;
    const removed: Removed = {
      boards: [],
      items: [item],
      threads: get().threads.filter((t) => t.fromId === id || t.toId === id),
    };
    const now = Date.now();
    bury([
      { kind: 'item', id, deletedAt: now },
      ...get()
        .threads.filter((t) => t.fromId === id || t.toId === id)
        .map((t) => threadGone(t, now)),
    ]);
    set((s) => ({
      items: s.items.filter((i) => i.id !== id),
      threads: s.threads.filter((t) => t.fromId !== id && t.toId !== id),
    }));
    persist(repo.deleteItem(id));
    cancelReminder(id);
    return removed;
  },

  /** Threads only live within one board, so moving an item cuts its threads. */
  moveItemToBoard: (id, boardId) => {
    const it = get().items.find((i) => i.id === id);
    if (!it || it.boardId === boardId || !get().boards.some((b) => b.id === boardId)) return;
    const now = Date.now();
    const moved: Item = { ...it, boardId, x: 60 + Math.random() * 320, y: 60 + Math.random() * 320, updatedAt: now };
    bury(
      get()
        .threads.filter((t) => t.fromId === id || t.toId === id)
        .map((t) => threadGone(t, now)),
    );
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? moved : i)),
      threads: s.threads.filter((t) => t.fromId !== id && t.toId !== id),
    }));
    persist(repo.deleteThreadsOf(id).then(() => repo.upsertItem(moved)));
  },

  arrangeBoard: () => {
    const cur = get().currentBoardId;
    let n = 0;
    const items = get().items.map((i) => {
      if (i.boardId !== cur) return i;
      const k = n++;
      return { ...i, x: 40 + (k % 3) * 230, y: 40 + Math.floor(k / 3) * 210, updatedAt: Date.now() };
    });
    set({ items });
    persist(repo.upsertItems(items.filter((i) => i.boardId === cur)));
  },

  connect: (fromId, toId) => {
    if (fromId === toId) return false;
    const exists = get().threads.some(
      (t) => (t.fromId === fromId && t.toId === toId) || (t.fromId === toId && t.toId === fromId),
    );
    if (exists) return false;
    const t: Thread = { fromId, toId, label: '', color: threadColors[0].value, updatedAt: Date.now() };
    set((s) => ({ threads: [...s.threads, t] }));
    persist(repo.upsertThread(t));
    return true;
  },

  updateThread: (fromId, toId, patch) => {
    let next: Thread | undefined;
    set((s) => ({
      threads: s.threads.map((t) => {
        if (t.fromId !== fromId || t.toId !== toId) return t;
        next = { ...t, ...patch, updatedAt: Date.now() };
        return next;
      }),
    }));
    if (next) persist(repo.upsertThread(next));
  },

  cutThread: (fromId, toId) => {
    const thread = get().threads.find((t) => t.fromId === fromId && t.toId === toId);
    if (!thread) return null;
    bury([{ kind: 'thread', id: threadKey(fromId, toId), deletedAt: Date.now() }]);
    set((s) => ({ threads: s.threads.filter((t) => t !== thread) }));
    persist(repo.deleteThread(fromId, toId));
    return { boards: [], items: [], threads: [thread] };
  },

  createBoard: (name) => {
    const now = Date.now();
    const b: Board = { id: uid(), name: name.trim(), usedAt: now, createdAt: now, updatedAt: now };
    set((s) => ({ boards: [...s.boards, b] }));
    persist(repo.upsertBoard(b));
    get().selectBoard(b.id);
    return b.id;
  },

  renameBoard: (id, name) => {
    const clean = name.trim();
    if (!clean) return;
    let next: Board | undefined;
    set((s) => ({
      boards: s.boards.map((b) => {
        if (b.id !== id) return b;
        next = { ...b, name: clean, updatedAt: Date.now() };
        return next;
      }),
    }));
    if (next) persist(repo.upsertBoard(next));
  },

  deleteBoard: (id) => {
    const { boards, items, threads, currentBoardId } = get();
    const board = boards.find((b) => b.id === id);
    if (!board || boards.length < 2) return null;
    const gone = new Set(items.filter((i) => i.boardId === id).map((i) => i.id));
    const removed: Removed = {
      boards: [board],
      items: items.filter((i) => gone.has(i.id)),
      threads: threads.filter((t) => gone.has(t.fromId) || gone.has(t.toId)),
    };
    const rest = boards.filter((b) => b.id !== id);
    const cur = currentBoardId === id ? (rest[0]?.id ?? '') : currentBoardId;
    const now = Date.now();
    bury([
      { kind: 'board', id, deletedAt: now },
      ...[...gone].map((i): Tombstone => ({ kind: 'item', id: i, deletedAt: now })),
      ...get()
        .threads.filter((t) => gone.has(t.fromId) || gone.has(t.toId))
        .map((t) => threadGone(t, now)),
    ]);
    set((s) => ({
      boards: rest,
      items: s.items.filter((i) => i.boardId !== id),
      threads: s.threads.filter((t) => !gone.has(t.fromId) && !gone.has(t.toId)),
      currentBoardId: cur,
    }));
    persist(repo.deleteBoard(id).then(() => repo.saveSetting('currentBoard', cur)));
    gone.forEach(cancelReminder);
    return removed;
  },

  restore: (removed) => {
    const now = Date.now();
    const back = restorable(get(), removed, now);
    set((s) => ({
      boards: [...s.boards, ...back.boards],
      items: [...s.items, ...back.items],
      threads: [...s.threads, ...back.threads],
    }));
    persist(
      (async () => {
        for (const b of back.boards) await repo.upsertBoard(b);
        await repo.upsertItems(back.items);
        for (const t of back.threads) await repo.upsertThread(t);
      })(),
    );
    for (const i of back.items) if (i.remindAt && i.remindAt > now) void scheduleReminder(i.id, i.title, i.remindAt);
  },

  selectBoard: (id) => {
    const usedAt = Date.now();
    let next: Board | undefined;
    set((s) => ({
      currentBoardId: id,
      boards: s.boards.map((b) => {
        if (b.id !== id) return b;
        next = { ...b, usedAt };
        return next;
      }),
    }));
    if (next) persist(repo.upsertBoard(next));
    persist(repo.saveSetting('currentBoard', id));
  },
}));

/* ---------- selectors ---------- */

export const boardItems = (s: DataState): Item[] => s.items.filter((i) => i.boardId === s.currentBoardId);
export const currentBoard = (s: DataState): Board | undefined => s.boards.find((b) => b.id === s.currentBoardId);
export const outgoing = (s: DataState, id: string): Thread[] => s.threads.filter((t) => t.fromId === id);
export const incoming = (s: DataState, id: string): Thread[] => s.threads.filter((t) => t.toId === id);
export const findThread = (s: DataState, a: string, b: string): Thread | undefined =>
  s.threads.find((t) => (t.fromId === a && t.toId === b) || (t.fromId === b && t.toId === a));
