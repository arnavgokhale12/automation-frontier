import type { PatchNoteMeta } from '@/lib/types'

export function Buff({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-neon pl-4 my-3">
      <span className="text-neon text-xs font-bold mr-2">BUFF</span>
      <span className="text-sm">{children}</span>
    </div>
  )
}

export function Nerf({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-amber pl-4 my-3">
      <span className="text-amber text-xs font-bold mr-2">NERF</span>
      <span className="text-sm">{children}</span>
    </div>
  )
}

export function SectorTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center border border-cyan/30 text-cyan text-xs px-2 py-0.5 rounded mr-1 mb-1">
      {children}
    </span>
  )
}

export function PatchHeader({ meta }: { meta: PatchNoteMeta }) {
  return (
    <div className="border border-border rounded bg-surface p-6 mb-8">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-muted text-xs tracking-widest mb-1">
            PATCH v{meta.version}
          </div>
          <h1 className="text-neon text-2xl font-bold">{meta.title}</h1>
        </div>
        <span className="text-muted text-xs">{meta.date}</span>
      </div>
      <p className="text-muted text-sm mb-4">{meta.summary}</p>
      <div className="flex flex-wrap gap-1">
        {meta.tags.map((tag) => (
          <SectorTag key={tag}>{tag}</SectorTag>
        ))}
      </div>
    </div>
  )
}
