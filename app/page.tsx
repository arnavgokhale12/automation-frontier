import BottleneckTable from '@/components/BottleneckTable'
import industriesData from '@/data/industries.json'
import occupationsData from '@/data/occupations.json'
import type { Industry, Occupation } from '@/lib/types'

export default function Home() {
  const industries = industriesData as Industry[]
  const occupations = occupationsData as Occupation[]
  const avgRisk = industries.reduce((sum, industry) => sum + industry.automationRisk, 0) / industries.length
  const highFriction = industries.filter((industry) => industry.bottleneckTypes.length > 0).length
  const workers = industries.reduce((sum, industry) => sum + industry.blsEmployment, 0)
  const highestRisk = [...industries].sort((a, b) => b.automationRisk - a.automationRisk)[0]

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6 md:pt-8 lg:px-8">
      <div className="mb-6 overflow-hidden rounded-lg border border-border/80 bg-surface/85 shadow-2xl shadow-black/20">
        <div className="border-b border-border/70 bg-panel/50 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 text-xs uppercase tracking-[0.24em] text-cyan">
                Human Bottleneck Index
              </div>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Where automation moves fast, and where humans still hold the line.
              </h1>
            </div>
            <div className="rounded-md border border-border bg-bg/50 px-4 py-3 text-xs text-muted">
              Updated model view
              <div className="mt-1 text-lg font-semibold text-neon">{industries.length} sectors</div>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
            Compare industries by AI capability, physical friction, regulation, trust, labor scale, and net automation risk.
          </p>
        </div>

        <div className="grid grid-cols-1 divide-y divide-border/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          <div className="px-5 py-4 sm:px-6">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted">Avg risk</div>
            <div className="mt-2 text-2xl font-semibold text-ink">{avgRisk.toFixed(1)}/5</div>
          </div>
          <div className="px-5 py-4 sm:px-6">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted">Friction sectors</div>
            <div className="mt-2 text-2xl font-semibold text-amber">{highFriction}</div>
          </div>
          <div className="px-5 py-4 sm:px-6">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted">Workers mapped</div>
            <div className="mt-2 text-2xl font-semibold text-cyan">{(workers / 1_000_000).toFixed(1)}M</div>
          </div>
          <div className="px-5 py-4 sm:px-6">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted">Highest risk</div>
            <div className="mt-2 truncate text-lg font-semibold text-ink">{highestRisk.name}</div>
          </div>
        </div>
      </div>

      <BottleneckTable
        industries={industries}
        occupations={occupations}
      />
    </div>
  )
}
