import { contextBridge, ipcRenderer } from 'electron'
import type { Document, Note, CommandHistoryEntry, Settings } from '../shared/types'

type IPCInvoke = (channel: string, ...args: unknown[]) => Promise<unknown>
const invoke: IPCInvoke = ipcRenderer.invoke.bind(ipcRenderer)

const api = {
  documents: {
    create: (input: { name: string; shell: string; cwd: string }) =>
      invoke('documents:create', input) as Promise<Document>,
    findAll: () => invoke('documents:findAll') as Promise<Document[]>,
    findById: (id: number) => invoke('documents:findById', id) as Promise<Document | undefined>,
    update: (input: { id: number; name?: string; cwd?: string }) =>
      invoke('documents:update', input) as Promise<Document | undefined>,
    updateLastOpened: (id: number) => invoke('documents:updateLastOpened', id) as Promise<boolean>,
    delete: (id: number) => invoke('documents:delete', id) as Promise<boolean>,
    reorder: (ids: number[]) => invoke('documents:reorder', ids) as Promise<boolean>,
  },
  dialog: {
    pickDirectory: (options?: { defaultPath?: string }) =>
      invoke('dialog:pickDirectory', options) as Promise<string | null>,
  },
  notes: {
    findByDocumentId: (documentId: number) =>
      invoke('notes:findByDocumentId', documentId) as Promise<Note | undefined>,
    upsert: (input: { document_id: number; content: string }) =>
      invoke('notes:upsert', input) as Promise<Note | null>,
  },
  history: {
    save: (input: { document_id: number; command: string; cwd: string | null }) =>
      invoke('history:save', input) as Promise<boolean>,
    load: (input: { document_id: number; limit: number; offset: number }) =>
      invoke('history:load', input) as Promise<CommandHistoryEntry[]>,
    findByDocumentId: (documentId: number) =>
      invoke('history:findByDocumentId', documentId) as Promise<CommandHistoryEntry[]>,
  },
  settings: {
    load: () => invoke('settings:load') as Promise<Settings>,
    save: (partial: Partial<Settings>) => invoke('settings:save', partial) as Promise<boolean>,
  },
  terminal: {
    create: (documentId: number, shell: string, cwd: string) =>
      invoke('terminal:create', { documentId, shell, cwd }) as Promise<void>,
    attachXterm: (documentId: number) =>
      invoke('terminal:attach', { documentId }) as Promise<void>,
    detach: (documentId: number) =>
      invoke('terminal:detach', { documentId }) as Promise<void>,
    has: (documentId: number) =>
      invoke('terminal:has', documentId) as Promise<boolean>,
    resize: (documentId: number, cols: number, rows: number) =>
      invoke('terminal:resize', { documentId, cols, rows }) as Promise<void>,
    kill: (documentId: number) => invoke('terminal:kill', documentId) as Promise<void>,
    setCwd: (documentId: number, path: string) =>
      invoke('terminal:setCwd', { documentId, path }) as Promise<void>,
    getCwd: async (documentId: number) => {
      const result = await invoke('terminal:getCwd', documentId) as { cwd: string }
      return result.cwd
    },
    flushCwd: (documentId: number) =>
      invoke('terminal:flushCwd', documentId) as Promise<void>,
    shellDetect: () => invoke('terminal:shellDetect') as Promise<{ shell: string; version: string }>,
  },
  termBridge: {
    sendToTerminal: (documentId: number, data: string) => {
      void ipcRenderer.invoke('term:write', { documentId, data })
    },
    onTerminalData: (callback: (payload: { documentId: number; data: string }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: { documentId: number; data: string }) => {
        callback(payload)
      }
      ipcRenderer.on('term:data-from-pty', handler)
      return {
        dispose: () => {
          ipcRenderer.removeListener('term:data-from-pty', handler)
        },
      }
    },
  },
  db: {
    getDbPath: () => invoke('db:getPath') as Promise<string>,
    getCwd: () => invoke('app:getCwd') as Promise<string>,
  },
}

contextBridge.exposeInMainWorld('terminalSave', api)
