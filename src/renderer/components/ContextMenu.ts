export interface ContextMenuItem {
  label: string
  danger?: boolean
  onClick: () => void | Promise<void>
}

let menuEl: HTMLDivElement | null = null
let dismissMouse: ((e: MouseEvent) => void) | null = null
let dismissKey: ((e: KeyboardEvent) => void) | null = null

export function showContextMenu(x: number, y: number, items: ContextMenuItem[]): void {
  hideContextMenu()

  menuEl = document.createElement('div')
  menuEl.className = 'context-menu'

  for (const item of items) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'context-menu-item' + (item.danger ? ' danger' : '')
    btn.textContent = item.label
    btn.addEventListener('click', () => {
      hideContextMenu()
      void item.onClick()
    })
    menuEl.appendChild(btn)
  }

  document.body.appendChild(menuEl)
  requestAnimationFrame(() => menuEl?.classList.add('is-open'))

  const rect = menuEl.getBoundingClientRect()
  const left = Math.min(x, window.innerWidth - rect.width - 8)
  const top = Math.min(y, window.innerHeight - rect.height - 8)
  menuEl.style.left = `${Math.max(8, left)}px`
  menuEl.style.top = `${Math.max(8, top)}px`

  dismissMouse = (e: MouseEvent): void => {
    if (menuEl && !menuEl.contains(e.target as Node)) {
      hideContextMenu()
    }
  }

  dismissKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') hideContextMenu()
  }

  setTimeout(() => {
    if (dismissMouse) document.addEventListener('mousedown', dismissMouse)
  }, 0)
  if (dismissKey) document.addEventListener('keydown', dismissKey)

  menuEl.addEventListener('contextmenu', (e) => e.preventDefault())
}

export function hideContextMenu(): void {
  if (dismissMouse) {
    document.removeEventListener('mousedown', dismissMouse)
    dismissMouse = null
  }
  if (dismissKey) {
    document.removeEventListener('keydown', dismissKey)
    dismissKey = null
  }

  if (!menuEl) return
  menuEl.classList.remove('is-open')
  const el = menuEl
  menuEl = null
  window.setTimeout(() => el.remove(), 120)
}
