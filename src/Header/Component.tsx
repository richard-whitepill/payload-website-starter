import React from 'react'
import Link from 'next/link'

type HeaderProps = {
  header?: any
}

export const Header: React.FC<HeaderProps> = ({ header }) => {
  // Adminban szerkeszthető mezők - Globals -> Header
  const email = header?.email || 'info@efdsz.hu'
  const fbUrl = header?.facebookUrl || 'https://www.facebook.com/efdsz.hivatalos'
  
  // Logók és szlogen - Adminban feltölthető!
  const mainLogo = header?.logo || header?.mainLogo
  const mainLogoUrl = typeof mainLogo === 'object' ? mainLogo?.url : null
  
  const heroImage = header?.heroImage
  const heroImageUrl = typeof heroImage === 'object' ? heroImage?.url : null
  
  const slogan = header?.slogan || 'Erdészeti és Faipari Dolgozók Szakszervezete'
  
  const smallLogo = header?.smallLogo || header?.sloganLogo
  const smallLogoUrl = typeof smallLogo === 'object' ? smallLogo?.url : null

  const navItems = header?.navItems || [
    { link: { label: 'Nyitó oldal', url: '/' } },
    { link: { label: 'Rólunk', url: '/rolunk' } },
    { link: { label: 'Hírek', url: '/posts' } },
    { link: { label: 'ERFA Híradó', url: '/erfa-hirado' } },
    { link: { label: 'Kapcsolat', url: '/kapcsolat' } },
  ]

  return (
    <header>
      {/* STICKY RÉSZ - ez marad fixen felül görgetéskor! */}
      <div className="sticky top-0 z-50">
        {/* 1. FELSŐ SÁV: email + FB - BCCFA stílus */}
        <div className="bg-[#2d5016] text-white text-sm">
          <div className="container flex justify-between items-center py-2 px-4">
            <div className="flex items-center gap-2">
              <span className="hidden md:inline">✉️</span>
              <a href={`mailto:${email}`} className="hover:underline hover:text-[#e8e0c8]">
                {email}
              </a>
            </div>
            <a
              href={fbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[#e8e0c8] transition-colors"
              aria-label="Facebook"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="hidden md:inline text-xs ml-1">Facebook</span>
            </a>
          </div>
        </div>

        {/* 2. FŐ MENÜ SÁV: bal logó + jobb menü - EZ IS STICKY! */}
        <div className="bg-[#fffef5] border-b border-[#d5cfb8] shadow-md">
          <div className="container flex justify-between items-center py-3 px-4">
            {/* BAL LOGÓ - feltölthető Adminban! */}
            <Link href="/" className="flex items-center gap-3">
              {mainLogoUrl ? (
                <img src={mainLogoUrl} alt="EFDSZ logó" className="h-12 md:h-14 w-auto object-contain" />
              ) : (
                <div className="w-12 h-12 bg-[#2d5016] rounded-full flex items-center justify-center text-white font-serif font-bold text-xl">
                  E
                </div>
              )}
              <div className="hidden md:block">
                <div className="font-serif font-bold text-[#2d5016] text-lg leading-none">EFDSZ</div>
                <div className="text-[10px] text-[#5d4037] uppercase tracking-wide">Erdészeti és Faipari Dolgozók Szakszervezete</div>
              </div>
            </Link>

            {/* JOBB MENÜ */}
            <nav className="hidden md:flex gap-6">
              {navItems.map((item: any, i: number) => {
                const label = item.link?.label || item.label
                const url = item.link?.url || item.url || '/'
                return (
                  <Link
                    key={i}
                    href={url}
                    className="text-sm font-medium text-[#2c2c2c] hover:text-[#2d5016] hover:underline underline-offset-4 transition-colors"
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>

            <button className="md:hidden text-[#2d5016]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* NEM STICKY RÉSZ - ez kigördül görgetéskor! */}
      {/* 3. HERO KÉP + SZLOGEN + KIS LOGÓ */}
      <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden bg-[#e8e0c8]">
        {heroImageUrl ? (
          <img src={heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#2d5016] to-[#5d4037] flex items-center justify-center">
            <span className="text-white/50 text-sm">Hero kép - Adminban töltsd fel!</span>
          </div>
        )}

        {/* Szlogen + kis logó a Hero képen */}
        <div className="absolute inset-0 bg-black/30 flex items-center">
          <div className="container px-4">
            <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto">
              {/* Szlogen - Adminban átírható! */}
              <h1 className="font-serif font-bold text-white text-2xl md:text-4xl leading-tight drop-shadow-lg">
                {slogan}
              </h1>

              {/* Kis logó a szlogentől jobbra - feltölthető! */}
              {smallLogoUrl ? (
                <div className="flex-shrink-0">
                  <img src={smallLogoUrl} alt="Kis logó" className="h-16 md:h-24 w-auto object-contain bg-white/90 p-2 rounded shadow-lg" />
                </div>
              ) : (
                <div className="hidden md:block flex-shrink-0 w-24 h-24 bg-white/20 rounded flex items-center justify-center text-white/50 text-xs">
                  Kis logó
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
