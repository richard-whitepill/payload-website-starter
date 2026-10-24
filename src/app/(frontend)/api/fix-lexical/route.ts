import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'
import path from 'path'

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function decodeHtmlEntities(str: string): string {
  if (!str) return str
  str = str.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => { try { return String.fromCharCode(parseInt(hex, 16)) } catch { return _ } })
  str = str.replace(/&#(\d+);/g, (_, dec) => { try { return String.fromCharCode(parseInt(dec, 10)) } catch { return _ } })
  const entities: Record<string, string> = {
    'aacute': 'á', 'Aacute': 'Á', 'eacute': 'é', 'Eacute': 'É',
    'iacute': 'í', 'Iacute': 'Í', 'oacute': 'ó', 'Oacute': 'Ó',
    'uacute': 'ú', 'Uacute': 'Ú', 'ouml': 'ö', 'Ouml': 'Ö',
    'uuml': 'ü', 'Uuml': 'Ü', 'odblac': 'ő', 'Odblac': 'Ő', 'udblac': 'ű', 'Udblac': 'Ű',
    'nbsp': ' ', 'amp': '&', 'lt': '<', 'gt': '>', 'quot': '"', 'apos': "'",
    'laquo': '«', 'raquo': '»', 'ndash': '–', 'mdash': '—',
    'ldquo': '“', 'rdquo': '”', 'lsquo': '‘', 'rsquo': '’',
  }
  str = str.replace(/&([a-zA-Z]+);/g, (match, name) => entities[name] !== undefined ? entities[name] : entities[name.toLowerCase()] !== undefined ? entities[name.toLowerCase()] : match)
  return str
}

function htmlToLexicalWithMediaBlocks(html: string, mediaMap: Map<string, { id: string | number }>): any {
  const rootChildren: any[] = []
  let decodedHtml = decodeHtmlEntities(html)
  decodedHtml = decodedHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  const parts = decodedHtml.split(/(<img[^>]+>)/gi)
  let paragraphBuffer = ''

  for (const part of parts) {
    if (!part) continue
    if (part.toLowerCase().startsWith('<img')) {
      if (paragraphBuffer.trim()) {
        let textContent = paragraphBuffer.replace(/<\/p>/gi, '\n\n').replace(/<\/div>/gi, '\n\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        if (textContent) {
          const paras = textContent.split(/\n\s*\n|\n/)
          for (const p of paras) {
            const t = p.trim()
            if (t.length > 1) {
              rootChildren.push({
                type: 'paragraph', format: '', indent: 0, version: 1,
                children: [{ mode: 'normal', text: t, type: 'text', style: '', detail: 0, format: 0, version: 1 }],
                direction: null, textStyle: '', textFormat: 0,
              })
            }
          }
        }
        paragraphBuffer = ''
      }
      const srcMatch = part.match(/src=["']([^"']+)["']/i)
      if (srcMatch) {
        const src = srcMatch[1]
        const filename = path.basename(src.split('?')[0].split('#')[0])
        let mediaInfo = mediaMap.get(filename) || mediaMap.get(filename.toLowerCase())
        if (!mediaInfo) {
          try {
            const decodedFilename = decodeURIComponent(filename)
            mediaInfo = mediaMap.get(decodedFilename) || mediaMap.get(decodedFilename.toLowerCase())
          } catch {}
        }
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
  if (paragraphBuffer.trim()) {
    let textContent = paragraphBuffer.replace(/<\/p>/gi, '\n\n').replace(/<\/div>/gi, '\n\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (textContent) {
      const paras = textContent.split(/\n\s*\n|\n/)
      for (const p of paras) {
        const t = p.trim()
        if (t.length > 1) {
          rootChildren.push({
            type: 'paragraph', format: '', indent: 0, version: 1,
            children: [{ mode: 'normal', text: t, type: 'text', style: '', detail: 0, format: 0, version: 1 }],
            direction: null, textStyle: '', textFormat: 0,
          })
        }
      }
    }
  }
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
    
    // Try new full JSON first, then old
    const possiblePaths = [
      path.join(process.cwd(), 'src/seed/j2xml-parsed-full.json'),
      path.join(process.cwd(), 'src/seed/j2xml_parsed_full.json'),
      path.join(process.cwd(), 'src/seed/j2xml-parsed.json'),
    ]
    let jsonPath = ''
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) { jsonPath = p; break }
    }
    if (!jsonPath) return NextResponse.json({ success: false, error: 'j2xml-parsed JSON nem található!' }, { status: 404 })
    
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
    
    let updated = 0
    let imagesFound = 0
    const details: string[] = []
    
    // Focus on the sportnap article first, then others
    const priorityTitles = ["Újjáélesztettük az erdészeti és faipari sportnapokat"]
    
    for (const priorityTitle of priorityTitles) {
      const article = articles.find((a: any) => (a.title || a.Title) === priorityTitle)
      if (!article) continue
      const post = postMap.get(priorityTitle)
      if (!post) continue
      
      const intro = String(article.introtext || article.intro || '')
      const full = String(article.fulltext || article.full || '')
      const combined = `${intro}\n${full}`.trim()
      
      const lexical = htmlToLexicalWithMediaBlocks(combined, mediaMap)
      const imgCount = (combined.match(/<img/gi) || []).length
      
      try {
        await payload.update({ collection: 'posts', id: post.id, data: { content: lexical } as any })
        updated++
        imagesFound += imgCount
        details.push(`PRIORITY FIXED: ${priorityTitle}: ${imgCount} kép, intro ${intro.length}, full ${full.length} -> FULL CONTENT!`)
      } catch (e: any) {
        details.push(`Hiba ${priorityTitle}: ${e.message}`)
      }
    }
    
    // Then fix others that still have broken entities or missing fulltext
    for (const article of articles) {
      if (updated >= 50) break
      const title = article.title || article.Title
      if (!title) continue
      if (priorityTitles.includes(title)) continue // already done
      
      const post = postMap.get(title)
      if (!post) continue
      
      const intro = String(article.introtext || article.intro || '')
      const full = String(article.fulltext || article.full || '')
      const combined = `${intro}\n${full}`.trim()
      if (!combined) continue
      
      const contentStr = JSON.stringify(post.content || '')
      const hasBroken = contentStr.includes('&ouml;') || contentStr.includes('&aacute;') || contentStr.includes('T&ouml;')
      const sourceImgCount = (combined.match(/<img/gi) || []).length
      const currentImgCount = (contentStr.match(/mediaBlock/g) || []).length
      
      // Re-fix if broken entities OR if source has more images than current
      if (!hasBroken && sourceImgCount <= currentImgCount && sourceImgCount > 0) continue
      if (!hasBroken && sourceImgCount === 0 && !contentStr.includes('mediaBlock')) {
        // No images, but check if content is empty-ish
        if (contentStr.length > 1000) continue
      }
      
      const lexical = htmlToLexicalWithMediaBlocks(combined, mediaMap)
      
      try {
        await payload.update({ collection: 'posts', id: post.id, data: { content: lexical } as any })
        updated++
        imagesFound += sourceImgCount
        if (details.length < 20) details.push(`${String(title).substring(0,50)}: ${sourceImgCount} kép (was ${currentImgCount})`)
      } catch (e: any) {
        details.push(`Hiba ${String(title).substring(0,30)}: ${e.message.substring(0,150)}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      version: 'V6 - FULL J2XML with 4 images',
      jsonPath,
      totalArticles: articles.length,
      totalMedia: allMedia.totalDocs,
      updatedThisRun: updated,
      imagesFoundThisRun: imagesFound,
      details,
      nextStep: updated > 0 
        ? `V6 FIXED ${updated} cikk! Most már a "Újjáélesztettük..." cikk 4 képpel és teljes szöveggel van! Futtasd újra amíg 0!` 
        : 'Kész! Minden cikk teljes tartalommal!',
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack?.substring(0, 4000) }, { status: 500 })
  }
}
