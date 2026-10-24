import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import path from 'path'

function safeIncludes(str: any, search: string): boolean {
  return typeof str === 'string' && str.includes(search)
}

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
    // Check if node is an image/upload node
    if (node.type === 'upload' || node.type === 'image') {
      const rawSrc = node.fields?.url || node.url || node.src || node.fields?.src || ''
      const src = typeof rawSrc === 'string' ? rawSrc : (rawSrc?.url || rawSrc?.filename || '')
      if (safeIncludes(src, 'images/') || safeIncludes(src, 'image/')) {
        const filename = path.basename(String(src).split('?')[0].split('#')[0])
        let newUrl = mediaMap.get(filename) || mediaMapLower.get(filename.toLowerCase())
        if (!newUrl) {
          for (const [key, url] of mediaMap.entries()) {
            if (key.toLowerCase() === filename.toLowerCase()) { newUrl = url; break }
          }
        }
        if (newUrl && newUrl !== src) {
          if (node.fields?.url && typeof node.fields.url === 'string') node.fields.url = newUrl
          if (typeof node.url === 'string') node.url = newUrl
          if (typeof node.src === 'string') node.src = newUrl
          if (node.fields?.src && typeof node.fields.src === 'string') node.fields.src = newUrl
          replaced++; changed = true
        }
      }
    }
    // Check text nodes with HTML
    if (typeof node.text === 'string' && safeIncludes(node.text, 'images/')) {
      let newText = node.text
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
      let match
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
      }
      if (replacements.length > 0) {
        node.text = newText
        replaced += replacements.length
        changed = true
      }
    }
    for (const key of Object.keys(node)) {
      if (key === 'text') continue
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
      const filename = m.filename || (m.url ? path.basename(m.url) : '')
      if (filename) {
        mediaMap.set(filename, m.url)
        mediaMapLower.set(filename.toLowerCase(), m.url)
      }
    }
    const allPosts = await payload.find({ collection: 'posts', limit: 300 })
    let updated = 0, skipped = 0, imagesReplaced = 0
    const details: string[] = []
    const sampleDebug: string[] = []

    for (const post of allPosts.docs as any[]) {
      let content = post.content || ''
      let richText = post.richText || null
      let changed = false
      let replacedInThisPost = 0

      if (typeof content === 'string' && safeIncludes(content, 'images/')) {
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
          if (newUrl && newUrl !== oldSrc) replacements.push({ oldSrc, newSrc: newUrl })
        }
        for (const rep of replacements) {
          const escapedOld = rep.oldSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          content = content.replace(new RegExp(escapedOld, 'g'), rep.newSrc)
          replacedInThisPost++
        }
        if (replacements.length > 0) changed = true
      }

      if (richText) {
        const res = replaceInRichText(richText, mediaMap, mediaMapLower)
        if (res.changed) { changed = true; replacedInThisPost += res.replaced }
      }

      if (sampleDebug.length < 3) {
        const hasImagesContent = typeof content === 'string' ? content.includes('images/') : false
        const richTextStr = JSON.stringify(richText || '').substring(0, 500)
        const hasImagesRich = richTextStr.includes('images/')
        sampleDebug.push(`Post: ${String(post.title || '').substring(0,30)} | content images/: ${hasImagesContent} | richText images/: ${hasImagesRich} | richText sample: ${richTextStr.substring(0,200)}`)
      }

      if (changed && replacedInThisPost > 0) {
        try {
          const updateData: any = {}
          if (content !== post.content) updateData.content = content
          if (richText) updateData.richText = richText
          await payload.update({ collection: 'posts', id: post.id, data: updateData })
          updated++; imagesReplaced += replacedInThisPost
          details.push(`${String(post.title || '').substring(0,50)}: ${replacedInThisPost} kép`)
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
      details: details.slice(0,20),
      sampleDebug,
      nextStep: updated > 0 ? `Frissítve ${updated} cikk!` : 'Nincs images/ a tartalomban - nézd sampleDebug-et!',
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack?.substring(0,3000) }, { status: 500 })
  }
}
