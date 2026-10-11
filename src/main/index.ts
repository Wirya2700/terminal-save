import { app, BrowserWindow, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { openDatabase, closeDatabase } from './database/Database'
import { registerDocumentHandlers } from './ipc/documents'
import { registerNotesHandlers } from './ipc/notes'
import { registerHistoryHandlers } from './ipc/history'
import { registerSettingsHandlers } from './ipc/settings'
import { registerTerminalHandlers, flushAllCwd } from './ipc/terminal'
import { registerDbHandlers } from './ipc/db'
import { registerDialogHandlers } from './ipc/dialog'

function getAppIcon(): Electron.NativeImage | undefined {
  const candidates = [
    join(__dirname, 'icon.ico'),
    join(__dirname, 'icon.png'),
    join(__dirname, '../../resources/icon.ico'),
    join(__dirname, '../../resources/icon.png'),
    join(process.resourcesPath, 'icon.ico'),
    join(process.resourcesPath, 'icon.png'),
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      const img = nativeImage.createFromPath(candidate)
      if (!img.isEmpty()) {
        return img
      }
    }
  }
  return undefined
}

function createWindow(): BrowserWindow {
  const icon = getAppIcon()

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    frame: true,
    backgroundColor: '#F7F8FA',
    ...(icon ? { icon } : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: join(__dirname, '..', 'preload', 'index.js'),
    },
  })

  win.setMenu(null)
  win.setMenuBarVisibility(false)

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(join(__dirname, '..', 'renderer', 'index.html'))
  }

  return win
}

app.whenReady().then(async () => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.terminal-save.app')
  }
  Menu.setApplicationMenu(null)

  try {
    await openDatabase()
    registerDocumentHandlers()
    registerNotesHandlers()
    registerHistoryHandlers()
    registerSettingsHandlers()
    registerTerminalHandlers()
    registerDbHandlers()
    registerDialogHandlers()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  } catch (err) {
    console.error('Failed to initialize database:', err)
    createWindow()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  flushAllCwd()
})

app.on('quit', () => {
  closeDatabase()
})
