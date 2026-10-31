// src/components/RichText/Component.tsx - ékezet javítás
'use client'
import React from 'react'
import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'
import { decodeRichTextNode } from '@/utilities/decodeHtml'

export const RichText: React.FC<{ data: any; className?: string }> = ({ data, className }) => {
  if (!data) return null
  
  // Dekódoljuk a magyar ékezet entitásokat a Lexical JSON-ban
  const decodedData = React.useMemo(() => {
    try {
      return decodeRichTextNode(data)
    } catch {
      return data
    }
  }, [data])

  return (
    <div className={className}>
      <PayloadRichText data={decodedData} />
    </div>
  )
}

export default RichText
