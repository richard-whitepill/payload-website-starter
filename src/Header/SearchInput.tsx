'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SearchInput({ className, placeholder }: { className?: string; placeholder?: string }) {
  const [value, setValue] = useState('')
  const router = useRouter()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = value.trim()
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
    } else {
      router.push('/search')
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
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </form>
  )
}
