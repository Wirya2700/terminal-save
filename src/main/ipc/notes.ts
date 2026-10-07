import { ipcMain } from 'electron'
import { NotesRepository } from '../database/repositories/NotesRepository'

export function registerNotesHandlers(): void {
  ipcMain.handle('notes:findByDocumentId', (_event, documentId) => {
    return new NotesRepository().findByDocumentId(documentId)
  })

  ipcMain.handle('notes:upsert', (_event, input) => {
    return new NotesRepository().upsert(input)
  })
}
