import { getAllPatchNotes } from '@/lib/patch-notes'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://automationfrontier.com'

function escapeXml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const notes = getAllPatchNotes()

  const items = notes
    .map(
      (note) => `
    <item>
      <title>${escapeXml(`Patch v${note.version} — ${note.title}`)}</title>
      <link>${BASE_URL}/patch-notes/${note.slug}</link>
      <guid>${BASE_URL}/patch-notes/${note.slug}</guid>
      <pubDate>${new Date(note.date).toUTCString()}</pubDate>
      <description>${escapeXml(note.summary)}</description>
    </item>`
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Automation Frontier — Civilization Patch Notes</title>
    <link>${BASE_URL}/patch-notes</link>
    <description>Economic and labor updates on where AI automation is blocked.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
