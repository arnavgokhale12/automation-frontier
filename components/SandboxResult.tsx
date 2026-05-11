import React from 'react'
import RadarChart from '@/components/RadarChart'
import type { SandboxEntry } from '@/lib/types'
import Link from 'next/link'

export default function SandboxResult({ entry }: { entry: SandboxEntry | null }) {
  if (!entry) return null
  const confidence = entry.confidence ?? 'Curated preset'
  const analysisMode = entry.analysisMode ?? 'Hand-tuned example analysis'

  return (
    <div className="space-y-6 rounded-lg border border-border/80 bg-surface/85 p-5 shadow-2xl shadow-black/20 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-muted">Analysis</div>
          <h2 className="text-2xl font-semibold text-ink">{entry.title}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-md border border-cyan/25 bg-cyan/10 px-2 py-1 text-[11px] text-cyan">
              {confidence}
            </span>
            <span className="rounded-md border border-border bg-bg/40 px-2 py-1 text-[11px] text-muted">
              {analysisMode}
            </span>
          </div>
        </div>
        <span className="w-fit rounded-md border border-amber/40 bg-amber/10 px-3 py-1.5 text-xs text-amber">
          BOTTLENECK: {entry.bottleneck.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RadarChart components={entry.components} />
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.18em] text-muted">Component breakdown</div>
          {Object.entries(entry.components).map(([key, value]) => {
            const label = key.replace(/([A-Z])/g, ' $1').trim().toUpperCase()
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-xs text-muted">{label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-dim/70">
                  <div
                    className="h-full rounded-full bg-cyan"
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs tabular-nums text-cyan">{value}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs uppercase tracking-[0.18em] text-muted">Editorial take</div>
        <p className="text-sm leading-6 text-ink/90">{entry.summary}</p>
      </div>

      {entry.industryId && (
        <div>
          <Link
            href="/"
            className="text-xs text-cyan hover:underline"
          >
            → View {entry.industryId.replace(/-/g, ' ')} sector in Bottleneck Index
          </Link>
        </div>
      )}
    </div>
  )
}
