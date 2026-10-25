import React from 'react'
import Link from 'next/link'

function decodeHtml(str: string) {
  if (!str) return ''
  let s = str
  const map: Record<string,string> = {
    '&aacute;': 'á', '&Aacute;': 'Á',
    '&eacute;': 'é', '&Eacute;': 'É',
    '&iacute;': 'í', '&Iacute;': 'Í',
    '&oacute;': 'ó', '&Oacute;': 'Ó',
    '&uacute;': 'ú', '&Uacute;': 'Ú',
    '&ouml;': 'ö', '&Ouml;': 'Ö',
    '&uuml;': 'ü', '&Uuml;': 'Ü',
    '&odblac;': 'ő', '&Odblac;': 'Ő',
    '&udblac;': 'ű', '&Udblac;': 'Ű',
    '&amp;': '&', '&quot;': '"', '&lt;': '<', '&gt;': '>',
    '&nbsp;': ' ', '&rsquo;': "'", '&ndash;': '–',
  }
  for (const [k,v] of Object.entries(map)) s = s.split(k).join(v)
  s = s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
  s = s.replace(/&[a-z]+;/gi, '')
  return s
}

export const CollectionArchive: React.FC<{ posts: any[] }> = ({ posts }) => {
  return (
    <div className="container">
      <div className="max-w-4xl mx-auto divide-y divide-[#d5cfb8]">
        {posts?.map((post: any, i: number) => {
          const title = decodeHtml(post.title || '')
          const slug = post.slug
          const rawExcerpt = post.meta?.description || post.excerpt || ''
          const excerpt = decodeHtml(rawExcerpt)
          const dateStr = post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })
            : ''

          // Csak az ELSŐ cikknek van képe, mint régi efdsz.hu-n, balra igazítva!
          let imageUrl: string | null = null
          if (i === 0) {
            const img = post.heroImage || post.meta?.image
            if (img && typeof img === 'object') imageUrl = img.url
          }

          return (
            <article key={i} className="py-6">
              <div className="flex gap-4">
                {imageUrl && (
                  <div className="flex-shrink-0 w-40 h-28 md:w-48 md:h-32 border border-[#d5cfb8] p-1 bg-white shadow-sm">
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
                      {excerpt.slice(0, 280)}{excerpt.length > 280 ? '...' : ''}
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
