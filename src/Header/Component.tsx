import React from 'react'
import Link from 'next/link'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { Header } from '@/payload-types'
import { HeaderNav } from './Nav'

export async function Header() {
  const headerData: Header = await getCachedGlobal('header', 1)()

  const email = 'info@efdsz.hu'
  const facebookUrl = 'https://www.facebook.com/efdsz.hivatalos'
  const slogan = 'Erdészeti és Faipari Dolgozók Szakszervezete'

  return (
    <>
      {/* TOP BAR - zöld */}
      <div className="w-full bg-[#2d5016] text-white text-sm">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <a href={`mailto:${email}`} className="hover:underline flex items-center gap-2">
            <span>✉</span> {email}
          </a>
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80"
            aria-label="Facebook"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
        </div>
      </div>

      {/* MAIN HEADER - fehér, STICKY, bal oldalon a te zöld logód */}
      <header className="w-full bg-[#fffef5] border-b border-[#e8e0c8] sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <img
              src="/efdsz-logo.png"
              alt="EFDSZ logó"
              className="h-12 w-12 object-contain"
            />
            <div className="leading-tight hidden sm:block">
              <div className="font-bold text-[#2d5016] text-lg leading-none">EFDSZ</div>
              <div className="text-[10px] text-[#5d4037] uppercase tracking-wider">
                Erdészeti Szakszervezet
              </div>
            </div>
          </Link>
          <HeaderNav data={headerData} />
        </div>
      </header>

      {/* HERO - 400px, a TE képeddel, kigördül */}
      <div className="relative w-full h-[400px] overflow-hidden">
        <img
          src="/hero.jpg"
          alt="Erdő - EFDSZ"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="flex items-center gap-6 bg-white/90 backdrop-blur-sm px-8 py-6 rounded-lg shadow-lg border border-[#e8e0c8]">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2d5016] leading-tight">
                {slogan}
              </h1>
              <p className="text-[#5d4037] text-sm mt-1">1950 óta a dolgozókért</p>
            </div>
            {/* Kis logó jobbra a szlogen mellé */}
            <img
              src="/efdsz-logo.png"
              alt="EFDSZ"
              className="w-20 h-20 object-contain flex-shrink-0 hidden md:block"
            />
          </div>
        </div>
      </div>
    </>
  )
}
