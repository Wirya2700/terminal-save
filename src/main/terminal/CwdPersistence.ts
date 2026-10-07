import { DocumentsRepository } from '../database/repositories/DocumentsRepository'
import { cwdTracker } from './CwdTracker'

const debounceTimers = new Map<number, ReturnType<typeof setTimeout>>()
const DEBOUNCE_MS = 400

export function scheduleCwdPersist(documentId: number, cwd: string): void {
  const existing = debounceTimers.get(documentId)
  if (existing) clearTimeout(existing)

  debounceTimers.set(documentId, setTimeout(() => {
    debounceTimers.delete(documentId)
    persistCwd(documentId, cwd)
  }, DEBOUNCE_MS))
}

export function persistCwd(documentId: number, cwd?: string): void {
  const pending = debounceTimers.get(documentId)
  if (pending) {
    clearTimeout(pending)
    debounceTimers.delete(documentId)
  }

  const path = cwd ?? cwdTracker.getCwd(documentId)
  if (!path) return

  new DocumentsRepository().update({ id: documentId, cwd: path })
}

export function flushAllCwd(): void {
  for (const [documentId, cwd] of cwdTracker.entries()) {
    persistCwd(documentId, cwd)
  }
}
