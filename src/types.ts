export type ItemType = 'note' | 'link' | 'file';

export interface Board {
  id: string;
  name: string;
  /** Last time the board was opened, used for the "recent" list. */
  usedAt: number;
  createdAt: number;
  /** Last change (epoch ms); newer wins when two devices sync. */
  updatedAt: number;
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
  updatedAt: number;
}

/** A directed connection between two items on the same board. */
export interface Thread {
  fromId: string;
  toId: string;
  label: string;
  color: string;
  updatedAt: number;
}

/** Record of a deletion, so a sync does not bring the deleted record back from another device. */
export interface Tombstone {
  kind: 'board' | 'item' | 'thread';
  /** Board or item id; for threads the item pair, see threadKey. */
  id: string;
  deletedAt: number;
}

export interface Viewport {
  x: number;
  y: number;
  k: number;
}
