import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'
import path from 'path'

function findFile(dir: string, nameContains: string): string | null {
  if (!fs.existsSync(dir)) return null
  const files = fs.readdirSync(dir)
  for (const f of files) {
    if (f.toLowerCase().includes(nameContains.toLowerCase())) {
      return path.join(dir, f)
    }
  }
  return null
}

function findZip(): string | null {
  const dirs = [
    path.join(process.cwd(), 'src/seed'),
    path.join(process.cwd(), 'src/app/(frontend)/api/seed-j2xml'),
    path.join(process.cwd(), 'src/app/(frontend)/api/seed-images'),
    path.join(process.cwd()),
  ]
  for (const dir of dirs) {
    const found = findFile(dir, 'images') && findFile(dir, '.zip')
    // More precise: look for images.zip
    const candidates = ['images.zip', 'Images.zip', 'IMAGES.ZIP']
    for (const c of candidates) {
      const p = path.join(dir, c)
      if (fs.existsSync(p)) return p
    }
    // fallback: any zip with images in name
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir)
      for (const f of files) {
        if (f.toLowerCase().includes('images') && f.toLowerCase().endsWith('.zip')) {
          return path.join(dir, f)
        }
      }
    }
  }
  return null
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const doUpdatePosts = searchParams.get('updatePosts') !== 'false'
  
  try {
    const payload = await getPayload({ config })
    const zipPath = findZip()
    
    if (!zipPath) {
      return NextResponse.json({ 
        success: false, 
        error: 'images.zip nem található! Tedd a src/seed/ mappába!',
        searched: ['src/seed', 'src/app/(frontend)/api/seed-j2xml', 'cwd'],
        cwd: process.cwd(),
        debug: fs.existsSync(path.join(process.cwd(), 'src/seed')) ? fs.readdirSync(path.join(process.cwd(), 'src/seed')).join(', ') : 'src/seed NOT EXISTS'
      }, { status: 404 })
    }

    const stats = fs.statSync(zipPath)
    
    // Try to use adm-zip if available
    let AdmZip: any
    try {
      AdmZip = require('adm-zip')
    } catch {
      return NextResponse.json({
        success: false,
        error: 'adm-zip nincs telepítve! Add hozzá package.json-hoz: npm install adm-zip',
        zipPath,
        size: stats.size,
      }, { status: 500 })
    }

    const zip = new AdmZip(zipPath)
    const entries = zip.getEntries()
    
    let uploaded = 0
    let skipped = 0
    let errors = 0
    const mapping: Record<string, string> = {}
    const errorList: string[] = []

    // Filter only images and pdfs
    const imageEntries = entries.filter((e: any) => {
      if (e.isDirectory) return false
      const name = e.entryName.toLowerCase()
      return name.match(/\.(jpg|jpeg|png|gif|webp|pdf|svg)$/)
    })

    for (const entry of imageEntries.slice(0, 300)) { // limit 300 per run to avoid timeout
      try {
        const entryName = entry.entryName // e.g. images/hirek/bedo01.jpg
        const fileName = path.basename(entryName)
        const buffer = entry.getData()
        
        if (buffer.length === 0) { skipped++; continue }
        if (buffer.length > 10 * 1024 * 1024) { skipped++; continue } // skip >10MB

        // Check if already uploaded
        const existing = await payload.find({
          collection: 'media',
          where: { filename: { equals: fileName } },
          limit: 1,
        })
        
        let mediaUrl = ''
        let mediaId = ''
        
        if (existing.docs[0]) {
          mediaUrl = existing.docs[0].url || ''
          mediaId = existing.docs[0].id
          skipped++
        } else {
          // Create media
          const mediaDoc = await payload.create({
            collection: 'media',
            data: {
              alt: fileName,
            },
            file: {
              data: buffer,
              mimetype: entryName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : `image/${path.extname(fileName).slice(1) === 'jpg' ? 'jpeg' : path.extname(fileName).slice(1)}`,
              name: fileName,
              size: buffer.length,
            } as any,
          })
          mediaUrl = (mediaDoc as any).url || ''
          mediaId = (mediaDoc as any).id
          uploaded++
        }

        if (mediaUrl) {
          // Map old paths to new URL
          // e.g. images/hirek/bedo01.jpg -> new URL
          // Also images\hirek\bedo01.jpg, /images/hirek/bedo01.jpg, etc.
          const cleanEntryName = entryName.replace(/\\/g, '/')
          mapping[cleanEntryName] = mediaUrl
          mapping[`/${cleanEntryName}`] = mediaUrl
          mapping[fileName] = mediaUrl
          // Also without images/ prefix
          if (cleanEntryName.startsWith('images/')) {
            mapping[cleanEntryName.substring(7)] = mediaUrl
          }
        }
      } catch (e: any) {
        errors++
        errorList.push(`${entry.entryName}: ${e.message}`)
      }
    }

    // Update posts if requested
    let postsUpdated = 0
    if (doUpdatePosts && Object.keys(mapping).length > 0) {
      const allPosts = await payload.find({ collection: 'posts', limit: 500 })
      
      for (const post of allPosts.docs) {
        try {
          let contentStr = JSON.stringify(post.content)
          let originalStr = contentStr
          
          // Also check if post has old image references in content
          // The content is lexical JSON, but may contain old image paths in text
          // We'll also need to update if there's a hero or other fields
          // For now, update lexical content if it contains image paths
          
          // Simple replacement: replace old paths with new URLs in JSON string
          for (const [oldPath, newUrl] of Object.entries(mapping)) {
            if (contentStr.includes(oldPath)) {
              contentStr = contentStr.split(oldPath).join(newUrl)
            }
          }
          
          if (contentStr !== originalStr) {
            const newContent = JSON.parse(contentStr)
            await payload.update({
              collection: 'posts',
              id: post.id,
              data: { content: newContent } as any,
            })
            postsUpdated++
          }
        } catch (e: any) {
          errorList.push(`Post ${post.id} update: ${e.message}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      zipPath,
      zipSize: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      totalInZip: entries.length,
      imagesInZip: imageEntries.length,
      uploaded,
      skipped,
      errors,
      postsUpdated,
      mappingCount: Object.keys(mapping).length,
      sampleMapping: Object.fromEntries(Object.entries(mapping).slice(0, 5)),
      errorsList: errorList.slice(0, 10),
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack }, { status: 500 })
  }
}

