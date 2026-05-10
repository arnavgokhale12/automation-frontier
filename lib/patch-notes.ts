import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { PatchNoteMeta } from '@/lib/types'

const PATCH_NOTES_DIR = path.join(process.cwd(), 'content', 'patch-notes')

export function getAllPatchNotes(): PatchNoteMeta[] {
  const files = fs.readdirSync(PATCH_NOTES_DIR).filter((f) => f.endsWith('.mdx'))
  return files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, '')
      const raw = fs.readFileSync(path.join(PATCH_NOTES_DIR, file), 'utf-8')
      const { data } = matter(raw)
      return {
        slug,
        version: data.version ?? '',
        date: data.date ?? '',
        title: data.title ?? '',
        summary: data.summary ?? '',
        tags: data.tags ?? [],
        relatedIndustries: data.relatedIndustries ?? [],
        relatedSandboxJobs: data.relatedSandboxJobs ?? [],
      } as PatchNoteMeta
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getPatchNoteContent(slug: string): { meta: PatchNoteMeta; content: string } {
  const file = path.join(PATCH_NOTES_DIR, `${slug}.mdx`)
  const raw = fs.readFileSync(file, 'utf-8')
  const { data, content } = matter(raw)
  return {
    meta: {
      slug,
      version: data.version ?? '',
      date: data.date ?? '',
      title: data.title ?? '',
      summary: data.summary ?? '',
      tags: data.tags ?? [],
      relatedIndustries: data.relatedIndustries ?? [],
      relatedSandboxJobs: data.relatedSandboxJobs ?? [],
    },
    content,
  }
}
