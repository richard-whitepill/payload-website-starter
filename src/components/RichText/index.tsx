// @ts-nocheck
import { RichText as RichTextConverter } from '@payloadcms/richtext-lexical/react'
import { decodeRichTextNode } from '@/utilities/decodeHtml'
import React from 'react'

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
    />
  )
}

export default RichText
