'use client'

import React, { useState, useMemo } from 'react'
import type { Industry, Occupation } from '@/lib/types'

type SortKey = 'name' | 'aiCapability' | 'physicalFriction' | 'regulation' | 'trustNeed' | 'automationRisk' | 'blsEmployment'
type SortDir = 'asc' | 'desc'

const BOTTLENECK_FILTERS = ['regulation', 'physical', 'trust'] as const

function ScoreBar({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-dim rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(value / max) * 100}%`, background: color }}
        />
      </div>
      <span className="text-xs text-muted w-6 text-right">{value}</span>
    </div>
  )
}

function formatEmployment(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

export default function BottleneckTable({
  industries,
  occupations,
}: {
  industries: Industry[]
  occupations: Occupation[]
}) {
  const [sortKey, setSortKey] = useState<SortKey>('automationRisk')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function toggleFilter(f: string) {
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    )
  }

  const filtered = useMemo(() => {
    let rows = industries
    if (activeFilters.length > 0) {
      rows = rows.filter((ind) =>
        activeFilters.every((f) => ind.bottleneckTypes.includes(f))
      )
    }
    return [...rows].sort((a, b) => {
      const av = a[sortKey] as number | string
      const bv = b[sortKey] as number | string
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [industries, activeFilters, sortKey, sortDir])

  const cols: { key: SortKey; label: string }[] = [
    { key: 'name', label: 'INDUSTRY' },
    { key: 'aiCapability', label: 'AI CAP.' },
    { key: 'physicalFriction', label: 'PHYSICAL' },
    { key: 'regulation', label: 'REGULATION' },
    { key: 'trustNeed', label: 'TRUST' },
    { key: 'automationRisk', label: 'AUTO RISK' },
    { key: 'blsEmployment', label: 'WORKERS' },
  ]

  return (
    <div>
      {/* Filter chips */}
      <div className="flex gap-2 mb-4">
        <span className="text-muted text-xs self-center">FILTER BY BOTTLENECK:</span>
        {BOTTLENECK_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => toggleFilter(f)}
            className={`text-xs px-3 py-1 rounded border font-mono transition-colors ${
              activeFilters.includes(f)
                ? 'border-neon text-neon bg-neon/10'
                : 'border-border text-muted hover:border-neon/50'
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
        {activeFilters.length > 0 && (
          <button
            onClick={() => setActiveFilters([])}
            className="text-xs text-muted hover:text-amber ml-auto"
          >
            CLEAR ×
          </button>
        )}
      </div>

      {/* Table */}
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-border bg-surface">
              {cols.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="px-3 py-2 text-left text-muted cursor-pointer hover:text-neon select-none"
                >
                  {label}{' '}
                  {sortKey === key && (
                    <span className="text-neon">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((ind) => {
              const isExpanded = expandedId === ind.id
              const relatedOccs = occupations
                .filter((o) => o.industryId === ind.id)
                .sort((a, b) => b.automationExposure - a.automationExposure)
                .slice(0, 5)

              return (
                <React.Fragment key={ind.id}>
                  <tr
                    onClick={() => setExpandedId(isExpanded ? null : ind.id)}
                    className="border-b border-border cursor-pointer hover:bg-surface/60 transition-colors"
                  >
                    <td className="px-3 py-3">
                      <span className="text-neon mr-1">{isExpanded ? '▼' : '▶'}</span>
                      {ind.name}
                    </td>
                    <td className="px-3 py-2 w-28">
                      <ScoreBar value={ind.aiCapability} color="#00ff88" />
                    </td>
                    <td className="px-3 py-2 w-28">
                      <ScoreBar value={ind.physicalFriction} color="#ff6b35" />
                    </td>
                    <td className="px-3 py-2 w-28">
                      <ScoreBar value={ind.regulation} color="#ff6b35" />
                    </td>
                    <td className="px-3 py-2 w-28">
                      <ScoreBar value={ind.trustNeed} color="#00bfff" />
                    </td>
                    <td className="px-3 py-2 w-28">
                      <ScoreBar value={ind.automationRisk} color="#00ff88" />
                    </td>
                    <td className="px-3 py-2 text-muted">
                      {formatEmployment(ind.blsEmployment)}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-b border-border bg-surface/40">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="text-muted text-xs mb-2 tracking-widest">TOP OCCUPATIONS BY AUTOMATION EXPOSURE</div>
                        <div className="space-y-2">
                          {relatedOccs.map((occ) => (
                            <div key={occ.socCode} className="flex items-center gap-3">
                              <span className="text-dim w-28">{occ.socCode}</span>
                              <span className="flex-1">{occ.title}</span>
                              <div className="w-32">
                                <ScoreBar value={occ.automationExposure} max={100} color="#00ff88" />
                              </div>
                            </div>
                          ))}
                        </div>
                        {ind.bottleneckTypes.length > 0 && (
                          <div className="mt-3 flex gap-2">
                            <span className="text-muted text-xs">BOTTLENECKS:</span>
                            {ind.bottleneckTypes.map((b) => (
                              <span key={b} className="text-xs text-amber border border-amber/30 px-2 py-0.5 rounded">
                                {b.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <p className="text-muted text-xs text-center py-8">No industries match the selected filters.</p>
      )}
    </div>
  )
}
