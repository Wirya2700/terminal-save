/// <reference types="vite/client" />

declare module '@xterm/xterm/css/xterm.css'

import type { Document, Note, CommandHistoryEntry, Settings } from '@shared/types'

interface TerminalSaveAPI {
  documents: {
    create(input: { name: string; shell: string; cwd: string }): Promise<Document>
    findAll(): Promise<Document[]>
    findById(id: number): Promise<Document | undefined>
    update(input: { id: number; name?: string; cwd?: string }): Promise<Document | undefined>
    updateLastOpened(id: number): Promise<boolean>
    delete(id: number): Promise<boolean>
    reorder(ids: number[]): Promise<boolean>
  }
  dialog: {
    pickDirectory(options?: { defaultPath?: string }): Promise<string | null>
  }
  notes: {
    findByDocumentId(documentId: number): Promise<Note | undefined>
    upsert(input: { document_id: number; content: string }): Promise<Note | null>
  }
  history: {
    save(input: { document_id: number; command: string; cwd: string | null }): Promise<boolean>
    load(input: { document_id: number; limit: number; offset: number }): Promise<CommandHistoryEntry[]>
    findByDocumentId(documentId: number): Promise<CommandHistoryEntry[]>
  }
  settings: {
    load(): Promise<Settings>
    save(partial: Partial<Settings>): Promise<boolean>
  }
  terminal: {
    create(documentId: number, shell: string, cwd: string): Promise<void>
    attachXterm(documentId: number): Promise<void>
    detach(documentId: number): Promise<void>
    has(documentId: number): Promise<boolean>
    resize(documentId: number, cols: number, rows: number): Promise<void>
    kill(documentId: number): Promise<void>
    setCwd(documentId: number, path: string): Promise<void>
    getCwd(documentId: number): Promise<string>
    flushCwd(documentId: number): Promise<void>
    shellDetect(): Promise<{ shell: string; version: string }>
  }
  termBridge: {
    sendToTerminal(documentId: number, data: string): void
    onTerminalData(callback: (payload: { documentId: number; data: string }) => void): { dispose(): void }
  }
  db: {
    getDbPath(): Promise<string>
    getCwd(): Promise<string>
  }
}

declare global {
  interface Window {
    terminalSave: TerminalSaveAPI
  }
}

export {}
