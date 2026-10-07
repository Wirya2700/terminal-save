export const DB_NAME = 'terminal-save.db'

export const LAYOUTS = {
  STANDARD: 'standard',
  FOCUS_TERMINAL: 'focus-terminal',
  TERMINAL_AND_NOTES: 'terminal-and-notes',
} as const

export const DEFAULT_LAYOUT = LAYOUTS.STANDARD

export const HISTORY_LIMIT = 100
export const HISTORY_OFFSET = 0
