import { ipcMain, dialog, BrowserWindow, type OpenDialogOptions } from 'electron'

export function registerDialogHandlers(): void {
  ipcMain.handle('dialog:pickDirectory', async (event, options?: { defaultPath?: string }) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getFocusedWindow()
    const dialogOptions: OpenDialogOptions = {
      properties: ['openDirectory', 'createDirectory'],
      defaultPath: options?.defaultPath,
    }
    const result = win
      ? await dialog.showOpenDialog(win, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })
}
