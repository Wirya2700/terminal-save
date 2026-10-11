import { icons } from './icons'
import { showConfirmDialog } from './ConfirmDialog'

const DEBOUNCE_MS = 400

let container: HTMLElement | null = null
let textarea: HTMLTextAreaElement | null = null
let statusEl: HTMLElement | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let currentDocId: number | null = null
let saveGeneration = 0

function getContainer(): HTMLElement {
  if (!container) {
    const el = document.getElementById('notes-panel')
    if (!el) throw new Error('#notes-panel not found')
    container = el
  }
  return container
}

export function initNotesPanel(): void {
  const root = getContainer()
  root.id = 'notes-panel'
  root.className = 'panel notes-panel'
  root.innerHTML = ''

  const header = document.createElement('div')
  header.className = 'panel-header notes-header'
  header.innerHTML = `
    <span class="panel-header-icon">${icons.notes}</span>
    <span class="panel-header-title">Notes</span>
    <button type="button" class="notes-clear-btn" title="Clear notes">Clear</button>
  `
  root.appendChild(header)

  textarea = document.createElement('textarea')
  textarea.id = 'notes-content'
  textarea.placeholder = 'Write notes here...'
  textarea.disabled = true
  textarea.spellcheck = false
  textarea.setAttribute('autocomplete', 'off')
  textarea.setAttribute('autocorrect', 'off')
  textarea.setAttribute('autocapitalize', 'off')
  root.appendChild(textarea)

  statusEl = document.createElement('div')
  statusEl.className = 'notes-status'
  statusEl.textContent = ''
  root.appendChild(statusEl)

  header.querySelector('.notes-clear-btn')?.addEventListener('click', () => {
    void clearNotesForCurrentDocument()
  })

  textarea.addEventListener('input', () => {
    if (!currentDocId || !textarea) return
    setSaveStatus('saving')
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      if (!currentDocId || !textarea) return
      void persistNotes(currentDocId, textarea.value)
    }, DEBOUNCE_MS)
  })

  textarea.addEventListener('focus', () => {
    if (textarea) textarea.tabIndex = 0
  })
}

function setSaveStatus(state: 'idle' | 'saving' | 'saved' | 'error'): void {
  if (!statusEl) return
  statusEl.className = 'notes-status ' + state
  switch (state) {
    case 'saving':
      statusEl.textContent = 'Saving...'
      break
    case 'saved':
      statusEl.textContent = 'Autosaved'
      break
    case 'error':
      statusEl.textContent = 'Save failed'
      break
    default:
      statusEl.textContent = ''
  }
}

async function persistNotes(documentId: number, content: string): Promise<void> {
  const generation = ++saveGeneration
  setSaveStatus('saving')
  try {
    const saved = await window.terminalSave.notes.upsert({
      document_id: documentId,
      content,
    })
    if (!saved) return
    if (generation === saveGeneration && currentDocId === documentId) {
      setSaveStatus('saved')
    }
  } catch {
    if (generation === saveGeneration && currentDocId === documentId) {
      setSaveStatus('error')
    }
  }
}

export function cancelPendingNotesSave(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  saveGeneration++
}

export function detachNotesPanel(): void {
  cancelPendingNotesSave()
  currentDocId = null
  if (textarea) {
    textarea.value = ''
    textarea.disabled = true
    textarea.placeholder = 'Open a document to write notes...'
  }
  setSaveStatus('idle')
}

export async function flushPendingSave(): Promise<void> {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  if (!currentDocId || !textarea) return

  const docId = currentDocId
  const doc = await window.terminalSave.documents.findById(docId)
  if (!doc) {
    currentDocId = null
    return
  }

  await persistNotes(docId, textarea.value)
}

export async function loadNotes(documentId: number, documentName?: string): Promise<void> {
  await flushPendingSave()

  currentDocId = documentId
  saveGeneration++

  const note = await window.terminalSave.notes.findByDocumentId(documentId)

  if (textarea) {
    textarea.disabled = false
    textarea.value = note?.content ?? ''
    textarea.placeholder = documentName
      ? `Notes for ${documentName}...`
      : 'Write notes here...'
  }

  setSaveStatus('idle')
}

export async function clearNotesForCurrentDocument(): Promise<void> {
  if (!currentDocId || !textarea) return

  if (textarea.value.trim().length === 0) return

  const confirmed = await showConfirmDialog({
    title: 'Clear notes',
    message: 'Remove all notes for this document?',
    confirmLabel: 'Clear',
    danger: true,
  })
  if (!confirmed) return

  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  textarea.value = ''
  await persistNotes(currentDocId, '')
}

export function clearNotesPanel(): void {
  detachNotesPanel()
}
