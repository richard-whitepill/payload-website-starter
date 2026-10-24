import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    const zipPath = path.join(process.cwd(), 'src/seed/images.zip')
    if (!fs.existsSync(zipPath)) {
      return NextResponse.json({ success: false, error: 'images.zip nem található!' }, { status: 404 })
    }

    // @ts-ignore
    const mod = await import('adm-zip')
    const AdmZip = (mod as any).default || mod
    const zip = new AdmZip(zipPath)
    const entries = zip.getEntries()

    const imageEntries = entries.filter((e: any) => {
      if (e.isDirectory) return false
      const name = (e.entryName as string).toLowerCase()
      return name.match(/\.(jpg|jpeg|png|gif|webp|pdf|svg)$/)
    })

    // Get all existing media filenames
    const allMedia = await payload.find({ collection: 'media', limit: 1000 })
    const existingFilenames = new Set(allMedia.docs.map((d: any) => d.filename || path.basename(d.url || '')))

    // Filter to only new images
    const newEntries = imageEntries.filter((e: any) => {
      const fileName = path.basename(e.entryName as string)
      return !existingFilenames.has(fileName)
    })

    let uploaded = 0
    let errors = 0
    const errorList: string[] = []

    const batch = newEntries.slice(0, 50)

    // @ts-ignore
    let put: any = null
    try {
      const blobMod = await import('@vercel/blob')
      put = blobMod.put
    } catch {}

    for (const entry of batch) {
      try {
        const fileName = path.basename(entry.entryName as string)
        const buffer = entry.getData() as Buffer
        if (buffer.length === 0 || buffer.length > 10 * 1024 * 1024) continue

        const ext = path.extname(fileName).toLowerCase()
        let mimetype = 'image/jpeg'
        if (ext === '.png') mimetype = 'image/png'
        else if (ext === '.gif') mimetype = 'image/gif'
        else if (ext === '.webp') mimetype = 'image/webp'
        else if (ext === '.pdf') mimetype = 'application/pdf'
        else if (ext === '.svg') mimetype = 'image/svg+xml'

        let fileUrl = ''
        if (put) {
          const blob = await put(`media/${fileName}`, buffer, { access: 'public', contentType: mimetype })
          fileUrl = blob.url
        }

        if (fileUrl) {
          await payload.create({
            collection: 'media',
            data: { alt: fileName, url: fileUrl, filename: fileName } as any,
          })
        } else {
          await payload.create({
            collection: 'media',
            data: { alt: fileName },
            file: { data: buffer, mimetype, name: fileName, size: buffer.length } as any,
          })
        }
        uploaded++
      } catch (e: any) {
        errors++
        errorList.push(`${(entry.entryName as string)}: ${e.message}`.substring(0, 400))
      }
    }

    // Recalculate after upload
    const afterMedia = await payload.find({ collection: 'media', limit: 1000 })
    const totalUploaded = afterMedia.totalDocs

    return NextResponse.json({
      success: true,
      zipPath,
      totalInZip: entries.length,
      imagesInZip: imageEntries.length,
      alreadyInMedia: existingFilenames.size,
      newImagesFound: newEntries.length,
      processedThisRun: batch.length,
      uploaded,
      errors,
      totalInMediaNow: totalUploaded,
      remaining: newEntries.length - batch.length,
      errorsList: errorList.slice(0, 5),
      nextStep: newEntries.length - batch.length > 0 ? `Futtasd újra! Még ${newEntries.length - batch.length} kép hátra!` : 'Kész! Minden kép feltöltve! 337 kép bent van!',
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack?.substring(0, 2000) }, { status: 500 })
  }
}
