import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'
import path from 'path'

function htmlToLexical(html: string, mediaMap: Map<string, { id: string, url: string }>): any {
  // Simple HTML to Lexical conversion
  // Split by img tags
  const rootChildren: any[] = []
  
  // Remove script, style tags
  let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  
  // Split by img tags, keep img tags
  const parts = cleanHtml.split(/(<img[^>]+>)/gi)
  
  let paragraphBuffer = ''
  
  const flushParagraph = () => {
    if (paragraphBuffer.trim()) {
      // Strip remaining HTML tags for text
      let text = paragraphBuffer
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim()
      
      if (text) {
        // Split by double newlines into paragraphs
        const paragraphs = text.split(/\n\s*\n/)
        for (const para of paragraphs) {
          const trimmed = para.trim()
          if (trimmed) {
            rootChildren.push({
              type: 'paragraph',
              children: [{ type: 'text', text: trimmed, version: 1 }],
              direction: 'ltr',
              format: '',
              indent: 0,
              version: 1,
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
      // It's an image tag
      flushParagraph()
      
      // Extract src
      const srcMatch = part.match(/src=["']([^"']+)["']/i)
      if (srcMatch) {
        const oldSrc = srcMatch[1]
        const filename = path.basename(oldSrc.split('?')[0].split('#')[0])
        let mediaInfo = mediaMap.get(filename) || mediaMap.get(filename.toLowerCase())
        if (!mediaInfo) {
          for (const [key, info] of mediaMap.entries()) {
            if (key.toLowerCase() === filename.toLowerCase()) { mediaInfo = info; break }
          }
        }
        
        if (mediaInfo) {
          // Create upload node for Lexical
          rootChildren.push({
            type: 'upload',
            value: { id: mediaInfo.id },
            relationTo: 'media',
            fields: {
              alt: filename,
            },
            format: '',
            version: 2,
          })
        } else {
          // If media not found, keep as text placeholder
          rootChildren.push({
            type: 'paragraph',
            children: [{ type: 'text', text: `[Kép: ${filename}]`, version: 1 }],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          })
        }
      }
    } else {
      // Text/HTML part
      paragraphBuffer += part
    }
  }
  
  flushParagraph()
  
  // If no children, create at least one empty paragraph
  if (rootChildren.length === 0) {
    rootChildren.push({
      type: 'paragraph',
      children: [{ type: 'text', text: '', version: 1 }],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    })
  }
  
  return {
    root: {
      type: 'root',
      children: rootChildren,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

export async function GET() {
  try {
    const payload = await getPayload({ config })
    
    // Find j2xml-parsed.json
    const possiblePaths = [
      path.join(process.cwd(), 'src/seed/j2xml-parsed.json'),
      path.join(process.cwd(), 'src/seed/j2xml-parsed-en.json'),
    ]
    let jsonPath = ''
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) { jsonPath = p; break }
    }
    if (!jsonPath) {
      const seedDir = path.join(process.cwd(), 'src/seed')
      if (fs.existsSync(seedDir)) {
        const files = fs.readdirSync(seedDir)
        for (const f of files) {
          if (f.includes('j2xml') && f.endsWith('.json')) {
            jsonPath = path.join(seedDir, f)
            break
          }
        }
      }
    }
    if (!jsonPath) {
      return NextResponse.json({ success: false, error: 'j2xml-parsed.json nem található!' }, { status: 404 })
    }
    
    const raw = fs.readFileSync(jsonPath, 'utf-8')
    const data = JSON.parse(raw)
    const articles = Array.isArray(data) ? data : data.articles || data.items || []
    
    // Media map filename -> { id, url }
    const allMedia = await payload.find({ collection: 'media', limit: 1000 })
    const mediaMap = new Map<string, { id: string, url: string }>()
    for (const m of allMedia.docs as any[]) {
      const filename = m.filename || path.basename(m.url || '')
      if (filename) {
        mediaMap.set(filename, { id: m.id, url: m.url })
        mediaMap.set(filename.toLowerCase(), { id: m.id, url: m.url })
      }
    }
    
    let updated = 0
    let skipped = 0
    let imagesFound = 0
    const details: string[] = []
    
    for (const article of articles.slice(0, 150)) {
      const title = article.title || article.Title
      if (!title) continue
      
      const introtext = String(article.introtext || article.intro || '')
      const fulltext = String(article.fulltext || article.full || '')
      const combinedHtml = `${introtext}\n${fulltext}`.trim()
      
      if (!combinedHtml) continue
      
      // Find existing post
      const found = await payload.find({ collection: 'posts', where: { title: { equals: title } }, limit: 1 })
      if (!found.docs[0]) {
        skipped++
        continue
      }
      
      const post = found.docs[0] as any
      
      // Count images in HTML
      const imgMatches = combinedHtml.match(/<img[^>]+>/gi) || []
      
      // Convert HTML to Lexical
      const lexicalContent = htmlToLexical(combinedHtml, mediaMap)
      
      try {
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: { content: lexicalContent } as any,
        })
        updated++
        imagesFound += imgMatches.length
        if (details.length < 10) {
          details.push(`${String(title).substring(0, 50)}: ${imgMatches.length} kép`)
        }
      } catch (e: any) {
        details.push(`Hiba ${String(title).substring(0, 30)}: ${e.message.substring(0, 200)}`)
      }
      
      if (updated >= 50) break
    }
    
    return NextResponse.json({
      success: true,
      jsonPath,
      totalArticlesInJson: articles.length,
      totalMedia: allMedia.totalDocs,
      mediaMapSize: mediaMap.size,
      updated,
      skipped,
      imagesFound,
      details,
      nextStep: updated > 0 ? `Frissítve ${updated} cikk Lexical formátumra, ${imagesFound} képpel! Nézd meg adminban egy cikket!` : 'Nincs frissítendő cikk!',
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack?.substring(0, 3000) }, { status: 500 })
  }
}
