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
  }
  str = str.replace(/&([a-zA-Z]+);/g, (match, name) => entities[name] !== undefined ? entities[name] : entities[name.toLowerCase()] !== undefined ? entities[name.toLowerCase()] : match)
  return str
}

function htmlToLexical(html: string, mediaMap: Map<string, { id: any }>): any {
  const rootChildren: any[] = []
  let decodedHtml = decodeHtmlEntities(html)
  decodedHtml = decodedHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  const parts = decodedHtml.split(/(<img[^>]+>)/gi)
  let buf = ''
  const flush = () => {
    if (buf.trim()) {
      let txt = buf.replace(/<\/p>/gi, '\n\n').replace(/<\/div>/gi, '\n\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const paras = txt.split(/\n\s*\n|\n/)
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
      buf = ''
    }
  }
  for (const part of parts) {
    if (!part) continue
    if (part.toLowerCase().startsWith('<img')) {
      flush()
      const m = part.match(/src=["']([^"']+)["']/i)
      if (m) {
        const fn = path.basename(m[1].split('?')[0].split('#')[0])
        let info = mediaMap.get(fn) || mediaMap.get(fn.toLowerCase())
        if (!info) {
          for (const [k, v] of mediaMap.entries()) if (k.toLowerCase() === fn.toLowerCase()) { info = v; break }
        }
        if (info) {
          rootChildren.push({ type: 'block', fields: { id: generateId(), media: info.id, blockName: '', blockType: 'mediaBlock' }, format: '', version: 2 })
        }
      }
    } else buf += part
  }
  flush()
  if (rootChildren.length === 0) {
    rootChildren.push({ type: 'paragraph', format: '', indent: 0, version: 1, children: [{ mode: 'normal', text: '', type: 'text', style: '', detail: 0, format: 0, version: 1 }], direction: null, textStyle: '', textFormat: 0 })
  }
  return { root: { type: 'root', format: '', indent: 0, version: 1, children: rootChildren, direction: null } }
}

export async function GET() {
  try {
    const payload = await getPayload({ config })
    const possiblePaths = [
      path.join(process.cwd(), 'src/seed/j2xml-parsed-full.json'),
      path.join(process.cwd(), 'src/seed/j2xml-parsed.json'),
    ]
    let jsonPath = ''
    for (const p of possiblePaths) if (fs.existsSync(p)) { jsonPath = p; break }
    if (!jsonPath) return NextResponse.json({ success: false, error: 'JSON nem található' }, { status: 404 })
    
    const raw = fs.readFileSync(jsonPath, 'utf-8')
    const articles = JSON.parse(raw)
    
    const allMedia = await payload.find({ collection: 'media', limit: 1000 })
    const mediaMap = new Map<string, { id: any }>()
    for (const m of allMedia.docs as any[]) {
      const fn = m.filename || path.basename(m.url || '')
      if (fn) { mediaMap.set(fn, { id: m.id }); mediaMap.set(fn.toLowerCase(), { id: m.id }) }
    }
    
    const allPosts = await payload.find({ collection: 'posts', limit: 500 })
    const postMap = new Map<string, any>()
    for (const p of allPosts.docs as any[]) postMap.set(p.title, p)
    
    let alreadyFixed = 0, needFixingTotal = 0, noImagesTotal = 0, totalSourceImgs = 0
    
    for (const article of articles) {
      const title = article.title || article.Title
      if (!title) continue
      const post = postMap.get(title)
      if (!post) { noImagesTotal++; continue }
      
      const intro = String(article.introtext || article.intro || '')
      const full = String(article.fulltext || article.full || '')
      const combined = `${intro}\n${full}`.trim()
      const sourceImgs = (combined.match(/<img/gi) || []).length
      totalSourceImgs += sourceImgs
      
      if (sourceImgs === 0) { noImagesTotal++; continue }
      
      const contentStr = JSON.stringify(post.content || '')
      const currentImgs = (contentStr.match(/mediaBlock/g) || []).length
      const hasBroken = contentStr.includes('&ouml;') || contentStr.includes('&aacute;') || contentStr.includes('&eacute;')
      
      if (!hasBroken && sourceImgs === currentImgs) alreadyFixed++
      else needFixingTotal++
    }
    
    let updated = 0, imagesFound = 0
    const details: string[] = []
    
    for (const article of articles) {
      if (updated >= 50) break
      const title = article.title || article.Title
      if (!title) continue
      const post = postMap.get(title)
      if (!post) continue
      
      const intro = String(article.introtext || article.intro || '')
      const full = String(article.fulltext || article.full || '')
      const combined = `${intro}\n${full}`.trim()
      const sourceImgs = (combined.match(/<img/gi) || []).length
      if (sourceImgs === 0) continue
      
      const contentStr = JSON.stringify(post.content || '')
      const currentImgs = (contentStr.match(/mediaBlock/g) || []).length
      const hasBroken = contentStr.includes('&ouml;') || contentStr.includes('&aacute;') || contentStr.includes('&eacute;')
      
      if (!hasBroken && sourceImgs === currentImgs) continue
      
      const lexical = htmlToLexical(combined, mediaMap)
      try {
        await payload.update({ collection: 'posts', id: post.id, data: { content: lexical } as any })
        updated++
        imagesFound += sourceImgs
        if (details.length < 15) details.push(`${String(title).substring(0,50)}: ${sourceImgs} kép (most ${currentImgs} volt)`)
      } catch (e: any) {
        details.push(`Hiba ${String(title).substring(0,30)}: ${e.message.substring(0,100)}`)
      }
    }
    
    const remaining = needFixingTotal - updated
    
    return NextResponse.json({
      success: true,
      version: 'V7 - Progress with counts',
      jsonPath,
      totalArticles: articles.length,
      totalPosts: allPosts.totalDocs,
      totalMedia: allMedia.totalDocs,
      totalSourceImages: totalSourceImgs,
      alreadyFixed,
      needFixingTotal,
      noImagesTotal,
      updatedThisRun: updated,
      imagesFoundThisRun: imagesFound,
      remaining,
      details,
      progress: `${alreadyFixed} kész + ${updated} most = ${alreadyFixed + updated} / ${alreadyFixed + needFixingTotal} képpel rendelkező cikk`,
      nextStep: remaining > 0 ? `Még ${remaining} cikk hátra! Futtasd újra!` : `KÉSZ! Minden ${alreadyFixed + updated} képes cikk javítva! ${totalSourceImgs} kép összesen!`,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack?.substring(0, 4000) }, { status: 500 })
  }
}
