import React from 'react'
import RadarChart from '@/components/RadarChart'
import type { SandboxEntry } from '@/lib/types'
import Link from 'next/link'

export default function SandboxResult({ entry }: { entry: SandboxEntry | null; loading?: boolean }) {
  if (!entry) return null

  return (
    <div className="border border-border rounded bg-surface p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-muted text-xs tracking-widest mb-1">ANALYSIS</div>
          <h2 className="text-neon text-xl font-bold">{entry.title}</h2>
        </div>
        <span className="text-xs border border-amber/40 text-amber px-3 py-1 rounded">
          BOTTLENECK: {entry.bottleneck.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RadarChart components={entry.components} />
        <div className="space-y-3">
          <div className="text-muted text-xs tracking-widest">COMPONENT BREAKDOWN</div>
          {Object.entries(entry.components).map(([key, value]) => {
            const label = key.replace(/([A-Z])/g, ' $1').trim().toUpperCase()
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-muted text-xs w-32 shrink-0">{label}</span>
                <div className="flex-1 h-1 bg-dim rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neon rounded-full"
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="text-neon text-xs w-8 text-right">{value}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <div className="text-muted text-xs tracking-widest mb-2">EDITORIAL TAKE</div>
        <p className="text-sm leading-relaxed">{entry.summary}</p>
      </div>

      {entry.industryId && (
        <div>
          <Link
            href={`/index`}
            className="text-xs text-cyan hover:underline"
          >
            → View {entry.industryId.replace(/-/g, ' ')} sector in Bottleneck Index
          </Link>
        </div>
      )}
    </div>
  )
}
