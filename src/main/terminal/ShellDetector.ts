import { execSync } from 'child_process'

export interface ShellInfo {
  shell: string
  version: string
}

let cachedShell: ShellInfo | null = null

export class ShellDetector {
  static async detect(): Promise<ShellInfo> {
    if (cachedShell) return cachedShell

    try {
      const psPath = await this.findPowerShell()
      if (psPath) {
        cachedShell = { shell: psPath, version: '' }
        return cachedShell
      }
    } catch {
      // fall through
    }

    const cmdPath = 'C:\\Windows\\System32\\cmd.exe'
    try {
      execSync(`${cmdPath} /c ver`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      cachedShell = { shell: cmdPath, version: '' }
      return cachedShell
    } catch {
      throw new Error('No suitable shell found')
    }
  }

  private static async findPowerShell(): Promise<string | null> {
    const candidates = [
      'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
      'C:\\Program Files (x86)\\PowerShell\\7\\pwsh.exe',
      'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
    ]
    for (const path of candidates) {
      try {
        execSync(`${path} -Command Get-Host`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
        return path
      } catch {
        // try next candidate
      }
    }
    return null
  }
}
