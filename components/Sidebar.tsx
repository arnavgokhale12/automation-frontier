'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV = [
  { href: '/index', label: 'BOTTLENECK INDEX', short: 'IDX' },
  { href: '/sandbox', label: 'AUTOMATION SANDBOX', short: 'SBX' },
  { href: '/patch-notes', label: 'PATCH NOTES', short: 'LOG' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`
        flex flex-col border-r border-border bg-surface transition-all duration-200
        ${collapsed ? 'w-14' : 'w-56'}
        shrink-0 h-screen sticky top-0
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-3">
        {!collapsed && (
          <span className="text-neon font-mono text-xs font-bold tracking-widest">
            AFD
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-muted hover:text-neon text-xs ml-auto"
          aria-label="Toggle sidebar"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {NAV.map(({ href, label, short }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-2 rounded px-2 py-2 text-xs font-mono transition-colors
                ${active
                  ? 'text-neon bg-neon/5 border border-neon/20'
                  : 'text-muted hover:text-neon hover:bg-neon/5'
                }
              `}
            >
              <span className="shrink-0">{collapsed ? short : '→'}</span>
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3">
        {collapsed ? (
          <span className="text-muted text-xs">↗</span>
        ) : (
          <a
            href="https://arnavgokhale.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-neon text-xs font-mono transition-colors"
          >
            ↗ portfolio
          </a>
        )}
      </div>
    </aside>
  )
}
