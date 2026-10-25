import React from 'react'
import Link from 'next/link'
function decodeHtml(str: string) {
  if (!str) return ''
  return str.replace(/&aacute;/g,'á').replace(/&eacute;/g,'é').replace(/&iacute;/g,'í').replace(/&oacute;/g,'ó').replace(/&uacute;/g,'ú').replace(/&ouml;/g,'ö').replace(/&uuml;/g,'ü').replace(/&odblac;/g,'ő').replace(/&udblac;/g,'ű').replace(/&amp;/g,'&')
}
export const CollectionArchive: React.FC<{ posts: any[] }> = ({ posts }) => {
  return (
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts?.map((post: any, i: number) => {
          // ERŐS KÉPKERESÉS
          let img: any = post.heroImage || post.meta?.image || null
          let imageUrl = null
          let imageAlt = post.title
          if (img) {
            if (typeof img === 'object') {
              imageUrl = img.url || img.sizes?.card?.url || img.sizes?.thumbnail?.url
              imageAlt = img.alt || post.title
            } else {
              imageUrl = null // ID, nem objektum
            }
          }
          // Ha nincs hero, próbáld az első MediaBlock-ot? Most csak hero
          const title = post.title
          const slug = post.slug
          const excerpt = post.meta?.description || ''
          return (
            <article key={i} className="border border-[#d5cfb8] rounded-lg bg-[#fffef5] p-6 shadow-sm">
              {imageUrl ? (
                <div className="mb-4 -m-6 mb-6 overflow-hidden rounded-t-lg">
                  <img src={imageUrl} alt={imageAlt} className="w-full h-48 object-cover" />
                </div>
              ) : (
                <div className="mb-2 text-[10px] text-gray-400">Nincs hero kép: {slug} - heroImage típus: {typeof post.heroImage}</div>
              )}
              <h3 className="font-serif font-bold text-lg text-[#2d5016] mb-3">
                <Link href={`/posts/${slug}`}>{decodeHtml(title)}</Link>
              </h3>
              <p className="text-sm">{decodeHtml(excerpt).slice(0,180)}</p>
              <Link href={`/posts/${slug}`} className="text-sm text-[#2d5016] font-medium hover:underline mt-4 block">Bővebben...</Link>
            </article>
          )
        })}
      </div>
    </div>
  )
}
