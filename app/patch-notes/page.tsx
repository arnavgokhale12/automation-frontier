import Link from 'next/link'
import { getAllPatchNotes } from '@/lib/patch-notes'

export const metadata = { title: 'Patch Notes — Automation Frontier Dashboard' }

export default function PatchNotesPage() {
  const notes = getAllPatchNotes()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="text-muted text-xs tracking-widest mb-1">CIVILIZATION PATCH NOTES</div>
        <h1 className="text-neon text-2xl font-bold font-mono">Changelog</h1>
        <p className="text-muted text-sm mt-2">
          Economic and labor updates. What changed and what&apos;s still broken.
        </p>
      </div>

      <div className="space-y-3">
        {notes.map((note) => (
          <Link
            key={note.slug}
            href={`/patch-notes/${note.slug}`}
            className="block border border-border rounded bg-surface p-4 hover:border-neon/40 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-neon text-xs font-bold group-hover:underline">
                PATCH v{note.version}
              </span>
              <span className="text-muted text-xs">{note.date}</span>
            </div>
            <h2 className="text-sm mb-2">{note.title}</h2>
            <p className="text-muted text-xs leading-relaxed">{note.summary}</p>
            <div className="flex flex-wrap gap-1 mt-3">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs border border-cyan/20 text-cyan/70 px-2 py-0.5 rounded"
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
