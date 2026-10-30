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
  const initialQ = searchParams.get('q') || ''
  const [searchTerm, setSearchTerm] = useState(initialQ)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Ha URL-ben van q (header-ből jött), azt tegye be az inputba
  useEffect(() => {
    const q = searchParams.get('q') || ''
    setSearchTerm(q)
  }, [searchParams])

  // Gépeléskor frissítse az URL-t ?q= paraméterrel - ez triggereli a szerver oldali keresést
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (debouncedSearchTerm) {
      params.set('q', debouncedSearchTerm)
    } else {
      params.delete('q')
    }
    // Csak akkor pusholjon ha változott
    const currentQ = searchParams.get('q') || ''
    if (debouncedSearchTerm !== currentQ) {
      router.push(`/search?${params.toString()}`, { scroll: false })
    }
  }, [debouncedSearchTerm, router, searchParams])

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
