import { icons } from './icons'
import { showAboutDialog } from './AboutDialog'

export interface ToolbarCallbacks {
  onNew?: () => void | Promise<void>
  onSave?: () => void | Promise<void>
  onToggleDocumentList?: (visible: boolean) => void | Promise<void>
  onToggleNotes?: (visible: boolean) => void | Promise<void>
}

export function createToolbar(container: HTMLElement, callbacks: ToolbarCallbacks = {}): void {
  container.innerHTML = ''
  container.className = 'toolbar'

  const left = document.createElement('div')
  left.className = 'toolbar-group toolbar-left'

  const brand = document.createElement('div')
  brand.className = 'toolbar-brand'
  brand.innerHTML = `<span class="toolbar-brand-icon">${icons.terminal}</span><span class="toolbar-brand-name">terminal-save</span>`
  left.appendChild(brand)

  left.appendChild(createIconButton('New', icons.plus, () => callbacks.onNew?.(), {
    tooltip: 'New (Ctrl+N)',
  }))
  left.appendChild(createIconButton('Save', icons.save, () => callbacks.onSave?.(), {
    tooltip: 'Save (Ctrl+S)',
  }))

  const right = document.createElement('div')
  right.className = 'toolbar-group toolbar-right'

  const docListBtn = createIconButton('Document List', icons.eye, async () => {
    const current = await window.terminalSave.settings.load()
    void callbacks.onToggleDocumentList?.(!current.showDocumentList)
  }, { id: 'toggle-doc-list', tooltip: 'Show/Hide Document List (Ctrl+Shift+B)' })
  right.appendChild(docListBtn)

  const notesBtn = createIconButton('Notes', icons.eye, async () => {
    const current = await window.terminalSave.settings.load()
    void callbacks.onToggleNotes?.(!current.showNotes)
  }, { id: 'toggle-notes', tooltip: 'Show/Hide Notes (Ctrl+Shift+N)' })
  right.appendChild(notesBtn)

  right.appendChild(createIconButton('About', icons.settings, () => { void showAboutDialog() }, {
    id: 'settings-btn',
    tooltip: 'About terminal-save',
  }))

  container.appendChild(left)
  container.appendChild(right)

  void syncToolbarState()
}

export async function syncToolbarState(): Promise<void> {
  const settings = await window.terminalSave.settings.load()
  updatePanelToggle('toggle-doc-list', settings.showDocumentList, 'Document List', 'Ctrl+Shift+B')
  updatePanelToggle('toggle-notes', settings.showNotes, 'Notes', 'Ctrl+Shift+N')
}

function updatePanelToggle(
  id: string,
  visible: boolean,
  label: string,
  shortcut: string,
): void {
  const btn = document.getElementById(id)
  if (!btn) return

  btn.classList.toggle('active', visible)
  btn.title = visible ? `Hide ${label} (${shortcut})` : `Show ${label} (${shortcut})`

  const icon = btn.querySelector('.toolbar-icon')
  if (icon) {
    icon.innerHTML = visible ? icons.eye : icons.eyeOff
  }
}

function createIconButton(
  label: string,
  iconSvg: string,
  onClick: () => void | Promise<void>,
  options: { id?: string; tooltip?: string } = {},
): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'toolbar-btn'
  if (options.id) btn.id = options.id
  btn.title = options.tooltip ?? label

  const icon = document.createElement('span')
  icon.className = 'toolbar-icon'
  icon.innerHTML = iconSvg
  btn.appendChild(icon)

  const text = document.createElement('span')
  text.textContent = label
  btn.appendChild(text)

  btn.addEventListener('click', () => { void onClick() })
  return btn
}
