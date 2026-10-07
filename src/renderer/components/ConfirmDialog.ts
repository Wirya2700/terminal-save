import { escapeHtml } from '../utils/html'

export interface ConfirmDialogOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

export function showConfirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  const {
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false,
  } = options

  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'dialog-overlay'
    overlay.innerHTML = `
      <div class="dialog" role="alertdialog" aria-labelledby="confirm-dialog-title">
        <h3 id="confirm-dialog-title" class="dialog-title">${escapeHtml(title)}</h3>
        <p class="dialog-message">${escapeHtml(message)}</p>
        <div class="dialog-actions">
          <button type="button" class="dialog-btn" data-action="cancel">${escapeHtml(cancelLabel)}</button>
          <button type="button" class="dialog-btn ${danger ? 'danger' : 'primary'}" data-action="ok">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `

    document.body.appendChild(overlay)

    const close = (confirmed: boolean): void => {
      overlay.remove()
      resolve(confirmed)
    }

    overlay.querySelector('[data-action=cancel]')?.addEventListener('click', () => close(false))
    overlay.querySelector('[data-action=ok]')?.addEventListener('click', () => close(true))

    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close(false)
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        close(true)
      }
    })

    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) close(false)
    })

    ;(overlay.querySelector('[data-action=ok]') as HTMLButtonElement | null)?.focus()
  })
}
