export interface Industry {
  id: string
  name: string
  aiCapability: number       // 1–5
  physicalFriction: number   // 1–5
  regulation: number         // 1–5
  trustNeed: number          // 1–5
  automationRisk: number     // 1–5, computed
  bottleneckTypes: string[]  // friction dimensions ≥ 4
  blsEmployment: number
  occupationIds: string[]
}

export interface Occupation {
  socCode: string
  title: string
  industryId: string
  automationExposure: number  // 0–100
  workActivities: string[]
}

export interface SandboxComponents {
  knowledgeWork: number       // 0–100
  judgment: number
  trust: number
  physicalExecution: number
  legalLiability: number
  humanPreference: number
  costToDeploy: number
}

export interface SandboxEntry {
  title: string
  components: SandboxComponents
  summary: string
  bottleneck: string
  industryId: string
}

export interface PatchNoteMeta {
  slug: string
  version: string
  date: string
  title: string
  summary: string
  tags: string[]
  relatedIndustries: string[]
  relatedSandboxJobs: string[]
}
