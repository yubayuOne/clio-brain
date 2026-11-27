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

/** Note bodies are HTML from the rich editor. Bodies written before 1.3 are plain text. */
export const isHtml = (body: string): boolean => body.trimStart().startsWith('<html>');

const escapeHtml = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Old plain-text list markers: "- [ ] ", "- [x] ", "1. ", "- ". */
const LEGACY_LINE = /^\s*(?:- \[([ xX])\] |(\d+)\. |- )(.*)$/;

/** Converts an old plain-text body to editor HTML, turning its markers into real lists. */
export function plainToHtml(body: string): string {
  const out: string[] = [];
  let open = '';
  const close = () => {
    if (open) out.push(open === 'ol' ? '</ol>' : '</ul>');
    open = '';
  };
  for (const line of body.split('\n')) {
    const m = LEGACY_LINE.exec(line);
    const kind = !m ? '' : m[1] !== undefined ? 'check' : m[2] !== undefined ? 'ol' : 'ul';
    if (kind !== open) {
      close();
      if (kind) out.push(kind === 'check' ? '<ul data-type="checkbox">' : `<${kind}>`);
      open = kind;
    }
    if (m && kind) out.push(`<li${kind === 'check' && m[1] !== ' ' ? ' checked' : ''}>${escapeHtml(m[3] ?? '')}</li>`);
    else out.push(line.trim() ? `<p>${escapeHtml(line)}</p>` : '<br>');
  }
  close();
  return `<html>\n${out.join('\n')}\n</html>`;
}

export const toHtml = (body: string): string => (isHtml(body) ? body : plainToHtml(body));

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

/**
 * Plain text of a body for compact previews (cards, list rows, search): list items get
 * "• ", "1. ", "☐ " or "☑ ". shortcut: a regex tokenizer that only knows the editor's own
 * output; use a real HTML parser if bodies ever come from elsewhere.
 */
export function htmlToText(body: string): string {
  if (!isHtml(body)) return body;
  const lists: { kind: 'ul' | 'ol' | 'check'; n: number }[] = [];
  let out = '';
  for (const m of body.matchAll(/<(\/?)([a-z0-9]+)([^>]*)>|([^<]+)/gi)) {
    const [, end, rawTag, attrs = '', text] = m;
    if (text !== undefined) {
      out += text.replace(/\n/g, '').replace(/&(#?\w+);/g, (e, k: string) => ENTITIES[k] ?? e);
      continue;
    }
    const tag = rawTag?.toLowerCase();
    if (tag === 'ul' || tag === 'ol') {
      if (end) lists.pop();
      else lists.push({ kind: tag === 'ol' ? 'ol' : /data-type="checkbox"/.test(attrs) ? 'check' : 'ul', n: 0 });
    } else if (tag === 'li' && !end) {
      const l = lists[lists.length - 1];
      out += !l || l.kind === 'ul' ? '• ' : l.kind === 'ol' ? `${++l.n}. ` : /\bchecked\b/.test(attrs) ? '☑ ' : '☐ ';
    } else if ((end && (tag === 'li' || tag === 'p' || /^h[1-6]$/.test(tag ?? ''))) || tag === 'br') {
      out += '\n';
    }
  }
  return out.replace(/\n{3,}/g, '\n\n').trim();
}
