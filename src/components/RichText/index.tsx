// @ts-nocheck
import { RichText as RichTextConverter } from '@payloadcms/richtext-lexical/react'
import { jsxConverter } from '@/components/RichText/converters'
import { decodeRichTextNode } from '@/utilities/decodeHtml'
import React from 'react'

export function RichText(props: any) {
  const { className, enableGutter, enableProse, data, ...rest } = props

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
      className={className}
      converters={jsxConverter}
    />
  )
}

export default RichText
