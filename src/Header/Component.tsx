import { Header as HeaderType } from '@/payload-types'
import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import React from 'react'
// data optional, hogy layout.tsx se sírjon
export const Header: React.FC<{ data?: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []
  return (
    <header className="w-full">
      <div className="bg-[#2d5016] text-[#f5f5dc] border-b-4 border-[#5d4037]">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="bg-[#f5f5dc] text-[#2d5016] w-[60px] h-[60px] rounded-full flex items-center justify-center font-bold text-xl font-serif">
            EFDSZ
          </Link>
          <div className="flex flex-col">
            <Link href="/" className="font-serif font-bold text-xl md:text-2xl leading-tight">
              Erdészeti és Faipari Dolgozók Szakszervezete
            </Link>
            <span className="text-sm opacity-80 hidden md:block">1146 Budapest, Thököly út 58-60.</span>
          </div>
        </div>
      </div>
      <nav className="bg-[#1a3a0f] text-[#f5f5dc] border-b border-[#5d4037]">
        <div className="container mx-auto px-4">
          <ul className="flex flex-wrap">
            <li className="border-r border-[#2d5016]/50">
              <Link href="/" className="block px-4 py-3 hover:bg-[#2d5016]">Nyitó oldal</Link>
            </li>
            {navItems.map(({ link }, i) => (
              <li key={i} className="border-r border-[#2d5016]/50">
                <CMSLink {...link} className="block px-4 py-3 hover:bg-[#2d5016]" />
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  )
}
