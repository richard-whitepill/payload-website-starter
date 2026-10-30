'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export function SearchInput({ className, placeholder }: { className?: string; placeholder?: string }) {
  const searchParams = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const [value, setValue] = useState(initialQ)

  // Ha URL-ben van q, az maradjon a mezőben (első és második kattintásnál is)
  useEffect(() => {
    const q = searchParams.get('q') || ''
    setValue(q)
  }, [searchParams])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = value.trim()
    if (q) {
      // Hard navigation - biztosan első kattintásra is fut!
      window.location.href = `/search?q=${encodeURIComponent(q)}`
    } else {
      window.location.href = '/search'
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder || 'Keresés...'}
          className={className}
        />
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </form>
  )
}
