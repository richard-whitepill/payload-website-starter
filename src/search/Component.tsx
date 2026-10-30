// @ts-nocheck
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export const Search: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Kezdetben URL-ből olvassa a q-t (header-ből jött)
  const [searchTerm, setSearchTerm] = useState(() => {
    try {
      return searchParams.get('q') || ''
    } catch {
      return ''
    }
  })

  const debouncedSearchTerm = useDebounce(searchTerm, 400)

  // Ha URL változik (header keresés), frissítse az inputot
  useEffect(() => {
    const q = searchParams.get('q') || ''
    if (q !== searchTerm) {
      setSearchTerm(q)
    }
  }, [searchParams])

  // Csak akkor pusholjon ha a felhasználó gépelt, ne törölje a header-ből jött q-t
  useEffect(() => {
    const currentQ = searchParams.get('q') || ''
    // Ha a debounced és a current megegyezik, ne pusholjon (megőrzi a ?q=-t)
    if (debouncedSearchTerm === currentQ) return

    const params = new URLSearchParams(searchParams.toString())
    if (debouncedSearchTerm) {
      params.set('q', debouncedSearchTerm)
    } else {
      // Csak akkor törölje ha tényleg üres és a felhasználó törölte
      if (currentQ && debouncedSearchTerm === '') {
        params.delete('q')
      } else {
        return
      }
    }
    router.push(`/search?${params.toString()}`, { scroll: false })
  }, [debouncedSearchTerm])

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search"
        className="w-full border border-gray-300 rounded px-4 py-2"
      />
    </div>
  )
}

export default Search
