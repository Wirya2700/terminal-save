import { getDatabase } from '../Database'
import type { CommandHistoryEntry, SaveCommandHistoryInput, LoadHistoryInput } from '@shared/types'

export class CommandHistoryRepository {
  private db = getDatabase()

  save(input: SaveCommandHistoryInput): void {
    const stmt = this.db.prepare(`
      INSERT INTO command_history (document_id, command, cwd, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `)
    stmt.run(input.document_id, input.command, input.cwd)
  }

  load(input: LoadHistoryInput): CommandHistoryEntry[] {
    const stmt = this.db.prepare(`
      SELECT h.*
      FROM command_history h
      INNER JOIN (
        SELECT MAX(id) AS id
        FROM command_history
        WHERE document_id = ?
        GROUP BY command
      ) latest ON h.id = latest.id
      WHERE h.document_id = ?
      ORDER BY h.id DESC
      LIMIT ? OFFSET ?
    `)
    return stmt.all(
      input.document_id,
      input.document_id,
      input.limit,
      input.offset,
    ) as CommandHistoryEntry[]
  }

  findByDocumentId(documentId: number): CommandHistoryEntry[] {
    const stmt = this.db.prepare(`
      SELECT * FROM command_history
      WHERE document_id = ?
      ORDER BY id DESC
    `)
    return stmt.all(documentId) as CommandHistoryEntry[]
  }
}
