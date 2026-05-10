import SandboxSearch from '@/components/SandboxSearch'
import occupationsData from '@/data/occupations.json'
import type { Occupation } from '@/lib/types'

export const metadata = { title: 'Automation Sandbox — Automation Frontier Dashboard' }

const occupationTitles = (occupationsData as Occupation[]).map((o) => o.title)

export default function SandboxPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="text-muted text-xs tracking-widest mb-1">AUTOMATION SANDBOX</div>
        <h1 className="text-neon text-2xl font-bold font-mono">
          Can AI automate this?
        </h1>
        <p className="text-muted text-sm mt-2">
          Enter any job title. Prebuilt entries load instantly. Unknown jobs are analyzed by Claude.
        </p>
      </div>
      <SandboxSearch occupationTitles={occupationTitles} />
    </div>
  )
}
