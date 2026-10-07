import { getDatabase } from '../Database'
import type { Settings } from '@shared/types'

const DEFAULT_SETTINGS: Settings = {
  layout: 'standard',
  showDocumentList: true,
  showNotes: true,
  lastOpenedDocumentId: null,
  openTabIds: [],
}

const LAYOUTS = new Set<Settings['layout']>(['standard', 'focus-terminal', 'terminal-and-notes'])

function decodeSetting(raw: string): unknown {
  try {
    const first = JSON.parse(raw)
    if (typeof first === 'string') {
      try {
        return JSON.parse(first)
      } catch {
        return first
      }
    }
    return first
  } catch {
    return raw
  }
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

function normalizeSettings(raw: Partial<Settings>): Settings {
  const layout = LAYOUTS.has(raw.layout as Settings['layout'])
    ? (raw.layout as Settings['layout'])
    : DEFAULT_SETTINGS.layout

  return {
    layout,
    showDocumentList: asBoolean(raw.showDocumentList, DEFAULT_SETTINGS.showDocumentList),
    showNotes: asBoolean(raw.showNotes, DEFAULT_SETTINGS.showNotes),
    lastOpenedDocumentId:
      typeof raw.lastOpenedDocumentId === 'number' ? raw.lastOpenedDocumentId : null,
    openTabIds: Array.isArray(raw.openTabIds)
      ? raw.openTabIds.map(Number).filter(id => Number.isFinite(id))
      : DEFAULT_SETTINGS.openTabIds,
  }
}

export class SettingsRepository {
  private db = getDatabase()

  load(): Settings {
    const rows = this.db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
    const result: Partial<Settings> = {}
    for (const row of rows) {
      if (row.key in DEFAULT_SETTINGS) {
        (result as Record<string, unknown>)[row.key] = decodeSetting(row.value)
      }
    }
    return normalizeSettings(result)
  }

  save(settings: Partial<Settings>): void {
    const txn = this.db.transaction((entries: [string, string][]) => {
      const stmt = this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      for (const [key, value] of entries) {
        stmt.run(key, value)
      }
    })
    txn(
      Object.entries(settings).map(
        ([key, value]) => [key, JSON.stringify(value)] as [string, string],
      ),
    )
  }
}
