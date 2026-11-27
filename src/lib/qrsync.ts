import { strFromU8, strToU8, unzlibSync, zlibSync } from 'fflate';

/**
 * Sync by QR: the backup JSON is compressed, base64-encoded and split into numbered frames,
 * one QR code each, shown in a loop on the sending phone. The receiver collects frames in any
 * order until it has them all. Frame text: "CB1:<session>:<n>/<total>:<base64 chunk>".
 */
const FRAME = /^CB1:([a-z0-9]{1,8}):(\d{1,4})\/(\d{1,4}):([A-Za-z0-9+/=]+)$/;
/** Base64 characters per frame: keeps each code small enough to read quickly off a screen. */
const CHUNK = 600;
/** Rejects absurd frame counts from foreign codes before allocating anything. */
const MAX_FRAMES = 2000;

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

const fromBase64 = (b64: string): Uint8Array => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export function toFrames(json: string, session = Math.random().toString(36).slice(2, 7)): string[] {
  const b64 = toBase64(zlibSync(strToU8(json), { level: 9 }));
  const total = Math.max(1, Math.ceil(b64.length / CHUNK));
  return Array.from(
    { length: total },
    (_, i) => `CB1:${session}:${i + 1}/${total}:${b64.slice(i * CHUNK, (i + 1) * CHUNK)}`,
  );
}

/** Gathers scanned frames of one session; a frame from a new session starts over. */
export class FrameCollector {
  private session = '';
  private parts = new Map<number, string>();
  total = 0;

  get received(): number {
    return this.parts.size;
  }

  /** True when the frame was new and accepted; false for duplicates and foreign codes. */
  add(text: string): boolean {
    const m = FRAME.exec(text.trim());
    if (!m) return false;
    const [, session = '', n, t, chunk = ''] = m;
    const index = Number(n);
    const total = Number(t);
    if (total < 1 || total > MAX_FRAMES || index < 1 || index > total) return false;
    if (session !== this.session || total !== this.total) {
      this.session = session;
      this.total = total;
      this.parts = new Map();
    }
    if (this.parts.has(index)) return false;
    this.parts.set(index, chunk);
    return true;
  }

  get complete(): boolean {
    return this.total > 0 && this.parts.size === this.total;
  }

  /** The original JSON once complete, or null if incomplete or corrupt. */
  result(): string | null {
    if (!this.complete) return null;
    try {
      const b64 = Array.from({ length: this.total }, (_, i) => this.parts.get(i + 1) ?? '').join('');
      return strFromU8(unzlibSync(fromBase64(b64)));
    } catch {
      return null;
    }
  }
}
