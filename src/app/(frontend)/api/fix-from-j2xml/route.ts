import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const payload = await getPayload({ config })
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
      return NextResponse.json({ success: false, error: 'j2xml-parsed.json nem található src/seed-ben!' }, { status: 404 })
    }
    const raw = fs.readFileSync(jsonPath, 'utf-8')
    const data = JSON.parse(raw)
    const articles = Array.isArray(data) ? data : data.articles || data.items || []
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
    const first = articles[0] || {}
    const sampleIntroRaw = first.introtext || first.intro || first.content || ''
    const sampleIntro = String(sampleIntroRaw).substring(0, 1000)
    const sampleFullRaw = first.fulltext || first.full || ''
    const sampleFull = String(sampleFullRaw).substring(0, 1000)
    const hasImagesInJson = sampleIntro.includes('images/') || sampleFull.includes('images/') || sampleIntro.includes('<img') || sampleFull.includes('<img')

    const existingPosts = await payload.find({ collection: 'posts', limit: 1 })
    const existingPost = existingPosts.docs[0] as any
    const existingContentSample = String(existingPost?.content || '').substring(0, 500)

    let updated = 0, skipped = 0, imagesReplaced = 0
    const details: string[] = []

    for (const article of articles.slice(0, 100)) {
      const title = article.title || article.Title
      if (!title) continue
      const introtext = String(article.introtext || article.intro || '')
      const fulltext = String(article.fulltext || article.full || '')
      let combinedContent = `${introtext}\n${fulltext}`.trim()
      if (!combinedContent) continue
      if (!combinedContent.includes('images/') && !combinedContent.includes('<img')) continue

      let newContent = combinedContent
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
      let match
      const replacements: Array<{ oldSrc: string, newSrc: string }> = []
      while ((match = imgRegex.exec(combinedContent)) !== null) {
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
        newContent = newContent.replace(new RegExp(escapedOld, 'g'), rep.newSrc)
      }
      const found = await payload.find({ collection: 'posts', where: { title: { equals: title } }, limit: 1 })
      if (found.docs[0]) {
        const post = found.docs[0] as any
        if (newContent.length > (post.content || '').length || replacements.length > 0) {
          await payload.update({ collection: 'posts', id: post.id, data: { content: newContent } as any })
          updated++; imagesReplaced += replacements.length
          if (details.length < 10) details.push(`${String(title).substring(0,50)}: ${replacements.length} kép`)
        } else skipped++
      }
      if (updated >= 50) break
    }

    return NextResponse.json({
      success: true,
      jsonPath,
      totalArticlesInJson: articles.length,
      hasImagesInJson,
      sampleIntroHasImages: sampleIntro.includes('images/') || sampleIntro.includes('<img'),
      sampleIntro: sampleIntro.substring(0, 500),
      existingPostTitle: existingPost?.title || 'nincs',
      existingContentSample,
      totalMedia: allMedia.totalDocs,
      updated,
      skipped,
      imagesReplaced,
      details,
      nextStep: updated > 0 ? `Frissítve ${updated} cikk!` : 'Nincs images/ a JSON-ban vagy már frissítve!',
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack?.substring(0, 3000) }, { status: 500 })
  }
}
