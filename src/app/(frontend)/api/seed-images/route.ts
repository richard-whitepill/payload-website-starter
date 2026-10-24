import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    // Find zip
    const possibleZips = [
      path.join(process.cwd(), 'src/seed/images.zip'),
      path.join(process.cwd(), 'src/seed/Images.zip'),
      path.join(process.cwd(), 'src/app/(frontend)/api/seed-images/images.zip'),
      path.join(process.cwd(), 'images.zip'),
    ]
    
    let zipPath = ''
    for (const p of possibleZips) {
      if (fs.existsSync(p)) { zipPath = p; break }
    }
    
    // Also search src/seed folder for any zip with images in name
    if (!zipPath) {
      const seedDir = path.join(process.cwd(), 'src/seed')
      if (fs.existsSync(seedDir)) {
        const files = fs.readdirSync(seedDir)
        for (const f of files) {
          if (f.toLowerCase().includes('images') && f.toLowerCase().endsWith('.zip')) {
            zipPath = path.join(seedDir, f)
            break
          }
        }
      }
    }

    if (!zipPath) {
      const seedDir = path.join(process.cwd(), 'src/seed')
      return NextResponse.json({
        success: false,
        error: 'images.zip nem található!',
        debug: fs.existsSync(seedDir) ? fs.readdirSync(seedDir).join(', ') : 'src/seed NOT EXISTS',
        cwd: process.cwd(),
      }, { status: 404 })
    }

    const stats = fs.statSync(zipPath)

    // Dynamic import adm-zip
    let AdmZip
    try {
      AdmZip = (await import('adm-zip')).default
    } catch (e: any) {
      return NextResponse.json({
        success: false,
        error: `adm-zip betöltése sikertelen: ${e.message}. Ellenőrizd package.json-ban!`,
        zipPath,
        size: stats.size,
      }, { status: 500 })
    }

    const zip = new AdmZip(zipPath)
    const entries = zip.getEntries()

    let uploaded = 0
    let skipped = 0
    let errors = 0
    const errorList: string[] = []

    const imageEntries = entries.filter((e: any) => {
      if (e.isDirectory) return false
      const name = e.entryName.toLowerCase()
      return name.match(/\.(jpg|jpeg|png|gif|webp|pdf|svg)$/)
    })

    // Limit to 50 per run to avoid timeout
    const batch = imageEntries.slice(0, 60)

    for (const entry of batch) {
      try {
        const entryName = entry.entryName
        const fileName = path.basename(entryName)
        const buffer = entry.getData() as Buffer

        if (buffer.length === 0 || buffer.length > 10 * 1024 * 1024) { skipped++; continue }

        const existing = await payload.find({
          collection: 'media',
          where: { filename: { equals: fileName } },
          limit: 1,
        })

        if (existing.docs[0]) { skipped++; continue }

        const ext = path.extname(fileName).toLowerCase()
        let mimetype = 'image/jpeg'
        if (ext === '.png') mimetype = 'image/png'
        else if (ext === '.gif') mimetype = 'image/gif'
        else if (ext === '.webp') mimetype = 'image/webp'
        else if (ext === '.pdf') mimetype = 'application/pdf'
        else if (ext === '.svg') mimetype = 'image/svg+xml'

        await payload.create({
          collection: 'media',
          data: { alt: fileName },
          file: {
            data: buffer,
            mimetype,
            name: fileName,
            size: buffer.length,
          } as any,
        })
        uploaded++
      } catch (e: any) {
        errors++
        errorList.push(`${entry.entryName}: ${e.message}`.substring(0, 200))
      }
    }

    return NextResponse.json({
      success: true,
      zipPath,
      zipSize: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      totalInZip: entries.length,
      imagesInZip: imageEntries.length,
      processedThisRun: batch.length,
      uploaded,
      skipped,
      errors,
      remaining: imageEntries.length - batch.length,
      errorsList: errorList.slice(0, 5),
      nextStep: imageEntries.length > batch.length ? `Futtasd újra! Még ${imageEntries.length - batch.length} kép hátra!` : 'Kész! Minden kép feltöltve! Most jöhet a cikkek frissítése!',
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack?.substring(0, 1000) }, { status: 500 })
  }
}
