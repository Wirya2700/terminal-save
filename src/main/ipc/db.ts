import { ipcMain } from 'electron'
import { getDbPath } from '../database/Database'

export function registerDbHandlers(): void {
  ipcMain.handle('db:getPath', () => {
    return getDbPath()
  })

  ipcMain.handle('app:getCwd', () => {
    return process.cwd()
  })
}
