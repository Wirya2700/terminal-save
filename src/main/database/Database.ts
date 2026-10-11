import Database from 'better-sqlite3'
import { join } from 'path'
import { readdirSync, readFileSync, existsSync } from 'fs'
import { app } from 'electron'

let db: Database.Database | null = null

export function getDbPath(): string {
  return join(app.getPath('userData'), 'terminal-save.db')
}

export async function openDatabase(): Promise<Database.Database> {
  if (db) return db

  const dbPath = getDbPath()
  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  await runMigrations()

  return db
}

export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

async function runMigrations(): Promise<void> {
  const srcMigrationsDir = join(__dirname, '../../src/main/database/migrations')
  const migrationsDir =
    !app.isPackaged && existsSync(srcMigrationsDir)
      ? srcMigrationsDir
      : join(__dirname, 'migrations')
  const files = readdirSync(migrationsDir)
  const migrationFiles = files.filter((f: string) => f.endsWith('.sql')).sort()

  await db!.transaction(() => {
    db!.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)

    for (const file of migrationFiles) {
      const exists = db!.prepare('SELECT 1 FROM schema_migrations WHERE name = ?').get(file)
      if (exists) continue

      const sqlContent = readFileSync(join(migrationsDir, file), 'utf-8')
      db!.exec(sqlContent)
      db!.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(file)
    }
  })()
}
