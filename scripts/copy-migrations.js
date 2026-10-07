const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const srcDir = path.join(root, 'src', 'main', 'database', 'migrations')
const destDir = path.join(root, 'out', 'main', 'migrations')

fs.mkdirSync(destDir, { recursive: true })

const files = fs.readdirSync(srcDir)
for (const file of files) {
  if (file.endsWith('.sql')) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file))
  }
}

console.log(`Copied ${files.filter(f => f.endsWith('.sql')).length} migration(s) to out/main/migrations/`)
