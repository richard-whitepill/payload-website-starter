// @ts-nocheck
import { cn } from '@/utilities/ui'
import React from 'react'
import Link from 'next/link'
import { Media } from '@/components/Media'

function decodeHtml(str: any) {
  if (!str || typeof str !== 'string') return str
  let s = str
  const map: any = {
    '&aacute;': 'á', '&Aacute;': 'Á', '&aac;': 'á', '&Aac;': 'Á',
    '&eacute;': 'é', '&Eacute;': 'É',
    '&iacute;': 'í', '&Iacute;': 'Í',
    '&oacute;': 'ó', '&Oacute;': 'Ó',
    '&uacute;': 'ú', '&Uacute;': 'Ú',
    '&ouml;': 'ö', '&Ouml;': 'Ö',
    '&uuml;': 'ü', '&Uuml;': 'Ü',
    '&odblac;': 'ő', '&Odblac;': 'Ő',
    '&udblac;': 'ű', '&Udblac;': 'Ű',
    '&oogon;': 'ő', '&uogon;': 'ű',
    '&amp;': '&', '&nbsp;': ' ', '&quot;': '"', '&lt;': '<', '&gt;': '>',
    '&#39;': "'", '&#34;': '"',
  }
  for (const k in map) s = s.split(k).join(map[k])
  // Fix truncated entities like &eacu, &eacute, k&, v&eacu
  s = s.replace(/&[a-z]+;?/gi, (m: string) => {
    const lower = m.toLowerCase()
    if (lower.startsWith('&aacute') || lower.startsWith('&aac')) return 'á'
    if (lower.startsWith('&eacute')) return 'é'
    if (lower.startsWith('&iacute')) return 'í'
    if (lower.startsWith('&oacute')) return 'ó'
    if (lower.startsWith('&uacute')) return 'ú'
    if (lower.startsWith('&ouml')) return 'ö'
    if (lower.startsWith('&uuml')) return 'ü'
    if (lower.startsWith('&odblac') || lower.startsWith('&oogon')) return 'ő'
    if (lower.startsWith('&udblac') || lower.startsWith('&uogon')) return 'ű'
    if (lower.startsWith('&eacu')) return 'é' // truncated &eacute
    if (lower.startsWith('&aacu')) return 'á'
    if (lower === '&' || lower === 'k&' || lower === 'v&' || lower.length <= 2) return ''
    return map[m] || ''
  })
  // Remove any remaining &... fragments at end
  s = s.replace(/&[a-z]*$/gi, '')
  s = s.replace(/&[a-z]+$/gi, '')
  if (typeof document !== 'undefined') {
    try {
      const txt = document.createElement('textarea')
      txt.innerHTML = s
      return txt.value
    } catch {}
  }
  return s
}

export const Card: React.FC<{
  alignItems?: 'center'
  className?: string
  doc?: any
  relationTo?: string
  showCategories?: boolean
  title?: string
}> = (props) => {
  const { className, doc, relationTo, showCategories, title: titleFromProps } = props

  const { slug, categories, meta, title } = doc || {}
  const { description, image } = meta || {}
  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
  const titleToUse = titleFromProps || title
  const sanitizedDescription = description ? decodeHtml(description) : ''
  const sanitizedTitle = titleToUse ? decodeHtml(titleToUse) : ''
  const href = `/${relationTo !== 'pages' ? `${relationTo}/` : ''}${slug}`

  return (
    <article className={cn('border border-border rounded-lg overflow-hidden bg-card hover:cursor-pointer', className)}>
      <div className="relative w-full">
        {!image && <div className="w-full h-full bg-card" />}
        {image && typeof image !== 'string' && <Media resource={image} size="33vw" />}
      </div>
      <div className="p-4">
        {showCategories && hasCategories && (
          <div className="uppercase text-sm mb-4">
            {showCategories && hasCategories && (
              <div>
                {categories?.map((category: any, index: number) => {
                  if (typeof category === 'object') {
                    const { title: titleFromCategory } = category
                    const categoryTitle = titleFromCategory || 'Untitled category'
                    const isLast = index === categories.length - 1
                    return (
                      <React.Fragment key={index}>
                        {decodeHtml(categoryTitle)}
                        {!isLast && <React.Fragment>, &nbsp;</React.Fragment>}
                      </React.Fragment>
                    )
                  }
                  return null
                })}
              </div>
            )}
          </div>
        )}
        {sanitizedTitle && (
          <div className="prose">
            <h3>
              <Link className="not-prose" href={href}>
                {sanitizedTitle}
              </Link>
            </h3>
          </div>
        )}
        {sanitizedDescription && <div className="mt-2">{sanitizedDescription && <p>{sanitizedDescription}</p>}</div>}
      </div>
    </article>
  )
}
