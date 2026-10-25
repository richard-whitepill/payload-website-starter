import React from 'react'
import { Media } from '@/components/Media'
import type { MediaBlock as MediaBlockProps } from '@/payload-types'
export const MediaBlock: React.FC<MediaBlockProps> = (props) => {
  const { media } = props
  if (!media || typeof media === 'string') return null
  return (
    <div className="my-6">
      <Media resource={media} />
    </div>
  )
}
