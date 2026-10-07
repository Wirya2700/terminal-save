import type { Document, Note, CommandHistoryEntry, Settings } from '@shared/types'

type Listener = () => void

export class AppStore {
  private documents: Document[] = []
  private notes: Map<number, Note> = new Map()
  private history: Map<number, CommandHistoryEntry[]> = new Map()
  private settings: Settings = {
    layout: 'standard',
    showDocumentList: true,
    showNotes: true,
    lastOpenedDocumentId: null,
    openTabIds: [],
  }
  private activeDocumentId: number | null = null
  private listeners: Set<Listener> = new Set()

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }

  // Documents
  getDocuments(): Document[] { return this.documents }
  setActiveDocument(id: number | null): void {
    this.activeDocumentId = id
    this.notify()
  }
  getActiveDocumentId(): number | null { return this.activeDocumentId }

  // Notes
  setNotes(docId: number, note: Note): void {
    this.notes.set(docId, note)
    this.notify()
  }
  getNote(docId: number): Note | undefined { return this.notes.get(docId) }

  // History
  setHistory(docId: number, entries: CommandHistoryEntry[]): void {
    this.history.set(docId, entries)
    this.notify()
  }
  getHistory(docId: number): CommandHistoryEntry[] { return this.history.get(docId) ?? [] }

  // Settings
  getSettings(): Settings { return this.settings }
  setSettings(partial: Partial<Settings>): void {
    this.settings = { ...this.settings, ...partial }
    this.notify()
  }

  // Bulk setters
  setDocuments(docs: Document[]): void {
    this.documents = docs
    this.notify()
  }

  getState(): {
    documents: Document[]
    activeDocumentId: number | null
    notes: Map<number, Note>
    history: Map<number, CommandHistoryEntry[]>
    settings: Settings
  } {
    return {
      documents: this.documents,
      activeDocumentId: this.activeDocumentId,
      notes: this.notes,
      history: this.history,
      settings: this.settings,
    }
  }
}

export const store = new AppStore()
