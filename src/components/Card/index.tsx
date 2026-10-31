// @ts-nocheck
import { cn } from '@/utilities/ui'
import React from 'react'
import Link from 'next/link'
import { Media } from '@/components/Media'

export type CardPostData = any

function decodeHtml(str: any) {
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
  s = s.replace(/&[a-z]+;?/gi, (m: string) => {
    const l = m.toLowerCase()
    if (l.startsWith('&aacute') || l.startsWith('&aac')) return 'á'
    if (l.startsWith('&eacute') || l.startsWith('&eacu')) return 'é'
    if (l.startsWith('&iacute')) return 'í'
    if (l.startsWith('&oacute')) return 'ó'
    if (l.startsWith('&uacute')) return 'ú'
    if (l.startsWith('&ouml')) return 'ö'
    if (l.startsWith('&uuml')) return 'ü'
    if (l.startsWith('&odblac') || l.startsWith('&oogon')) return 'ő'
    if (l.startsWith('&udblac') || l.startsWith('&uogon')) return 'ű'
    if (l === '&' || l === 'k&' || l === 'v&' || l.length <= 2) return ''
    return ''
  })
  s = s.replace(/&[a-z]*$/gi, '')
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
        {sanitizedTitle && (
          <div className="prose">
            <h3>
              <Link className="not-prose" href={href}>
                {sanitizedTitle}
              </Link>
            </h3>
          </div>
        )}
        {sanitizedDescription && <div className="mt-2"><p>{sanitizedDescription}</p></div>}
      </div>
    </article>
  )
}
