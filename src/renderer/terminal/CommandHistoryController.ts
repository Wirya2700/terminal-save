import type { CommandHistoryEntry } from '@shared/types'
import { HISTORY_LIMIT, HISTORY_OFFSET } from '@shared/constants'

const INTERACTIVE_COMMANDS = new Set([
  'vim', 'nvim', 'vi', 'ssh', 'python', 'python3', 'node', 'mysql', 'psql',
  'redis-cli', 'nano', 'htop', 'less', 'more', 'dotnet', 'npm',
])

/**
 * History navigation (Arrow Up/Down) only replaces input when the local buffer is empty.
 * If the user has typed text, keys pass through to PowerShell unchanged.
 */
export class CommandHistoryController {
  private inputBuffer = ''
  private suspended = false
  /** -1 = live input; 0 = newest saved command; higher = older */
  private recallIndex = -1
  private cachedHistory: CommandHistoryEntry[] = []
  private historyLoaded = false

  constructor(private readonly documentId: number) {}

  onPromptReady(): void {
    this.suspended = false
  }

  reset(): void {
    this.inputBuffer = ''
    this.recallIndex = -1
    this.suspended = false
  }

  invalidateHistory(): void {
    this.cachedHistory = []
    this.historyLoaded = false
    this.inputBuffer = ''
    this.recallIndex = -1
    this.suspended = false
  }

  async ensureHistory(): Promise<void> {
    if (this.historyLoaded) return
    this.cachedHistory = await window.terminalSave.history.load({
      document_id: this.documentId,
      limit: HISTORY_LIMIT,
      offset: HISTORY_OFFSET,
    })
    this.historyLoaded = true
  }

  handleInput(data: string): void {
    if (this.suspended) return

    if (data === '\r' || data === '\n') {
      void this.commitCommand()
      return
    }

    if (data === '\x03') {
      this.inputBuffer = ''
      this.recallIndex = -1
      return
    }

    if (data === '\x7f' || data === '\b') {
      this.inputBuffer = this.inputBuffer.slice(0, -1)
      this.recallIndex = -1
      return
    }

    if (data.startsWith('\x1b')) return

    if (data.length > 0 && !data.includes('\x1b')) {
      this.inputBuffer += data
      this.recallIndex = -1
    }
  }

  private async commitCommand(): Promise<void> {
    const command = this.inputBuffer.trim()
    this.inputBuffer = ''
    this.recallIndex = -1

    if (!command) return

    if (isInteractiveCommand(command)) {
      this.suspended = true
    }

    const cwd = await window.terminalSave.terminal.getCwd(this.documentId)

    await window.terminalSave.history.save({
      document_id: this.documentId,
      command,
      cwd: cwd || null,
    })

    this.cachedHistory = await window.terminalSave.history.load({
      document_id: this.documentId,
      limit: HISTORY_LIMIT,
      offset: HISTORY_OFFSET,
    })
    this.historyLoaded = true
  }

  canNavigateHistory(): boolean {
    if (this.suspended) return false
    // Allow continued browsing while a recalled command is shown
    if (this.recallIndex >= 0) return true
    return this.inputBuffer.length === 0
  }

  handleArrowUp(): boolean {
    if (!this.canNavigateHistory()) return false
    if (this.cachedHistory.length === 0) return false

    const nextIndex = this.recallIndex + 1
    if (nextIndex >= this.cachedHistory.length) return false

    this.recallIndex = nextIndex
    this.recallIntoPrompt(this.cachedHistory[this.recallIndex].command)
    return true
  }

  handleArrowDown(): boolean {
    if (this.recallIndex < 0) return false

    if (this.recallIndex === 0) {
      this.recallIndex = -1
      this.recallIntoPrompt('')
      return true
    }

    this.recallIndex -= 1
    this.recallIntoPrompt(this.cachedHistory[this.recallIndex].command)
    return true
  }

  private recallIntoPrompt(command: string): void {
    const previous = this.inputBuffer
    if (previous.length > 0) {
      // Backspace works without PSReadLine; Ctrl+U (\x15) echoes as ^U with -NoProfile
      window.terminalSave.termBridge.sendToTerminal(this.documentId, '\b'.repeat(previous.length))
    }
    if (command.length > 0) {
      window.terminalSave.termBridge.sendToTerminal(this.documentId, command)
    }
    this.inputBuffer = command
  }
}

function isInteractiveCommand(command: string): boolean {
  const first = command.trim().split(/\s+/)[0]?.toLowerCase() ?? ''
  return INTERACTIVE_COMMANDS.has(first)
}

const controllers = new Map<number, CommandHistoryController>()

export function getCommandHistoryController(documentId: number): CommandHistoryController {
  let controller = controllers.get(documentId)
  if (!controller) {
    controller = new CommandHistoryController(documentId)
    controllers.set(documentId, controller)
  }
  return controller
}

export function removeCommandHistoryController(documentId: number): void {
  controllers.delete(documentId)
}
