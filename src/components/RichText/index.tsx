// @ts-nocheck
import { RichText as RichTextConverter } from '@payloadcms/richtext-lexical/react'
import { decodeRichTextNode } from '@/utilities/decodeHtml'
import React from 'react'

const jsxConverter = {
  upload: ({ node }: any) => {
    const value = node?.fields || node?.value || {}
    const url = value?.url || value?.filename ? `/media/${value?.filename}` : value?.url
    // Payload upload node can have url directly
    const finalUrl = value?.url || value?.sizes?.large?.url || value?.sizes?.medium?.url || url
    const alt = value?.alt || ''
    if (!finalUrl) return null
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={finalUrl} alt={alt} className="my-6 w-full rounded-lg" />
  },
  // For blocks like MediaBlock, Banner, etc - just render children
  blocks: {
    mediaBlock: ({ node }: any) => {
      const value = node?.fields || {}
      const media = value?.media
      const url = media?.url || media?.sizes?.large?.url
      const alt = media?.alt || ''
      if (!url) return null
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={url} alt={alt} className="my-6 w-full rounded-lg" />
    }
  }
}

export function RichText(props: any) {
  const { data, ...rest } = props

  const decodedData = React.useMemo(() => {
    try {
      return data ? decodeRichTextNode(data) : data
    } catch {
      return data
    }
  }, [data])

  return (
    <RichTextConverter
      {...rest}
      data={decodedData}
      converters={jsxConverter as any}
    />
  )
}

export default RichText
