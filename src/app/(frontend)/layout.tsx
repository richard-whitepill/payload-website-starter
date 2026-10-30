import type { Metadata } from 'next'
import React from 'react'
import { draftMode } from 'next/headers'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { Header } from '@/Header/Component'
import { Footer } from '@/Footer/Component'
import './globals.css'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled: draft } = await draftMode()

  return (
    <html lang="hu">
      <body>
        {/* AdminBar KIKAPCSOLVA - nem látszik a fekete csík */}
        {/* Ha vissza akarod kapcsolni, vedd ki a kommentet: */}
        {/* <AdminBar draft={draft} /> */}
        
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  title: 'EFDSZ',
  description: 'Erdészeti és Faipari Dolgozók Szakszervezete',
}
