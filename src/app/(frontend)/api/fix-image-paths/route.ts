import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import path from 'path'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    // Get all media with filename -> url map
    const allMedia = await payload.find({ collection: 'media', limit: 1000 })
    const mediaMap = new Map<string, string>()
    const mediaMapLower = new Map<string, string>()
    
    for (const m of allMedia.docs as any[]) {
      const filename = m.filename || path.basename(m.url || '')
      if (filename) {
        mediaMap.set(filename, m.url)
        mediaMapLower.set(filename.toLowerCase(), m.url)
        // Also map without extension? No, keep filename
      }
    }

    // Get all posts
    const allPosts = await payload.find({ collection: 'posts', limit: 500 })
    
    let updated = 0
    let skipped = 0
    let imagesReplaced = 0
    const details: string[] = []

    for (const post of allPosts.docs as any[]) {
      let content = post.content || ''
      let richText = post.richText || null
      let originalContent = content
      let replacedInThisPost = 0

      // Find all img src in content (HTML)
      // Match: src="images/..." or src='/images/...' or src="images\..."
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
      let match
      const replacements: Array<{ oldSrc: string, newSrc: string, filename: string }> = []

      while ((match = imgRegex.exec(content)) !== null) {
        const oldSrc = match[1]
        // Extract filename from oldSrc
        // oldSrc can be: images/news/2016_09/file.jpg, /images/news/file.jpg, images/file.jpg, etc.
        const filename = path.basename(oldSrc.split('?')[0].split('#')[0])
        if (!filename) continue

        // Find in media map
        let newUrl = mediaMap.get(filename) || mediaMapLower.get(filename.toLowerCase())
        
        // Try without extension case insensitive? Already lower
        // Try to find by filename without path
        if (!newUrl) {
          // Try to find media that ends with same filename
          for (const [key, url] of mediaMap.entries()) {
            if (key.toLowerCase() === filename.toLowerCase()) {
              newUrl = url
              break
            }
          }
        }

        if (newUrl && newUrl !== oldSrc) {
          replacements.push({ oldSrc, newSrc: newUrl, filename })
        }
      }

      // Replace in content
      for (const rep of replacements) {
        // Escape oldSrc for regex
        const escapedOld = rep.oldSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(escapedOld, 'g')
        content = content.replace(regex, rep.newSrc)
        replacedInThisPost++
      }

      // Also check for Joomla {image} tags or other image references?
      // Example: images/stories/... or /media/...

      if (replacedInThisPost > 0 && content !== originalContent) {
        try {
          await payload.update({
            collection: 'posts',
            id: post.id,
            data: { content } as any,
          })
          updated++
          imagesReplaced += replacedInThisPost
          details.push(`${post.title?.substring(0, 40)}: ${replacedInThisPost} kép javítva`)
        } catch (e: any) {
          details.push(`Hiba ${post.title}: ${e.message}`)
        }
      } else {
        skipped++
      }

      // Safety: only process 50 posts per run to avoid timeout
      if (updated >= 100) break
    }

    return NextResponse.json({
      success: true,
      totalPosts: allPosts.totalDocs,
      totalMedia: allMedia.totalDocs,
      mediaMapSize: mediaMap.size,
      updated,
      skipped,
      imagesReplaced,
      details: details.slice(0, 20),
      nextStep: updated > 0 ? `Frissítve ${updated} cikk, ${imagesReplaced} kép útvonal javítva! Futtasd újra, ha még van!` : 'Minden cikk képe már jó útvonalon van!',
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack?.substring(0, 2000) }, { status: 500 })
  }
}

