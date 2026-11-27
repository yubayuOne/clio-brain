import { create } from 'zustand';
import { canvas } from '@/theme/tokens';
import type { Viewport } from '@/types';

export type Tab = 'board' | 'list';
export type ListGroup = 'inbox' | 'type' | 'tag';

/** Exactly one overlay is open at a time; `picker` and `confirm` stack on top of it. */
export type Overlay =
  | { kind: 'preview'; id: string }
  | { kind: 'edit'; id: string }
  | { kind: 'capture' }
  | { kind: 'thread'; a: string; b: string; returnTo: string | null }
  | { kind: 'folders' }
  | { kind: 'folderForm'; focus: 'new' | 'rename' }
  | { kind: 'settings' };

/** Snackbar offered after a delete; `run` puts the deleted records back. */
export interface UndoOffer {
  message: string;
  run: () => void;
}

export interface Confirm {
  message: string;
  onConfirm: () => void;
  /** Label of the destructive button; "Delete" by default. */
  confirmLabel?: string;
}

interface UiState {
  tab: Tab;
  group: ListGroup;
  /** Drill-down inside Type or Tag: "type:note" or "tag:idea". */
  drill: string | null;
  overlay: Overlay | null;
  picker: boolean;
  /** "Move to folder" sheet over the edit form. */
  moving: boolean;
  /** Reminder date/time sheet over the edit form. */
  reminding: boolean;
  confirm: Confirm | null;
  connectMode: boolean;
  selectedId: string | null;
  hint: string | null;
  undo: UndoOffer | null;
  /** Remembered canvas view per board. */
  views: Record<string, Viewport>;
  newItemId: string | null;
  /** Size of the canvas on screen, used to drop new cards in the middle of the view. */
  canvasSize: { w: number; h: number };

  setTab: (t: Tab) => void;
  setGroup: (g: ListGroup) => void;
  setDrill: (d: string | null) => void;
  open: (o: Overlay) => void;
  close: () => void;
  setPicker: (v: boolean) => void;
  setMoving: (v: boolean) => void;
  setReminding: (v: boolean) => void;
  ask: (message: string, onConfirm: () => void, confirmLabel?: string) => void;
  dismissConfirm: () => void;
  toggleConnect: () => void;
  select: (id: string | null) => void;
  flash: (text: string) => void;
  /** Shows "<message> · Undo" for a few seconds. */
  offerUndo: (message: string, run: () => void) => void;
  dismissUndo: () => void;
  setView: (boardId: string, v: Viewport) => void;
  setNewItem: (id: string | null) => void;
}

let hintTimer: ReturnType<typeof setTimeout> | undefined;
let undoTimer: ReturnType<typeof setTimeout> | undefined;
const UNDO_FOR = 6000;

export const useUi = create<UiState>((set) => ({
  tab: 'board',
  group: 'inbox',
  drill: null,
  overlay: null,
  picker: false,
  moving: false,
  reminding: false,
  confirm: null,
  connectMode: false,
  selectedId: null,
  hint: null,
  undo: null,
  views: {},
  newItemId: null,
  canvasSize: { w: 390, h: 700 },

  setTab: (tab) => set({ tab, selectedId: null, connectMode: false }),
  setGroup: (group) => set({ group, drill: null }),
  setDrill: (drill) => set({ drill }),
  open: (overlay) => set({ overlay, picker: false, moving: false, reminding: false }),
  close: () => set({ overlay: null, picker: false, moving: false, reminding: false }),
  setPicker: (picker) => set({ picker }),
  setMoving: (moving) => set({ moving }),
  setReminding: (reminding) => set({ reminding }),
  ask: (message, onConfirm, confirmLabel) => set({ confirm: { message, onConfirm, confirmLabel } }),
  dismissConfirm: () => set({ confirm: null }),
  toggleConnect: () => set((s) => ({ connectMode: !s.connectMode, selectedId: null })),
  select: (selectedId) => set({ selectedId }),
  flash: (text) => {
    clearTimeout(hintTimer);
    set({ hint: text });
    hintTimer = setTimeout(() => set({ hint: null }), 2000);
  },
  offerUndo: (message, run) => {
    clearTimeout(undoTimer);
    set({ undo: { message, run } });
    undoTimer = setTimeout(() => set({ undo: null }), UNDO_FOR);
  },
  dismissUndo: () => {
    clearTimeout(undoTimer);
    set({ undo: null });
  },
  setView: (boardId, v) => set((s) => ({ views: { ...s.views, [boardId]: v } })),
  setNewItem: (newItemId) => set({ newItemId }),
}));

export const viewOf = (views: Record<string, Viewport>, boardId: string): Viewport => views[boardId] ?? canvas.start;
