import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    // Ensure public/media exists for Payload
    const mediaDirs = [
      path.join(process.cwd(), 'public/media'),
      path.join(process.cwd(), 'public'),
      '/var/task/public/media',
      '/var/task/public',
    ]
    for (const dir of mediaDirs) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }
      } catch {}
    }

    // Find zip
    const possibleZips = [
      path.join(process.cwd(), 'src/seed/images.zip'),
      path.join(process.cwd(), 'src/seed/Images.zip'),
    ]
    
    let zipPath = ''
    for (const p of possibleZips) {
      if (fs.existsSync(p)) { zipPath = p; break }
    }
    
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
      }, { status: 404 })
    }

    const stats = fs.statSync(zipPath)

    // @ts-ignore
    const mod = await import('adm-zip')
    const AdmZip = (mod as any).default || mod
    const zip = new AdmZip(zipPath)
    const entries = zip.getEntries()

    let uploaded = 0
    let skipped = 0
    let errors = 0
    const errorList: string[] = []

    const imageEntries = entries.filter((e: any) => {
      if (e.isDirectory) return false
      const name = (e.entryName as string).toLowerCase()
      return name.match(/\.(jpg|jpeg|png|gif|webp|pdf|svg)$/)
    })

    const batch = imageEntries.slice(0, 50)

    for (const entry of batch) {
      try {
        const entryName = entry.entryName as string
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
        errorList.push(`${(entry.entryName as string)}: ${e.message}`.substring(0, 300))
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
      nextStep: imageEntries.length > batch.length ? `Futtasd újra! Még ${imageEntries.length - batch.length} kép hátra!` : 'Kész! Minden kép feltöltve!',
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack?.substring(0, 2000) }, { status: 500 })
  }
}
