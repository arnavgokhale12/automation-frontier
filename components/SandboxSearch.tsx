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
      setResult({
        ...prebuiltEntry,
        confidence: 'Curated preset',
        analysisMode: 'Hand-tuned example analysis',
      })
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
      setError('Analysis failed. Try a quick pick or a more specific job title.')
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
      <div className="relative">
        <div className="flex items-center overflow-hidden rounded-lg border border-border/80 bg-surface/85 shadow-2xl shadow-black/20 transition-colors focus-within:border-cyan/60">
          <span className="px-4 text-sm text-cyan">$</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true) }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Enter a job title... (e.g. Accountant, Nurse, Truck Driver)"
            className="min-w-0 flex-1 bg-transparent py-4 pr-3 text-sm text-ink outline-none placeholder:text-muted"
          />
          <button
            onClick={() => query.trim() && analyze(query.trim())}
            disabled={loading || !query.trim()}
            className="border-l border-border px-4 py-4 text-xs text-cyan transition-colors hover:bg-cyan/10 disabled:opacity-40"
          >
            {loading ? 'ANALYZING...' : 'ANALYZE →'}
          </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-10 overflow-hidden rounded-b-lg border border-border border-t-0 bg-surface shadow-2xl shadow-black/30">
            {suggestions.map((s) => (
              <button
                key={s}
                onMouseDown={() => analyze(s)}
                className="block w-full px-4 py-2.5 text-left text-xs text-muted transition-colors hover:bg-cyan/10 hover:text-ink"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-cyan/20 bg-cyan/5 px-4 py-3 text-xs leading-5 text-muted">
        <span className="font-semibold text-cyan">No API key required.</span>{' '}
        Custom searches use a local estimate from the project&apos;s industry and occupation data.
        Curated presets are hand-tuned; optional AI analysis can be enabled later with an API key.
      </div>

      <div className="rounded-lg border border-border/80 bg-surface/65 p-4">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-xs uppercase tracking-[0.18em] text-muted">Quick picks</div>
          <div className="text-[11px] text-muted">Curated examples across knowledge, care, logistics, trades, and creative work</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(PREBUILT).map((key) => (
            <button
              key={key}
              onClick={() => analyze(key)}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-cyan/40 hover:bg-cyan/10 hover:text-ink"
            >
              {PREBUILT[key].title}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-amber/30 bg-amber/10 px-3 py-2 text-xs text-amber">{error}</p>
      )}

      {loading && (
        <div className="rounded-lg border border-border/80 bg-surface/85 p-6 text-center text-sm text-muted">
          Analyzing {query}...
        </div>
      )}

      {!loading && <SandboxResult entry={result} />}
    </div>
  )
}
