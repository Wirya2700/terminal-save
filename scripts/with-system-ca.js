const { spawnSync } = require('node:child_process')

// electron-builder downloads Electron, NSIS, and winCodeSign over HTTPS.
// A corporate proxy presents a CA that Windows trusts and Node's built-in
// store rejects. NODE_USE_SYSTEM_CA is read when Node starts, so the
// packaging command must be a child process.
const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Usage: node scripts/with-system-ca.js <command> [args...]')
  process.exit(1)
}

const nodeOptions = [process.env.NODE_OPTIONS, '--experimental-require-module']
  .filter(Boolean)
  .join(' ')

const result = spawnSync(args[0], args.slice(1), {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_USE_SYSTEM_CA: '1',
    NODE_OPTIONS: nodeOptions
  }
})

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
