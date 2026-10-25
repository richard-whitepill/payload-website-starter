import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

function decodeHtml(str: string) {
  if (!str) return ''
  const entities: Record<string, string> = {
    '&aacute;': 'á',
    '&Aacute;': 'Á',
    '&eacute;': 'é',
    '&Eacute;': 'É',
    '&iacute;': 'í',
    '&Iacute;': 'Í',
    '&oacute;': 'ó',
    '&Oacute;': 'Ó',
    '&uacute;': 'ú',
    '&Uacute;': 'Ú',
    '&ouml;': 'ö',
    '&Ouml;': 'Ö',
    '&uuml;': 'ü',
    '&Uuml;': 'Ü',
    '&odblac;': 'ő',
    '&Odblac;': 'Ő',
    '&udblac;': 'ű',
    '&Udblac;': 'Ű',
    '&amp;': '&',
    '&quot;': '"',
    '&apos;': "'",
    '&lt;': '<',
    '&gt;': '>',
    '&nbsp;': ' ',
    '&rsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&ndash;': '–',
    '&mdash;': '—',
  }
  let result = str
  for (const [code, char] of Object.entries(entities)) {
    result = result.split(code).join(char)
  }
  // Numeric entities
  result = result.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  return result
}

type Props = {
  posts: any[]
}

export const CollectionArchive: React.FC<Props> = ({ posts }) => {
  return (
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts?.map((post: any, index: number) => {
          const title = post.title || 'Nincs cím'
          const slug = post.slug
          const excerpt = post.meta?.description || post.excerpt || ''
          const categories = post.categories
          const firstCategory =
            Array.isArray(categories) && categories.length > 0
              ? typeof categories[0] === 'object'
                ? categories[0].title
                : categories[0]
              : 'HÍREK'
          const heroImage = post.heroImage || post.meta?.image
          const imageUrl = typeof heroImage === 'object' ? heroImage?.url : null
          const decodedExcerpt = decodeHtml(excerpt).slice(0, 200)
          const decodedTitle = decodeHtml(title)

          return (
            <article
              key={index}
              className="border border-[#d5cfb8] rounded-lg bg-[#fffef5] p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {imageUrl && (
                <div className="mb-4 -m-6 mb-6 overflow-hidden rounded-t-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt={decodedTitle} className="w-full h-48 object-cover" />
                </div>
              )}
              <div className="text-xs uppercase tracking-wide text-[#5d4037] mb-2">{firstCategory}</div>
              <h3 className="font-serif font-bold text-lg text-[#2d5016] mb-3 leading-tight">
                <Link href={`/posts/${slug}`} className="hover:underline">
                  {decodedTitle}
                </Link>
              </h3>
              {decodedExcerpt && (
                <p className="text-sm text-[#2c2c2c] leading-relaxed line-clamp-3">{decodedExcerpt}</p>
              )}
              <div className="mt-4">
                <Link href={`/posts/${slug}`} className="text-sm text-[#2d5016] font-medium hover:underline">
                  Bővebben...
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
