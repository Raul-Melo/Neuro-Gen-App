/**
 * Converts Neuro-Gen_v2.png → logo.webp (multiple sizes) + favicon.png
 * Run: node scripts/convert-assets.mjs
 */
import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dir, '..', 'public')
const src = join(publicDir, 'Neuro-Gen_v2.png')

console.log('Converting Neuro-Gen_v2.png...')

// 1. Full logo WebP (512px — used in AuthLayout, splash)
await sharp(src)
  .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .webp({ quality: 90 })
  .toFile(join(publicDir, 'logo.webp'))
console.log('✓ logo.webp (512px)')

// 2. Logo WebP 192px — PWA icon
await sharp(src)
  .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .webp({ quality: 90 })
  .toFile(join(publicDir, 'logo-192.webp'))
console.log('✓ logo-192.webp')

// 3. Logo WebP 64px — small use
await sharp(src)
  .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .webp({ quality: 90 })
  .toFile(join(publicDir, 'logo-64.webp'))
console.log('✓ logo-64.webp')

// 4. favicon.png 32px (browsers fallback)
await sharp(src)
  .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(join(publicDir, 'favicon.png'))
console.log('✓ favicon.png (32px)')

// 5. apple-touch-icon 180px
await sharp(src)
  .resize(180, 180, { fit: 'contain', background: { r: 8, g: 10, b: 24, alpha: 1 } })
  .png()
  .toFile(join(publicDir, 'apple-touch-icon.png'))
console.log('✓ apple-touch-icon.png (180px)')

// 6. Write SVG favicon that embeds the logo as <image> (crisp at all sizes)
const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0d1332"/>
      <stop offset="100%" stop-color="#1a1060"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="7" fill="url(#bg)"/>
  <image href="./Neuro-Gen_v2.png" x="2" y="2" width="28" height="28"/>
</svg>`
writeFileSync(join(publicDir, 'favicon.svg'), svgFavicon)
console.log('✓ favicon.svg (SVG with embedded logo)')

console.log('\nAll assets generated in public/')
