/**
 * Session-only PowerShell prompt that emits OSC 9;9 with the current working directory.
 * Injected via -Command — does not modify the user's PowerShell profile.
 */
export function buildPowerShellInitCommand(): string {
  // Statements must be separated with ';' when passed as a single-line -Command script.
  // Do not set RawUI.BackgroundColor. ConPTY paints that color onto the prompt line,
  // and the light theme maps ANSI white to a dark gray, which draws a black bar.
  // ${e}[49m keeps the terminal's default white background. Prompt/path colors match the theme.
  return [
    "try { $Host.UI.RawUI.ForegroundColor = 'Black' } catch {};",
    "try { Set-PSReadLineOption -Colors @{ Default = 'Black'; Command = 'Black'; Parameter = 'DarkMagenta'; String = 'DarkCyan'; Comment = 'DarkGreen'; Keyword = 'DarkBlue'; Operator = 'DarkGray'; Variable = 'DarkGreen'; Number = 'DarkRed'; Type = 'DarkCyan'; Member = 'DarkCyan'; ContinuationPrompt = 'DarkGray'; Emphasis = 'DarkCyan'; Error = 'Red' } } catch {};",
    'function global:prompt {',
    '$p = $PWD.Path;',
    '$e = [char]27;',
    '$b = [char]7;',
    'Write-Host -NoNewline "$e]9;9;$p$b";',
    '"${e}[49m${e}[38;2;37;99;235mPS ${e}[38;2;8;145;178m$p${e}[38;2;37;99;235m> ${e}[0m"',
    '}',
  ].join(' ')
}

export function isPowerShell(shell: string): boolean {
  const lower = shell.toLowerCase()
  return lower.includes('powershell') || lower.includes('pwsh')
}
