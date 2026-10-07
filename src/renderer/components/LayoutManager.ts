import type { Layout } from '@shared/types'
import { scheduleRefit } from './TerminalView'

const main = document.getElementById('main')!
const documentList = document.getElementById('document-list')!
const terminalArea = document.getElementById('terminal-area')!
const notesPanel = document.getElementById('notes-panel')!

export interface LayoutVisibility {
  showDocumentList: boolean
  showNotes: boolean
}

export function resolveLayoutVisibility(
  layout: Layout,
  showDocumentList: boolean,
  showNotes: boolean,
): LayoutVisibility {
  switch (layout) {
    case 'focus-terminal':
      return { showDocumentList: false, showNotes: false }
    case 'terminal-and-notes':
      return { showDocumentList: false, showNotes }
    case 'standard':
    default:
      return { showDocumentList, showNotes }
  }
}

export function applyLayout(layout: Layout, showDocList: boolean, showNotes: boolean): void {
  const visibility = resolveLayoutVisibility(layout, showDocList, showNotes)

  documentList.classList.toggle('hidden', !visibility.showDocumentList)
  notesPanel.classList.toggle('hidden', !visibility.showNotes)
  terminalArea.classList.remove('hidden')
  main.dataset.layout = layout

  scheduleRefit()
}
