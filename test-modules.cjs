const { spawnSync } = require('child_process');
const path = require('path');

const electronExe = path.resolve('node_modules/electron/dist/electron.exe');
const res = spawnSync(electronExe, [
  '-e',
  "const pty = require('node-pty'); const db = require('better-sqlite3'); console.log('MODULES_OK'); process.exit(0);"
], { encoding: 'utf-8' });

console.log('STDOUT:', res.stdout);
console.log('STDERR:', res.stderr);
console.log('STATUS:', res.status);
