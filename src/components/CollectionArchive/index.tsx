import React from 'react'
import Link from 'next/link'

function decodeHtml(str: string) {
  if (!str) return ''
  let s = str

  // 1. Teljes ékezetek
  const map: Record<string, string> = {
    '&aacute;': 'á', '&Aacute;': 'Á', '&aac;': 'á', '&Aac;': 'Á',
    '&eacute;': 'é', '&Eacute;': 'É',
    '&iacute;': 'í', '&Iacute;': 'Í',
    '&oacute;': 'ó', '&Oacute;': 'Ó',
    '&uacute;': 'ú', '&Uacute;': 'Ú',
    '&ouml;': 'ö', '&Ouml;': 'Ö',
    '&uuml;': 'ü', '&Uuml;': 'Ü',
    '&odblac;': 'ő', '&Odblac;': 'Ő',
    '&udblac;': 'ű', '&Udblac;': 'Ű',
    '&oogon;': 'ő', '&uogon;': 'ű',
    '&amp;': '&', '&quot;': '"', '&lt;': '<', '&gt;': '>',
    '&nbsp;': ' ', '&rsquo;': "'", '&ndash;': '–', '&mdash;': '—',
  }
  for (const [k, v] of Object.entries(map)) {
    s = s.split(k).join(v)
  }

  // 2. Vágott entitások: &eacu, &aacu, &eacute, &aacute; ; nélkül, h&aac
  s = s.replace(/&aacute;?|&aac;?/gi, 'á')
  s = s.replace(/&eacute;?|&eacu;?/gi, 'é')
  s = s.replace(/&iacute;?/gi, 'í')
  s = s.replace(/&oacute;?/gi, 'ó')
  s = s.replace(/&uacute;?/gi, 'ú')
  s = s.replace(/&ouml;?/gi, 'ö')
  s = s.replace(/&uuml;?/gi, 'ü')
  s = s.replace(/&odblac;?|&oogon;?/gi, 'ő')
  s = s.replace(/&udblac;?|&uogon;?/gi, 'ű')

  // 3. Specifikus vágott: h&aac -> há
  s = s.replace(/h&aac/gi, 'há')
  s = s.replace(/&aac/gi, 'á')
  s = s.replace(/&eacu/gi, 'é')

  // 4. Numerikus
  s = s.replace(/&#(\d+);/g, (_, n) => {
    try { return String.fromCharCode(parseInt(n, 10)) } catch { return '' }
  })
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, n) => {
    try { return String.fromCharCode(parseInt(n, 16)) } catch { return '' }
  })

  // 5. Maradék &...; és vágott &... és k&, v& törlése
  s = s.replace(/&[a-z]+;/gi, '')
  s = s.replace(/&[a-z]{1,10}$/gi, '') // végén maradt &eacute, &eacu
  s = s.replace(/\s[akv]&$/gi, '') // k& a végén
  s = s.replace(/\s&[a-z]*$/gi, '')
  s = s.replace(/&[a-z]*$/gi, '')
  s = s.replace(/\s&$/g, '')

  return s.trim()
}

export const CollectionArchive: React.FC<{ posts: any[] }> = ({ posts }) => {
  // Rendezés: legújabb elől!
  const sorted = [...(posts || [])].sort((a: any, b: any) => {
    const da = new Date(a.publishedAt || a.createdAt).getTime()
    const db = new Date(b.publishedAt || b.createdAt).getTime()
    return db - da
  })

  return (
    <div className="container">
      <div className="max-w-4xl mx-auto divide-y divide-[#d5cfb8]">
        {sorted?.map((post: any, i: number) => {
          const title = decodeHtml(post.title || '')
          const slug = post.slug
          const rawExcerpt = post.meta?.description || post.excerpt || ''
          const excerpt = decodeHtml(rawExcerpt)
          const dateStr = post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })
            : ''

          // Hero kép: ha van, balra igazítva! Régi Joomla!
          let imageUrl: string | null = null
          const img = post.heroImage || post.meta?.image
          if (img && typeof img === 'object') imageUrl = img.url

          return (
            <article key={i} className="py-6">
              <div className="flex gap-4">
                {imageUrl && (
                  <div className="flex-shrink-0 w-32 h-24 md:w-40 md:h-28 border border-[#d5cfb8] p-1 bg-white shadow-sm">
                    <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  {dateStr && <div className="text-sm text-[#5d4037] mb-1">{dateStr} -</div>}
                  <h3 className="font-serif font-bold text-lg md:text-xl text-[#2d5016] mb-2 leading-tight">
                    <Link href={`/posts/${slug}`} className="hover:underline">
                      {title}
                    </Link>
                  </h3>
                  {excerpt && (
                    <p className="text-[14px] text-[#2c2c2c] leading-relaxed mb-2">
                      {excerpt.slice(0, 300)}{excerpt.length > 300 ? '...' : ''}
                    </p>
                  )}
                  <Link href={`/posts/${slug}`} className="text-sm text-[#2d5016] font-bold hover:underline">
                    Bővebben...
                  </Link>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
