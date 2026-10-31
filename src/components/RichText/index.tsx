// @ts-nocheck
import { RichText as RichTextConverter } from '@payloadcms/richtext-lexical/react'

function decode(str: string) {
  if (!str || typeof str !== 'string') return str
  const map: any = {
    '&aacute;': 'á', '&Aacute;': 'Á', '&aac;': 'á', '&Aac;': 'Á', '&aacute': 'á',
    '&eacute;': 'é', '&Eacute;': 'É', '&eacute': 'é',
    '&iacute;': 'í', '&Iacute;': 'Í',
    '&oacute;': 'ó', '&Oacute;': 'Ó',
    '&uacute;': 'ú', '&Uacute;': 'Ú',
    '&ouml;': 'ö', '&Ouml;': 'Ö', '&ouml': 'ö',
    '&uuml;': 'ü', '&Uuml;': 'Ü', '&uuml': 'ü',
    '&odblac;': 'ő', '&Odblac;': 'Ő', '&odblac': 'ő',
    '&udblac;': 'ű', '&Udblac;': 'Ű', '&udblac': 'ű',
    '&oogon;': 'ő', '&uogon;': 'ű',
    '&amp;': '&', '&nbsp;': ' ', '&quot;': '"', '&lt;': '<', '&gt;': '>',
    '&#39;': "'", '&#34;': '"', '&#38;': '&',
    '&ndash;': '–', '&mdash;': '—',
  }
  let s = str
  for (const k in map) {
    s = s.split(k).join(map[k])
  }
  // h&aac -> há  (truncated)
  s = s.replace(/&aacute;|&aac;?/g, 'á')
  s = s.replace(/&eacute;?/g, 'é')
  s = s.replace(/&ouml;?/g, 'ö')
  s = s.replace(/&uuml;?/g, 'ü')
  s = s.replace(/&odblac;?|&oogon;?/g, 'ő')
  s = s.replace(/&udblac;?|&uogon;?/g, 'ű')
  s = s.replace(/&#(\d+);/g, (_: any, c: any) => String.fromCharCode(parseInt(c, 10)))
  return s
}

export function RichText(props: any) {
  const converters = {
    // Fix ékezet in text nodes
    text: ({ node, nodesToJSX }: any) => {
      const text = decode(node?.text || '')
      // Keep formatting (bold, italic etc) via default handling
      const formatted = nodesToJSX ? nodesToJSX({ nodes: [{ ...node, text }] }) : text
      return formatted
    },
    // Fix képek - normál méret
    upload: ({ node }: any) => {
      const v = node?.value || node?.fields || {}
      const url = v?.url || v?.sizes?.medium?.url || v?.sizes?.large?.url
      if (!url) return null
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={url} alt={v?.alt || ''} style={{ maxWidth: '100%', height: 'auto', margin: '1rem 0', borderRadius: '8px' }} />
    },
    blocks: {
      mediaBlock: ({ node }: any) => {
        const media = node?.fields?.media || node?.fields
        const url = media?.url || media?.sizes?.medium?.url
        if (!url) return null
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={url} alt={media?.alt || ''} style={{ maxWidth: '100%', height: 'auto', margin: '1rem 0', borderRadius: '8px' }} />
      }
    }
  } as any

  return (
    <RichTextConverter
      {...props}
      converters={converters}
    />
  )
}

export default RichText
