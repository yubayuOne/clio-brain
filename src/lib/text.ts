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

/** A list line: "1. ", "- " or a checklist "- [ ] " / "- [x] ", with optional indent. */
const LIST_MARK = /^(\s*)(?:(\d+)\.|-) (?:\[[ xX]\] )?/;
const CHECK_MARK = /^(\s*)- \[([ xX])\] /;

/**
 * Called when a multiline field changes. If the change was Enter on a list line, returns the
 * text with the next marker ("2. ", "- ", "- [ ] ") added and where the cursor goes; Enter on an
 * empty item removes its marker and ends the list. Returns null for every other change.
 */
export function continueList(prev: string, next: string): { text: string; cursor: number } | null {
  if (next.length !== prev.length + 1) return null;
  let i = 0;
  while (i < prev.length && prev[i] === next[i]) i++;
  if (next[i] !== '\n' || next.slice(i + 1) !== prev.slice(i)) return null;
  const lineStart = prev.lastIndexOf('\n', i - 1) + 1;
  const line = prev.slice(lineStart, i);
  const m = LIST_MARK.exec(line);
  if (!m) return null;
  if (line.length === m[0].length) return { text: prev.slice(0, lineStart) + prev.slice(i), cursor: lineStart };
  const indent = m[1] ?? '';
  const marker = m[2] ? `${indent}${Number(m[2]) + 1}. ` : CHECK_MARK.test(line) ? `${indent}- [ ] ` : `${indent}- `;
  return { text: next.slice(0, i + 1) + marker + next.slice(i + 1), cursor: i + 1 + marker.length };
}

export interface BodyLine {
  text: string;
  /** null for plain text, otherwise whether the checklist box is ticked. */
  checked: boolean | null;
}

export function bodyLines(body: string): BodyLine[] {
  return body.split('\n').map((l) => {
    const m = CHECK_MARK.exec(l);
    return m ? { text: l.slice(m[0].length), checked: m[2] !== ' ' } : { text: l, checked: null };
  });
}

/** Ticks or unticks the checklist box on line `index`. */
export function toggleCheck(body: string, index: number): string {
  return body
    .split('\n')
    .map((l, n) =>
      n === index ? l.replace(CHECK_MARK, (_, s: string, c: string) => `${s}- [${c === ' ' ? 'x' : ' '}] `) : l,
    )
    .join('\n');
}

/** Turns the line holding `cursor` into a checklist item, or back into plain text. */
export function toggleChecklistLine(body: string, cursor: number): string {
  const start = body.lastIndexOf('\n', cursor - 1) + 1;
  const line = body.slice(start).split('\n')[0] ?? '';
  const m = CHECK_MARK.exec(line);
  const next = m ? (m[1] ?? '') + line.slice(m[0].length) : `- [ ] ${line}`;
  return body.slice(0, start) + next + body.slice(start + line.length);
}

/** Body text for compact previews (cards, list rows): checklist markers become boxes. */
export const displayBody = (body: string): string =>
  body.replace(/^(\s*)- \[ \] /gm, '$1☐ ').replace(/^(\s*)- \[[xX]\] /gm, '$1☑ ');
