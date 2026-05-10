import BottleneckTable from '@/components/BottleneckTable'
import industriesData from '@/data/industries.json'
import occupationsData from '@/data/occupations.json'
import type { Industry, Occupation } from '@/lib/types'

export const metadata = { title: 'Bottleneck Index — Automation Frontier Dashboard' }

export default function IndexPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="text-muted text-xs tracking-widest mb-1">HUMAN BOTTLENECK INDEX</div>
        <h1 className="text-neon text-2xl font-bold font-mono">
          Where is AI blocked?
        </h1>
        <p className="text-muted text-sm mt-2 max-w-2xl">
          Industries ranked by automation risk vs. friction bottleneck.
          Sorted by automation risk by default. Click any row to see top occupations.
        </p>
      </div>
      <BottleneckTable
        industries={industriesData as Industry[]}
        occupations={occupationsData as Occupation[]}
      />
    </div>
  )
}
