import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'
import path from 'path'

function htmlToLexical(html: string) {
  const clean = html
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<script[^>]*>.*?<\/script>/gis, '')

  const pRegex = /<p[^>]*>(.*?)<\/p>/gis
  const paragraphs: any[] = []
  let match
  while ((match = pRegex.exec(clean)) !== null) {
    let text = match[1]
      .replace(/<br[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&eacute;/g, 'é')
      .replace(/&aacute;/g, 'á')
      .replace(/&oacute;/g, 'ó')
      .replace(/&uacute;/g, 'ú')
      .replace(/&ouml;/g, 'ö')
      .replace(/&uuml;/g, 'ü')
      .replace(/&iacute;/g, 'í')
      .trim()
    if (text.length > 2) {
      paragraphs.push({
        type: 'paragraph',
        children: [{ type: 'text', text, version: 1 }],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      })
    }
  }

  if (paragraphs.length === 0) {
    const text = clean.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').trim().substring(0, 5000)
    if (text) {
      paragraphs.push({
        type: 'paragraph',
        children: [{ type: 'text', text, version: 1 }],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      })
    }
  }

  return {
    root: {
      type: 'root',
      children: paragraphs.length ? paragraphs : [
        { type: 'paragraph', children: [{ type: 'text', text: 'Nincs tartalom', version: 1 }], direction: 'ltr', format: '', indent: 0, version: 1 }
      ],
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

    const possiblePaths = [
      path.join(process.cwd(), 'src/seed/j2xml_parsed.json'),
      path.join(process.cwd(), 'src/app/(frontend)/api/seed-j2xml/j2xml_parsed.json'),
      path.join(process.cwd(), 'src/app/api/seed-j2xml/j2xml_parsed.json'),
      path.join(process.cwd(), 'src/app/(frontend)/seed/j2xml_parsed.json'),
      path.join(process.cwd(), 'j2xml_parsed.json'),
      '/var/task/src/seed/j2xml_parsed.json',
      '/var/task/src/app/(frontend)/api/seed-j2xml/j2xml_parsed.json',
      '/var/task/src/app/api/seed-j2xml/j2xml_parsed.json',
    ]

    let jsonPath = ''
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        jsonPath = p
        break
      }
    }

    if (!jsonPath) {
      // List files to debug
      let debugInfo = ''
      try {
        const srcDir = path.join(process.cwd(), 'src')
        const seedDir = path.join(srcDir, 'seed')
        if (fs.existsSync(seedDir)) {
          debugInfo += `src/seed exists: ${fs.readdirSync(seedDir).join(', ')}\n`
        } else {
          debugInfo += `src/seed NOT exists\n`
        }
        const frontendSeed = path.join(process.cwd(), 'src/app/(frontend)/api/seed-j2xml')
        if (fs.existsSync(frontendSeed)) {
          debugInfo += `frontend api exists: ${fs.readdirSync(frontendSeed).join(', ')}\n`
        }
      } catch (e) {}

      return NextResponse.json({ 
        success: false, 
        error: 'j2xml_parsed.json nem található! Tedd a src/seed/ mappába vagy mellé a route.ts mellé',
        tried: possiblePaths,
        debug: debugInfo,
        cwd: process.cwd(),
      }, { status: 404 })
    }

    const raw = fs.readFileSync(jsonPath, 'utf-8')
    const j2xmlData = JSON.parse(raw)

    let imported = 0
    let skipped = 0
    let errors = 0

    const categoriesMap: Record<string, any> = {}
    const uniqueCats = [...new Set(j2xmlData.map((a: any) => a.catid))].filter(Boolean) as string[]

    for (const catSlug of uniqueCats) {
      try {
        const existing = await payload.find({
          collection: 'categories',
          where: { slug: { equals: catSlug } },
          limit: 1,
        })
        if (existing.docs[0]) {
          categoriesMap[catSlug] = existing.docs[0].id
          continue
        }
        const catDoc = await payload.create({
          collection: 'categories',
          data: {
            title: catSlug,
            slug: catSlug.toLowerCase().replace(/[^a-z0-9\/]+/g, '-'),
          } as any,
        })
        categoriesMap[catSlug] = catDoc.id
      } catch (e: any) {
        console.error('Kategória hiba', catSlug, e.message)
      }
    }

    for (const article of j2xmlData) {
      try {
        const slug = article.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 90) || `cikk-${article.id}`
        
        const existingPost = await payload.find({
          collection: 'posts',
          where: { slug: { equals: slug } },
          limit: 1,
        })
        if (existingPost.docs.length > 0) {
          skipped++
          continue
        }

        const lexicalContent = htmlToLexical(article.content_html)

        const postData: any = {
          title: article.title.substring(0, 200),
          slug,
          _status: 'published',
          publishedAt: article.publish_up && article.publish_up !== '0000-00-00 00:00:00' ? new Date(article.publish_up) : new Date(article.created),
          content: lexicalContent,
          meta: {
            title: article.title.substring(0, 60),
            description: article.intro?.replace(/<[^>]+>/g, '').substring(0, 160) || '',
          }
        }

        if (categoriesMap[article.catid]) {
          postData.categories = [categoriesMap[article.catid]]
        }

        await payload.create({
          collection: 'posts',
          data: postData,
        })
        imported++
      } catch (e: any) {
        console.error('Post hiba', article.slug, e.message)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import kész!`,
      imported,
      skipped,
      errors,
      total: j2xmlData.length,
      categories: Object.keys(categoriesMap),
      usedPath: jsonPath,
    })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ success: false, error: err.message, stack: err.stack }, { status: 500 })
  }
}
