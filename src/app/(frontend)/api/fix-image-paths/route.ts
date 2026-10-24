import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import path from 'path'

function replaceInRichText(node: any, mediaMap: Map<string, string>, mediaMapLower: Map<string, string>): { replaced: number, changed: boolean } {
  let replaced = 0
  let changed = false

  if (!node) return { replaced, changed }

  if (Array.isArray(node)) {
    for (const child of node) {
      const res = replaceInRichText(child, mediaMap, mediaMapLower)
      replaced += res.replaced
      if (res.changed) changed = true
    }
    return { replaced, changed }
  }

  if (typeof node === 'object') {
    // Check if node is an image node
    // Lexical image node often has type: 'upload' or type: 'image' with fields
    if (node.type === 'upload' || node.type === 'image') {
      // Check if it has a src or url that is old Joomla path
      const src = node.fields?.url || node.url || node.src || node.fields?.src || ''
      if (src && (src.includes('images/') || src.includes('image/'))) {
        const filename = path.basename(src.split('?')[0].split('#')[0])
        let newUrl = mediaMap.get(filename) || mediaMapLower.get(filename.toLowerCase())
        if (!newUrl) {
          for (const [key, url] of mediaMap.entries()) {
            if (key.toLowerCase() === filename.toLowerCase()) { newUrl = url; break }
          }
        }
        if (newUrl && newUrl !== src) {
          // Update node
          if (node.fields?.url) node.fields.url = newUrl
          if (node.url) node.url = newUrl
          if (node.src) node.src = newUrl
          if (node.fields?.src) node.fields.src = newUrl
          replaced++
          changed = true
        }
      }
    }

    // Check for HTML in text nodes: <img src="images/...">
    if (node.text && typeof node.text === 'string' && node.text.includes('images/')) {
      let newText = node.text
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
      let match
      let localReplaced = 0
      // Need to find all oldSrc in text
      const replacements: Array<{ oldSrc: string, newSrc: string }> = []
      while ((match = imgRegex.exec(node.text)) !== null) {
        const oldSrc = match[1]
        const filename = path.basename(oldSrc.split('?')[0].split('#')[0])
        let newUrl = mediaMap.get(filename) || mediaMapLower.get(filename.toLowerCase())
        if (!newUrl) {
          for (const [key, url] of mediaMap.entries()) {
            if (key.toLowerCase() === filename.toLowerCase()) { newUrl = url; break }
          }
        }
        if (newUrl && newUrl !== oldSrc) {
          replacements.push({ oldSrc, newSrc: newUrl })
        }
      }
      for (const rep of replacements) {
        const escapedOld = rep.oldSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(escapedOld, 'g')
        newText = newText.replace(regex, rep.newSrc)
        localReplaced++
      }
      if (localReplaced > 0) {
        node.text = newText
        replaced += localReplaced
        changed = true
      }
    }

    // Recurse into children and other object properties
    for (const key of Object.keys(node)) {
      if (key === 'text') continue // already handled
      const val = (node as any)[key]
      if (typeof val === 'object' && val !== null) {
        const res = replaceInRichText(val, mediaMap, mediaMapLower)
        replaced += res.replaced
        if (res.changed) changed = true
      }
    }
  }

  return { replaced, changed }
}

export async function GET() {
  try {
    const payload = await getPayload({ config })
    const allMedia = await payload.find({ collection: 'media', limit: 1000 })
    const mediaMap = new Map<string, string>()
    const mediaMapLower = new Map<string, string>()
    for (const m of allMedia.docs as any[]) {
      const filename = m.filename || path.basename(m.url || '')
      if (filename) {
        mediaMap.set(filename, m.url)
        mediaMapLower.set(filename.toLowerCase(), m.url)
      }
    }

    const allPosts = await payload.find({ collection: 'posts', limit: 500 })
    
    let updated = 0, skipped = 0, imagesReplaced = 0
    const details: string[] = []
    const sampleContents: string[] = []

    for (const post of allPosts.docs as any[]) {
      let content = post.content || ''
      let richText = post.richText || null
      let changed = false
      let replacedInThisPost = 0

      // Check content (HTML string)
      if (content && typeof content === 'string' && content.includes('images/')) {
        const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
        let match
        const replacements: Array<{ oldSrc: string, newSrc: string }> = []
        while ((match = imgRegex.exec(content)) !== null) {
          const oldSrc = match[1]
          const filename = path.basename(oldSrc.split('?')[0].split('#')[0])
          let newUrl = mediaMap.get(filename) || mediaMapLower.get(filename.toLowerCase())
          if (!newUrl) {
            for (const [key, url] of mediaMap.entries()) {
              if (key.toLowerCase() === filename.toLowerCase()) { newUrl = url; break }
            }
          }
          if (newUrl && newUrl !== oldSrc) {
            replacements.push({ oldSrc, newSrc: newUrl })
          }
        }
        for (const rep of replacements) {
          const escapedOld = rep.oldSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const regex = new RegExp(escapedOld, 'g')
          content = content.replace(regex, rep.newSrc)
          replacedInThisPost++
        }
        if (replacements.length > 0) changed = true
      }

      // Check richText (JSON)
      if (richText) {
        const res = replaceInRichText(richText, mediaMap, mediaMapLower)
        if (res.changed) {
          changed = true
          replacedInThisPost += res.replaced
        }
      }

      // For debugging, save first few post contents
      if (sampleContents.length < 3) {
        sampleContents.push(`Post: ${post.title?.substring(0, 30)} | content has images/: ${content.includes('images/')} | richText has images/: ${JSON.stringify(richText)?.includes('images/')} | content length: ${content.length} | richText type: ${typeof richText}`)
      }

      if (changed && replacedInThisPost > 0) {
        try {
          const updateData: any = {}
          if (content !== post.content) updateData.content = content
          if (richText) updateData.richText = richText
          
          await payload.update({ collection: 'posts', id: post.id, data: updateData })
          updated++
          imagesReplaced += replacedInThisPost
          details.push(`${post.title?.substring(0, 50)}: ${replacedInThisPost} kép javítva`)
        } catch (e: any) {
          details.push(`Hiba ${post.title}: ${e.message}`)
        }
      } else {
        skipped++
      }

      if (updated >= 100) break
    }

    return NextResponse.json({
      success: true,
      totalPosts: allPosts.totalDocs,
      totalMedia: allMedia.totalDocs,
      updated,
      skipped,
      imagesReplaced,
      details: details.slice(0, 20),
      sampleDebug: sampleContents,
      nextStep: updated > 0 ? `Frissítve ${updated} cikk, ${imagesReplaced} kép!` : 'Nincs images/ a content-ben és richText-ben! Lehet, hogy máshol van a kép hivatkozás, nézd meg a sampleDebug-et!',
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack?.substring(0, 3000) }, { status: 500 })
  }
}
