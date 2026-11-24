import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { migrate } from './schema';

// Kept from the app's former name: renaming would orphan existing on-device data.
const DB_NAME = 'simpul.db';
let handle: Promise<SQLiteDatabase> | null = null;

/** Opens the database once and runs pending migrations. */
export function getDb(): Promise<SQLiteDatabase> {
  if (!handle) {
    handle = openDatabaseAsync(DB_NAME).then(async (db) => {
      await migrate(db);
      return db;
    });
    handle.catch(() => {
      handle = null;
    });
  }
  return handle;
}
