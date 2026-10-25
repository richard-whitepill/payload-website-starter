import React from 'react'

export const PostHero: React.FC<{ post: any }> = ({ post }) => {
  const title = post?.title || ''
  const publishedAt = post?.publishedAt
  const dateStr = publishedAt
    ? new Date(publishedAt).toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''
  const heroImage = post?.heroImage || post?.meta?.image
  let imageUrl = null
  if (heroImage && typeof heroImage === 'object') {
    imageUrl = heroImage.url
  }

  return (
    <div className="container pt-8 pb-2">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-serif font-bold text-3xl md:text-4xl text-[#2d5016] leading-tight mb-2">
          {title}
        </h1>
        {dateStr && <div className="text-sm text-[#5d4037] mb-6 border-b border-[#d5cfb8] pb-4">{dateStr}</div>}
        
        {imageUrl && (
          <div className="float-left mr-6 mb-4 w-64 md:w-80 border border-[#d5cfb8] p-1 bg-white shadow-sm">
            <img src={imageUrl} alt={title} className="w-full h-auto" />
          </div>
        )}
        {/* Clearfix után a tartalom jön, de a kép úszik! */}
        <div className="clearfix"></div>
      </div>
    </div>
  )
}

export default PostHero
