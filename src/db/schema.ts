import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Ordered migrations. Index + 1 is the schema version stored in PRAGMA user_version.
 * Never edit a shipped migration: append a new one instead.
 */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    used_at INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY NOT NULL,
    board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('note', 'link', 'file')),
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '',
    file_name TEXT NOT NULL DEFAULT '',
    file_uri TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    processed INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    x REAL NOT NULL DEFAULT 0,
    y REAL NOT NULL DEFAULT 0,
    z INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS idx_items_board ON items(board_id);
  CREATE TABLE IF NOT EXISTS threads (
    from_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    to_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    label TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#E8584D',
    PRIMARY KEY (from_id, to_id)
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
  `ALTER TABLE items ADD COLUMN remind_at INTEGER;`,
];

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[v] ?? '');
      await db.execAsync(`PRAGMA user_version = ${v + 1}`);
    });
  }
}
