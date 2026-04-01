import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const svg = readFileSync(join(root, 'public/og-image.svg'), 'utf8')
const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
const png = resvg.render().asPng()
writeFileSync(join(root, 'public/og-image.png'), png)
console.log('✓ og-image.png generated (%dKB)', Math.round(png.length / 1024))
