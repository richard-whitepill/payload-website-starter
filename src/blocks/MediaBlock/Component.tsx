import React from 'react'
import Image from 'next/image'

type Props = {
  media: any
  alignment?: 'left' | 'center' | 'right' | 'full' | string
  width?: '25%' | '33%' | '50%' | '75%' | '100%' | string
  enableGutter?: boolean
  enable_gutter?: boolean
  caption?: string
  alt?: string
  className?: string
  imgClassName?: string
  captionClassName?: string
  disableInnerContainer?: boolean
  [key: string]: any
}

export const MediaBlock: React.FC<Props> = (props) => {
  const { media, alignment, width, enableGutter, enable_gutter, caption, alt, className } = props
  const shouldGutter = enableGutter ?? enable_gutter ?? false

  if (!media || typeof media === 'string') return null

  const mediaUrl = (media as any).url
  const mediaWidth = (media as any).width
  const mediaHeight = (media as any).height

  const align = (alignment as string) || 'center'
  const w = (width as string) || '100%'

  let widthValue = w
  if (w === '25' || w === '33' || w === '50' || w === '75' || w === '100') {
    widthValue = `${w}%`
  }
  if (/^\d+$/.test(w)) {
    widthValue = `${w}%`
  }

  // Joomla-style float logic
  let figureClass = 'my-6'
  let figureStyle: React.CSSProperties = {}

  if (shouldGutter && (align === 'left' || align === 'right')) {
    // TRUE Joomla float - text wraps!
    if (align === 'left') {
      figureClass = 'float-left mr-6 mb-4 mt-2'
      figureStyle = { width: widthValue, maxWidth: '100%' }
    } else {
      figureClass = 'float-right ml-6 mb-4 mt-2'
      figureStyle = { width: widthValue, maxWidth: '100%' }
    }
  } else {
    // No gutter - centered blocks
    if (align === 'left') {
      figureClass = 'mr-auto my-6'
      figureStyle = { width: widthValue }
    } else if (align === 'right') {
      figureClass = 'ml-auto my-6'
      figureStyle = { width: widthValue }
    } else if (align === 'center') {
      figureClass = 'mx-auto my-6'
      figureStyle = { width: widthValue, marginLeft: 'auto', marginRight: 'auto' }
    } else if (align === 'full') {
      figureClass = 'w-full my-6'
      figureStyle = { width: '100%' }
    } else {
      figureStyle = { width: widthValue }
    }
  }

  return (
    <figure className={`${figureClass} ${className || ''}`} style={figureStyle}>
      <div className="overflow-hidden rounded-lg">
        {mediaUrl && mediaWidth && mediaHeight ? (
          <Image
            src={mediaUrl}
            alt={alt || (media as any).alt || ''}
            width={mediaWidth}
            height={mediaHeight}
            className="h-auto w-full"
            sizes={`(max-width: 768px) 100vw, ${widthValue}`}
          />
        ) : (
          <img
            src={mediaUrl}
            alt={alt || (media as any).alt || ''}
            className="h-auto w-full rounded-lg"
            style={{ maxWidth: '100%' }}
          />
        )}
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

export default MediaBlock
