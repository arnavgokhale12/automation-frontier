'use client'

import React, { useState, useMemo } from 'react'
import type { Industry, Occupation } from '@/lib/types'

type SortKey = 'name' | 'aiCapability' | 'physicalFriction' | 'regulation' | 'trustNeed' | 'automationRisk' | 'blsEmployment'
type SortDir = 'asc' | 'desc'

const BOTTLENECK_FILTERS = ['regulation', 'physical', 'trust'] as const

const COLUMN_HELP: Record<SortKey, string> = {
  name: 'Industry sector being evaluated. Click a row to expand the top related occupations.',
  aiCapability: 'How capable current AI systems are at the digital and knowledge-work parts of this sector. Scale: 1 low, 5 high.',
  physicalFriction: 'How much real-world movement, hardware, site access, or embodied work slows automation. Scale: 1 low, 5 high.',
  regulation: 'How much compliance, licensing, audits, safety rules, or legal review slows deployment. Scale: 1 low, 5 high.',
  trustNeed: 'How much customers, workers, or institutions need human accountability before adopting automation. Scale: 1 low, 5 high.',
  automationRisk: 'Composite estimate of how exposed the sector is to automation after capability and bottlenecks are weighed. Scale: 1 low, 5 high.',
  blsEmployment: 'Approximate U.S. employment represented by the occupations mapped to this sector.',
}

const BOTTLENECK_HELP: Record<string, string> = {
  regulation: 'Regulation means licensing, safety rules, audits, liability, or compliance review make automation harder to deploy.',
  physical: 'Physical friction means the work depends on movement, tools, facilities, field conditions, or real-world execution.',
  trust: 'Trust means people still expect a human to be accountable for judgment, care, persuasion, or high-stakes decisions.',
}

function ScoreBar({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex min-w-24 items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-dim/70">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${(value / max) * 100}%`, background: color }}
        />
      </div>
      <span className="w-7 text-right text-xs tabular-nums text-muted">{value}</span>
    </div>
  )
}

function formatEmployment(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

function HeaderInfo({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        onClick={(event) => event.stopPropagation()}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-dim text-[10px] leading-none text-muted transition-colors hover:border-cyan/60 hover:text-cyan focus:border-cyan/60 focus:text-cyan focus:outline-none"
        aria-label={text}
      >
        i
      </button>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-md border border-border bg-bg px-3 py-2 text-left text-[11px] font-normal normal-case leading-5 tracking-normal text-ink opacity-0 shadow-2xl shadow-black/40 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {text}
      </span>
    </span>
  )
}

function ExposureCard({ occupation }: { occupation: Occupation }) {
  return (
    <div className="rounded-md border border-border/70 bg-panel/40 px-4 py-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="font-semibold text-ink">{occupation.title}</div>
          <div className="mt-1 text-[11px] text-muted">
            BLS occupation code {occupation.socCode}
          </div>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-lg font-semibold tabular-nums text-cyan">
            {occupation.automationExposure}
          </div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted">
            exposure / 100
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-dim/70">
          <div
            className="h-full rounded-full bg-neon"
            style={{ width: `${occupation.automationExposure}%` }}
          />
        </div>
        <span className="w-16 text-right text-xs text-muted">
          {occupation.automationExposure < 25 ? 'Lower' : occupation.automationExposure < 60 ? 'Medium' : 'Higher'}
        </span>
      </div>
    </div>
  )
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

  const totalWorkers = filtered.reduce((sum, industry) => sum + industry.blsEmployment, 0)

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
    <section className="overflow-hidden rounded-lg border border-border/80 bg-surface/85 shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-4 border-b border-border/70 bg-panel/40 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm font-semibold text-ink">Industry ranking</div>
          <div className="mt-1 text-xs text-muted">
            {filtered.length} sectors · {formatEmployment(totalWorkers)} workers in view
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted">Bottleneck</span>
        {BOTTLENECK_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => toggleFilter(f)}
            className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
              activeFilters.includes(f)
                ? 'border-cyan/50 bg-cyan/10 text-cyan'
                : 'border-border text-muted hover:border-cyan/40 hover:text-ink'
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
        {activeFilters.length > 0 && (
          <button
            onClick={() => setActiveFilters([])}
            className="text-xs text-muted hover:text-amber"
          >
            CLEAR ×
          </button>
        )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-xs">
          <thead>
            <tr className="border-b border-border/80 bg-bg/50">
              {cols.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="cursor-pointer select-none px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-muted hover:text-cyan"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span>{label}</span>
                    <HeaderInfo text={COLUMN_HELP[key]} />
                    {sortKey === key && (
                      <span className="text-cyan">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
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
                    className="cursor-pointer border-b border-border/60 transition-colors hover:bg-panel/50"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-cyan">{isExpanded ? '▼' : '▶'}</span>
                        <div>
                          <div className="font-semibold text-ink">{ind.name}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {ind.bottleneckTypes.slice(0, 2).map((b) => (
                              <span key={b} className="rounded border border-amber/25 px-1.5 py-0.5 text-[10px] uppercase text-amber/90">
                                {b}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="w-32 px-4 py-3">
                      <ScoreBar value={ind.aiCapability} color="#4ade80" />
                    </td>
                    <td className="w-32 px-4 py-3">
                      <ScoreBar value={ind.physicalFriction} color="#f59e0b" />
                    </td>
                    <td className="w-32 px-4 py-3">
                      <ScoreBar value={ind.regulation} color="#f59e0b" />
                    </td>
                    <td className="w-32 px-4 py-3">
                      <ScoreBar value={ind.trustNeed} color="#38bdf8" />
                    </td>
                    <td className="w-32 px-4 py-3">
                      <ScoreBar value={ind.automationRisk} color="#4ade80" />
                    </td>
                    <td className="px-4 py-3 text-muted tabular-nums">
                      {formatEmployment(ind.blsEmployment)}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-b border-border/60 bg-bg/35">
                      <td colSpan={7} className="px-8 py-5">
                        <div className="mb-4">
                          <div className="text-sm font-semibold text-ink">
                            Roles in {ind.name} most exposed to automation
                          </div>
                          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">
                            These are example occupations mapped to this industry. The exposure score estimates how much of each role&apos;s work could be affected by current AI and automation tools. A higher score means more tasks are exposed; it does not mean the job disappears.
                          </p>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-2">
                          {relatedOccs.map((occ) => (
                            <ExposureCard key={occ.socCode} occupation={occ} />
                          ))}
                        </div>
                        {ind.bottleneckTypes.length > 0 && (
                          <div className="mt-5 rounded-md border border-amber/20 bg-amber/5 p-4">
                            <div className="text-sm font-semibold text-amber">
                              Why this sector is still hard to automate
                            </div>
                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                              {ind.bottleneckTypes.map((b) => (
                                <div key={b} className="rounded border border-amber/20 bg-bg/30 px-3 py-2">
                                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber">
                                    {b}
                                  </div>
                                  <p className="mt-1 text-xs leading-5 text-muted">
                                    {BOTTLENECK_HELP[b] ?? 'This factor slows automation even when software can perform some tasks.'}
                                  </p>
                                </div>
                              ))}
                            </div>
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
    </section>
  )
}
