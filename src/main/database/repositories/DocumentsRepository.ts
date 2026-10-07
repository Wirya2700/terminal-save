import { getDatabase } from '../Database'
import type { Document, CreateDocumentInput, UpdateDocumentInput } from '@shared/types'

function mapDocument(row: Record<string, unknown>): Document {
  return {
    id: Number(row.id),
    name: String(row.name),
    shell: String(row.shell),
    cwd: String(row.cwd),
    sort_order: Number(row.sort_order ?? row.id ?? 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    last_opened_at: row.last_opened_at ? String(row.last_opened_at) : null,
  }
}

export class DocumentsRepository {
  private db = getDatabase()

  create(input: CreateDocumentInput): Document {
    const now = new Date().toISOString()
    const maxOrder = this.db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM documents').get() as {
      max_order: number
    }
    const sortOrder = Number(maxOrder.max_order) + 1

    const stmt = this.db.prepare(`
      INSERT INTO documents (name, shell, cwd, sort_order, created_at, updated_at, last_opened_at)
      VALUES (?, ?, ?, ?, ?, ?, NULL)
    `)
    const result = stmt.run(input.name, input.shell, input.cwd, sortOrder, now, now)
    return this.findById(Number(result.lastInsertRowid))!
  }

  findAll(): Document[] {
    const stmt = this.db.prepare('SELECT * FROM documents ORDER BY sort_order ASC, id ASC')
    return (stmt.all() as Record<string, unknown>[]).map(mapDocument)
  }

  findById(id: number): Document | undefined {
    const stmt = this.db.prepare('SELECT * FROM documents WHERE id = ?')
    const row = stmt.get(Number(id)) as Record<string, unknown> | undefined
    return row ? mapDocument(row) : undefined
  }

  update(input: UpdateDocumentInput): Document | undefined {
    const existing = this.findById(input.id)
    if (!existing) return undefined

    const fields: string[] = []
    const values: unknown[] = []

    if (input.name !== undefined) {
      fields.push('name = ?')
      values.push(input.name)
    }
    if (input.cwd !== undefined) {
      fields.push('cwd = ?')
      values.push(input.cwd)
    }
    fields.push("updated_at = datetime('now')")
    values.push(Number(input.id))

    this.db.prepare(`UPDATE documents SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return this.findById(input.id)
  }

  reorder(ids: number[]): void {
    const txn = this.db.transaction((orderedIds: number[]) => {
      const stmt = this.db.prepare('UPDATE documents SET sort_order = ? WHERE id = ?')
      orderedIds.forEach((id, index) => {
        stmt.run(index, Number(id))
      })
    })
    txn(ids.map(Number))
  }

  updateLastOpened(id: number): void {
    this.db.prepare("UPDATE documents SET last_opened_at = datetime('now') WHERE id = ?").run(Number(id))
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM documents WHERE id = ?')
    const result = stmt.run(Number(id))
    return result.changes > 0
  }
}
