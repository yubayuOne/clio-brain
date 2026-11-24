export type ItemType = 'note' | 'link' | 'file';

export interface Board {
  id: string;
  name: string;
  /** Last time the board was opened, used for the "recent" list. */
  usedAt: number;
  createdAt: number;
}

export interface Item {
  id: string;
  boardId: string;
  type: ItemType;
  title: string;
  body: string;
  url: string;
  fileName: string;
  /** Copy of the picked file inside the app's document directory. */
  fileUri: string;
  tags: string[];
  /** false means the item still sits in the Inbox. */
  processed: boolean;
  createdAt: number;
  /** When to fire the reminder notification (epoch ms); null means no reminder. */
  remindAt: number | null;
  x: number;
  y: number;
  z: number;
}

/** A directed connection between two items on the same board. */
export interface Thread {
  fromId: string;
  toId: string;
  label: string;
  color: string;
}

export interface Viewport {
  x: number;
  y: number;
  k: number;
}
