import type { Document } from '@shared/types'
import { icons } from './icons'
import { showContextMenu } from './ContextMenu'
import { escapeHtml } from '../utils/html'

export interface TerminalTabsCallbacks {
  onSelect?: (doc: Document) => void | Promise<void>
  onClose?: (doc: Document) => void | Promise<void>
  onNew?: () => void | Promise<void>
  onRename?: (doc: Document) => void | Promise<void>
  onSave?: (doc: Document) => void | Promise<void>
  onSaveAs?: (doc: Document) => void | Promise<void>
}

let callbacks: TerminalTabsCallbacks = {}

function getContainer(): HTMLElement {
  const el = document.getElementById('terminal-tabs')
  if (!el) throw new Error('#terminal-tabs not found')
  return el
}

export function initTerminalTabs(cbs: TerminalTabsCallbacks = {}): void {
  callbacks = cbs
  getContainer().className = 'terminal-tabs'
}

export function renderTerminalTabs(docs: Document[], activeId: number | null): void {
  const container = getContainer()
  container.innerHTML = ''

  const tabList = document.createElement('div')
  tabList.className = 'terminal-tab-list'

  for (const doc of docs) {
    const tab = document.createElement('div')
    tab.className = 'terminal-tab' + (doc.id === activeId ? ' active' : '')
    tab.dataset.id = String(doc.id)

    tab.innerHTML = `
      <span class="terminal-tab-icon">${icons.terminal}</span>
      <span class="terminal-tab-name">${escapeHtml(doc.name)}</span>
      <button type="button" class="terminal-tab-close" title="Close tab">${icons.close}</button>
    `

    const closeBtn = tab.querySelector('.terminal-tab-close') as HTMLButtonElement | null
    closeBtn?.addEventListener('mousedown', (e) => {
      e.preventDefault()
      e.stopPropagation()
    })
    closeBtn?.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      void callbacks.onClose?.(doc)
    })

    tab.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.terminal-tab-close')) return
      void callbacks.onSelect?.(doc)
    })

    tab.querySelector('.terminal-tab-name')?.addEventListener('dblclick', (e) => {
      e.preventDefault()
      e.stopPropagation()
      void callbacks.onRename?.(doc)
    })

    tab.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      showContextMenu(e.clientX, e.clientY, [
        { label: 'Open', onClick: () => callbacks.onSelect?.(doc) },
        { label: 'Rename', onClick: () => callbacks.onRename?.(doc) },
        { label: 'Save', onClick: () => callbacks.onSave?.(doc) },
        { label: 'Save As...', onClick: () => callbacks.onSaveAs?.(doc) },
        { label: 'Close Tab', onClick: () => callbacks.onClose?.(doc) },
      ])
    })

    tabList.appendChild(tab)
  }

  container.appendChild(tabList)

  const newTab = document.createElement('button')
  newTab.type = 'button'
  newTab.className = 'terminal-tab-new'
  newTab.title = 'New document'
  newTab.innerHTML = icons.plus
  newTab.addEventListener('click', () => { void callbacks.onNew?.() })
  container.appendChild(newTab)

  if (activeId !== null) {
    const activeTab = tabList.querySelector(`[data-id="${activeId}"]`)
    activeTab?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
  }
}
