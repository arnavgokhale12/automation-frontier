import Link from 'next/link'
import { getAllPatchNotes } from '@/lib/patch-notes'

export const metadata = { title: 'Patch Notes — Automation Frontier Dashboard' }

export default function PatchNotesPage() {
  const notes = getAllPatchNotes()

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-24 sm:px-6 md:pt-8 lg:px-8">
      <div className="mb-6 overflow-hidden rounded-lg border border-border/80 bg-surface/85 shadow-2xl shadow-black/20">
        <div className="border-b border-border/70 bg-panel/50 px-5 py-5 sm:px-6">
          <div className="mb-2 text-xs uppercase tracking-[0.24em] text-cyan">Civilization Patch Notes</div>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Labor-market changes, written like release notes.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            Economic and labor updates translated into practical shifts: what got easier, what got harder, and what still resists automation.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {notes.map((note) => (
          <Link
            key={note.slug}
            href={`/patch-notes/${note.slug}`}
            className="group block rounded-lg border border-border/80 bg-surface/85 p-5 shadow-xl shadow-black/10 transition-colors hover:border-cyan/40 hover:bg-panel/70"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-cyan text-xs font-bold group-hover:underline">
                PATCH v{note.version}
              </span>
              <span className="text-muted text-xs">{note.date}</span>
            </div>
            <h2 className="mb-2 text-base font-semibold text-ink">{note.title}</h2>
            <p className="text-sm leading-relaxed text-muted">{note.summary}</p>
            <div className="flex flex-wrap gap-1 mt-3">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-cyan/25 px-2 py-0.5 text-xs text-cyan/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
