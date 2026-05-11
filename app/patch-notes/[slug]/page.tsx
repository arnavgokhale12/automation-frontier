import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllPatchNotes, getPatchNoteContent } from '@/lib/patch-notes'
import { PatchHeader, Buff, Nerf, SectorTag } from '@/components/PatchNoteLayout'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  return getAllPatchNotes().map((n) => ({ slug: n.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    const { meta } = getPatchNoteContent(slug)
    return { title: `Patch v${meta.version} — ${meta.title}` }
  } catch {
    return { title: 'Patch Notes — Automation Frontier Dashboard' }
  }
}

const mdxComponents = { Buff, Nerf, SectorTag }

export default async function PatchNotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let result: ReturnType<typeof getPatchNoteContent>
  try {
    result = getPatchNoteContent(slug)
  } catch {
    notFound()
  }

  const { meta, content } = result!

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-24 sm:px-6 md:pt-8 lg:px-8">
      <PatchHeader meta={meta} />
      <div className="prose prose-sm prose-invert max-w-none rounded-lg border border-border/80 bg-surface/70 p-5 font-mono shadow-2xl shadow-black/20
        prose-headings:text-cyan prose-headings:font-mono
        prose-p:text-ink/90 prose-p:text-sm
        prose-strong:text-white
        prose-hr:border-border
        prose-a:text-cyan prose-a:no-underline hover:prose-a:underline
        prose-li:text-ink/90 prose-li:text-sm">
        <MDXRemote source={content} components={mdxComponents} />
      </div>
    </div>
  )
}
