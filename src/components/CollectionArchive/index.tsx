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
          let imageUrl = null
          const img = post.heroImage || post.meta?.image
          if (img && typeof img === 'object') {
            imageUrl = img.url || img.sizes?.card?.url || img.sizes?.medium?.url || null
          }
          const title = post.title
          const slug = post.slug
          const excerpt = post.meta?.description || ''
          return (
            <article key={i} className="border border-[#d5cfb8] rounded-lg bg-[#fffef5] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {imageUrl && (
                <div className="w-full h-48 overflow-hidden bg-[#e8e0c8]">
                  <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6">
                <div className="text-xs uppercase text-[#5d4037] mb-2">HÍREK</div>
                <h3 className="font-serif font-bold text-lg text-[#2d5016] mb-3 leading-tight">
                  <Link href={`/posts/${slug}`} className="hover:underline">
                    {decodeHtml(title)}
                  </Link>
                </h3>
                <p className="text-sm text-[#2c2c2c] line-clamp-3">{decodeHtml(excerpt).slice(0,180)}</p>
                <Link href={`/posts/${slug}`} className="text-sm text-[#2d5016] font-medium hover:underline mt-4 block">Bővebben...</Link>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
