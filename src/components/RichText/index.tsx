// @ts-nocheck
import React from 'react'
import { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical'
import { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { JSXConvertersFunction, RichText as RichTextLexical } from '@payloadcms/richtext-lexical/react'

import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { CodeBlock, CodeBlockProps } from '@/blocks/Code/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'

function decode(str: any) {
  if (!str || typeof str !== 'string') return str
  let s = str
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
    '&oogon;': 'ő', '&uogon;': 'ű',
    '&amp;': '&', '&nbsp;': ' ', '&quot;': '"', '&lt;': '<', '&gt;': '>',
    '&#39;': "'", '&#34;': '"',
  }
  for (const k in map) s = s.split(k).join(map[k])
  s = s.replace(/&#(\d+);/g, (_: any, c: any) => String.fromCharCode(parseInt(c, 10)))
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_: any, c: any) => String.fromCharCode(parseInt(c, 16)))
  return s
}

type NodeTypes = DefaultNodeTypes | SerializedBlockNode<CodeBlockProps | any>

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  // Ékezet fix - minden text node-ban
  text: ({ node }: any) => {
    if (node?.text) {
      const original = node.text
      node.text = decode(node.text)
      // Debug: if you still see &aacute;, log it
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
