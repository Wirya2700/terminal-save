import { createToolbar, syncToolbarState } from './components/Toolbar'
import {
  destroyTerminal,
  focusTerminal,
  getOrCreateTerminal,
  getTerminalInstance,
  hideAllTerminals,
  resetTerminalSession,
  scheduleRefit,
  setCwdChangeHandler,
  showTerminal,
} from './components/TerminalView'
import {
  clearNotesPanel,
  detachNotesPanel,
  flushPendingSave,
  initNotesPanel,
  loadNotes,
} from './components/NotesPanel'
import { initDocumentList, renderDocumentList } from './components/DocumentList'
import { initTerminalTabs, renderTerminalTabs } from './components/TerminalTabs'
import { showRenameDialog } from './components/RenameDialog'
import { showConfirmDialog } from './components/ConfirmDialog'
import { applyLayout } from './components/LayoutManager'
import { hideAppLoading, hideTerminalLoading, showAppLoading, showTerminalLoading } from './components/LoadingOverlay'
import { showToast } from './components/Toast'
import { isEditableTarget } from './utils/keyboard'
import { escapeHtml } from './utils/html'
import { icons } from './components/icons'
import type { Document } from '@shared/types'

let docs: Document[] = []
let openTabIds: number[] = []
let activeId: number | null = null
let cachedShell: string | null = null
let switchInProgress = false

function docIdOf(doc: Document): number {
  return Number(doc.id)
}

function getOpenDocs(): Document[] {
  return docs.filter(d => openTabIds.includes(docIdOf(d)))
}

async function persistOpenTabs(): Promise<void> {
  await window.terminalSave.settings.save({ openTabIds })
}

function ensureDocInOpenTabs(docId: number): void {
  const id = Number(docId)
  if (!openTabIds.includes(id)) {
    openTabIds.push(id)
  }
}

async function init(): Promise<void> {
  showAppLoading()

  if (!window.terminalSave) {
    hideAppLoading()
    showBootstrapError('Preload failed — window.terminalSave is not available. Restart the app.')
    return
  }

  const docCallbacks = {
    onSelect: selectDocument,
    onRename: renameDocument,
    onSave: saveDocument,
    onSaveAs: saveDocumentAs,
    onDelete: deleteDocument,
    onReorder: reorderDocuments,
  }

  initDocumentList(docCallbacks)
  initTerminalTabs({
    onSelect: selectDocument,
    onClose: closeDocumentTab,
    onNew: createNewDocument,
    onRename: renameDocument,
    onSave: saveDocument,
    onSaveAs: saveDocumentAs,
  })
  initNotesPanel()

  setCwdChangeHandler((documentId, cwd) => {
    docs = docs.map(d => d.id === documentId ? { ...d, cwd } : d)
    refreshUI()
  })

  createToolbar(document.getElementById('toolbar')!, {
    onNew: createNewDocument,
    onSave: () => saveCurrentDocument(true),
    onToggleDocumentList: (visible) => toggleDocumentList(visible),
    onToggleNotes: (visible) => toggleNotes(visible),
  })

  try {
    cachedShell = (await window.terminalSave.terminal.shellDetect()).shell

    const settings = await window.terminalSave.settings.load()
    applyLayout('standard', settings.showDocumentList, settings.showNotes)
    await syncToolbarState()

    docs = await window.terminalSave.documents.findAll()

    openTabIds = settings.openTabIds
      .map(Number)
      .filter(id => docs.some(d => docIdOf(d) === id))
    if (openTabIds.length === 0 && docs.length > 0) {
      openTabIds = docs.map(d => docIdOf(d))
    }

    activeId = settings.lastOpenedDocumentId
    if (activeId && !docs.find(d => d.id === activeId)) {
      activeId = null
    }
    if (activeId && !openTabIds.includes(activeId)) {
      activeId = openTabIds[openTabIds.length - 1] ?? null
    }
    if (!activeId && openTabIds.length > 0) {
      activeId = openTabIds[openTabIds.length - 1]
    }

    refreshUI()
    await waitForLayout()

    if (activeId) {
      const doc = docs.find(d => d.id === activeId)
      if (doc) await openDocument(doc, { skipTabRegister: true })
    } else {
      showEmptyTerminal()
    }
  } catch (err) {
    console.error('[App] Startup failed:', err)
    showBootstrapError(err instanceof Error ? err.message : String(err))
  } finally {
    hideAppLoading()
  }

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (isEditableTarget(e.target)) return

    if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'n') {
      e.preventDefault()
      void createNewDocument()
    }
    if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 's') {
      e.preventDefault()
      void saveCurrentDocument(true)
    }
    if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'w') {
      e.preventDefault()
      if (activeId) {
        const doc = docs.find(d => d.id === activeId)
        if (doc) void closeDocumentTab(doc)
      }
    }
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      void window.terminalSave.settings.load().then(s => toggleDocumentList(!s.showDocumentList))
    }
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'n') {
      e.preventDefault()
      void window.terminalSave.settings.load().then(s => toggleNotes(!s.showNotes))
    }
  })
}

function refreshUI(): void {
  renderDocumentList(docs, activeId)
  renderTerminalTabs(getOpenDocs(), activeId)
}

function waitForLayout(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

async function selectDocument(doc: Document): Promise<void> {
  ensureDocInOpenTabs(doc.id)
  await persistOpenTabs()
  refreshUI()

  if (activeId === doc.id && getTerminalInstance(doc.id)) {
    showTerminal(doc.id)
    focusTerminal(doc.id)
    await loadNotes(doc.id, doc.name)
    return
  }
  await openDocument(doc)
}

async function openDocument(
  doc: Document,
  options: { skipTabRegister?: boolean } = {},
): Promise<void> {
  if (switchInProgress) return
  switchInProgress = true
  showTerminalLoading(`Opening ${doc.name}...`)

  try {
    if (!options.skipTabRegister) {
      ensureDocInOpenTabs(doc.id)
      await persistOpenTabs()
    }
    if (activeId !== null && activeId !== doc.id) {
      if (docs.some(d => d.id === activeId)) {
        await flushPendingSave()
      } else {
        detachNotesPanel()
      }
      await window.terminalSave.terminal.detach(activeId)
    }

    activeId = doc.id
    refreshUI()

    void window.terminalSave.settings.save({ lastOpenedDocumentId: doc.id })
    void window.terminalSave.documents.updateLastOpened(doc.id)

    const docId = Number(doc.id)
    const ptyExists = await window.terminalSave.terminal.has(docId)
    if (ptyExists) {
      getOrCreateTerminal(docId)
    } else {
      resetTerminalSession(docId)
      await window.terminalSave.terminal.create(docId, doc.shell, doc.cwd)
      getOrCreateTerminal(docId)
    }
    await window.terminalSave.terminal.attachXterm(docId)
    hideTerminalLoading()
    showTerminal(docId)
    await loadNotes(docId, doc.name)

    ;(document.getElementById('notes-content') as HTMLTextAreaElement | null)?.blur()
    scheduleRefit(docId)
  } catch (err) {
    console.error('[App] Failed to open document:', err)
    hideTerminalLoading()
    showTerminalError(err)
  } finally {
    switchInProgress = false
  }
}

async function createNewDocument(): Promise<void> {
  if (!cachedShell) {
    cachedShell = (await window.terminalSave.terminal.shellDetect()).shell
  }

  const doc = await window.terminalSave.documents.create({
    name: getNextDocumentName(docs),
    shell: cachedShell,
    cwd: await window.terminalSave.db.getCwd(),
  })

  docs = await window.terminalSave.documents.findAll()
  ensureDocInOpenTabs(Number(doc.id))
  await persistOpenTabs()
  await openDocument({ ...doc, id: Number(doc.id) }, { skipTabRegister: true })
}

function getNextDocumentName(existing: Document[]): string {
  const used = new Set(existing.map(d => d.name))
  let index = existing.length + 1
  while (used.has(`Document ${index}`)) index++
  return `Document ${index}`
}

async function saveCurrentDocument(showFeedback = false): Promise<void> {
  if (!activeId) {
    if (showFeedback) showToast('No document open')
    return
  }
  const doc = docs.find(d => d.id === activeId)
  if (doc) await saveDocument(doc, showFeedback)
}

async function saveDocument(doc: Document, showFeedback = false): Promise<void> {
  if (activeId === doc.id) {
    await window.terminalSave.terminal.flushCwd(doc.id)
  }

  const cwd = activeId === doc.id
    ? await window.terminalSave.terminal.getCwd(doc.id)
    : doc.cwd

  const updated = await window.terminalSave.documents.update({ id: doc.id, cwd })
  if (updated) {
    docs = docs.map(d => d.id === updated.id ? updated : d)
    refreshUI()
    if (showFeedback) showToast(`Saved "${updated.name}"`)
  } else if (showFeedback) {
    showToast('Save failed')
  }
}

async function saveDocumentAs(doc: Document): Promise<void> {
  const selected = await window.terminalSave.dialog.pickDirectory({ defaultPath: doc.cwd })
  if (!selected) return

  const updated = await window.terminalSave.documents.update({ id: doc.id, cwd: selected })
  if (!updated) {
    showToast('Save As failed')
    return
  }

  docs = docs.map(d => d.id === updated.id ? updated : d)
  refreshUI()

  if (activeId === doc.id) {
    await window.terminalSave.terminal.flushCwd(doc.id)
    await window.terminalSave.terminal.kill(doc.id)
    resetTerminalSession(doc.id)
    await window.terminalSave.terminal.create(doc.id, doc.shell, selected)
    getOrCreateTerminal(doc.id)
    await window.terminalSave.terminal.attachXterm(doc.id)
    showTerminal(doc.id)
    scheduleRefit(doc.id)
  }

  showToast(`Saved to ${selected}`)
}

async function reorderDocuments(orderedIds: number[]): Promise<void> {
  await window.terminalSave.documents.reorder(orderedIds)
  docs = await window.terminalSave.documents.findAll()
  refreshUI()
}

async function renameDocument(doc: Document): Promise<void> {
  const name = await showRenameDialog(doc.name)
  if (!name || name === doc.name) return

  const updated = await window.terminalSave.documents.update({ id: doc.id, name })
  if (updated) {
    docs = docs.map(d => d.id === updated.id ? updated : d)
    refreshUI()
    showToast(`Renamed to "${updated.name}"`)
  }
}

async function closeDocumentTab(doc: Document): Promise<void> {
  const id = docIdOf(doc)
  if (!openTabIds.includes(id)) return

  const wasActive = activeId === id
  openTabIds = openTabIds.filter(tabId => tabId !== id)
  await persistOpenTabs()
  refreshUI()

  if (wasActive) {
    await flushPendingSave()
    await window.terminalSave.terminal.detach(id)
  }

  if (await window.terminalSave.terminal.has(id)) {
    await window.terminalSave.terminal.flushCwd(id)
    await window.terminalSave.terminal.kill(id)
  }
  destroyTerminal(id)

  if (wasActive) {
    if (openTabIds.length > 0) {
      const nextId = openTabIds[openTabIds.length - 1]
      const nextDoc = docs.find(d => docIdOf(d) === nextId)
      if (nextDoc) {
        await openDocument(nextDoc, { skipTabRegister: true })
        return
      }
    }

    activeId = null
    await window.terminalSave.settings.save({ lastOpenedDocumentId: null })
    clearNotesPanel()
    hideAllTerminals()
    showEmptyTerminal()
    refreshUI()
  }
}

async function deleteDocument(doc: Document): Promise<void> {
  const confirmed = await showConfirmDialog({
    title: 'Delete document',
    message: `Delete "${doc.name}"? Command history and notes for this document will be removed.`,
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!confirmed) return

  if (activeId === doc.id) {
    detachNotesPanel()
  }

  await window.terminalSave.terminal.flushCwd(doc.id)
  await window.terminalSave.terminal.kill(doc.id)
  destroyTerminal(doc.id)
  await window.terminalSave.documents.delete(doc.id)
  docs = await window.terminalSave.documents.findAll()
  openTabIds = openTabIds.filter(id => id !== docIdOf(doc))
  await persistOpenTabs()

  if (activeId === doc.id) {
    if (openTabIds.length > 0) {
      const nextDoc = docs.find(d => d.id === openTabIds[openTabIds.length - 1])
      if (nextDoc) await openDocument(nextDoc, { skipTabRegister: true })
    } else if (docs.length > 0) {
      await selectDocument(docs[docs.length - 1])
    } else {
      activeId = null
      await window.terminalSave.settings.save({ lastOpenedDocumentId: null })
      refreshUI()
      clearNotesPanel()
      showEmptyTerminal()
    }
  } else {
    refreshUI()
  }

  showToast(`Deleted "${doc.name}"`)
}

function showEmptyTerminal(): void {
  const container = document.getElementById('terminal-container')
  if (!container) return

  hideTerminalLoading()
  container.querySelector('.terminal-empty')?.remove()
  container.querySelector('.terminal-error')?.remove()

  if (container.querySelector('.terminal-empty')) return

  container.insertAdjacentHTML('beforeend', `
    <div class="terminal-empty">
      <span class="empty-icon">${icons.terminal}</span>
      <p class="empty-title">No document open</p>
      <p class="terminal-empty-hint">Press <kbd>+ New</kbd> or <kbd>Ctrl+N</kbd> to create a terminal document.</p>
    </div>
  `)
}

function showTerminalError(err: unknown): void {
  showBootstrapError(err instanceof Error ? err.message : String(err), 'Terminal failed to start')
}

function showBootstrapError(message: string, title = 'Startup error'): void {
  const container = document.getElementById('terminal-container')
  if (!container) return
  hideTerminalLoading()
  container.innerHTML = `
    <div class="terminal-error">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(message)}</p>
      <p class="terminal-error-hint">Try restarting terminal-save. If the problem continues, check that PowerShell is installed.</p>
    </div>
  `
}

async function toggleDocumentList(visible: boolean): Promise<void> {
  const settings = await window.terminalSave.settings.load()
  await window.terminalSave.settings.save({ showDocumentList: visible })
  applyLayout('standard', visible, settings.showNotes)
  await syncToolbarState()
  if (activeId) scheduleRefit(activeId)
}

async function toggleNotes(visible: boolean): Promise<void> {
  const settings = await window.terminalSave.settings.load()
  await window.terminalSave.settings.save({ showNotes: visible })
  applyLayout('standard', settings.showDocumentList, visible)
  await syncToolbarState()
  if (activeId) scheduleRefit(activeId)
}

init().catch((err) => {
  console.error(err)
  hideAppLoading()
  showBootstrapError(err instanceof Error ? err.message : String(err))
})
