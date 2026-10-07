/** Parse OSC 9;9 payload from xterm into a filesystem path */
export function parseOsc9Cwd(data: string): string | null {
  let payload = data.trim()
  if (!payload) return null

  if (payload.startsWith('9;9;')) {
    payload = payload.slice(4)
  } else if (payload.startsWith('9;')) {
    payload = payload.slice(2)
  }

  payload = payload.trim()
  if (payload.startsWith('"') && payload.endsWith('"')) {
    payload = payload.slice(1, -1)
  }

  return payload.length > 0 ? payload : null
}
