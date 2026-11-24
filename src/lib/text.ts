import type { ItemType } from '@/types';

export const KIND_LABEL: Record<ItemType, string> = { note: 'Note', link: 'Link', file: 'File' };

export const uid = (): string => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

export const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

export function hostOf(url: string): string {
  const m = /^[a-z]+:\/\/([^/?#]+)/i.exec(url.trim());
  return m?.[1] ?? url;
}

export function normalizeUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** "a, #B , a" -> ["a", "b"] */
export function parseTags(raw: string): string[] {
  const tags = raw
    .split(',')
    .map((t) => t.trim().replace(/^#/, '').toLowerCase())
    .filter(Boolean);
  return [...new Set(tags)];
}

export function cleanTitle(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim() || '(untitled)';
}

export function fileExt(name: string): string {
  return name.includes('.') ? (name.split('.').pop() ?? '').slice(0, 4).toUpperCase() : 'FILE';
}

function hash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return h;
}

/** Stable tilt between -2.5 and 2.4 degrees, so a card keeps its angle across renders. */
export const tiltOf = (id: string): number => (Math.abs(hash(id)) % 50) / 10 - 2.5;

export const byName = (a: { name: string }, b: { name: string }): number =>
  a.name.localeCompare(b.name, 'en', { numeric: true, sensitivity: 'base' });

/** "Tue 26 Nov, 09:00" for reminders. */
export function formatWhen(ms: number): string {
  return `${formatDay(ms)}, ${formatTime(ms)}`;
}

export function formatDay(ms: number): string {
  return new Date(ms).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
