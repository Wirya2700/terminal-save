const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const resourcesDir = path.join(root, 'resources')
const rendererDir = path.join(root, 'src', 'renderer')
const tempDir = path.join(resourcesDir, '_tmp_icons')
const ps1File = path.join(__dirname, '_render_icons.ps1')

if (!fs.existsSync(resourcesDir)) fs.mkdirSync(resourcesDir, { recursive: true })
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

const psScript = `param([string]$targetDir)

Add-Type -AssemblyName System.Drawing

function Create-Icon([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $pad = [float]($size * 0.05)
    $w = [float]($size - 2 * $pad)
    $h = [float]($size - 2 * $pad)
    $r = [float]($size * 0.22)

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($pad, $pad, $r * 2, $r * 2, 180, 90)
    $path.AddArc($pad + $w - $r * 2, $pad, $r * 2, $r * 2, 270, 90)
    $path.AddArc($pad + $w - $r * 2, $pad + $h - $r * 2, $r * 2, $r * 2, 0, 90)
    $path.AddArc($pad, $pad + $h - $r * 2, $r * 2, $r * 2, 90, 90)
    $path.CloseFigure()

    # Deep dark slate background gradient
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF 0, 0),
        (New-Object System.Drawing.PointF 0, $size),
        [System.Drawing.Color]::FromArgb(255, 17, 24, 39),
        [System.Drawing.Color]::FromArgb(255, 10, 15, 29)
    )
    $g.FillPath($bgBrush, $path)

    # Subtle border
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 255, 255, 255), [Math]::Max(1.0, [float]($size * 0.02)))
    $g.DrawPath($borderPen, $path)

    $penWidth = [Math]::Max(1.6, [float]($size * 0.11))

    $scale = $w / 24.0
    $ox = $pad + 0.2 * $scale
    $oy = $pad - 0.2 * $scale

    $p1 = New-Object System.Drawing.PointF ($ox + 5.0 * $scale), ($oy + 6.0 * $scale)
    $p2 = New-Object System.Drawing.PointF ($ox + 11.5 * $scale), ($oy + 12.0 * $scale)
    $p3 = New-Object System.Drawing.PointF ($ox + 5.0 * $scale), ($oy + 18.0 * $scale)
    $u1 = New-Object System.Drawing.PointF ($ox + 13.5 * $scale), ($oy + 18.0 * $scale)
    $u2 = New-Object System.Drawing.PointF ($ox + 19.5 * $scale), ($oy + 18.0 * $scale)

    if ($size -ge 48) {
        $glowPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40, 37, 99, 235), [float]($penWidth * 1.6))
        $glowPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
        $glowPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
        $glowPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
        $g.DrawLines($glowPen, @($p1, $p2, $p3))
        $g.DrawLine($glowPen, $u1, $u2)
    }

    $gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF 0, 0),
        (New-Object System.Drawing.PointF $size, $size),
        [System.Drawing.Color]::FromArgb(255, 59, 130, 246),
        [System.Drawing.Color]::FromArgb(255, 96, 165, 250)
    )
    $pen = New-Object System.Drawing.Pen($gradBrush, $penWidth)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    $g.DrawLines($pen, @($p1, $p2, $p3))
    $g.DrawLine($pen, $u1, $u2)

    $g.Dispose()
    return $bmp
}

$sizes = @(16, 32, 48, 64, 128, 256, 512)
foreach ($s in $sizes) {
    $bmp = Create-Icon $s
    $p = Join-Path $targetDir "icon_$s.png"
    $bmp.Save($p, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}
`

fs.writeFileSync(ps1File, psScript, 'utf8')
execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${ps1File}" -targetDir "${tempDir}"`, { stdio: 'inherit' })
fs.unlinkSync(ps1File)

// 2. Build multi-resolution ICO file from PNGs
function buildIco(pngPaths, outPath) {
  const images = pngPaths.map(p => fs.readFileSync(p))
  const entries = images.map(buf => {
    const width = buf.readUInt32BE(16)
    const height = buf.readUInt32BE(20)
    return {
      width: width >= 256 ? 0 : width,
      height: height >= 256 ? 0 : height,
      size: buf.length,
      buf
    }
  })

  const headerLen = 6 + entries.length * 16
  let currentOffset = headerLen
  const headerBuf = Buffer.alloc(headerLen)

  headerBuf.writeUInt16LE(0, 0)
  headerBuf.writeUInt16LE(1, 2)
  headerBuf.writeUInt16LE(entries.length, 4)

  entries.forEach((e, idx) => {
    const offset = 6 + idx * 16
    headerBuf.writeUInt8(e.width, offset)
    headerBuf.writeUInt8(e.height, offset + 1)
    headerBuf.writeUInt8(0, offset + 2)
    headerBuf.writeUInt8(0, offset + 3)
    headerBuf.writeUInt16LE(1, offset + 4)
    headerBuf.writeUInt16LE(32, offset + 6)
    headerBuf.writeUInt32LE(e.size, offset + 8)
    headerBuf.writeUInt32LE(currentOffset, offset + 12)
    currentOffset += e.size
  })

  const icoBuf = Buffer.concat([headerBuf, ...entries.map(e => e.buf)])
  fs.writeFileSync(outPath, icoBuf)
}

const icoSizes = [256, 128, 64, 48, 32, 16]
const icoPngPaths = icoSizes.map(s => path.join(tempDir, `icon_${s}.png`))
const destIco = path.join(resourcesDir, 'icon.ico')
buildIco(icoPngPaths, destIco)

// 3. Save standard icon.png (256x256) and icon-512.png
fs.copyFileSync(path.join(tempDir, 'icon_256.png'), path.join(resourcesDir, 'icon.png'))
fs.copyFileSync(path.join(tempDir, 'icon_512.png'), path.join(resourcesDir, 'icon-512.png'))

// Also copy icon.png and icon.ico to src/renderer
if (fs.existsSync(rendererDir)) {
  fs.copyFileSync(path.join(tempDir, 'icon_256.png'), path.join(rendererDir, 'icon.png'))
}

// 4. Generate SVG icon as well
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#111827" />
      <stop offset="100%" stop-color="#0A0F1D" />
    </linearGradient>
    <linearGradient id="glyphGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#60A5FA" />
    </linearGradient>
  </defs>
  <rect x="13" y="13" width="230" height="230" rx="51" fill="url(#bgGrad)" stroke="rgba(255,255,255,0.2)" stroke-width="4" />
  <path d="M 62 72 L 126 130 L 62 188 M 145 188 L 203 188" fill="none" stroke="rgba(37,99,235,0.4)" stroke-width="42" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 62 72 L 126 130 L 62 188" fill="none" stroke="url(#glyphGrad)" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" />
  <line x1="145" y1="188" x2="203" y2="188" stroke="url(#glyphGrad)" stroke-width="26" stroke-linecap="round" />
</svg>
`
fs.writeFileSync(path.join(resourcesDir, 'icon.svg'), svgContent)
fs.writeFileSync(path.join(rendererDir, 'icon.svg'), svgContent)

// Clean up temporary files
fs.rmSync(tempDir, { recursive: true, force: true })
console.log('Successfully generated resources/icon.ico, resources/icon.png, resources/icon.svg')
