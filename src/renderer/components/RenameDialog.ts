import { escapeHtml } from '../utils/html'

export function showRenameDialog(currentName: string): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'dialog-overlay'
    overlay.innerHTML = `
      <div class="dialog" role="dialog" aria-labelledby="rename-dialog-title">
        <h3 id="rename-dialog-title" class="dialog-title">Rename document</h3>
        <input type="text" class="dialog-input" value="${escapeHtml(currentName)}" maxlength="120" />
        <div class="dialog-actions">
          <button type="button" class="dialog-btn" data-action="cancel">Cancel</button>
          <button type="button" class="dialog-btn primary" data-action="ok">Rename</button>
        </div>
      </div>
    `

    document.body.appendChild(overlay)
    const input = overlay.querySelector('.dialog-input') as HTMLInputElement

    const close = (value: string | null): void => {
      overlay.remove()
      resolve(value)
    }

    input.focus()
    input.select()

    overlay.querySelector('[data-action=cancel]')?.addEventListener('click', () => close(null))
    overlay.querySelector('[data-action=ok]')?.addEventListener('click', () => {
      const value = input.value.trim()
      close(value.length > 0 ? value : null)
    })

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        const value = input.value.trim()
        close(value.length > 0 ? value : null)
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        close(null)
      }
    })

    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) close(null)
    })
  })
}
