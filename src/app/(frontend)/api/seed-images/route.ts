import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    // Find zip
    const zipPath = path.join(process.cwd(), 'src/seed/images.zip')
    if (!fs.existsSync(zipPath)) {
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

    const batch = imageEntries.slice(0, 40)

    // Try to use @vercel/blob directly if available
    let put: any = null
    try {
      const blobMod = await import('@vercel/blob')
      put = blobMod.put
    } catch {}

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

        // Upload to Vercel Blob if possible, otherwise use Payload media
        let fileUrl = ''
        
        if (put) {
          try {
            const blob = await put(`media/${fileName}`, buffer, { 
              access: 'public',
              contentType: mimetype,
            })
            fileUrl = blob.url
          } catch (e: any) {
            // fallback to payload create
            errorList.push(`Blob put failed for ${fileName}: ${e.message}, trying payload create`)
          }
        }

        if (fileUrl) {
          // Create media doc with blob URL
          await payload.create({
            collection: 'media',
            data: {
              alt: fileName,
              url: fileUrl,
              filename: fileName,
            } as any,
          })
        } else {
          // Fallback: try payload create with /tmp file
          const tmpPath = path.join('/tmp', fileName)
          fs.writeFileSync(tmpPath, buffer)
          
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
          
          try { fs.unlinkSync(tmpPath) } catch {}
        }
        
        uploaded++
      } catch (e: any) {
        errors++
        errorList.push(`${(entry.entryName as string)}: ${e.message}`.substring(0, 400))
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
      errorsList: errorList.slice(0, 8),
      nextStep: imageEntries.length > batch.length ? `Futtasd újra! Még ${imageEntries.length - batch.length} kép hátra!` : 'Kész! Minden kép feltöltve!',
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack?.substring(0, 2000) }, { status: 500 })
  }
}
