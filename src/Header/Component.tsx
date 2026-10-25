import { Header as HeaderType } from '@/payload-types'
import { CMSLink } from '@/components/Link'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
export const Header: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []
  const logo = data?.logo as any
  const orgName = data?.orgName || 'Erdészeti és Faipari Dolgozók Szakszervezete'
  const orgShort = data?.orgShortName || 'EFDSZ'
  return (
    <header className="w-full">
      {/* Felső zöld sáv - logó + cím - mint régi efdsz.hu */}
      <div className="bg-[#2d5016] text-[#f5f5dc] border-b-4 border-[#5d4037]">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          {logo?.url ? (
            <Link href="/">
              <Image
                src={logo.url}
                alt={logo.alt || 'EFDSZ'}
                width={60}
                height={60}
                className="bg-white rounded-full p-1"
              />
            </Link>
          ) : (
            <Link href="/" className="bg-[#f5f5dc] text-[#2d5016] w-[60px] h-[60px] rounded-full flex items-center justify-center font-bold text-xl font-serif">
              {orgShort.slice(0,4)}
            </Link>
          )}
          <div className="flex flex-col">
            <Link href="/" className="font-serif font-bold text-xl md:text-2xl leading-tight hover:text-white transition-colors">
              {orgName}
            </Link>
            <span className="text-sm opacity-80 hidden md:block">Erdészeti és Faipari Híradó | 1146 Budapest, Thököly út 58-60.</span>
          </div>
        </div>
      </div>
      {/* Felső menü - zöld sáv - Joomla Main Menu stílus */}
      <nav className="bg-[#1a3a0f] text-[#f5f5dc] border-b border-[#5d4037] shadow-md">
        <div className="container mx-auto px-4">
          <ul className="flex flex-wrap gap-0">
            <li>
              <Link href="/" className="block px-4 py-3 hover:bg-[#2d5016] transition-colors font-medium border-r border-[#2d5016]/50">
                Nyitó oldal
              </Link>
            </li>
            {navItems.map(({ link }, i) => (
              <li key={i} className="border-r border-[#2d5016]/50">
                <CMSLink
                  {...link}
                  className="block px-4 py-3 hover:bg-[#2d5016] transition-colors font-medium"
                />
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  )
}
