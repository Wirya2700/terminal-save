import { ipcMain } from 'electron'
import { SettingsRepository } from '../database/repositories/SettingsRepository'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:load', () => {
    return new SettingsRepository().load()
  })

  ipcMain.handle('settings:save', (_event, partial) => {
    new SettingsRepository().save(partial)
    return true
  })
}
