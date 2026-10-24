import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

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

export async function GET() {
  try {
    const jsonPath = path.join(process.cwd(), 'src/seed/j2xml-parsed.json')
    const raw = fs.readFileSync(jsonPath, 'utf-8')
    const data = JSON.parse(raw)
    const articles = Array.isArray(data) ? data : data.articles || data.items || []
    
    const matches = articles.filter((a: any) => {
      const t = (a.title || a.Title || '').toLowerCase()
      return t.includes('újjáéleszt') || t.includes('ujjaeleszt') || t.includes('újjáélesztettük')
    })
    
    if (matches.length === 0) {
      // try without accent
      const allSport = articles.filter((a: any) => {
        const t = (a.title || a.Title || '').toLowerCase()
        return t.includes('sportnap')
      }).slice(0, 10)
      return NextResponse.json({ 
        found: false, 
        message: 'Nincs Újjáélesztettük cikk, de van sportnap:',
        sportnapTitles: allSport.map((a:any) => ({ title: a.title || a.Title, introLen: String(a.introtext||'').length, fullLen: String(a.fulltext||'').length, imgIntro: (String(a.introtext||'').match(/<img/gi)||[]).length, imgFull: (String(a.fulltext||'').match(/<img/gi)||[]).length }))
      })
    }
    
    const result = matches.map((target: any) => {
      const intro = String(target.introtext || target.intro || '')
      const full = String(target.fulltext || target.full || '')
      return {
        title: target.title || target.Title,
        introLength: intro.length,
        fullLength: full.length,
        introRaw: intro.substring(0, 8000),
        fullRaw: full.substring(0, 8000),
        introDecoded: decodeHtmlEntities(intro).substring(0, 8000),
        fullDecoded: decodeHtmlEntities(full).substring(0, 8000),
        imgCountIntro: (intro.match(/<img/gi) || []).length,
        imgCountFull: (full.match(/<img/gi) || []).length,
        combinedPreview: decodeHtmlEntities(intro + '\n' + full).substring(0, 10000),
      }
    })
    
    return NextResponse.json({ found: true, count: matches.length, articles: result })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack?.substring(0,4000) }, { status: 500 })
  }
}
