import industries from '@/data/industries.json'
import occupations from '@/data/occupations.json'
import prebuilt from '@/data/sandbox-prebuilt.json'
import type { SandboxOutput } from '@/lib/sandbox-schema'
import type { Industry, Occupation, SandboxEntry } from '@/lib/types'

const INDUSTRIES = industries as Industry[]
const OCCUPATIONS = occupations as Occupation[]
const PREBUILT = prebuilt as Record<string, SandboxEntry>

const ROLE_KEYWORDS: Record<string, string[]> = {
  'software-dev': [
    'ai', 'analyst', 'analytics', 'backend', 'cloud', 'code', 'coder', 'data',
    'developer', 'devops', 'engineer', 'frontend', 'machine learning',
    'ml', 'programmer', 'qa', 'scientist', 'software',
  ],
  'financial-services': [
    'account', 'actuary', 'analyst', 'bank', 'bookkeeper', 'broker', 'compliance',
    'finance', 'financial', 'insurance', 'loan', 'payroll', 'tax', 'trader',
  ],
  healthcare: [
    'care', 'clinical', 'coder', 'doctor', 'health', 'medical', 'nurse',
    'pharmacist', 'physician', 'radiologist', 'therapist',
  ],
  'legal-services': [
    'attorney', 'clerk', 'contract', 'law', 'lawyer', 'legal', 'paralegal',
  ],
  transportation: [
    'cargo', 'delivery', 'driver', 'fleet', 'freight', 'logistics', 'pilot',
    'truck', 'warehouse',
  ],
  construction: [
    'architect', 'builder', 'carpenter', 'construction', 'contractor',
    'electrician', 'plumber', 'roofer',
  ],
  education: [
    'coach', 'education', 'instructor', 'professor', 'school', 'teacher',
    'trainer', 'tutor',
  ],
  media: [
    'content', 'copywriter', 'designer', 'editor', 'journalist', 'media',
    'producer', 'reporter', 'writer',
  ],
  retail: [
    'cashier', 'customer', 'food', 'hospitality', 'manager', 'real estate',
    'retail', 'sales', 'service', 'support',
  ],
  manufacturing: [
    'assembler', 'factory', 'machinist', 'manufacturing', 'mechanic',
    'operator', 'production', 'technician',
  ],
}

function titleCase(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word))
}

function findIndustry(title: string) {
  const normalized = title.toLowerCase()
  let best = { industryId: 'software-dev', score: -1 }

  for (const [industryId, keywords] of Object.entries(ROLE_KEYWORDS)) {
    const score = keywords.reduce((sum, keyword) => (
      normalized.includes(keyword) ? sum + keyword.length : sum
    ), 0)
    if (score > best.score) best = { industryId, score }
  }

  return INDUSTRIES.find((industry) => industry.id === best.industryId) ?? INDUSTRIES[0]
}

function findRelatedOccupation(title: string, industryId: string) {
  const normalized = title.toLowerCase()
  const inIndustry = OCCUPATIONS.filter((occupation) => occupation.industryId === industryId)
  const exactish = inIndustry.find((occupation) => {
    const occupationTitle = occupation.title.toLowerCase()
    return occupationTitle.includes(normalized) || normalized.includes(occupationTitle.replace(/s$/, ''))
  })

  if (exactish) return exactish

  return [...inIndustry].sort((a, b) => b.automationExposure - a.automationExposure)[0]
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function primaryBottleneck(components: SandboxOutput['components']) {
  const entries = [
    ['Physical Execution', components.physicalExecution],
    ['Legal Liability', components.legalLiability],
    ['Trust', components.trust],
    ['Human Preference', components.humanPreference],
    ['Judgment', components.judgment],
    ['Cost to Deploy', components.costToDeploy],
  ] as const

  return [...entries].sort((a, b) => b[1] - a[1])[0][0]
}

function buildSummary(title: string, industry: Industry, exposure: number, bottleneck: string) {
  if (exposure >= 65) {
    return `${title} has high automation exposure because much of the work can be digitized, structured, or assisted by current AI tools. The main thing slowing full replacement is ${bottleneck.toLowerCase()}, so the realistic near-term outcome is task automation with a human still owning decisions and accountability.`
  }

  if (exposure >= 40) {
    return `${title} has moderate automation exposure: AI can help with documentation, analysis, scheduling, or repeatable workflows, but the whole job is not cleanly automatable. In ${industry.name}, ${bottleneck.toLowerCase()} is the main reason the role remains partly human-led.`
  }

  return `${title} has lower full-replacement risk because the work depends heavily on physical execution, trust, judgment, or regulated accountability. AI can still improve parts of the workflow, but ${bottleneck.toLowerCase()} keeps this closer to augmentation than replacement.`
}

export function analyzeLocally(title: string): SandboxOutput {
  const key = title.toLowerCase().trim()
  const prebuiltEntry = PREBUILT[key]
  if (prebuiltEntry) return prebuiltEntry

  const formattedTitle = titleCase(title)
  const industry = findIndustry(formattedTitle)
  const relatedOccupation = findRelatedOccupation(formattedTitle, industry.id)
  const exposure = relatedOccupation?.automationExposure ?? Math.round(industry.automationRisk * 18)
  const normalized = formattedTitle.toLowerCase()
  const isKnowledgeRole = includesAny(normalized, [
    'analyst', 'data', 'engineer', 'developer', 'manager', 'writer', 'accountant',
    'lawyer', 'financial', 'scientist', 'software',
  ])
  const isPhysicalRole = includesAny(normalized, [
    'driver', 'nurse', 'construction', 'worker', 'technician', 'operator',
    'mechanic', 'chef', 'carpenter',
  ])

  const components: SandboxOutput['components'] = {
    knowledgeWork: clamp(industry.aiCapability * 18 + (isKnowledgeRole ? 10 : 0)),
    judgment: clamp(35 + exposure * 0.35 + industry.trustNeed * 5),
    trust: clamp(industry.trustNeed * 17 + (industry.bottleneckTypes.includes('trust') ? 10 : 0)),
    physicalExecution: clamp(industry.physicalFriction * 17 + (isPhysicalRole ? 12 : 0)),
    legalLiability: clamp(industry.regulation * 17 + (industry.bottleneckTypes.includes('regulation') ? 10 : 0)),
    humanPreference: clamp(industry.trustNeed * 14 + (industry.id === 'education' || industry.id === 'healthcare' ? 12 : 0)),
    costToDeploy: clamp(industry.physicalFriction * 14 + industry.regulation * 8),
  }
  const bottleneck = primaryBottleneck(components)

  return {
    title: formattedTitle,
    components,
    summary: buildSummary(formattedTitle, industry, exposure, bottleneck),
    bottleneck,
    industryId: industry.id,
    confidence: 'Local estimate',
    analysisMode: 'Rules-based estimate from local industry and occupation data',
  }
}
