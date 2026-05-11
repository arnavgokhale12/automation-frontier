import SandboxSearch from '@/components/SandboxSearch'
import occupationsData from '@/data/occupations.json'
import type { Occupation } from '@/lib/types'

export const metadata = { title: 'Automation Sandbox — Automation Frontier Dashboard' }

const occupationTitles = (occupationsData as Occupation[]).map((o) => o.title)

export default function SandboxPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-24 sm:px-6 md:pt-8 lg:px-8">
      <div className="mb-6 overflow-hidden rounded-lg border border-border/80 bg-surface/85 shadow-2xl shadow-black/20">
        <div className="border-b border-border/70 bg-panel/50 px-5 py-5 sm:px-6">
          <div className="mb-2 text-xs uppercase tracking-[0.24em] text-cyan">Automation Sandbox</div>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Test a role against the current automation frontier.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            Search a job title to see where software capability, judgment, trust, legal exposure, and physical execution constrain automation.
          </p>
        </div>
        <div className="grid grid-cols-1 divide-y divide-border/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-5 py-4 sm:px-6">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted">Prebuilt roles</div>
            <div className="mt-2 text-2xl font-semibold text-ink">10</div>
          </div>
          <div className="px-5 py-4 sm:px-6">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted">Model dimensions</div>
            <div className="mt-2 text-2xl font-semibold text-cyan">7</div>
          </div>
          <div className="px-5 py-4 sm:px-6">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted">Fallback analysis</div>
            <div className="mt-2 text-lg font-semibold text-amber">Claude</div>
          </div>
        </div>
      </div>
      <SandboxSearch occupationTitles={occupationTitles} />
    </div>
  )
}
