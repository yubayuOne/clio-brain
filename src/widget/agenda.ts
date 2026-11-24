import type { Item } from '@/types';

export interface AgendaEntry {
  id: string;
  title: string;
  at: number;
}

export interface Agenda {
  /** The soonest upcoming reminder, on any day. */
  next: AgendaEntry | null;
  /** Upcoming reminders today after `next`, soonest first. */
  later: AgendaEntry[];
  /** Upcoming reminders left today, including `next` when it is today. */
  today: number;
}

const sameDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString();

/** What the home screen widget shows: only reminders still ahead of `now`. */
export function agendaOf(items: Pick<Item, 'id' | 'title' | 'remindAt'>[], now: number): Agenda {
  const upcoming = items
    .filter((i): i is typeof i & { remindAt: number } => i.remindAt != null && i.remindAt > now)
    .map((i) => ({ id: i.id, title: i.title, at: i.remindAt }))
    .sort((a, b) => a.at - b.at);
  const todays = upcoming.filter((e) => sameDay(e.at, now));
  const next = upcoming[0] ?? null;
  return { next, later: todays.filter((e) => e !== next), today: todays.length };
}
