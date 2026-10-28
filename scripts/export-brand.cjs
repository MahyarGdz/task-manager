const { app, BrowserWindow } = require('electron')
const assert = require('node:assert/strict')
const { execFile } = require('node:child_process')
const { readFile, mkdir, writeFile, mkdtemp, rm } = require('node:fs/promises')
const { tmpdir } = require('node:os')
const { join } = require('node:path')
const { promisify } = require('node:util')

app.whenReady().then(async () => {
  let window
  try {
    const source = join(__dirname, '../src/renderer/src/assets/brand/pishro-icon.svg')
    const output = join(__dirname, '../build')
    const svg = await readFile(source, 'utf8')
    window = new BrowserWindow({ width: 1024, height: 1024, show: false, frame: false, transparent: true, webPreferences: { sandbox: true } })
    await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`<style>html,body{margin:0;width:100%;height:100%;background:transparent}svg{width:100%;height:100%;display:block}</style>${svg}`)}`)
    const icon = (await window.webContents.capturePage()).resize({ width: 1024, height: 1024, quality: 'best' })
    await mkdir(output, { recursive: true })
    const png = icon.toPNG({ scaleFactor: 1 })
    assert.equal(png.readUInt32BE(16), 1024)
    assert.equal(png.readUInt32BE(20), 1024)
    await writeFile(join(output, 'icon.png'), png)
    const sizes = [16, 32, 48, 256]
    const frames = sizes.map((size) => {
      const frame = icon.resize({ width: size, height: size, quality: 'best' }).toPNG({ scaleFactor: 1 })
      assert.equal(frame.readUInt32BE(16), size)
      return frame
    })
    const directory = Buffer.alloc(6 + 16 * sizes.length)
    directory.writeUInt16LE(1, 2)
    directory.writeUInt16LE(sizes.length, 4)
    let offset = directory.length
    frames.forEach((frame, i) => {
      const entry = 6 + i * 16
      directory[entry] = sizes[i] % 256
      directory[entry + 1] = sizes[i] % 256
      directory.writeUInt16LE(1, entry + 4)
      directory.writeUInt16LE(32, entry + 6)
      directory.writeUInt32LE(frame.length, entry + 8)
      directory.writeUInt32LE(offset, entry + 12)
      offset += frame.length
    })
    await writeFile(join(output, 'icon.ico'), Buffer.concat([directory, ...frames]))
    if (process.platform === 'darwin') {
      const temporary = await mkdtemp(join(tmpdir(), 'pishro-icons-'))
      try {
        const iconset = join(temporary, 'Pishro.iconset')
        await mkdir(iconset)
        for (const size of [16, 32, 128, 256, 512]) {
          for (const scale of [1, 2]) {
            const frame = icon.resize({ width: size * scale, height: size * scale, quality: 'best' }).toPNG({ scaleFactor: 1 })
            await writeFile(join(iconset, `icon_${size}x${size}${scale === 2 ? '@2x' : ''}.png`), frame)
          }
        }
        await promisify(execFile)('/usr/bin/iconutil', ['-c', 'icns', iconset, '-o', join(output, 'icon.icns')])
      } finally {
        await rm(temporary, { recursive: true, force: true })
      }
    }
    console.log('Exported build/icon.png (1024px) and icon.ico (16, 32, 48, 256px).')
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  } finally {
    window?.destroy()
    app.exit(process.exitCode ?? 0)
  }
})
