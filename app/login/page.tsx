'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  async function submit(code: string) {
    setLoading(true)
    setError(false)
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: code }),
    })
    if (res.ok) {
      router.replace('/')
    } else {
      setError(true)
      setDigits(['', '', '', ''])
      setLoading(false)
      inputs.current[0]?.focus()
    }
  }

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return
    const next = [...digits]
    next[index] = value
    setDigits(next)
    if (value && index < 3) inputs.current[index + 1]?.focus()
    if (next.every(d => d !== '') && next.join('').length === 4) {
      submit(next.join(''))
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  return (
    <div className="min-h-screen bg-[#fffff4] flex flex-col items-center justify-center">
      <h1 className="text-2xl font-medium tracking-tight text-[#013b4a] mb-2">Halo</h1>
      <p className="text-sm text-black/40 mb-8">Enter your passcode</p>
      <div className="flex gap-3">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => { inputs.current[i] = el }}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={d}
            autoFocus={i === 0}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            disabled={loading}
            className={`w-12 h-14 text-center text-2xl font-medium border rounded-lg outline-none transition-colors
              ${error ? 'border-red-400 bg-red-50' : 'border-black/20 bg-white focus:border-[#013b4a]'}
              ${loading ? 'opacity-50' : ''}`}
          />
        ))}
      </div>
      {error && <p className="mt-4 text-sm text-red-500">Incorrect passcode</p>}
    </div>
  )
}
