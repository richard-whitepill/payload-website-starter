import React from 'react'
import Link from 'next/link'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { Header } from '@/payload-types'
import { HeaderNav } from './Nav'

export async function Header() {
  const headerData: Header = await getCachedGlobal('header', 1)()

  const email = 'info@efdsz.hu'
  const facebookUrl = 'https://www.facebook.com/efdsz.hivatalos'

  return (
    <>
      {/* TOP BAR */}
      <div className="w-full bg-[#2d5016] text-white text-sm">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <a href={`mailto:${email}`} className="hover:underline flex items-center gap-2">
            <span>✉</span> {email}
          </a>
          <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
        </div>
      </div>

      {/* MAIN HEADER - sticky */}
      <header className="w-full bg-[#fffef5] border-b border-[#e8e0c8] sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <img src="/efdsz-logo.png" alt="EFDSZ" className="h-12 w-12 object-contain" />
            <div className="leading-tight hidden sm:block">
              <div className="font-bold text-[#2d5016] text-lg leading-none">EFDSZ</div>
              <div className="text-[10px] text-[#5d4037] uppercase">Erdészeti Szakszervezet</div>
            </div>
          </Link>
          <HeaderNav data={headerData} />
        </div>
      </header>

      {/* HERO - BCCFA stílus, középre zárt, 3 sor is lehet */}
      <div className="relative w-full h-[480px] md:h-[520px] overflow-hidden flex items-center justify-center">
        <img
          src="/hero.jpg"
          alt="Erdő"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />

        {/* Középre zárt tartalom - mint BCCFA */}
        <div className="relative z-10 container mx-auto px-4 flex flex-col items-center justify-center text-center">
          {/* Fatörzs szelet logó - középen */}
          <img
            src="/logo-right.png"
            alt="EFDSZ logó"
            className="w-48 md:w-64 lg:w-72 object-contain mb-6 drop-shadow-2xl"
          />

          {/* 3 sornyi szlogen - középre zárt, mint BCCFA */}
          <div className="bg-white/90 backdrop-blur-sm px-8 py-6 rounded-xl shadow-2xl border border-white/50 max-w-3xl">
            <h1 className="font-bold text-[#2d5016] text-xl md:text-2xl lg:text-3xl leading-tight">
              Erdészeti és Faipari<br />
              Dolgozók Szakszervezete<br />
              <span className="text-[#5d4037] text-lg md:text-xl font-normal">1950 óta a dolgozókért</span>
            </h1>
          </div>
        </div>
      </div>
    </>
  )
}
