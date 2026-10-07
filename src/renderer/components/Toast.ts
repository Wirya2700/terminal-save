let toastTimer: ReturnType<typeof setTimeout> | null = null

export function showToast(message: string, durationMs = 2200): void {
  let toast = document.getElementById('app-toast') as HTMLDivElement | null
  if (!toast) {
    toast = document.createElement('div')
    toast.id = 'app-toast'
    toast.className = 'app-toast'
    document.body.appendChild(toast)
  }

  if (toastTimer) clearTimeout(toastTimer)

  toast.textContent = message
  toast.classList.add('visible')

  toastTimer = setTimeout(() => {
    toast?.classList.remove('visible')
    toastTimer = null
  }, durationMs)
}
