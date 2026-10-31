// @ts-nocheck
import { RichText as RichTextConverter } from '@payloadcms/richtext-lexical/react'
import { jsxConverter } from '@/components/RichText/converters'

export function RichText(props: any) {
  return (
    <RichTextConverter
      {...props}
      converters={jsxConverter}
    />
  )
}

export default RichText
