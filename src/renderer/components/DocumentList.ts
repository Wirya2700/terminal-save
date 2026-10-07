import type { Document } from '@shared/types'
import { icons } from './icons'
import { showContextMenu } from './ContextMenu'
import { escapeHtml } from '../utils/html'

export interface DocumentListCallbacks {
  onSelect?: (doc: Document) => void | Promise<void>
  onRename?: (doc: Document) => void | Promise<void>
  onSave?: (doc: Document) => void | Promise<void>
  onSaveAs?: (doc: Document) => void | Promise<void>
  onDelete?: (doc: Document) => void | Promise<void>
  onReorder?: (orderedIds: number[]) => void | Promise<void>
}

let callbacks: DocumentListCallbacks = {}
let dragDocId: number | null = null

function getContainer(): HTMLElement {
  const el = document.getElementById('document-list')
  if (!el) throw new Error('#document-list not found')
  return el
}

export function initDocumentList(cbs: DocumentListCallbacks = {}): void {
  callbacks = cbs
  const container = getContainer()
  container.id = 'document-list'
  container.className = 'panel document-panel'
}

export function renderDocumentList(docs: Document[], activeId: number | null): void {
  const container = getContainer()
  container.innerHTML = ''

  const header = document.createElement('div')
  header.className = 'panel-header'
  header.innerHTML = `<span class="panel-header-title">Documents</span>`
  container.appendChild(header)

  const list = document.createElement('div')
  list.className = 'document-list'

  if (docs.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'document-empty'
    empty.innerHTML = `
      <span class="empty-icon">${icons.terminal}</span>
      <p class="empty-title">No documents yet</p>
      <p class="empty-hint">Create your first terminal workspace with <kbd>New</kbd> in the toolbar or <kbd>Ctrl+N</kbd>.</p>
    `
    list.appendChild(empty)
  }

  for (const doc of docs) {
    const item = document.createElement('div')
    item.className = 'document-item' + (doc.id === activeId ? ' active' : '')
    item.dataset.id = String(doc.id)
    item.draggable = true

    item.innerHTML = `
      <span class="document-item-drag" title="Drag to reorder">${icons.grip}</span>
      <span class="document-item-icon">${icons.terminal}</span>
      <div class="document-item-body">
        <span class="document-item-name">${escapeHtml(doc.name)}</span>
        <span class="document-item-path">${escapeHtml(doc.cwd)}</span>
      </div>
      <button type="button" class="document-item-menu" title="More">${icons.more}</button>
    `
    item.title = doc.cwd

    const openMenu = (x: number, y: number): void => {
      showContextMenu(x, y, [
        { label: 'Open', onClick: () => callbacks.onSelect?.(doc) },
        { label: 'Rename', onClick: () => callbacks.onRename?.(doc) },
        { label: 'Save', onClick: () => callbacks.onSave?.(doc) },
        { label: 'Save As...', onClick: () => callbacks.onSaveAs?.(doc) },
        { label: 'Delete', danger: true, onClick: () => callbacks.onDelete?.(doc) },
      ])
    }

    item.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.closest('.document-item-menu') || target.closest('.document-item-drag')) return
      void callbacks.onSelect?.(doc)
    })

    item.querySelector('.document-item-name')?.addEventListener('dblclick', (e) => {
      e.preventDefault()
      e.stopPropagation()
      void callbacks.onRename?.(doc)
    })

    item.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      openMenu(e.clientX, e.clientY)
    })

    item.querySelector('.document-item-menu')?.addEventListener('click', (e) => {
      e.stopPropagation()
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      openMenu(rect.left, rect.bottom + 4)
    })

    item.addEventListener('dragstart', (e) => {
      dragDocId = doc.id
      item.classList.add('dragging')
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', String(doc.id))
      }
    })

    item.addEventListener('dragend', () => {
      dragDocId = null
      item.classList.remove('dragging')
      list.querySelectorAll('.document-item.drop-target').forEach(el => el.classList.remove('drop-target'))
    })

    item.addEventListener('dragover', (e) => {
      e.preventDefault()
      if (dragDocId === null || dragDocId === doc.id) return
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
      item.classList.add('drop-target')
    })

    item.addEventListener('dragleave', () => {
      item.classList.remove('drop-target')
    })

    item.addEventListener('drop', (e) => {
      e.preventDefault()
      item.classList.remove('drop-target')
      if (dragDocId === null || dragDocId === doc.id) return

      const orderedIds = reorderIds(docs, dragDocId, doc.id)
      dragDocId = null
      void callbacks.onReorder?.(orderedIds)
    })

    list.appendChild(item)
  }

  container.appendChild(list)
}

function reorderIds(docs: Document[], sourceId: number, targetId: number): number[] {
  const ids = docs.map(d => d.id)
  const fromIndex = ids.indexOf(sourceId)
  const toIndex = ids.indexOf(targetId)
  if (fromIndex < 0 || toIndex < 0) return ids

  ids.splice(fromIndex, 1)
  ids.splice(toIndex, 0, sourceId)
  return ids
}
