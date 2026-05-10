import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { sandboxSchema, SYSTEM_PROMPT } from '@/lib/sandbox-schema'

export async function POST(req: Request) {
  const { title } = await req.json()

  if (!title || typeof title !== 'string' || title.length > 100) {
    return Response.json({ error: 'Invalid job title' }, { status: 400 })
  }

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-6'),
    schema: sandboxSchema,
    system: SYSTEM_PROMPT,
    prompt: `Analyze the automation potential for this job: ${title}`,
  })

  return Response.json(object)
}
