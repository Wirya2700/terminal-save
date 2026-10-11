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

const resourcesDir = path.join(root, 'resources')
const outMainDir = path.join(root, 'out', 'main')
for (const icon of ['icon.ico', 'icon.png']) {
  const src = path.join(resourcesDir, icon)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(outMainDir, icon))
  }
}

console.log(`Copied ${files.filter(f => f.endsWith('.sql')).length} migration(s) and icons to out/main/`)
