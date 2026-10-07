import { ipcMain } from 'electron'
import { DocumentsRepository } from '../database/repositories/DocumentsRepository'

export function registerDocumentHandlers(): void {
  ipcMain.handle('documents:create', (_event, input) => {
    return new DocumentsRepository().create(input)
  })

  ipcMain.handle('documents:findAll', () => {
    return new DocumentsRepository().findAll()
  })

  ipcMain.handle('documents:findById', (_event, id) => {
    return new DocumentsRepository().findById(id)
  })

  ipcMain.handle('documents:update', (_event, input) => {
    return new DocumentsRepository().update(input)
  })

  ipcMain.handle('documents:updateLastOpened', (_event, id) => {
    new DocumentsRepository().updateLastOpened(id)
    return true
  })

  ipcMain.handle('documents:delete', (_event, id) => {
    return new DocumentsRepository().delete(id)
  })

  ipcMain.handle('documents:reorder', (_event, ids: number[]) => {
    new DocumentsRepository().reorder(ids)
    return true
  })
}
