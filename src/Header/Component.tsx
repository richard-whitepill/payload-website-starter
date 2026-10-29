
import React from 'react'
import Link from 'next/link'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { Header } from '@/payload-types'
import { HeaderNav } from './Nav'

export async function Header() {
  const headerData: Header = await getCachedGlobal('header', 1)()

  // FIX KÓDOLÁS - nem Adminból!
  const email = 'info@efdsz.hu'
  const facebookUrl = 'https://www.facebook.com/efdsz.hivatalos'
  const slogan = 'Erdészeti és Faipari Dolgozók Szakszervezete'

  return (
    <>
      {/* TOP BAR - zöld, email bal, Facebook jobb - BCCFA stílus */}
      <div className="w-full bg-[#2d5016] text-white text-sm">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <a href={`mailto:${email}`} className="hover:underline flex items-center gap-2">
            <span>✉</span> {email}
          </a>
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 flex items-center gap-1"
            aria-label="Facebook"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
        </div>
      </div>

      {/* MAIN HEADER - fehér, logo bal, menü jobb, STICKY */}
      <header className="w-full bg-[#fffef5] border-b border-[#e8e0c8] sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            {/* Ha van feltöltött logo, használd, különben szöveg */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#2d5016] rounded-full flex items-center justify-center text-white font-bold text-xl">
                E
              </div>
              <div className="leading-tight">
                <div className="font-bold text-[#2d5016] text-lg">EFDSZ</div>
                <div className="text-[10px] text-[#5d4037] uppercase tracking-wider">
                  Erdészeti Szakszervezet
                </div>
              </div>
            </div>
          </Link>
          <HeaderNav data={headerData} />
        </div>
      </header>

      {/* HERO - 400px, erdős kép, szlogen + kis logo jobbra, görgetéskor eltűnik */}
      <div className="relative w-full h-[400px] overflow-hidden">
        {/* Hero kép - fix kódolt erdős kép */}
        <img
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2000&auto=format&fit=crop"
          alt="Erdő"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Sötét overlay hogy olvasható legyen a szlogen */}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Szlogen + kis logo jobbra */}
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="flex items-center gap-6 bg-white/90 backdrop-blur-sm px-8 py-6 rounded-lg shadow-lg border border-[#e8e0c8]">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2d5016] leading-tight">
                {slogan}
              </h1>
              <p className="text-[#5d4037] text-sm mt-1">1950 óta a dolgozókért</p>
            </div>
            {/* Kis zöld logó jobbra a szlogen mellé */}
            <div className="w-20 h-20 bg-[#2d5016] rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
              🌿
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
