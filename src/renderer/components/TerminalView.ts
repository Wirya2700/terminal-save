import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import type { IDisposable } from '@xterm/xterm'
import { parseOsc9Cwd } from '@shared/constants/osc'
import {
  getCommandHistoryController,
  removeCommandHistoryController,
} from '../terminal/CommandHistoryController'
import '@xterm/xterm/css/xterm.css'

export interface TerminalInstance {
  term: Terminal
  fitAddon: FitAddon
  element: HTMLElement
  documentId: number
  destroy(): void
}

const instances = new Map<number, TerminalInstance>()
let hostResizeObserver: ResizeObserver | null = null
let focusSetup = false
let visibleId: number | null = null
let cwdChangeHandler: ((documentId: number, cwd: string) => void) | null = null

export function setCwdChangeHandler(
  handler: ((documentId: number, cwd: string) => void) | null,
): void {
  cwdChangeHandler = handler
}

function getHost(): HTMLElement {
  const host = document.getElementById('terminal-container')
  if (!host) throw new Error('#terminal-container not found')
  return host
}

function clearEmptyState(): void {
  const host = getHost()
  host.querySelector('.terminal-empty')?.remove()
  host.querySelector('.terminal-error')?.remove()
}

function ensureHostObserver(): void {
  if (hostResizeObserver) return
  hostResizeObserver = new ResizeObserver(() => {
    if (visibleId !== null) refitTerminal(visibleId)
  })
  hostResizeObserver.observe(getHost())
}

function setupGlobalFocus(): void {
  if (focusSetup) return
  focusSetup = true

  document.getElementById('terminal-area')?.addEventListener('mousedown', (e) => {
    if ((e.target as HTMLElement).closest('#notes-panel')) return
    if (visibleId !== null) focusTerminal(visibleId)
  })
}

function setupKeyboardHandlers(term: Terminal, documentId: number): void {
  const history = getCommandHistoryController(documentId)

  term.attachCustomKeyEventHandler((event: KeyboardEvent) => {
    if (event.type !== 'keydown') return true

    const mod = event.ctrlKey || event.metaKey

    if (mod && (event.key === 'v' || event.key === 'V')) {
      event.preventDefault()
      void navigator.clipboard.readText().then((text) => {
        if (text) term.paste(text)
      })
      return false
    }

    if (mod && (event.key === 'c' || event.key === 'C') && term.hasSelection()) {
      event.preventDefault()
      void navigator.clipboard.writeText(term.getSelection())
      return false
    }

    if (event.key === 'ArrowUp' && !mod && !event.altKey && !event.shiftKey) {
      if (history.handleArrowUp()) {
        event.preventDefault()
        return false
      }
    }

    if (event.key === 'ArrowDown' && !mod && !event.altKey && !event.shiftKey) {
      if (history.handleArrowDown()) {
        event.preventDefault()
        return false
      }
    }

    return true
  })
}

export function getOrCreateTerminal(documentId: number): TerminalInstance {
  const existing = instances.get(documentId)
  if (existing) return existing

  clearEmptyState()
  ensureHostObserver()
  setupGlobalFocus()

  const history = getCommandHistoryController(documentId)
  void history.ensureHistory()

  const host = getHost()
  const pane = document.createElement('div')
  pane.className = 'terminal-pane'
  pane.dataset.documentId = String(documentId)
  pane.style.display = 'none'
  host.appendChild(pane)

  const term = new Terminal({
    cursorBlink: true,
    fontFamily: "'Cascadia Code', 'Consolas', 'Courier New', monospace",
    fontSize: 14,
    lineHeight: 1.3,
    scrollback: 5000,
    // Windows console uses ANSI white/bright white as the default text color.
    // On a light background those slots must be dark, or input like "dotnet" disappears.
    minimumContrastRatio: 4.5,
    theme: {
      background: '#FFFFFF',
      foreground: '#1F2937',
      cursor: '#2563EB',
      selectionBackground: '#BFDBFE',
      black: '#1F2937',
      red: '#DC2626',
      green: '#16A34A',
      yellow: '#CA8A04',
      blue: '#2563EB',
      magenta: '#9333EA',
      cyan: '#0891B2',
      white: '#1F2937',
      brightBlack: '#64748B',
      brightRed: '#EF4444',
      brightGreen: '#22C55E',
      brightYellow: '#EAB308',
      brightBlue: '#3B82F6',
      brightMagenta: '#A855F7',
      brightCyan: '#06B6D4',
      brightWhite: '#1F2937',
    },
    allowProposedApi: true,
  })

  const fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  term.open(pane)

  setupKeyboardHandlers(term, documentId)

  pane.addEventListener('mousedown', () => {
    term.focus()
  })

  const cwdDisposable: IDisposable = term.parser.registerOscHandler(9, (data: string): boolean => {
    const cwd = parseOsc9Cwd(data)
    if (cwd) {
      history.onPromptReady()
      void window.terminalSave.terminal.setCwd(documentId, cwd).then(() => {
        cwdChangeHandler?.(documentId, cwd)
      })
    }
    return true
  })

  const cleanupData = window.terminalSave.termBridge.onTerminalData((payload) => {
    if (payload.documentId === documentId) {
      term.write(payload.data)
    }
  })

  term.onData((data: string) => {
    history.handleInput(data)
    window.terminalSave.termBridge.sendToTerminal(documentId, data)
  })

  const instance: TerminalInstance = {
    term,
    fitAddon,
    element: pane,
    documentId,
    destroy: () => {
      cwdDisposable.dispose()
      cleanupData.dispose()
      term.dispose()
      pane.remove()
      instances.delete(documentId)
      removeCommandHistoryController(documentId)
      if (visibleId === documentId) visibleId = null
    },
  }

  instances.set(documentId, instance)
  return instance
}

export function hideAllTerminals(): void {
  for (const inst of instances.values()) {
    inst.element.style.display = 'none'
  }
  visibleId = null
}

export function showTerminal(documentId: number): void {
  clearEmptyState()
  for (const [id, inst] of instances) {
    inst.element.style.display = id === documentId ? 'block' : 'none'
  }
  visibleId = documentId
  void getCommandHistoryController(documentId).ensureHistory()
  scheduleRefit(documentId)
}

export function destroyTerminal(documentId: number): void {
  instances.get(documentId)?.destroy()
}

export function resetTerminalSession(documentId: number): void {
  destroyTerminal(documentId)
  getCommandHistoryController(documentId).invalidateHistory()
}

export function focusTerminal(documentId: number): void {
  instances.get(documentId)?.term.focus()
}

export function refitTerminal(documentId: number): void {
  const instance = instances.get(documentId)
  if (!instance || instance.element.style.display === 'none') return

  const { fitAddon, element, term } = instance
  if (element.clientWidth === 0 || element.clientHeight === 0) return

  fitAddon.fit()
  const dims = fitAddon.proposeDimensions()
  if (dims && dims.cols > 0 && dims.rows > 0) {
    void window.terminalSave.terminal.resize(documentId, dims.cols, dims.rows)
  }
}

export function scheduleRefit(documentId?: number): void {
  requestAnimationFrame(() => {
    if (documentId !== undefined) {
      refitTerminal(documentId)
      focusTerminal(documentId)
    } else {
      refitAllTerminals()
    }
  })
}

export function refitAllTerminals(): void {
  if (visibleId !== null) refitTerminal(visibleId)
}

export function getTerminalInstance(documentId: number): TerminalInstance | undefined {
  return instances.get(documentId)
}

export function getAllTerminals(): TerminalInstance[] {
  return Array.from(instances.values())
}

/** @deprecated use getOrCreateTerminal + showTerminal */
export function createTerminal(documentId: number, _containerId?: string): TerminalInstance {
  const inst = getOrCreateTerminal(documentId)
  showTerminal(documentId)
  return inst
}
