// @ts-nocheck
// src/utilities/decodeHtml.ts - HTML entitások dekódolása magyar ékezetekhez

export function decodeHtmlEntities(str) {
  if (!str) return str
  
  const entities = {
    '&aacute;': 'á', '&Aacute;': 'Á',
    '&eacute;': 'é', '&Eacute;': 'É',
    '&iacute;': 'í', '&Iacute;': 'Í',
    '&oacute;': 'ó', '&Oacute;': 'Ó',
    '&uacute;': 'ú', '&Uacute;': 'Ú',
    '&ouml;': 'ö', '&Ouml;': 'Ö',
    '&uuml;': 'ü', '&Uuml;': 'Ü',
    '&oogon;': 'ő', '&Oogon;': 'Ő',
    '&uogon;': 'ű', '&Uogon;': 'Ű',
    '&odblac;': 'ő', '&Odblac;': 'Ő',
    '&udblac;': 'ű', '&Udblac;': 'Ű',
    '&aac;': 'á', '&Aac;': 'Á',
    '&eacute': 'é', '&aacute': 'á', '&ouml': 'ö', '&uuml': 'ü',
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'",
    '&nbsp;': ' ', '&ndash;': '–', '&mdash;': '—',
    '&#39;': "'", '&#34;': '"', '&#38;': '&',
  }

  let decoded = str
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.split(entity).join(char)
  }
  
  decoded = decoded.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))

  if (typeof document !== 'undefined') {
    const txt = document.createElement('textarea')
    txt.innerHTML = decoded
    return txt.value
  }

  return decoded
}

export function decodeRichTextNode(node) {
  if (!node) return node
  if (typeof node === 'string') {
    return decodeHtmlEntities(node)
  }
  if (Array.isArray(node)) {
    return node.map(decodeRichTextNode)
  }
  if (typeof node === 'object') {
    if (node.text) {
      return { ...node, text: decodeHtmlEntities(node.text) }
    }
    const newNode = { ...node }
    if (newNode.children) {
      newNode.children = newNode.children.map(decodeRichTextNode)
    }
    return newNode
  }
  return node
}
