import type { PatchNoteMeta } from '@/lib/types'

export function Buff({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-3 rounded-r-md border-l-2 border-neon bg-neon/5 px-4 py-3">
      <span className="text-neon text-xs font-bold mr-2">BUFF</span>
      <span className="text-sm">{children}</span>
    </div>
  )
}

export function Nerf({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-3 rounded-r-md border-l-2 border-amber bg-amber/5 px-4 py-3">
      <span className="text-amber text-xs font-bold mr-2">NERF</span>
      <span className="text-sm">{children}</span>
    </div>
  )
}

export function SectorTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 mr-1 inline-flex items-center rounded border border-cyan/30 px-2 py-0.5 text-xs text-cyan">
      {children}
    </span>
  )
}

export function PatchHeader({ meta }: { meta: PatchNoteMeta }) {
  return (
    <div className="mb-8 rounded-lg border border-border/80 bg-surface/85 p-6 shadow-2xl shadow-black/20">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-muted">
            PATCH v{meta.version}
          </div>
          <h1 className="text-2xl font-semibold text-ink">{meta.title}</h1>
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
