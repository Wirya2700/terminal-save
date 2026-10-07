import type { IPty } from 'node-pty'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { cwdTracker } from './CwdTracker'
import { buildPowerShellInitCommand, isPowerShell } from './PowerShellInit'
import { BrowserWindow } from 'electron'

interface TermInfo {
  pty: IPty
  ready: boolean
  buffer: string[]
}

const termMap = new Map<number, TermInfo>()

function getMainWindow(): BrowserWindow | null {
  return BrowserWindow.getAllWindows()[0] ?? null
}

function sendToRenderer(documentId: number, data: string): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send('term:data-from-pty', { documentId, data })
  }
}

function resolveCwd(cwd: string): string {
  if (cwd && existsSync(cwd)) return cwd
  return homedir()
}

function shellArgs(shell: string): string[] {
  if (isPowerShell(shell)) {
    return ['-NoLogo', '-NoProfile', '-NoExit', '-Command', buildPowerShellInitCommand()]
  }
  return []
}

export class PtyManager {
  static has(documentId: number): boolean {
    return termMap.has(documentId)
  }

  static create(documentId: number, shell: string, cwd: string): void {
    if (termMap.has(documentId)) return

    const { spawn } = require('node-pty') as {
      spawn: (shell: string, args: string[], options: Record<string, unknown>) => IPty
    }

    const effectiveCwd = resolveCwd(cwd)
    const args = shellArgs(shell)

    const pty = spawn(shell, args, {
      name: 'xterm-color',
      cwd: effectiveCwd,
      cols: 120,
      rows: 30,
      env: process.env as Record<string, string>,
    })

    cwdTracker.setCwd(documentId, effectiveCwd)

    const info: TermInfo = {
      pty,
      ready: false,
      buffer: [],
    }
    termMap.set(documentId, info)

    pty.onData((data: string) => {
      if (!info.ready) {
        info.buffer.push(data)
        return
      }
      sendToRenderer(documentId, data)
    })

    pty.onExit(({ exitCode }: { exitCode: number }) => {
      console.error(`PTY exited with code ${exitCode} (document ${documentId})`)
      if (info.ready) {
        sendToRenderer(documentId, `\r\n\x1b[31m[Shell exited with code ${exitCode}]\x1b[0m\r\n`)
      }
      termMap.delete(documentId)
      cwdTracker.remove(documentId)
    })
  }

  static attachXterm(documentId: number): void {
    const info = termMap.get(documentId)
    if (!info) throw new Error(`No PTY found for document ${documentId}`)

    info.ready = true

    if (info.buffer.length > 0) {
      const combined = info.buffer.join('')
      info.buffer = []
      sendToRenderer(documentId, combined)
    }
  }

  static detachXterm(documentId: number): void {
    const info = termMap.get(documentId)
    if (info) info.ready = false
  }

  static writeToPty(documentId: number, data: string): boolean {
    const info = termMap.get(documentId)
    if (!info) {
      console.error(`writeToPty: no PTY for document ${documentId}`)
      return false
    }
    try {
      info.pty.write(data)
      return true
    } catch (err) {
      console.error(`writeToPty failed for document ${documentId}:`, err)
      return false
    }
  }

  static resize(documentId: number, cols: number, rows: number): void {
    const info = termMap.get(documentId)
    if (!info) return
    if (cols > 0 && rows > 0) {
      info.pty.resize(cols, rows)
    }
  }

  static kill(documentId: number): void {
    const info = termMap.get(documentId)
    if (!info) return
    try {
      info.pty.kill()
    } catch {
      // ignore
    }
    termMap.delete(documentId)
    cwdTracker.remove(documentId)
  }

  static getCwd(documentId: number): string {
    return cwdTracker.getCwd(documentId)
  }

  static getTermCount(): number {
    return termMap.size
  }
}
