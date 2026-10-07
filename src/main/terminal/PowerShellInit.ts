/**
 * Session-only PowerShell prompt that emits OSC 9;9 with the current working directory.
 * Injected via -Command — does not modify the user's PowerShell profile.
 */
export function buildPowerShellInitCommand(): string {
  // Statements must be separated with ';' when passed as a single-line -Command script.
  return [
    'function global:prompt {',
    '$p = $PWD.Path;',
    '$e = [char]27;',
    '$b = [char]7;',
    'Write-Host -NoNewline "$e]9;9;$p$b";',
    '"PS $p> "',
    '}',
  ].join(' ')
}

export function isPowerShell(shell: string): boolean {
  const lower = shell.toLowerCase()
  return lower.includes('powershell') || lower.includes('pwsh')
}
