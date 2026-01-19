import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'vendor_ledger.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await initializeDatabase(db);
  }
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon_uri TEXT,
      default_price REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      customer_id INTEGER,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
      note TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      total_owed REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON transactions(product_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
  `);
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

export async function resetDatabase(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM transactions;
    DELETE FROM products;
    DELETE FROM customers;
  `);
}
