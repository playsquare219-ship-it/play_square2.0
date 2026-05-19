#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { finished } = require('stream/promises')
const { createRequire } = require('module')

const requireLocal = createRequire(__filename)

async function ensurePdfkitFontData() {
  try {
    const helveticaPath = requireLocal.resolve('pdfkit/js/data/Helvetica.afm')
    const sourceDataPath = path.dirname(helveticaPath)

    const pdfkitSource = requireLocal.resolve('pdfkit/js/pdfkit.js')
    const targetDataPath = path.join(path.dirname(pdfkitSource), 'data')

    if (!fs.existsSync(targetDataPath)) {
      fs.mkdirSync(targetDataPath, { recursive: true })
    }

    if (path.resolve(sourceDataPath) === path.resolve(targetDataPath)) return

    for (const fileName of fs.readdirSync(sourceDataPath)) {
      if (!fileName.toLowerCase().endsWith('.afm')) continue
      const s = path.join(sourceDataPath, fileName)
      const t = path.join(targetDataPath, fileName)
      if (!fs.existsSync(t)) fs.copyFileSync(s, t)
    }
  } catch (e) {
    // best-effort
    console.warn('[pdf-worker] could not ensure pdfkit font data:', e && e.message)
  }
}

async function main() {
  const [, , jsonPath, outPath] = process.argv
  if (!jsonPath || !outPath) {
    console.error('Usage: generate-pdf.js <data.json> <output.pdf>')
    process.exit(2)
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))

  await ensurePdfkitFontData()

  const PDFKitModule = requireLocal('pdfkit')
  const PDFDocument = PDFKitModule.default ?? PDFKitModule

  const doc = new PDFDocument({ size: 'A4', margin: 50 })
  const stream = fs.createWriteStream(outPath)
  doc.pipe(stream)

  doc.fontSize(24).text('تأكيد حجز المباراة', { align: 'center' })
  doc.moveDown(2)

  doc.fontSize(16).text('معلومات المباراة:', { align: 'right' })
  doc.moveDown()

  doc.fontSize(12)
  doc.text(`رقم المباراة: ${data.matchId}`, { align: 'right' })
  doc.moveDown(0.5)

  doc.text(`الفريق الأول: ${data.team1.name}`, { align: 'right' })
  doc.moveDown(0.5)

  doc.text(`الفريق الثاني: ${data.team2.name}`, { align: 'right' })
  doc.moveDown(0.5)

  doc.text(`الملعب: ${data.stadium || 'غير محدد'}`, { align: 'right' })
  doc.moveDown(0.5)

  doc.text(`الولاية: ${data.wilaya || 'غير محدد'}`, { align: 'right' })
  doc.moveDown(0.5)

  doc.text(`البلدية: ${data.baladia || 'غير محدد'}`, { align: 'right' })
  doc.moveDown(0.5)

  doc.text(`التاريخ والوقت: ${new Date(data.dateTime).toLocaleString('ar-DZ')}`, { align: 'right' })
  doc.moveDown(2)

  doc.fontSize(10).text('تم إنشاء هذا التأكيد تلقائيًا بواسطة نظام Play Square', { align: 'center' })

  doc.end()

  try {
    await finished(stream)
    process.exit(0)
  } catch (e) {
    console.error('[pdf-worker] write error', e)
    process.exit(1)
  }
}

main()
