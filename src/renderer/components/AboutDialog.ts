import { escapeHtml } from '../utils/html'

export async function showAboutDialog(): Promise<void> {
  const dbPath = await window.terminalSave.db.getDbPath()

  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'dialog-overlay'
    overlay.innerHTML = `
      <div class="dialog about-dialog" role="dialog" aria-labelledby="about-dialog-title">
        <h3 id="about-dialog-title" class="dialog-title">terminal-save</h3>
        <p class="dialog-message">A simple terminal that remembers your work.</p>
        <dl class="about-details">
          <dt>Version</dt>
          <dd>1.0.0</dd>
          <dt>Database</dt>
          <dd class="about-path">${escapeHtml(dbPath)}</dd>
        </dl>
        <div class="dialog-actions">
          <button type="button" class="dialog-btn primary" data-action="close">Close</button>
        </div>
      </div>
    `

    document.body.appendChild(overlay)

    const close = (): void => {
      overlay.remove()
      resolve()
    }

    overlay.querySelector('[data-action=close]')?.addEventListener('click', close)
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault()
        close()
      }
    })
    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) close()
    })

    ;(overlay.querySelector('[data-action=close]') as HTMLButtonElement | null)?.focus()
  })
}
