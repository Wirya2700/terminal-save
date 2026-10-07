export interface Document {
  id: number
  name: string
  shell: string
  cwd: string
  sort_order: number
  created_at: string
  updated_at: string
  last_opened_at: string | null
}

export interface Note {
  id: number
  document_id: number
  content: string
  updated_at: string
}

export interface CommandHistoryEntry {
  id: number
  document_id: number
  command: string
  cwd: string | null
  created_at: string
}

export type Layout = 'standard' | 'focus-terminal' | 'terminal-and-notes'

export interface Settings {
  layout: Layout
  showDocumentList: boolean
  showNotes: boolean
  lastOpenedDocumentId: number | null
  openTabIds: number[]
}

export interface CreateDocumentInput {
  name: string
  shell: string
  cwd: string
}

export interface UpdateDocumentInput {
  id: number
  name?: string
  cwd?: string
}

export interface UpdateNoteInput {
  document_id: number
  content: string
}

export interface SaveCommandHistoryInput {
  document_id: number
  command: string
  cwd: string | null
}

export interface LoadHistoryInput {
  document_id: number
  limit: number
  offset: number
}
