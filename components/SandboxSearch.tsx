'use client'

import { useState, useMemo, useRef } from 'react'
import type { SandboxEntry } from '@/lib/types'
import type { SandboxOutput } from '@/lib/sandbox-schema'
import SandboxResult from '@/components/SandboxResult'
import prebuilt from '@/data/sandbox-prebuilt.json'

const PREBUILT = prebuilt as Record<string, SandboxEntry>

export default function SandboxSearch({
  occupationTitles,
}: {
  occupationTitles: string[]
}) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<SandboxEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return occupationTitles
      .filter((t) => t.toLowerCase().includes(q))
      .slice(0, 8)
  }, [query, occupationTitles])

  async function analyze(title: string) {
    setQuery(title)
    setShowSuggestions(false)
    setError(null)

    const key = title.toLowerCase().trim()
    const prebuiltEntry = PREBUILT[key]
    if (prebuiltEntry) {
      setResult(prebuiltEntry)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) throw new Error('Analysis failed')
      const data: SandboxOutput = await res.json()
      setResult(data as SandboxEntry)
    } catch {
      setError('Analysis failed. Check your ANTHROPIC_API_KEY and try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && query.trim()) {
      analyze(query.trim())
    }
  }

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="relative">
        <div className="flex items-center border border-border rounded bg-surface focus-within:border-neon/50 transition-colors">
          <span className="text-neon px-3 text-sm">$</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true) }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Enter a job title... (e.g. Accountant, Nurse, Truck Driver)"
            className="flex-1 bg-transparent text-sm py-3 pr-3 outline-none placeholder:text-muted"
          />
          <button
            onClick={() => query.trim() && analyze(query.trim())}
            disabled={loading || !query.trim()}
            className="px-4 py-3 text-xs text-neon border-l border-border hover:bg-neon/5 disabled:opacity-40 transition-colors"
          >
            {loading ? 'ANALYZING...' : 'ANALYZE →'}
          </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-10 border border-border border-t-0 rounded-b bg-surface">
            {suggestions.map((s) => (
              <button
                key={s}
                onMouseDown={() => analyze(s)}
                className="block w-full text-left px-4 py-2 text-xs hover:bg-neon/5 hover:text-neon text-muted transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick picks */}
      <div>
        <div className="text-muted text-xs mb-2 tracking-widest">QUICK PICKS</div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(PREBUILT).slice(0, 10).map((key) => (
            <button
              key={key}
              onClick={() => analyze(key)}
              className="text-xs border border-border text-muted hover:border-neon/50 hover:text-neon px-3 py-1 rounded transition-colors"
            >
              {PREBUILT[key].title}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-amber text-xs border border-amber/30 rounded px-3 py-2">{error}</p>
      )}

      {loading && (
        <div className="border border-border rounded bg-surface p-6 text-center text-muted text-sm">
          Analyzing {query}...
        </div>
      )}

      {!loading && <SandboxResult entry={result} />}
    </div>
  )
}
