import React from 'react'
import Link from 'next/link'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { Header } from '@/payload-types'
import { HeaderNav } from './Nav'
import { SearchInput } from './SearchInput'

export async function Header() {
  const headerData: Header = await getCachedGlobal('header', 1)()
  const email = 'info@efdsz.hu'
  const facebookUrl = 'https://www.facebook.com/profile.php?id=61586450575333'

  return (
    <>
      {/* TOP BAR */}
      <div className="w-full bg-[#2d5016] text-white text-sm" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <div className="container mx-auto px-4 py-2 flex justify-between items-center gap-4">
          <a href={`mailto:${email}`} className="hover:underline flex items-center gap-2 shrink-0">
            <span>✉</span> {email}
          </a>
          <div className="flex items-center gap-3">
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 bg-white/10 p-1.5 rounded-full"
              aria-label="EFDSZ Facebook - ERFA Híradó"
              title="ERFA Híradó Facebook"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <SearchInput
              placeholder="Keresés..."
              className="w-[140px] md:w-[200px] bg-[#1a3010] border border-white/20 text-white placeholder-white/60 text-sm px-3 py-1.5 pr-8 rounded-full focus:outline-none focus:bg-[#0f1e0a] focus:border-white/40"
            />
          </div>
        </div>
      </div>

      {/* MAIN HEADER */}
      <header className="w-full bg-[#fffef5] border-b border-[#e8e0c8] sticky top-0 z-40 shadow-sm" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <div className="container mx-auto px-4 py-2 flex justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <img src="/efdsz-logo.png" alt="EFDSZ" className="h-12 w-12 object-contain" />
            <div className="leading-tight hidden sm:block">
              <div className="font-bold text-[#2d5016] text-lg leading-none">EFDSZ</div>
              <div className="text-[10px] text-[#5d4037] uppercase">Erdészeti Szakszervezet</div>
            </div>
          </Link>
          <div className="flex items-center gap-4 flex-1 justify-end">
            <HeaderNav data={headerData} />
            <SearchInput
              placeholder="Keresés az oldalon..."
              className="hidden md:block w-[200px] lg:w-[260px] bg-[#e8e0c8] border border-[#d0c4a8] text-[#2d5016] placeholder-[#8a7a60] text-sm px-4 py-2 pr-10 rounded-full focus:outline-none focus:bg-[#ddd0b0] focus:border-[#b0a080] shadow-inner"
            />
          </div>
        </div>
      </header>

      {/* HERO - sablon */}
      <div className="relative w-full h-[380px] md:h-[420px] lg:h-[460px] overflow-hidden">
        <img
          src="/hero-forest-mod.jpg"
          alt="EFDSZ - Erdészeti és Faipari Dolgozók Szakszervezete"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </>
  )
}
