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
  
  // Numeric entities
  str = str.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try { return String.fromCharCode(parseInt(hex, 16)) } catch { return _ }
  })
  str = str.replace(/&#(\d+);/g, (_, dec) => {
    try { return String.fromCharCode(parseInt(dec, 10)) } catch { return _ }
  })
  
  // Named entities - comprehensive list
  const entities: Record<string, string> = {
    // Hungarian special
    'aacute': 'á', 'Aacute': 'Á', 'eacute': 'é', 'Eacute': 'É',
    'iacute': 'í', 'Iacute': 'Í', 'oacute': 'ó', 'Oacute': 'Ó',
    'uacute': 'ú', 'Uacute': 'Ú', 'ouml': 'ö', 'Ouml': 'Ö',
    'uuml': 'ü', 'Uuml': 'Ü', 'oelig': 'ő', 'OElig': 'Ő',
    'odblac': 'ő', 'Odblac': 'Ő', 'udblac': 'ű', 'Udblac': 'Ű',
    'abreve': 'ă', 'Abreve': 'Ă', // sometimes
    // Common
    'nbsp': ' ', 'amp': '&', 'lt': '<', 'gt': '>', 'quot': '"', 'apos': "'",
    'laquo': '«', 'raquo': '»', 'ndash': '–', 'mdash': '—',
    'ldquo': '“', 'rdquo': '”', 'lsquo': '‘', 'rsquo': '’',
    'hellip': '…', 'copy': '©', 'reg': '®', 'trade': '™',
    'szlig': 'ß', 'agrave': 'à', 'Agrave': 'À', 'egrave': 'è', 'Egrave': 'È',
    'igrave': 'ì', 'Igrave': 'Ì', 'ograve': 'ò', 'Ograve': 'Ò', 'ugrave': 'ù', 'Ugrave': 'Ù',
    'acirc': 'â', 'Acirc': 'Â', 'ecirc': 'ê', 'Ecirc': 'Ê', 'icirc': 'î', 'Icirc': 'Î',
    'ocirc': 'ô', 'Ocirc': 'Ô', 'ucirc': 'û', 'Ucirc': 'Û',
    'atilde': 'ã', 'Atilde': 'Ã', 'ntilde': 'ñ', 'Ntilde': 'Ñ', 'otilde': 'õ', 'Otilde': 'Õ',
    'auml': 'ä', 'Auml': 'Ä', 'euml': 'ë', 'Euml': 'Ë', 'iuml': 'ï', 'Iuml': 'Ï',
    'ouml2': 'ö', 'uuml2': 'ü', // fallback
    'aring': 'å', 'Aring': 'Å', 'aelig': 'æ', 'AElig': 'Æ', 'oslash': 'ø', 'Oslash': 'Ø',
    'ccedil': 'ç', 'Ccedil': 'Ç', 'eth': 'ð', 'ETH': 'Ð', 'thorn': 'þ', 'THORN': 'Þ',
  }
  
  // Joomla sometimes uses &ouml; etc without semicolon? Handle both
  str = str.replace(/&([a-zA-Z]+);/g, (match, name) => {
    if (entities[name] !== undefined) return entities[name]
    // Try lowercase
    const lower = name.toLowerCase()
    if (entities[lower] !== undefined) return entities[lower]
    return match // keep if unknown
  })
  
  // Also handle &ouml without semicolon edge (rare)
  // Already handled common with semicolon
  
  return str
}

function htmlToLexicalWithMediaBlocksV5(html: string, mediaMap: Map<string, { id: string | number }>): any {
  const rootChildren: any[] = []
  
  // First decode entire HTML
  let decodedHtml = decodeHtmlEntities(html)
  
  // Remove scripts/styles
  decodedHtml = decodedHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  
  // Split by img tags but keep them
  const parts = decodedHtml.split(/(<img[^>]+>)/gi)
  let paragraphBuffer = ''

  const flushParagraph = () => {
    if (paragraphBuffer.trim()) {
      let text = paragraphBuffer
        // Convert <br> to newline
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      
      // Further split by double newlines from original <p> tags
      // Since we already stripped tags, we need to handle paragraphs from original HTML structure
      // Let's re-extract paragraphs before stripping
      if (text) {
        // Clean up
        text = text.replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n').trim()
        const paragraphs = text.split(/\n\s*\n/)
        for (const para of paragraphs) {
          let trimmed = para.replace(/\s+/g, ' ').trim()
          if (trimmed && trimmed.length > 2) {
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

  // Better: parse original decodedHtml with paragraph awareness
  // Reset and use more accurate method
  rootChildren.length = 0
  paragraphBuffer = ''
  
  for (const part of parts) {
    if (!part) continue
    if (part.toLowerCase().startsWith('<img')) {
      // Flush text before image
      if (paragraphBuffer.trim()) {
        let textContent = paragraphBuffer
        // Extract text between tags
        textContent = textContent.replace(/<\/p>/gi, '\n\n').replace(/<\/div>/gi, '\n\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
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
          // Try without encoding
          const decodedFilename = decodeURIComponent(filename)
          mediaInfo = mediaMap.get(decodedFilename) || mediaMap.get(decodedFilename.toLowerCase())
        }
        if (!mediaInfo) {
          for (const [key, info] of mediaMap.entries()) {
            if (key.toLowerCase() === filename.toLowerCase() || key.toLowerCase().includes(filename.toLowerCase())) { 
              mediaInfo = info; break 
            }
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
  
  // Flush remaining
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
        // Also add decoded version
        try {
          const decoded = decodeURIComponent(filename)
          if (decoded !== filename) {
            mediaMap.set(decoded, { id: m.id })
            mediaMap.set(decoded.toLowerCase(), { id: m.id })
          }
        } catch {}
      }
    }
    
    const allPosts = await payload.find({ collection: 'posts', limit: 500 })
    const postMap = new Map<string, any>()
    for (const p of allPosts.docs as any[]) postMap.set(p.title, p)
    
    let alreadyFixed = 0
    let needFixingTotal = 0
    let noImagesTotal = 0
    let brokenEntityTotal = 0
    
    // First pass: count
    for (const article of articles) {
      const title = article.title || article.Title
      if (!title) continue
      const post = postMap.get(title)
      if (!post) { noImagesTotal++; continue }
      
      const introtext = String(article.introtext || article.intro || '')
      const fulltext = String(article.fulltext || article.full || '')
      const combinedHtml = `${introtext}\n${fulltext}`.trim()
      const hasImagesInSource = combinedHtml.includes('<img')
      
      if (!hasImagesInSource) { 
        // Check if it has broken entities
        const contentStr = JSON.stringify(post.content || '')
        if (contentStr.includes('&ouml;') || contentStr.includes('&aacute;') || contentStr.includes('&eacute;')) {
          brokenEntityTotal++
          needFixingTotal++
        } else {
          noImagesTotal++
        }
        continue
      }
      
      const contentStr = JSON.stringify(post.content || '')
      const hasBrokenEntities = contentStr.includes('&ouml;') || contentStr.includes('&aacute;') || contentStr.includes('&eacute;') || contentStr.includes('&uuml;')
      
      // For V5, we want to re-fix ALL that have broken entities OR wrong count
      if (hasBrokenEntities) {
        needFixingTotal++
      } else {
        const hasMediaBlock = contentStr.includes('mediaBlock')
        const hasWrongUpload = contentStr.includes('"type":"upload"')
        if (hasMediaBlock && !hasWrongUpload && !hasBrokenEntities) alreadyFixed++
        else needFixingTotal++
      }
    }
    
    let updated = 0
    let imagesFound = 0
    let entitiesFixed = 0
    const details: string[] = []
    
    for (const article of articles) {
      const title = article.title || article.Title
      if (!title) continue
      const post = postMap.get(title)
      if (!post) continue
      
      const introtext = String(article.introtext || article.intro || '')
      const fulltext = String(article.fulltext || article.full || '')
      const combinedHtml = `${introtext}\n${fulltext}`.trim()
      const hasImagesInSource = combinedHtml.includes('<img')
      
      const contentStr = JSON.stringify(post.content || '')
      const hasBrokenEntities = contentStr.includes('&ouml;') || contentStr.includes('&aacute;') || contentStr.includes('&eacute;') || contentStr.includes('&uuml;') || contentStr.includes('&szlig;') || contentStr.includes('T&')
      
      if (!hasImagesInSource && !hasBrokenEntities) continue
      
      // Skip if already fixed and no broken entities (for first runs of V5, we want to re-fix broken ones)
      if (!hasBrokenEntities) {
        const hasMediaBlock = contentStr.includes('mediaBlock')
        const hasWrongUpload = contentStr.includes('"type":"upload"')
        // For V5, re-process everything that has broken entities, OR if image count mismatch
        // Count images in source vs in content
        const sourceImgCount = (combinedHtml.match(/<img[^>]+>/gi) || []).length
        const contentImgCount = (contentStr.match(/mediaBlock/g) || []).length
        if (hasMediaBlock && !hasWrongUpload && sourceImgCount === contentImgCount) {
          // Already good
          continue
        }
      }
      
      const lexicalContent = htmlToLexicalWithMediaBlocksV5(combinedHtml, mediaMap)
      const imgMatches = combinedHtml.match(/<img[^>]+>/gi) || []
      
      try {
        await payload.update({ collection: 'posts', id: post.id, data: { content: lexicalContent } as any })
        updated++
        imagesFound += imgMatches.length
        if (hasBrokenEntities) entitiesFixed++
        if (details.length < 20) details.push(`${String(title).substring(0,45)}: ${imgMatches.length} kép${hasBrokenEntities ? ' + ékezet fix' : ''}`)
      } catch (e: any) {
        details.push(`Hiba ${String(title).substring(0,30)}: ${e.message.substring(0,150)}`)
      }
      if (updated >= 50) break
    }
    
    const remaining = needFixingTotal - updated
    
    return NextResponse.json({
      success: true,
      version: 'V5 - HTML entity decode + multi-image',
      totalArticlesInJson: articles.length,
      totalPostsInDb: allPosts.totalDocs,
      totalMedia: allMedia.totalDocs,
      alreadyFixed,
      needFixingTotal,
      noImagesTotal,
      brokenEntityTotal,
      updatedThisRun: updated,
      imagesFoundThisRun: imagesFound,
      entitiesFixedThisRun: entitiesFixed,
      remaining,
      details,
      nextStep: remaining > 0 
        ? `V5: Frissítve ${updated} cikk! ${imagesFound} kép, ${entitiesFixed} ékezet javítva! Már ${alreadyFixed + updated} kész, még ${remaining} hátra! Futtasd újra!` 
        : `V5 KÉSZ! Minden cikk javítva! ${alreadyFixed + updated} cikk! Ékezetek dekódolva, több kép berakva! Nézd meg: "Újjáélesztettük az erdészeti és faipari sportnapokat" - már 4 kép + rendes ékezetek!`,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack?.substring(0, 4000) }, { status: 500 })
  }
}
