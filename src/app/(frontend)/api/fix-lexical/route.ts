import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'
import path from 'path'

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function htmlToLexicalWithMediaBlocks(html: string, mediaMap: Map<string, { id: string | number }>): any {
  const rootChildren: any[] = []
  let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  const parts = cleanHtml.split(/(<img[^>]+>)/gi)
  let paragraphBuffer = ''

  const flushParagraph = () => {
    if (paragraphBuffer.trim()) {
      let text = paragraphBuffer.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim()
      if (text) {
        const paragraphs = text.split(/\n\s*\n/)
        for (const para of paragraphs) {
          const trimmed = para.trim()
          if (trimmed) {
            rootChildren.push({
              type: 'paragraph', format: '', indent: 0, version: 1,
              children: [{ mode: 'normal', text: trimmed, type: 'text', style: '', detail: 0, format: 0, version: 1 }],
              direction: null, textStyle: '', textFormat: 0,
            })
          }
        }
      }
      paragraphBuffer = ''
    }
  }

  for (const part of parts) {
    if (!part) continue
    if (part.toLowerCase().startsWith('<img')) {
      flushParagraph()
      const srcMatch = part.match(/src=["']([^"']+)["']/i)
      if (srcMatch) {
        const filename = path.basename(srcMatch[1].split('?')[0].split('#')[0])
        let mediaInfo = mediaMap.get(filename) || mediaMap.get(filename.toLowerCase())
        if (!mediaInfo) {
          for (const [key, info] of mediaMap.entries()) {
            if (key.toLowerCase() === filename.toLowerCase()) { mediaInfo = info; break }
          }
        }
        if (mediaInfo) {
          rootChildren.push({
            type: 'block',
            fields: { id: generateId(), media: mediaInfo.id, blockName: '', blockType: 'mediaBlock' },
            format: '', version: 2,
          })
        }
      }
    } else {
      paragraphBuffer += part
    }
  }
  flushParagraph()
  if (rootChildren.length === 0) {
    rootChildren.push({
      type: 'paragraph', format: '', indent: 0, version: 1,
      children: [{ mode: 'normal', text: '', type: 'text', style: '', detail: 0, format: 0, version: 1 }],
      direction: null, textStyle: '', textFormat: 0,
    })
  }
  return { root: { type: 'root', format: '', indent: 0, version: 1, children: rootChildren, direction: null } }
}

export async function GET() {
  try {
    const payload = await getPayload({ config })
    const jsonPath = path.join(process.cwd(), 'src/seed/j2xml-parsed.json')
    if (!fs.existsSync(jsonPath)) return NextResponse.json({ success: false, error: 'j2xml-parsed.json nem található!' }, { status: 404 })
    
    const raw = fs.readFileSync(jsonPath, 'utf-8')
    const data = JSON.parse(raw)
    const articles = Array.isArray(data) ? data : data.articles || data.items || []
    
    const allMedia = await payload.find({ collection: 'media', limit: 1000 })
    const mediaMap = new Map<string, { id: string | number }>()
    for (const m of allMedia.docs as any[]) {
      const filename = m.filename || path.basename(m.url || '')
      if (filename) {
        mediaMap.set(filename, { id: m.id })
        mediaMap.set(filename.toLowerCase(), { id: m.id })
      }
    }
    
    const allPosts = await payload.find({ collection: 'posts', limit: 500 })
    const postMap = new Map<string, any>()
    for (const p of allPosts.docs as any[]) postMap.set(p.title, p)
    
    // Count already fixed vs need fixing
    let alreadyFixed = 0
    let needFixingTotal = 0
    let noImagesTotal = 0
    
    for (const article of articles) {
      const title = article.title || article.Title
      if (!title) continue
      const post = postMap.get(title)
      if (!post) { noImagesTotal++; continue }
      
      const introtext = String(article.introtext || article.intro || '')
      const fulltext = String(article.fulltext || article.full || '')
      const combinedHtml = `${introtext}\n${fulltext}`.trim()
      const hasImagesInSource = combinedHtml.includes('<img')
      
      if (!hasImagesInSource) { noImagesTotal++; continue }
      
      const contentStr = JSON.stringify(post.content || '')
      const hasMediaBlock = contentStr.includes('mediaBlock')
      const hasWrongUpload = contentStr.includes('"type":"upload"')
      
      if (hasMediaBlock && !hasWrongUpload) alreadyFixed++
      else needFixingTotal++
    }
    
    let updated = 0
    let imagesFound = 0
    const details: string[] = []
    
    for (const article of articles) {
      const title = article.title || article.Title
      if (!title) continue
      const post = postMap.get(title)
      if (!post) continue
      
      const introtext = String(article.introtext || article.intro || '')
      const fulltext = String(article.fulltext || article.full || '')
      const combinedHtml = `${introtext}\n${fulltext}`.trim()
      if (!combinedHtml.includes('<img')) continue
      
      const contentStr = JSON.stringify(post.content || '')
      const hasMediaBlock = contentStr.includes('mediaBlock')
      const hasWrongUpload = contentStr.includes('"type":"upload"')
      if (hasMediaBlock && !hasWrongUpload) continue
      
      const lexicalContent = htmlToLexicalWithMediaBlocks(combinedHtml, mediaMap)
      const imgMatches = combinedHtml.match(/<img[^>]+>/gi) || []
      
      try {
        await payload.update({ collection: 'posts', id: post.id, data: { content: lexicalContent } as any })
        updated++
        imagesFound += imgMatches.length
        if (details.length < 15) details.push(`${String(title).substring(0,50)}: ${imgMatches.length} kép`)
      } catch (e: any) {
        details.push(`Hiba ${String(title).substring(0,30)}: ${e.message.substring(0,150)}`)
      }
      if (updated >= 50) break
    }
    
    const remaining = needFixingTotal - updated
    
    return NextResponse.json({
      success: true,
      totalArticlesInJson: articles.length,
      totalPostsInDb: allPosts.totalDocs,
      totalMedia: allMedia.totalDocs,
      alreadyFixed,
      needFixingTotal,
      noImagesTotal,
      updatedThisRun: updated,
      imagesFoundThisRun: imagesFound,
      remaining,
      details,
      nextStep: remaining > 0 ? `Frissítve ${updated} cikk! Már ${alreadyFixed + updated} kész, még ${remaining} hátra! Futtasd újra!` : `KÉSZ! Minden cikk MediaBlock formátumban! ${alreadyFixed + updated} cikk képekkel!`,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack?.substring(0, 3000) }, { status: 500 })
  }
}
