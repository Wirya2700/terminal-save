import { ipcMain } from 'electron'
import { CommandHistoryRepository } from '../database/repositories/CommandHistoryRepository'

export function registerHistoryHandlers(): void {
  ipcMain.handle('history:save', (_event, input) => {
    new CommandHistoryRepository().save({
      ...input,
      document_id: Number(input.document_id),
    })
    return true
  })

  ipcMain.handle('history:load', (_event, input) => {
    return new CommandHistoryRepository().load({
      ...input,
      document_id: Number(input.document_id),
    })
  })

  ipcMain.handle('history:findByDocumentId', (_event, documentId) => {
    return new CommandHistoryRepository().findByDocumentId(Number(documentId))
  })
}
