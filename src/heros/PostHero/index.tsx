import React from 'react'

export const PostHero: React.FC<any> = ({ post, title: t, publishedAt: p }) => {
  const postData = post || {}
  const title = postData.title || t || ''
  const publishedAt = postData.publishedAt || p
  const dateStr = publishedAt
    ? new Date(publishedAt).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  return (
    <div className="container pt-8 pb-2">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-serif font-bold text-3xl md:text-4xl text-[#2d5016] leading-tight mb-2">
          {title}
        </h1>
        {dateStr && (
          <div className="text-sm text-[#5d4037] mb-6 border-b border-[#d5cfb8] pb-4">{dateStr}</div>
        )}
        {/* NINCS Hero kép a cikkben! */}
      </div>
    </div>
  )
}

export default PostHero
