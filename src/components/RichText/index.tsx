// @ts-nocheck
import React from 'react'
import { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical'
import { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { JSXConvertersFunction, RichText as RichTextLexical } from '@payloadcms/richtext-lexical/react'

import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { CodeBlock, CodeBlockProps } from '@/blocks/Code/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'

function decodeHtml(str: any) {
  if (!str || typeof str !== 'string') return str
  let s = str

  // 1. Ismert magyar ékezetek - minden variáció
  const map: any = {
    '&aacute;': 'á', '&Aacute;': 'Á', '&aac;': 'á', '&Aac;': 'Á', '&aacute': 'á', '&aac': 'á',
    '&eacute;': 'é', '&Eacute;': 'É', '&eacute': 'é',
    '&iacute;': 'í', '&Iacute;': 'Í',
    '&oacute;': 'ó', '&Oacute;': 'Ó',
    '&uacute;': 'ú', '&Uacute;': 'Ú',
    '&ouml;': 'ö', '&Ouml;': 'Ö', '&ouml': 'ö',
    '&uuml;': 'ü', '&Uuml;': 'Ü', '&uuml': 'ü',
    '&odblac;': 'ő', '&Odblac;': 'Ő', '&odblac': 'ő', '&Odblac': 'Ő',
    '&udblac;': 'ű', '&Udblac;': 'Ű', '&udblac': 'ű', '&Udblac': 'Ű',
    '&oogon;': 'ő', '&Oogon;': 'Ő', '&uogon;': 'ű', '&Uogon;': 'Ű',
    '&ouml;': 'ö', '&Ouml;': 'Ö', '&uuml;': 'ü', '&Uuml;': 'Ü',
    '&szlig;': 'ß',
    '&amp;': '&', '&nbsp;': ' ', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>',
    '&#39;': "'", '&#34;': '"', '&#38;': '&', '&#60;': '<', '&#62;': '>',
  }
  for (const k in map) {
    s = s.split(k).join(map[k])
  }

  // 2. Truncated formák: h&aac -> há, &aacute -> á stb.
  s = s.replace(/&aacute;?/gi, (m: string) => (m.toLowerCase().startsWith('&a') ? 'á' : m))
  s = s.replace(/&eacute;?/gi, 'é')
  s = s.replace(/&ouml;?/gi, 'ö')
  s = s.replace(/&uuml;?/gi, 'ü')
  s = s.replace(/&odblac;?|&oogon;?/gi, 'ő')
  s = s.replace(/&udblac;?|&uogon;?/gi, 'ű')
  // Fix h&aac pattern specifically
  s = s.replace(/h&aac/gi, 'há')
  s = s.replace(/&aac;?/gi, 'á')

  // 3. Numerikus entitások
  s = s.replace(/&#(\d+);/g, (_: any, c: any) => {
    try { return String.fromCharCode(parseInt(c, 10)) } catch { return _ }
  })
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_: any, c: any) => {
    try { return String.fromCharCode(parseInt(c, 16)) } catch { return _ }
  })

  // 4. Böngészőben textarea trükk - minden maradék entitást dekódol
  if (typeof document !== 'undefined') {
    try {
      const txt = document.createElement('textarea')
      txt.innerHTML = s
      return txt.value
    } catch {}
  }

  return s
}

type NodeTypes = DefaultNodeTypes | SerializedBlockNode<CodeBlockProps | any>

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  // Minden text node-ban ékezet fix
  text: ({ node }: any) => {
    if (node?.text && typeof node.text === 'string') {
      node.text = decodeHtml(node.text)
    }
    return (defaultConverters as any).text ? (defaultConverters as any).text({ node }) : node.text
  },
  blocks: {
    banner: ({ node }: any) => <BannerBlock className="col-start-2 mb-4" {...node.fields} />,
    mediaBlock: ({ node }: any) => {
      return <MediaBlock className="col-start-1 col-span-3" {...node.fields} />
    },
    code: ({ node }: any) => <CodeBlock className="col-start-2" {...node.fields} />,
    cta: ({ node }: any) => <CallToActionBlock {...node.fields} />,
  },
})

type Props = {
  data: SerializedEditorState
  enableGutter?: boolean
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const { className, enableProse = true, enableGutter = true, ...rest } = props
  return (
    <RichTextLexical
      converters={jsxConverters}
      className={className}
      {...rest}
    />
  )
}

export { RichText }
