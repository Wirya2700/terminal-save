import { ipcMain } from 'electron'
import { PtyManager } from '../terminal/PtyManager'
import { cwdTracker } from '../terminal/CwdTracker'
import { flushAllCwd, persistCwd, scheduleCwdPersist } from '../terminal/CwdPersistence'
import { ShellDetector } from '../terminal/ShellDetector'

function docId(value: unknown): number {
  return Number(value)
}

export function registerTerminalHandlers(): void {
  ipcMain.handle('terminal:create', async (_event, data) => {
    const { documentId, shell: shellPath, cwd } = data
    PtyManager.create(docId(documentId), shellPath, cwd)
    return { ok: true }
  })

  ipcMain.handle('terminal:attach', (_event, data) => {
    PtyManager.attachXterm(docId(data.documentId))
    return { ok: true }
  })

  ipcMain.handle('terminal:detach', (_event, data) => {
    const id = docId(data.documentId)
    persistCwd(id)
    PtyManager.detachXterm(id)
    return { ok: true }
  })

  ipcMain.handle('terminal:has', (_event, documentId) => {
    return PtyManager.has(docId(documentId))
  })

  ipcMain.handle('terminal:resize', (_event, data) => {
    PtyManager.resize(docId(data.documentId), data.cols, data.rows)
    return { ok: true }
  })

  ipcMain.handle('terminal:kill', (_event, documentId) => {
    const id = docId(documentId)
    persistCwd(id)
    PtyManager.kill(id)
    return { ok: true }
  })

  ipcMain.handle('terminal:setCwd', (_event, data: { documentId: number; path: string }) => {
    const id = docId(data.documentId)
    cwdTracker.setCwd(id, data.path)
    scheduleCwdPersist(id, data.path)
    return { ok: true }
  })

  ipcMain.handle('terminal:getCwd', (_event, documentId: number) => {
    return { cwd: PtyManager.getCwd(docId(documentId)) }
  })

  ipcMain.handle('terminal:flushCwd', (_event, documentId: number) => {
    persistCwd(docId(documentId))
    return { ok: true }
  })

  ipcMain.handle('terminal:shellDetect', async () => {
    return ShellDetector.detect()
  })

  ipcMain.handle('term:write', (_event, data: { documentId: number; data: string }) => {
    const ok = PtyManager.writeToPty(docId(data.documentId), data.data)
    return { ok }
  })
}

export { flushAllCwd }
