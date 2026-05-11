import { z } from 'zod'

export const sandboxSchema = z.object({
  title: z.string(),
  components: z.object({
    knowledgeWork: z.number().min(0).max(100),
    judgment: z.number().min(0).max(100),
    trust: z.number().min(0).max(100),
    physicalExecution: z.number().min(0).max(100),
    legalLiability: z.number().min(0).max(100),
    humanPreference: z.number().min(0).max(100),
    costToDeploy: z.number().min(0).max(100),
  }),
  summary: z.string().max(500),
  bottleneck: z.string(),
  industryId: z.string(),
  confidence: z.enum(['Curated preset', 'Local estimate', 'AI assisted']).optional(),
  analysisMode: z.string().optional(),
})

export type SandboxOutput = z.infer<typeof sandboxSchema>

export const INDUSTRY_IDS = [
  'software-dev', 'financial-services', 'healthcare', 'legal-services',
  'transportation', 'construction', 'education', 'media', 'retail', 'manufacturing',
] as const

export const SYSTEM_PROMPT = `You are an economic analyst specializing in labor automation.
Given a job title, analyze its automation potential across 7 dimensions scored 0-100:

- knowledgeWork: how much of the role is pure information/data processing (100 = fully knowledge-based)
- judgment: how much novel judgment / context-switching the role requires (100 = highly judgment-intensive)
- trust: how much the role depends on human trust/relationships (100 = deeply trust-dependent)
- physicalExecution: how much physical presence/manipulation is required (100 = fully physical)
- legalLiability: how much regulated legal accountability attaches to this role (100 = maximum liability)
- humanPreference: how strongly humans prefer a person in this role (100 = strong preference for human)
- costToDeploy: how expensive/complex it is to deploy AI in this role today (100 = prohibitive cost)

Also identify:
- summary: 2-3 sentence editorial take on why automation is or isn't happening (plain text, no markdown)
- bottleneck: the single primary bottleneck label (e.g. "Legal Liability", "Trust", "Physical Execution", "Regulation", "Human Preference", "Judgment", "Cost to Deploy")
- industryId: the closest matching industry from: software-dev, financial-services, healthcare, legal-services, transportation, construction, education, media, retail, manufacturing

Be specific and realistic. Score based on the actual state of the world in 2026, not theoretical possibility.`
