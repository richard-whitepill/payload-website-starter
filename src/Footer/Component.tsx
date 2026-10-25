import { Footer as FooterType } from '@/payload-types'
import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import React from 'react'
export const Footer: React.FC<{ data?: FooterType }> = ({ data }) => {
  const navItems = data?.navItems || []
  return (
    <footer className="bg-[#5d4037] text-[#f5f5dc] border-t-4 border-[#2d5016] mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-serif font-bold text-lg mb-3">EFDSZ</h3>
            <p className="text-sm leading-relaxed opacity-90">
              Erdészeti és Faipari Dolgozók Szakszervezete<br />
              1146 Budapest, Thököly út 58-60.<br />
              Tel.: 331-4369<br />
              Email: 2016efdsz@gmail.com
            </p>
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg mb-3">Menü</h3>
            <ul className="text-sm space-y-2">
              <li><Link href="/" className="hover:underline">Nyitó oldal</Link></li>
              {navItems.map(({ link }, i) => (
                <li key={i}><CMSLink {...link} className="hover:underline" /></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg mb-3">ERFA Híradó</h3>
            <p className="text-sm opacity-80">© 2025 EFDSZ</p>
          </div>
        </div>
      </div>
      <div className="bg-[#2d1f1a] text-center py-3 text-xs opacity-60">
        EFDSZ | 1146 Budapest, Thököly út 58-60.
      </div>
    </footer>
  )
}
