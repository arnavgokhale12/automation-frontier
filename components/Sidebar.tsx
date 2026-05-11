'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/', label: 'Bottleneck Index', marker: '01' },
  { href: '/sandbox', label: 'Automation Sandbox', marker: '02' },
  { href: '/patch-notes', label: 'Patch Notes', marker: '03' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className={`
        fixed inset-x-0 top-0 z-30 flex border-b border-border/80 bg-bg/95 backdrop-blur transition-all duration-200
        md:inset-y-0 md:inset-x-auto md:left-0 md:flex-col md:border-b-0 md:border-r
        md:w-64
      `}
    >
      <div className="flex min-w-24 items-center justify-between border-r border-border/70 px-4 py-3 md:min-w-0 md:border-r-0 md:border-b">
        <div>
          <div className="text-ink text-sm font-bold tracking-[0.18em]">AFD</div>
          <div className="text-muted text-[10px] uppercase tracking-[0.2em] hidden md:block">
            Automation Frontier
          </div>
        </div>
      </div>

      <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto p-2 md:flex-col md:items-stretch md:overflow-visible md:p-3">
        {NAV.map(({ href, label, marker }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex min-w-fit items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors md:min-w-0
                ${active
                  ? 'border-cyan/40 bg-cyan/10 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                  : 'border-transparent text-muted hover:border-border hover:bg-panel/60 hover:text-ink'
                }
              `}
            >
              <span className={active ? 'text-cyan' : 'text-dim'}>
                {marker}
              </span>
              <span className="truncate">{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="hidden border-t border-border/70 p-4 md:block">
        <a
          href="https://arnavgokhale.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted hover:text-cyan text-xs transition-colors"
        >
          ↗ portfolio
        </a>
      </div>
    </aside>
  )
}
