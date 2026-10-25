import React from 'react'
import Image from 'next/image'

// FIX: Don't use payload-types that is old, use any with all Joomla fields
type Props = {
  media: any
  alignment?: 'left' | 'center' | 'right' | 'full'
  width?: '25%' | '33%' | '50%' | '75%' | '100%'
  enableGutter?: boolean
  caption?: string
  alt?: string
  className?: string
}

export const MediaBlock: React.FC<Props> = (props) => {
  const { media, alignment, width, enableGutter, caption, alt, className } = props

  if (!media || typeof media === 'string') return null

  const mediaUrl = (media as any).url
  const mediaWidth = (media as any).width
  const mediaHeight = (media as any).height

  const widthStyle: React.CSSProperties = {
    width: width || '100%',
    maxWidth: '100%',
  }

  let containerClass = 'my-6'
  let figureStyle: React.CSSProperties = {}

  if (alignment === 'left') {
    if (enableGutter) {
      containerClass += ' float-left mr-6 mb-4 clear-left'
      figureStyle = { ...widthStyle, float: 'left' as const }
    } else {
      containerClass += ' mr-auto'
      figureStyle = widthStyle
    }
  } else if (alignment === 'right') {
    if (enableGutter) {
      containerClass += ' float-right ml-6 mb-4 clear-right'
      figureStyle = { ...widthStyle, float: 'right' as const }
    } else {
      containerClass += ' ml-auto'
      figureStyle = widthStyle
    }
  } else if (alignment === 'center') {
    containerClass += ' mx-auto'
    figureStyle = { ...widthStyle, marginLeft: 'auto', marginRight: 'auto' }
  } else if (alignment === 'full') {
    containerClass += ' w-full'
    figureStyle = { width: '100%' }
  }

  return (
    <>
      <figure className={`${containerClass} ${className || ''}`} style={figureStyle}>
        <div className="overflow-hidden rounded-lg">
          {mediaUrl && mediaWidth && mediaHeight ? (
            <Image
              src={mediaUrl}
              alt={alt || (media as any).alt || ''}
              width={mediaWidth}
              height={mediaHeight}
              className="h-auto w-full"
              sizes={`(max-width: 768px) 100vw, ${width || '50vw'}`}
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
      {enableGutter && (alignment === 'left' || alignment === 'right') && (
        <div className="clear-both" style={{ clear: 'both', height: 0 }} />
      )}
    </>
  )
}

export default MediaBlock
