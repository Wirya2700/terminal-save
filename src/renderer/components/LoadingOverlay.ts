export function showAppLoading(message = 'Loading terminal-save...'): void {
  let overlay = document.getElementById('app-loading')
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = 'app-loading'
    overlay.className = 'app-loading'
    overlay.innerHTML = `
      <div class="app-loading-card">
        <div class="app-loading-spinner" aria-hidden="true"></div>
        <p class="app-loading-text">${message}</p>
      </div>
    `
    document.body.appendChild(overlay)
  } else {
    const text = overlay.querySelector('.app-loading-text')
    if (text) text.textContent = message
    overlay.classList.remove('hidden')
  }
}

export function hideAppLoading(): void {
  document.getElementById('app-loading')?.classList.add('hidden')
}

export function showTerminalLoading(message = 'Starting PowerShell...'): void {
  const container = document.getElementById('terminal-container')
  if (!container) return

  container.querySelector('.terminal-loading')?.remove()
  container.querySelector('.terminal-empty')?.remove()
  container.querySelector('.terminal-error')?.remove()

  const loading = document.createElement('div')
  loading.className = 'terminal-loading'
  loading.innerHTML = `
    <div class="app-loading-spinner" aria-hidden="true"></div>
    <p>${message}</p>
  `
  container.appendChild(loading)
}

export function hideTerminalLoading(): void {
  document.getElementById('terminal-container')?.querySelector('.terminal-loading')?.remove()
}
