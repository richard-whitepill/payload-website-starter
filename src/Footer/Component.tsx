
import React from 'react'
export const Footer: React.FC<any> = () => {
  return (
    <footer className="bg-[#5d4037] text-[#f5f5dc] border-t-4 border-[#2d5016] mt-12">
      <div className="container mx-auto px-4 py-6 text-center">
        <p className="font-serif font-bold text-lg mb-2">
          Erdészeti és Faipari Dolgozók Szakszervezete
        </p>
        <p className="text-sm opacity-90 leading-relaxed">
          1146 Budapest, Thököly út 58-60. | Tel.: 331-4369 | Fax: 331-9455 | Email: 2016efdsz@gmail.com
        </p>
        <p className="text-xs opacity-60 mt-3">
          © 2025 EFDSZ | ERDÉSZETI ÉS FAIPARI HÍRADÓ | Kiadja az EFDSZ
        </p>
      </div>
    </footer>
  )
}
