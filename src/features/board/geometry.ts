import { cardWidth } from '@/theme/tokens';
import type { Item, Thread } from '@/types';

/** Half-size of the oversized layer that holds the cards (see Canvas.tsx). */
export const WORLD = 10000;

export interface Segment {
  thread: Thread;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Threads attach to the pin's centre, on the middle of each card's top edge. */
export function anchorOf(it: Item): { x: number; y: number } {
  return { x: it.x + cardWidth[it.type] / 2, y: it.y };
}

export function segmentsFor(items: Item[], threads: Thread[]): Segment[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const out: Segment[] = [];
  for (const t of threads) {
    const a = byId.get(t.fromId);
    const b = byId.get(t.toId);
    if (!a || !b) continue;
    const p = anchorOf(a);
    const q = anchorOf(b);
    out.push({ thread: t, x1: p.x, y1: p.y, x2: q.x, y2: q.y });
  }
  return out;
}

/** Label tilt follows the thread but stays readable: never upside down, at most 20 degrees. */
export function labelAngle(s: Segment): number {
  let a = (Math.atan2(s.y2 - s.y1, s.x2 - s.x1) * 180) / Math.PI;
  if (a > 90) a -= 180;
  if (a < -90) a += 180;
  return Math.max(-20, Math.min(20, a));
}
