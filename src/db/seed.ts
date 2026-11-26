import type { Board, Item, Thread } from '@/types';

/** Sample content shown on first launch, clearly marked "Example" so it reads as a demo. */
export function seedData(now = Date.now()): { board: Board; items: Item[]; threads: Thread[] } {
  // updatedAt 0: two fresh devices share these ids, so a sync merges their samples into one.
  const board: Board = { id: 'b0', name: 'General', usedAt: now, createdAt: now, updatedAt: 0 };
  const base = {
    boardId: board.id,
    url: '',
    fileName: '',
    fileUri: '',
    tags: ['example'],
    processed: true,
    remindAt: null,
    updatedAt: 0,
  };
  const items: Item[] = [
    {
      ...base,
      id: 's1',
      type: 'note',
      title: 'Example: link-saving app idea',
      body: 'This is an example note. MVP focus: capture fast, connect, search.',
      createdAt: now - 3e5,
      x: 50,
      y: 70,
      z: 2,
    },
    {
      ...base,
      id: 's2',
      type: 'link',
      title: 'Example: reference page',
      body: 'Example link card. Add your own link from the edit screen.',
      url: '',
      createdAt: now - 2e5,
      x: 330,
      y: 150,
      z: 3,
    },
    {
      ...base,
      id: 's3',
      type: 'file',
      title: 'Example: cost sheet file',
      body: 'Example file. Pick a real file when adding a new item.',
      fileName: 'prices.pdf',
      tags: [],
      processed: false,
      createdAt: now - 1e5,
      x: 90,
      y: 300,
      z: 4,
    },
  ];
  const threads: Thread[] = [
    { fromId: 's1', toId: 's2', label: 'reference', color: '#E8584D', updatedAt: 0 },
    { fromId: 's3', toId: 's1', label: 'source', color: '#E8584D', updatedAt: 0 },
  ];
  return { board, items, threads };
}
