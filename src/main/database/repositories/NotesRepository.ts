import { getDatabase } from '../Database'
import type { Note, UpdateNoteInput } from '@shared/types'

export class NotesRepository {
  private db = getDatabase()

  findByDocumentId(documentId: number): Note | undefined {
    const stmt = this.db.prepare('SELECT * FROM notes WHERE document_id = ?')
    return stmt.get(documentId) as Note | undefined
  }

  upsert(input: UpdateNoteInput): Note | null {
    const documentExists = this.db
      .prepare('SELECT 1 FROM documents WHERE id = ?')
      .get(input.document_id)
    if (!documentExists) return null

    const now = new Date().toISOString()
    this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO notes (document_id, content, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(document_id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at
      `).run(input.document_id, input.content, now)
    })()
    return this.findByDocumentId(input.document_id) ?? null
  }
}
