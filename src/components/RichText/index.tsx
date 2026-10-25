import React from 'react'
import { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical'
import { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { JSXConvertersFunction, RichText as RichTextLexical } from '@payloadcms/richtext-lexical/react'

import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { CodeBlock, CodeBlockProps } from '@/blocks/Code/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'

type NodeTypes = DefaultNodeTypes | SerializedBlockNode<CodeBlockProps | any>

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  blocks: {
    banner: ({ node }: any) => <BannerBlock className="col-start-2 mb-4" {...node.fields} />,
    mediaBlock: ({ node }: any) => {
      // FIX: Only pass fields that MediaBlock actually has, no extra props like captionClassName
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
