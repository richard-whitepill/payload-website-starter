// @ts-nocheck
import React from 'react'
import Link from 'next/link'

function decodeHtml(str: any) {
  if (!str || typeof str !== 'string') return str
  let s = str
  // Full decode + truncated fix
  s = s.replace(/&aacute;|&Aacute;|&aac;?|&Aac;?|&aacute;|&aac/gi, 'á')
  s = s.replace(/&eacute;|&Eacute;|&eacu|&eacute/gi, 'é')
  s = s.replace(/&iacute;|&Iacute;/gi, 'í')
  s = s.replace(/&oacute;|&Oacute;/gi, 'ó')
  s = s.replace(/&uacute;|&Uacute;/gi, 'ú')
  s = s.replace(/&ouml;|&Ouml;/gi, 'ö')
  s = s.replace(/&uuml;|&Uuml;/gi, 'ü')
  s = s.replace(/&odblac;|&Odblac;|&oogon;?/gi, 'ő')
  s = s.replace(/&udblac;|&Udblac;|&uogon;?/gi, 'ű')
  s = s.replace(/&amp;/gi, '&')
  s = s.replace(/&nbsp;/gi, ' ')
  s = s.replace(/&quot;/gi, '"')
  s = s.replace(/&#39;/gi, "'")
  s = s.replace(/&#(\d+);/g, (_: any, c: any) => { try { return String.fromCharCode(parseInt(c, 10)) } catch { return _ } })
  // Remove truncated fragments like k&, v&, &eacu, &eacute, & at end
  s = s.replace(/&[a-z]+$/gi, (m: string) => {
    const l = m.toLowerCase()
    if (l.includes('aacute') || l.includes('aac') || l.includes('eacu')) return ''
    if (l.includes('eacute')) return 'é'
    if (l.includes('ouml')) return 'ö'
    if (l.includes('uuml')) return 'ü'
    if (l.length <= 3) return ''
    return ''
  })
  s = s.replace(/\s[akv]&$/gi, '')
  s = s.replace(/\s&[a-z]*$/gi, '')
  s = s.replace(/&[a-z]*$/gi, '')
  return s
}

export const CollectionArchive: React.FC<any> = (props) => {
  const { posts, relationTo } = props
  const docs = posts?.docs || props?.docs || []

  return (
    <div className="container">
      <div>
        {docs?.map((doc: any, index: number) => {
          const { slug, title, meta, publishedAt, createdAt } = doc
          const description = meta?.description || ''
          const date = publishedAt || createdAt
          const dateStr = date ? new Date(date).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' }) + ' -' : ''
          const href = `/${relationTo !== 'pages' ? `${relationTo}/` : ''}${slug}`

          const cleanTitle = decodeHtml(title)
          const cleanDesc = decodeHtml(description)

          return (
            <div key={index} className="py-6 border-b border-gray-300 last:border-b-0">
              {dateStr && <div className="text-sm text-gray-600">{dateStr}</div>}
              <h3 className="text-xl font-bold text-[#2d5a27] my-2">
                <Link href={href}>{cleanTitle}</Link>
              </h3>
              {cleanDesc && <p className="text-sm text-gray-700 line-clamp-2">{cleanDesc}</p>}
              <div className="mt-2">
                <Link href={href} className="text-sm font-bold text-[#2d5a27] hover:underline">
                  Bővebben...
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CollectionArchive
