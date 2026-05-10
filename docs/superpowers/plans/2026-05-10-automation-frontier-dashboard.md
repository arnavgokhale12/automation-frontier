# Automation Frontier Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public-facing dashboard showing where AI automation is technically possible but blocked — three sections: Human Bottleneck Index, Automation Sandbox, Civilization Patch Notes.

**Architecture:** Next.js 15 App Router, build-time static data from O*NET/BLS JSON files. Pages are statically generated; Claude API is invoked at runtime only for uncached Sandbox jobs via a Route Handler. Persistent sidebar layout with Terminal/Data Lab dark aesthetic.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Vercel AI SDK (`ai`, `@ai-sdk/anthropic`), Zod, gray-matter, next-mdx-remote, Vitest

---

## File Map

```
app/
  globals.css
  layout.tsx                     root layout — sidebar shell
  page.tsx                       redirect to /index
  index/
    page.tsx                     Human Bottleneck Index (server)
  sandbox/
    page.tsx                     Automation Sandbox (server shell)
  api/
    analyze/
      route.ts                   POST → Claude generateObject → SandboxEntry JSON
  patch-notes/
    page.tsx                     Patch Notes list (server)
    [slug]/
      page.tsx                   individual patch note (server)
    feed.xml/
      route.ts                   RSS 2.0 feed

components/
  Sidebar.tsx                    nav + filter chip state (client)
  BottleneckTable.tsx            sortable/filterable table + row expand (client)
  RadarChart.tsx                 pure SVG 7-axis radar chart (client)
  SandboxSearch.tsx              autocomplete search input (client)
  SandboxResult.tsx              renders RadarChart + summary (client)
  PatchNoteLayout.tsx            game-changelog wrapper with Buff/Nerf/SectorTag

lib/
  types.ts                       shared interfaces
  scores.ts                      computeAutomationRisk, deriveBottleneckTypes
  patch-notes.ts                 reads content/patch-notes/, parses frontmatter
  sandbox-schema.ts              Zod schema for Claude API output

data/
  industries.json                10 seed industries (overwritten by ingest.ts)
  occupations.json               30 seed occupations (overwritten by ingest.ts)
  sandbox-prebuilt.json          25 hand-authored job breakdowns

content/patch-notes/
  2026-05.mdx                    initial patch note

scripts/
  ingest.ts                      O*NET + BLS data ingestion
  manual-overrides.json          regulation + trust scores per industry

tests/
  lib/scores.test.ts
  lib/patch-notes.test.ts
```

---

### Task 1: Scaffold project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `.env.local.example`, `.gitignore`

- [ ] **Step 1: Install Next.js into existing directory**

The `automation-frontier/` directory already exists with `docs/` and `.git/`. Run from *inside* it:

```bash
cd /Users/arnavgokhale/Projects/automation-frontier
npx create-next-app@15 . \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --yes
```

When prompted about the non-empty directory, enter `y`. This scaffolds `app/`, `components/`, `public/`, `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`.

- [ ] **Step 2: Install additional dependencies**

```bash
cd /Users/arnavgokhale/Projects/automation-frontier
npm install gray-matter next-mdx-remote ai@latest @ai-sdk/anthropic@latest zod
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom tsx
```

- [ ] **Step 3: Replace `tailwind.config.ts` with dark theme config**

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        surface: '#111118',
        border: '#1a1a2e',
        neon: '#00ff88',
        cyan: '#00bfff',
        amber: '#ff6b35',
        muted: '#555566',
        dim: '#333344',
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 4: Replace `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
}

body {
  background-color: #0a0a0f;
  color: #cccccc;
  font-family: var(--font-mono), monospace;
}

* {
  border-color: #1a1a2e;
}

::selection {
  background: #00ff8830;
}

::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
::-webkit-scrollbar-track { background: #0a0a0f; }
::-webkit-scrollbar-thumb { background: #1a1a2e; border-radius: 2px; }
```

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 6: Create `tests/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Create `.env.local.example`**

```
ONET_USERNAME=your_onet_username
ONET_PASSWORD=your_onet_password
ANTHROPIC_API_KEY=sk-ant-...
```

- [ ] **Step 8: Add test script to `package.json`**

In `package.json`, add to the `scripts` object:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 9: Add `.gitignore` entries**

Append to `.gitignore`:
```
.env.local
.superpowers/
```

- [ ] **Step 10: Verify dev server starts**

```bash
cd /Users/arnavgokhale/Projects/automation-frontier
npm run dev
```

Expected: `ready - started server on http://localhost:3000`. Stop with Ctrl+C.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 project with Tailwind dark theme"
```

---

### Task 2: TypeScript types and score utilities

**Files:**
- Create: `lib/types.ts`
- Create: `lib/scores.ts`
- Create: `tests/lib/scores.test.ts`

- [ ] **Step 1: Create `lib/types.ts`**

```ts
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
```

- [ ] **Step 2: Create `lib/scores.ts`**

```ts
// Raw formula range: min=-2.6, max=1.4, span=4.0
// Normalized to 1–5 via linear map
export function computeAutomationRisk(
  aiCapability: number,
  regulation: number,
  physicalFriction: number,
  trustNeed: number,
): number {
  const raw =
    aiCapability * 0.4 -
    regulation * 0.2 -
    physicalFriction * 0.2 -
    trustNeed * 0.2
  const normalized = ((raw + 2.6) / 4.0) * 4 + 1
  return Math.round(Math.min(5, Math.max(1, normalized)) * 10) / 10
}

// A dimension is a bottleneck if its friction score is ≥ 4
export function deriveBottleneckTypes(
  regulation: number,
  physicalFriction: number,
  trustNeed: number,
): string[] {
  const types: string[] = []
  if (regulation >= 4) types.push('regulation')
  if (physicalFriction >= 4) types.push('physical')
  if (trustNeed >= 4) types.push('trust')
  return types
}
```

- [ ] **Step 3: Write failing tests in `tests/lib/scores.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { computeAutomationRisk, deriveBottleneckTypes } from '@/lib/scores'

describe('computeAutomationRisk', () => {
  it('returns high risk for high AI capability and low friction', () => {
    const risk = computeAutomationRisk(5, 1, 1, 1)
    expect(risk).toBeGreaterThanOrEqual(4.5)
    expect(risk).toBeLessThanOrEqual(5)
  })

  it('returns low risk for low AI capability and high friction', () => {
    const risk = computeAutomationRisk(1, 5, 5, 5)
    expect(risk).toBeGreaterThanOrEqual(1)
    expect(risk).toBeLessThanOrEqual(1.5)
  })

  it('clamps result between 1 and 5', () => {
    const high = computeAutomationRisk(5, 1, 1, 1)
    const low = computeAutomationRisk(1, 5, 5, 5)
    expect(high).toBeLessThanOrEqual(5)
    expect(low).toBeGreaterThanOrEqual(1)
  })

  it('software dev profile scores higher than healthcare profile', () => {
    const software = computeAutomationRisk(5, 2, 1, 3)
    const healthcare = computeAutomationRisk(3, 5, 3, 5)
    expect(software).toBeGreaterThan(healthcare)
  })
})

describe('deriveBottleneckTypes', () => {
  it('returns empty array when no friction dimension reaches 4', () => {
    expect(deriveBottleneckTypes(3, 3, 3)).toEqual([])
  })

  it('identifies regulation bottleneck', () => {
    expect(deriveBottleneckTypes(4, 1, 1)).toContain('regulation')
  })

  it('identifies physical bottleneck', () => {
    expect(deriveBottleneckTypes(1, 5, 1)).toContain('physical')
  })

  it('identifies trust bottleneck', () => {
    expect(deriveBottleneckTypes(1, 1, 4)).toContain('trust')
  })

  it('identifies multiple bottlenecks', () => {
    const types = deriveBottleneckTypes(5, 5, 5)
    expect(types).toContain('regulation')
    expect(types).toContain('physical')
    expect(types).toContain('trust')
  })
})
```

- [ ] **Step 4: Run tests — verify they fail**

```bash
cd /Users/arnavgokhale/Projects/automation-frontier
npm test tests/lib/scores.test.ts
```

Expected: FAIL — `lib/scores.ts` does not exist yet.

- [ ] **Step 5: Run tests — verify they pass now**

The implementation in Step 2 is already written. Run again:

```bash
npm test tests/lib/scores.test.ts
```

Expected: all 9 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/scores.ts tests/
git commit -m "feat: add shared types and score utility functions with tests"
```

---

### Task 3: Seed data files

**Files:**
- Create: `data/industries.json`
- Create: `data/occupations.json`
- Create: `data/sandbox-prebuilt.json`
- Create: `scripts/manual-overrides.json`

- [ ] **Step 1: Create `data/industries.json`**

```json
[
  {
    "id": "software-dev",
    "name": "Software Development",
    "aiCapability": 5,
    "physicalFriction": 1,
    "regulation": 2,
    "trustNeed": 3,
    "automationRisk": 4.4,
    "bottleneckTypes": [],
    "blsEmployment": 4000000,
    "occupationIds": ["15-1252.00", "15-1251.00", "15-1299.08"]
  },
  {
    "id": "financial-services",
    "name": "Financial Services",
    "aiCapability": 4,
    "physicalFriction": 1,
    "regulation": 5,
    "trustNeed": 4,
    "automationRisk": 2.8,
    "bottleneckTypes": ["regulation", "trust"],
    "blsEmployment": 6800000,
    "occupationIds": ["13-2051.00", "13-2052.00", "13-1041.00"]
  },
  {
    "id": "healthcare",
    "name": "Healthcare",
    "aiCapability": 3,
    "physicalFriction": 3,
    "regulation": 5,
    "trustNeed": 5,
    "automationRisk": 1.8,
    "bottleneckTypes": ["regulation", "trust"],
    "blsEmployment": 18000000,
    "occupationIds": ["29-1141.00", "29-1215.00", "29-2061.00"]
  },
  {
    "id": "legal-services",
    "name": "Legal Services",
    "aiCapability": 4,
    "physicalFriction": 1,
    "regulation": 5,
    "trustNeed": 4,
    "automationRisk": 2.8,
    "bottleneckTypes": ["regulation", "trust"],
    "blsEmployment": 1200000,
    "occupationIds": ["23-1011.00", "23-2011.00", "23-1012.00"]
  },
  {
    "id": "transportation",
    "name": "Transportation & Logistics",
    "aiCapability": 3,
    "physicalFriction": 5,
    "regulation": 3,
    "trustNeed": 3,
    "automationRisk": 2.4,
    "bottleneckTypes": ["physical"],
    "blsEmployment": 7500000,
    "occupationIds": ["53-3032.00", "53-1041.00", "53-7062.00"]
  },
  {
    "id": "construction",
    "name": "Construction",
    "aiCapability": 2,
    "physicalFriction": 5,
    "regulation": 3,
    "trustNeed": 3,
    "automationRisk": 1.8,
    "bottleneckTypes": ["physical"],
    "blsEmployment": 7800000,
    "occupationIds": ["47-2061.00", "47-2031.00", "47-1011.00"]
  },
  {
    "id": "education",
    "name": "Education",
    "aiCapability": 3,
    "physicalFriction": 2,
    "regulation": 3,
    "trustNeed": 5,
    "automationRisk": 2.4,
    "bottleneckTypes": ["trust"],
    "blsEmployment": 13000000,
    "occupationIds": ["25-2021.00", "25-1099.00", "25-3021.00"]
  },
  {
    "id": "media",
    "name": "Media & Journalism",
    "aiCapability": 4,
    "physicalFriction": 1,
    "regulation": 2,
    "trustNeed": 3,
    "automationRisk": 4.0,
    "bottleneckTypes": [],
    "blsEmployment": 900000,
    "occupationIds": ["27-3022.00", "27-1024.00", "27-3011.00"]
  },
  {
    "id": "retail",
    "name": "Retail & Customer Service",
    "aiCapability": 3,
    "physicalFriction": 3,
    "regulation": 2,
    "trustNeed": 3,
    "automationRisk": 3.0,
    "bottleneckTypes": [],
    "blsEmployment": 15000000,
    "occupationIds": ["41-2011.00", "41-1011.00", "43-4051.00"]
  },
  {
    "id": "manufacturing",
    "name": "Manufacturing",
    "aiCapability": 3,
    "physicalFriction": 5,
    "regulation": 3,
    "trustNeed": 2,
    "automationRisk": 2.2,
    "bottleneckTypes": ["physical"],
    "blsEmployment": 12800000,
    "occupationIds": ["51-4041.00", "51-2031.00", "51-1011.00"]
  }
]
```

- [ ] **Step 2: Create `data/occupations.json`**

```json
[
  { "socCode": "15-1252.00", "title": "Software Quality Assurance Analysts", "industryId": "software-dev", "automationExposure": 72, "workActivities": ["Analyzing Data", "Processing Information"] },
  { "socCode": "15-1251.00", "title": "Computer Programmers", "industryId": "software-dev", "automationExposure": 65, "workActivities": ["Analyzing Data", "Thinking Creatively"] },
  { "socCode": "15-1299.08", "title": "Machine Learning Engineers", "industryId": "software-dev", "automationExposure": 45, "workActivities": ["Analyzing Data", "Making Decisions"] },
  { "socCode": "13-2051.00", "title": "Financial Analysts", "industryId": "financial-services", "automationExposure": 61, "workActivities": ["Analyzing Data", "Processing Information"] },
  { "socCode": "13-2052.00", "title": "Personal Financial Advisors", "industryId": "financial-services", "automationExposure": 42, "workActivities": ["Communicating", "Making Decisions"] },
  { "socCode": "13-1041.00", "title": "Compliance Officers", "industryId": "financial-services", "automationExposure": 55, "workActivities": ["Evaluating", "Processing Information"] },
  { "socCode": "29-1141.00", "title": "Registered Nurses", "industryId": "healthcare", "automationExposure": 29, "workActivities": ["Assisting and Caring", "Documenting"] },
  { "socCode": "29-1215.00", "title": "Family Medicine Physicians", "industryId": "healthcare", "automationExposure": 18, "workActivities": ["Diagnosing", "Making Decisions"] },
  { "socCode": "29-2061.00", "title": "Licensed Practical Nurses", "industryId": "healthcare", "automationExposure": 35, "workActivities": ["Assisting and Caring", "Documenting"] },
  { "socCode": "23-1011.00", "title": "Lawyers", "industryId": "legal-services", "automationExposure": 38, "workActivities": ["Analyzing Data", "Communicating"] },
  { "socCode": "23-2011.00", "title": "Paralegals and Legal Assistants", "industryId": "legal-services", "automationExposure": 62, "workActivities": ["Processing Information", "Organizing"] },
  { "socCode": "23-1012.00", "title": "Judicial Law Clerks", "industryId": "legal-services", "automationExposure": 51, "workActivities": ["Analyzing Data", "Documenting"] },
  { "socCode": "53-3032.00", "title": "Heavy Truck Drivers", "industryId": "transportation", "automationExposure": 56, "workActivities": ["Operating Vehicles", "Handling Objects"] },
  { "socCode": "53-1041.00", "title": "Aircraft Cargo Handling Supervisors", "industryId": "transportation", "automationExposure": 33, "workActivities": ["Coordinating", "Monitoring"] },
  { "socCode": "53-7062.00", "title": "Laborers and Freight Movers", "industryId": "transportation", "automationExposure": 44, "workActivities": ["Handling Objects", "Physical Activities"] },
  { "socCode": "47-2061.00", "title": "Construction Laborers", "industryId": "construction", "automationExposure": 28, "workActivities": ["Physical Activities", "Handling Objects"] },
  { "socCode": "47-2031.00", "title": "Carpenters", "industryId": "construction", "automationExposure": 22, "workActivities": ["Inspecting", "Physical Activities"] },
  { "socCode": "47-1011.00", "title": "First-Line Construction Supervisors", "industryId": "construction", "automationExposure": 18, "workActivities": ["Coordinating", "Making Decisions"] },
  { "socCode": "25-2021.00", "title": "Elementary School Teachers", "industryId": "education", "automationExposure": 14, "workActivities": ["Teaching", "Coaching"] },
  { "socCode": "25-1099.00", "title": "Postsecondary Teachers", "industryId": "education", "automationExposure": 19, "workActivities": ["Teaching", "Analyzing Data"] },
  { "socCode": "25-3021.00", "title": "Self-Enrichment Teachers", "industryId": "education", "automationExposure": 22, "workActivities": ["Teaching", "Communicating"] },
  { "socCode": "27-3022.00", "title": "Reporters and Correspondents", "industryId": "media", "automationExposure": 67, "workActivities": ["Analyzing Data", "Communicating"] },
  { "socCode": "27-1024.00", "title": "Graphic Designers", "industryId": "media", "automationExposure": 58, "workActivities": ["Thinking Creatively", "Organizing"] },
  { "socCode": "27-3011.00", "title": "Broadcast Announcers", "industryId": "media", "automationExposure": 71, "workActivities": ["Communicating", "Performing"] },
  { "socCode": "41-2011.00", "title": "Cashiers", "industryId": "retail", "automationExposure": 82, "workActivities": ["Processing Information", "Communicating"] },
  { "socCode": "41-1011.00", "title": "First-Line Retail Supervisors", "industryId": "retail", "automationExposure": 44, "workActivities": ["Coordinating", "Monitoring"] },
  { "socCode": "43-4051.00", "title": "Customer Service Representatives", "industryId": "retail", "automationExposure": 74, "workActivities": ["Communicating", "Processing Information"] },
  { "socCode": "51-4041.00", "title": "Machinists", "industryId": "manufacturing", "automationExposure": 49, "workActivities": ["Operating Machines", "Inspecting"] },
  { "socCode": "51-2031.00", "title": "Engine Assemblers", "industryId": "manufacturing", "automationExposure": 54, "workActivities": ["Handling Objects", "Physical Activities"] },
  { "socCode": "51-1011.00", "title": "First-Line Production Supervisors", "industryId": "manufacturing", "automationExposure": 31, "workActivities": ["Coordinating", "Monitoring"] }
]
```

- [ ] **Step 3: Create `data/sandbox-prebuilt.json`**

```json
{
  "accountant": {
    "title": "Accountant",
    "components": { "knowledgeWork": 90, "judgment": 55, "trust": 60, "physicalExecution": 5, "legalLiability": 75, "humanPreference": 25, "costToDeploy": 35 },
    "summary": "Accounting is highly automatable at the data-processing layer — reconciliation, reporting, tax preparation. The blocker is legal liability: CPAs sign documents, and no firm will let an LLM take that exposure. Expect hybrid workflows, not replacement.",
    "bottleneck": "Legal Liability",
    "industryId": "financial-services"
  },
  "lawyer": {
    "title": "Lawyer",
    "components": { "knowledgeWork": 80, "judgment": 75, "trust": 85, "physicalExecution": 5, "legalLiability": 95, "humanPreference": 60, "costToDeploy": 50 },
    "summary": "Document review and contract drafting are already being automated. But a lawyer is also an officer of the court — there's a credentialing and liability structure that makes AI substitution legally impermissible, not just technically hard.",
    "bottleneck": "Legal Liability",
    "industryId": "legal-services"
  },
  "radiologist": {
    "title": "Radiologist",
    "components": { "knowledgeWork": 85, "judgment": 80, "trust": 80, "physicalExecution": 15, "legalLiability": 90, "humanPreference": 55, "costToDeploy": 65 },
    "summary": "AI reads medical images at or above radiologist accuracy in narrow tasks. The bottleneck is FDA approval, malpractice liability, and the fact that false negatives kill people — so human sign-off is mandated by regulation and insurance.",
    "bottleneck": "Regulation",
    "industryId": "healthcare"
  },
  "software engineer": {
    "title": "Software Engineer",
    "components": { "knowledgeWork": 95, "judgment": 65, "trust": 40, "physicalExecution": 5, "legalLiability": 30, "humanPreference": 45, "costToDeploy": 20 },
    "summary": "The highest automation exposure of any knowledge job. AI writes, reviews, and tests code today. What's left is judgment: architecture decisions, tradeoff navigation, stakeholder translation. The job is not going away — it's shifting to a different layer.",
    "bottleneck": "Judgment",
    "industryId": "software-dev"
  },
  "nurse": {
    "title": "Registered Nurse",
    "components": { "knowledgeWork": 65, "judgment": 70, "trust": 90, "physicalExecution": 75, "legalLiability": 80, "humanPreference": 85, "costToDeploy": 70 },
    "summary": "Nursing combines physical patient care, emotional presence, and real-time clinical judgment in a way that no current robot or LLM can replicate end-to-end. AI handles documentation and triage support, but the bedside role is structurally human for a long time.",
    "bottleneck": "Physical Execution",
    "industryId": "healthcare"
  },
  "teacher": {
    "title": "Teacher (K-12)",
    "components": { "knowledgeWork": 60, "judgment": 65, "trust": 90, "physicalExecution": 30, "legalLiability": 50, "humanPreference": 95, "costToDeploy": 45 },
    "summary": "Parents and school boards have strong revealed preferences for human teachers, regardless of AI tutoring efficacy. AI excels at personalized practice and feedback loops, but the in-classroom, relationship-based role is blocked by trust and human preference — not capability.",
    "bottleneck": "Human Preference",
    "industryId": "education"
  },
  "therapist": {
    "title": "Therapist / Counselor",
    "components": { "knowledgeWork": 65, "judgment": 80, "trust": 95, "physicalExecution": 10, "legalLiability": 70, "humanPreference": 92, "costToDeploy": 30 },
    "summary": "Therapy is almost entirely bottlenecked by trust and human preference. Patients know they could talk to an AI — many do. But for high-stakes mental health work, the therapeutic alliance with a human is what clients are paying for.",
    "bottleneck": "Trust",
    "industryId": "healthcare"
  },
  "financial analyst": {
    "title": "Financial Analyst",
    "components": { "knowledgeWork": 88, "judgment": 65, "trust": 55, "physicalExecution": 5, "legalLiability": 60, "humanPreference": 35, "costToDeploy": 30 },
    "summary": "Quant roles and data-heavy analysis are already heavily automated. The remaining value is in judgment calls on novel situations and client-facing trust — no institution will let an LLM sign off on a $50M position without a human in the loop.",
    "bottleneck": "Legal Liability",
    "industryId": "financial-services"
  },
  "truck driver": {
    "title": "Truck Driver",
    "components": { "knowledgeWork": 30, "judgment": 50, "trust": 40, "physicalExecution": 85, "legalLiability": 70, "humanPreference": 30, "costToDeploy": 80 },
    "summary": "Self-driving trucks work on highways. The last-mile problem — loading docks, weather, unexpected obstacles, liability for 80,000 lb vehicles — is where physical friction and regulation hold. Highway automation is a solved problem with a regulatory timeline attached.",
    "bottleneck": "Regulation",
    "industryId": "transportation"
  },
  "construction worker": {
    "title": "Construction Worker",
    "components": { "knowledgeWork": 25, "judgment": 45, "trust": 35, "physicalExecution": 95, "legalLiability": 55, "humanPreference": 25, "costToDeploy": 90 },
    "summary": "Construction is the hardest physical problem in robotics. Unstructured environments, varying materials, and coordination across dozens of trades make it deeply resistant to automation. Capital cost to deploy robotics at this fidelity is currently prohibitive.",
    "bottleneck": "Physical Execution",
    "industryId": "construction"
  },
  "chef": {
    "title": "Chef",
    "components": { "knowledgeWork": 50, "judgment": 65, "trust": 50, "physicalExecution": 80, "legalLiability": 30, "humanPreference": 75, "costToDeploy": 85 },
    "summary": "Food production at scale is highly automated. The fine dining chef is a different thing: artistry, improvisation, and human taste preference are the product. Diners know the chef is a person and that's part of what they're buying.",
    "bottleneck": "Human Preference",
    "industryId": "retail"
  },
  "customer service rep": {
    "title": "Customer Service Representative",
    "components": { "knowledgeWork": 70, "judgment": 45, "trust": 55, "physicalExecution": 5, "legalLiability": 20, "humanPreference": 50, "costToDeploy": 15 },
    "summary": "Already the most automated knowledge role. Chatbots handle 60-80% of tier-1 volume in most large companies. The remaining human work is escalations, edge cases, and customers who explicitly request a person — which is itself a shrinking preference.",
    "bottleneck": "Human Preference",
    "industryId": "retail"
  },
  "journalist": {
    "title": "Journalist",
    "components": { "knowledgeWork": 75, "judgment": 70, "trust": 65, "physicalExecution": 20, "legalLiability": 40, "humanPreference": 60, "costToDeploy": 20 },
    "summary": "Structured reporting (earnings summaries, box scores, weather) is already AI-generated at major outlets. Investigative journalism requires source trust, physical presence, and editorial judgment that AI cannot replicate. The commodity layer will collapse; the premium layer will not.",
    "bottleneck": "Trust",
    "industryId": "media"
  },
  "paralegal": {
    "title": "Paralegal",
    "components": { "knowledgeWork": 85, "judgment": 50, "trust": 55, "physicalExecution": 5, "legalLiability": 65, "humanPreference": 30, "costToDeploy": 25 },
    "summary": "Document review, contract analysis, and case research are being absorbed by AI tools at law firms now. Paralegals face the same liability ceiling as lawyers — but they're below it, making them more automatable. This is already happening.",
    "bottleneck": "Legal Liability",
    "industryId": "legal-services"
  },
  "hr manager": {
    "title": "HR Manager",
    "components": { "knowledgeWork": 65, "judgment": 65, "trust": 75, "physicalExecution": 5, "legalLiability": 60, "humanPreference": 70, "costToDeploy": 25 },
    "summary": "Recruiting, screening, and compliance workflows are automatable. The HR role that survives is the human-facing one: conflict resolution, performance conversations, and organizational culture — all of which require the credibility of a person.",
    "bottleneck": "Trust",
    "industryId": "financial-services"
  },
  "pharmacist": {
    "title": "Pharmacist",
    "components": { "knowledgeWork": 75, "judgment": 70, "trust": 75, "physicalExecution": 40, "legalLiability": 90, "humanPreference": 60, "costToDeploy": 55 },
    "summary": "Robotic dispensing handles filling. The pharmacist's remaining value is the medication counseling and interaction screening that requires a licensed professional by law. Deregulation is the unlock — not technology.",
    "bottleneck": "Regulation",
    "industryId": "healthcare"
  },
  "architect": {
    "title": "Architect",
    "components": { "knowledgeWork": 70, "judgment": 75, "trust": 65, "physicalExecution": 20, "legalLiability": 80, "humanPreference": 70, "costToDeploy": 40 },
    "summary": "AI generates design options faster than any human. The architect's legal stamp on building documents is a regulated liability instrument — unlicensed practice is a crime. Beyond liability, clients have strong preferences for human creative authorship at this price point.",
    "bottleneck": "Legal Liability",
    "industryId": "construction"
  },
  "tax preparer": {
    "title": "Tax Preparer",
    "components": { "knowledgeWork": 88, "judgment": 50, "trust": 55, "physicalExecution": 5, "legalLiability": 70, "humanPreference": 35, "costToDeploy": 20 },
    "summary": "Simple tax prep is fully automatable and largely already automated (TurboTax). The surviving role is complex business tax, estate planning, and audit representation — all of which carry IRS authorization and liability exposure that requires a credentialed human.",
    "bottleneck": "Legal Liability",
    "industryId": "financial-services"
  },
  "loan officer": {
    "title": "Loan Officer",
    "components": { "knowledgeWork": 75, "judgment": 60, "trust": 65, "physicalExecution": 5, "legalLiability": 75, "humanPreference": 55, "costToDeploy": 30 },
    "summary": "Underwriting models are already AI. The loan officer persists because of CFPB fair lending rules requiring explainable decisions and human accountability for credit denial. The compliance layer is the moat, not the knowledge work.",
    "bottleneck": "Regulation",
    "industryId": "financial-services"
  },
  "insurance adjuster": {
    "title": "Insurance Adjuster",
    "components": { "knowledgeWork": 72, "judgment": 65, "trust": 60, "physicalExecution": 35, "legalLiability": 70, "humanPreference": 45, "costToDeploy": 40 },
    "summary": "Claims triage and damage estimation are heavily automated. Complex claims — litigation exposure, disputed liability, catastrophe events — require human judgment and legal authority that insurance regulations mandate stays with a licensed adjuster.",
    "bottleneck": "Regulation",
    "industryId": "financial-services"
  },
  "recruiter": {
    "title": "Recruiter",
    "components": { "knowledgeWork": 70, "judgment": 60, "trust": 75, "physicalExecution": 5, "legalLiability": 45, "humanPreference": 70, "costToDeploy": 20 },
    "summary": "Resume screening and sourcing are automated. What candidates and hiring managers actually want is a human who can read between the lines, build relationships, and sell them on each other. The trust and relationship layer is highly resistant to AI substitution.",
    "bottleneck": "Trust",
    "industryId": "financial-services"
  },
  "data analyst": {
    "title": "Data Analyst",
    "components": { "knowledgeWork": 90, "judgment": 60, "trust": 40, "physicalExecution": 5, "legalLiability": 25, "humanPreference": 30, "costToDeploy": 15 },
    "summary": "Data analysis — querying, visualization, reporting — is the clearest automation target after customer service. AI generates SQL, interprets results, and builds dashboards. The surviving role is asking the right questions and translating for business stakeholders.",
    "bottleneck": "Judgment",
    "industryId": "software-dev"
  },
  "copywriter": {
    "title": "Copywriter",
    "components": { "knowledgeWork": 80, "judgment": 55, "trust": 45, "physicalExecution": 5, "legalLiability": 20, "humanPreference": 65, "costToDeploy": 10 },
    "summary": "High-volume content generation (ads, product descriptions, SEO articles) is dominated by AI. The surviving copywriting is brand-defining creative work where human authorship and voice are the product — and even there, AI is encroaching fast.",
    "bottleneck": "Human Preference",
    "industryId": "media"
  },
  "medical coder": {
    "title": "Medical Coder",
    "components": { "knowledgeWork": 88, "judgment": 45, "trust": 40, "physicalExecution": 5, "legalLiability": 70, "humanPreference": 15, "costToDeploy": 25 },
    "summary": "Medical coding is one of the most automatable healthcare-adjacent jobs. It's pure classification against a known schema (ICD-10, CPT codes). The blocker is audit liability — coders sign off on claims, and fraudulent or negligent coding carries criminal penalties.",
    "bottleneck": "Legal Liability",
    "industryId": "healthcare"
  },
  "real estate agent": {
    "title": "Real Estate Agent",
    "components": { "knowledgeWork": 60, "judgment": 60, "trust": 80, "physicalExecution": 25, "legalLiability": 55, "humanPreference": 80, "costToDeploy": 20 },
    "summary": "Listing search and market analysis are automated. But a home purchase is the largest transaction most people ever make — buyers and sellers want human representation, and state licensing laws require a licensed agent in the transaction loop in most jurisdictions.",
    "bottleneck": "Human Preference",
    "industryId": "retail"
  }
}
```

- [ ] **Step 4: Create `scripts/manual-overrides.json`**

```json
{
  "software-dev":       { "regulation": 2, "trustNeed": 3 },
  "financial-services": { "regulation": 5, "trustNeed": 4 },
  "healthcare":         { "regulation": 5, "trustNeed": 5 },
  "legal-services":     { "regulation": 5, "trustNeed": 4 },
  "transportation":     { "regulation": 3, "trustNeed": 3 },
  "construction":       { "regulation": 3, "trustNeed": 3 },
  "education":          { "regulation": 3, "trustNeed": 5 },
  "media":              { "regulation": 2, "trustNeed": 3 },
  "retail":             { "regulation": 2, "trustNeed": 3 },
  "manufacturing":      { "regulation": 3, "trustNeed": 2 }
}
```

- [ ] **Step 5: Commit**

```bash
git add data/ scripts/manual-overrides.json
git commit -m "feat: add seed data for industries, occupations, and sandbox jobs"
```

---

### Task 4: Layout shell and Sidebar

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Create: `components/Sidebar.tsx`

- [ ] **Step 1: Create `components/Sidebar.tsx`**

```tsx
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
```

- [ ] **Step 2: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Automation Frontier Dashboard',
  description: 'Where is AI blocked? A structured look at automation bottlenecks by industry.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-[#cccccc] font-mono flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Replace `app/page.tsx`**

```tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/index')
}
```

- [ ] **Step 4: Verify layout renders**

```bash
npm run dev
```

Open `http://localhost:3000` — should redirect to `/index` (404 for now, but layout with sidebar should be visible). Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/page.tsx components/Sidebar.tsx
git commit -m "feat: add persistent sidebar layout shell"
```

---

### Task 5: Human Bottleneck Index page

**Files:**
- Create: `app/index/page.tsx`
- Create: `components/BottleneckTable.tsx`

- [ ] **Step 1: Create `components/BottleneckTable.tsx`**

```tsx
'use client'

import React, { useState, useMemo } from 'react'
import type { Industry, Occupation } from '@/lib/types'

type SortKey = 'name' | 'aiCapability' | 'physicalFriction' | 'regulation' | 'trustNeed' | 'automationRisk' | 'blsEmployment'
type SortDir = 'asc' | 'desc'

const BOTTLENECK_FILTERS = ['regulation', 'physical', 'trust'] as const

function ScoreBar({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-dim rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(value / max) * 100}%`, background: color }}
        />
      </div>
      <span className="text-xs text-muted w-6 text-right">{value}</span>
    </div>
  )
}

function formatEmployment(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

export default function BottleneckTable({
  industries,
  occupations,
}: {
  industries: Industry[]
  occupations: Occupation[]
}) {
  const [sortKey, setSortKey] = useState<SortKey>('automationRisk')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function toggleFilter(f: string) {
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    )
  }

  const filtered = useMemo(() => {
    let rows = industries
    if (activeFilters.length > 0) {
      rows = rows.filter((ind) =>
        activeFilters.every((f) => ind.bottleneckTypes.includes(f))
      )
    }
    return [...rows].sort((a, b) => {
      const av = a[sortKey] as number | string
      const bv = b[sortKey] as number | string
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [industries, activeFilters, sortKey, sortDir])

  const cols: { key: SortKey; label: string }[] = [
    { key: 'name', label: 'INDUSTRY' },
    { key: 'aiCapability', label: 'AI CAP.' },
    { key: 'physicalFriction', label: 'PHYSICAL' },
    { key: 'regulation', label: 'REGULATION' },
    { key: 'trustNeed', label: 'TRUST' },
    { key: 'automationRisk', label: 'AUTO RISK' },
    { key: 'blsEmployment', label: 'WORKERS' },
  ]

  return (
    <div>
      {/* Filter chips */}
      <div className="flex gap-2 mb-4">
        <span className="text-muted text-xs self-center">FILTER BY BOTTLENECK:</span>
        {BOTTLENECK_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => toggleFilter(f)}
            className={`text-xs px-3 py-1 rounded border font-mono transition-colors ${
              activeFilters.includes(f)
                ? 'border-neon text-neon bg-neon/10'
                : 'border-border text-muted hover:border-neon/50'
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
        {activeFilters.length > 0 && (
          <button
            onClick={() => setActiveFilters([])}
            className="text-xs text-muted hover:text-amber ml-auto"
          >
            CLEAR ×
          </button>
        )}
      </div>

      {/* Table */}
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-border bg-surface">
              {cols.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="px-3 py-2 text-left text-muted cursor-pointer hover:text-neon select-none"
                >
                  {label}{' '}
                  {sortKey === key && (
                    <span className="text-neon">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((ind) => {
              const isExpanded = expandedId === ind.id
              const relatedOccs = occupations
                .filter((o) => o.industryId === ind.id)
                .sort((a, b) => b.automationExposure - a.automationExposure)
                .slice(0, 5)

              return (
                <React.Fragment key={ind.id}>
                  <tr
                    onClick={() => setExpandedId(isExpanded ? null : ind.id)}
                    className="border-b border-border cursor-pointer hover:bg-surface/60 transition-colors"
                  >
                    <td className="px-3 py-3">
                      <span className="text-neon mr-1">{isExpanded ? '▼' : '▶'}</span>
                      {ind.name}
                    </td>
                    <td className="px-3 py-2 w-28">
                      <ScoreBar value={ind.aiCapability} color="#00ff88" />
                    </td>
                    <td className="px-3 py-2 w-28">
                      <ScoreBar value={ind.physicalFriction} color="#ff6b35" />
                    </td>
                    <td className="px-3 py-2 w-28">
                      <ScoreBar value={ind.regulation} color="#ff6b35" />
                    </td>
                    <td className="px-3 py-2 w-28">
                      <ScoreBar value={ind.trustNeed} color="#00bfff" />
                    </td>
                    <td className="px-3 py-2 w-28">
                      <ScoreBar value={ind.automationRisk} color="#00ff88" />
                    </td>
                    <td className="px-3 py-2 text-muted">
                      {formatEmployment(ind.blsEmployment)}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-b border-border bg-surface/40">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="text-muted text-xs mb-2 tracking-widest">TOP OCCUPATIONS BY AUTOMATION EXPOSURE</div>
                        <div className="space-y-2">
                          {relatedOccs.map((occ) => (
                            <div key={occ.socCode} className="flex items-center gap-3">
                              <span className="text-dim w-28">{occ.socCode}</span>
                              <span className="flex-1">{occ.title}</span>
                              <div className="w-32">
                                <ScoreBar value={occ.automationExposure} max={100} color="#00ff88" />
                              </div>
                            </div>
                          ))}
                        </div>
                        {ind.bottleneckTypes.length > 0 && (
                          <div className="mt-3 flex gap-2">
                            <span className="text-muted text-xs">BOTTLENECKS:</span>
                            {ind.bottleneckTypes.map((b) => (
                              <span key={b} className="text-xs text-amber border border-amber/30 px-2 py-0.5 rounded">
                                {b.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <p className="text-muted text-xs text-center py-8">No industries match the selected filters.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `app/index/page.tsx`**

```tsx
import BottleneckTable from '@/components/BottleneckTable'
import industriesData from '@/data/industries.json'
import occupationsData from '@/data/occupations.json'
import type { Industry, Occupation } from '@/lib/types'

export const metadata = { title: 'Bottleneck Index — Automation Frontier Dashboard' }

export default function IndexPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="text-muted text-xs tracking-widest mb-1">HUMAN BOTTLENECK INDEX</div>
        <h1 className="text-neon text-2xl font-bold font-mono">
          Where is AI blocked?
        </h1>
        <p className="text-muted text-sm mt-2 max-w-2xl">
          Industries ranked by automation risk vs. friction bottleneck.
          Sorted by automation risk by default. Click any row to see top occupations.
        </p>
      </div>
      <BottleneckTable
        industries={industriesData as Industry[]}
        occupations={occupationsData as Occupation[]}
      />
    </div>
  )
}
```

- [ ] **Step 3: Add `resolveJsonModule` to `tsconfig.json`**

In `tsconfig.json`, ensure the `compilerOptions` object contains:
```json
"resolveJsonModule": true
```

- [ ] **Step 4: Verify the index page renders**

```bash
npm run dev
```

Open `http://localhost:3000/index`. Expect: sortable table with 10 industries, filter chips, expandable rows. Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add app/index/ components/BottleneckTable.tsx
git commit -m "feat: add Human Bottleneck Index with sortable/filterable table"
```

---

### Task 6: Radar Chart component

**Files:**
- Create: `components/RadarChart.tsx`

- [ ] **Step 1: Create `components/RadarChart.tsx`**

Seven axes, pure SVG, no dependencies.

```tsx
'use client'

import type { SandboxComponents } from '@/lib/types'

const AXES: { key: keyof SandboxComponents; label: string }[] = [
  { key: 'knowledgeWork', label: 'Knowledge' },
  { key: 'judgment', label: 'Judgment' },
  { key: 'trust', label: 'Trust' },
  { key: 'physicalExecution', label: 'Physical' },
  { key: 'legalLiability', label: 'Legal' },
  { key: 'humanPreference', label: 'Human Pref.' },
  { key: 'costToDeploy', label: 'Cost' },
]

const CX = 160
const CY = 160
const RADIUS = 110
const N = AXES.length

function axisAngle(i: number) {
  return -Math.PI / 2 + (2 * Math.PI * i) / N
}

function point(i: number, value: number) {
  const angle = axisAngle(i)
  const r = (value / 100) * RADIUS
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) }
}

function axisEnd(i: number) {
  const angle = axisAngle(i)
  return { x: CX + RADIUS * Math.cos(angle), y: CY + RADIUS * Math.sin(angle) }
}

function labelPos(i: number) {
  const angle = axisAngle(i)
  const r = RADIUS + 22
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) }
}

export default function RadarChart({ components }: { components: SandboxComponents }) {
  const dataPoints = AXES.map((ax, i) => point(i, components[ax.key]))
  const polygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')

  // Concentric rings at 20%, 40%, 60%, 80%, 100%
  const rings = [20, 40, 60, 80, 100].map((pct) =>
    AXES.map((_, i) => {
      const { x, y } = point(i, pct)
      return `${x},${y}`
    }).join(' ')
  )

  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-xs mx-auto">
      {/* Rings */}
      {rings.map((pts, ri) => (
        <polygon
          key={ri}
          points={pts}
          fill="none"
          stroke="#1a1a2e"
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {AXES.map((_, i) => {
        const end = axisEnd(i)
        return (
          <line
            key={i}
            x1={CX} y1={CY}
            x2={end.x} y2={end.y}
            stroke="#1a1a2e"
            strokeWidth={1}
          />
        )
      })}

      {/* Data polygon */}
      <polygon
        points={polygon}
        fill="#00ff8818"
        stroke="#00ff88"
        strokeWidth={1.5}
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#00ff88" />
      ))}

      {/* Axis labels */}
      {AXES.map((ax, i) => {
        const lp = labelPos(i)
        return (
          <text
            key={i}
            x={lp.x}
            y={lp.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="9"
            fill="#555566"
            fontFamily="monospace"
          >
            {ax.label.toUpperCase()}
          </text>
        )
      })}
    </svg>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/RadarChart.tsx
git commit -m "feat: add pure SVG 7-axis radar chart component"
```

---

### Task 7: Sandbox Zod schema and Claude API route

**Files:**
- Create: `lib/sandbox-schema.ts`
- Create: `app/api/analyze/route.ts`

- [ ] **Step 1: Create `lib/sandbox-schema.ts`**

```ts
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
```

- [ ] **Step 2: Create `app/api/analyze/route.ts`**

```ts
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
```

- [ ] **Step 3: Commit**

```bash
git add lib/sandbox-schema.ts app/api/
git commit -m "feat: add Zod schema and Claude API route for sandbox analysis"
```

---

### Task 8: Automation Sandbox page

**Files:**
- Create: `app/sandbox/page.tsx`
- Create: `components/SandboxSearch.tsx`
- Create: `components/SandboxResult.tsx`

- [ ] **Step 1: Create `components/SandboxResult.tsx`**

```tsx
import React from 'react'
import RadarChart from '@/components/RadarChart'
import type { SandboxEntry } from '@/lib/types'
import Link from 'next/link'

export default function SandboxResult({ entry }: { entry: SandboxEntry | null; loading?: boolean }) {
  if (!entry) return null

  return (
    <div className="border border-border rounded bg-surface p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-muted text-xs tracking-widest mb-1">ANALYSIS</div>
          <h2 className="text-neon text-xl font-bold">{entry.title}</h2>
        </div>
        <span className="text-xs border border-amber/40 text-amber px-3 py-1 rounded">
          BOTTLENECK: {entry.bottleneck.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RadarChart components={entry.components} />
        <div className="space-y-3">
          <div className="text-muted text-xs tracking-widest">COMPONENT BREAKDOWN</div>
          {Object.entries(entry.components).map(([key, value]) => {
            const label = key.replace(/([A-Z])/g, ' $1').trim().toUpperCase()
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-muted text-xs w-32 shrink-0">{label}</span>
                <div className="flex-1 h-1 bg-dim rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neon rounded-full"
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="text-neon text-xs w-8 text-right">{value}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <div className="text-muted text-xs tracking-widest mb-2">EDITORIAL TAKE</div>
        <p className="text-sm leading-relaxed">{entry.summary}</p>
      </div>

      {entry.industryId && (
        <div>
          <Link
            href={`/index`}
            className="text-xs text-cyan hover:underline"
          >
            → View {entry.industryId.replace(/-/g, ' ')} sector in Bottleneck Index
          </Link>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `components/SandboxSearch.tsx`**

```tsx
'use client'

import { useState, useMemo, useRef } from 'react'
import type { SandboxEntry } from '@/lib/types'
import type { SandboxOutput } from '@/lib/sandbox-schema'
import SandboxResult from '@/components/SandboxResult'
import prebuilt from '@/data/sandbox-prebuilt.json'

const PREBUILT = prebuilt as Record<string, SandboxEntry>

export default function SandboxSearch({
  occupationTitles,
}: {
  occupationTitles: string[]
}) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<SandboxEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return occupationTitles
      .filter((t) => t.toLowerCase().includes(q))
      .slice(0, 8)
  }, [query, occupationTitles])

  async function analyze(title: string) {
    setQuery(title)
    setShowSuggestions(false)
    setError(null)

    const key = title.toLowerCase().trim()
    const prebuiltEntry = PREBUILT[key]
    if (prebuiltEntry) {
      setResult(prebuiltEntry)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) throw new Error('Analysis failed')
      const data: SandboxOutput = await res.json()
      setResult(data as SandboxEntry)
    } catch {
      setError('Analysis failed. Check your ANTHROPIC_API_KEY and try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && query.trim()) {
      analyze(query.trim())
    }
  }

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="relative">
        <div className="flex items-center border border-border rounded bg-surface focus-within:border-neon/50 transition-colors">
          <span className="text-neon px-3 text-sm">$</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true) }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Enter a job title... (e.g. Accountant, Nurse, Truck Driver)"
            className="flex-1 bg-transparent text-sm py-3 pr-3 outline-none placeholder:text-muted"
          />
          <button
            onClick={() => query.trim() && analyze(query.trim())}
            disabled={loading || !query.trim()}
            className="px-4 py-3 text-xs text-neon border-l border-border hover:bg-neon/5 disabled:opacity-40 transition-colors"
          >
            {loading ? 'ANALYZING...' : 'ANALYZE →'}
          </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-10 border border-border border-t-0 rounded-b bg-surface">
            {suggestions.map((s) => (
              <button
                key={s}
                onMouseDown={() => analyze(s)}
                className="block w-full text-left px-4 py-2 text-xs hover:bg-neon/5 hover:text-neon text-muted transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick picks */}
      <div>
        <div className="text-muted text-xs mb-2 tracking-widest">QUICK PICKS</div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(PREBUILT).slice(0, 10).map((key) => (
            <button
              key={key}
              onClick={() => analyze(key)}
              className="text-xs border border-border text-muted hover:border-neon/50 hover:text-neon px-3 py-1 rounded transition-colors"
            >
              {PREBUILT[key].title}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-amber text-xs border border-amber/30 rounded px-3 py-2">{error}</p>
      )}

      {loading && (
        <div className="border border-border rounded bg-surface p-6 text-center text-muted text-sm">
          Analyzing {query}...
        </div>
      )}

      {!loading && <SandboxResult entry={result} />}
    </div>
  )
}
```

- [ ] **Step 3: Create `app/sandbox/page.tsx`**

```tsx
import SandboxSearch from '@/components/SandboxSearch'
import occupationsData from '@/data/occupations.json'
import type { Occupation } from '@/lib/types'

export const metadata = { title: 'Automation Sandbox — Automation Frontier Dashboard' }

const occupationTitles = (occupationsData as Occupation[]).map((o) => o.title)

export default function SandboxPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="text-muted text-xs tracking-widest mb-1">AUTOMATION SANDBOX</div>
        <h1 className="text-neon text-2xl font-bold font-mono">
          Can AI automate this?
        </h1>
        <p className="text-muted text-sm mt-2">
          Enter any job title. Prebuilt entries load instantly. Unknown jobs are analyzed by Claude.
        </p>
      </div>
      <SandboxSearch occupationTitles={occupationTitles} />
    </div>
  )
}
```

- [ ] **Step 4: Verify sandbox renders and prebuilt jobs work**

```bash
npm run dev
```

Open `http://localhost:3000/sandbox`. Click "Accountant" quick pick — should render radar chart and summary without any API call. Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add app/sandbox/ components/SandboxSearch.tsx components/SandboxResult.tsx
git commit -m "feat: add Automation Sandbox with radar chart and prebuilt/AI analysis"
```

---

### Task 9: Patch Notes MDX utilities and initial content

**Files:**
- Create: `lib/patch-notes.ts`
- Create: `content/patch-notes/2026-05.mdx`
- Create: `components/PatchNoteLayout.tsx`
- Create: `tests/lib/patch-notes.test.ts`

- [ ] **Step 1: Create `lib/patch-notes.ts`**

```ts
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
```

- [ ] **Step 2: Write failing tests for `lib/patch-notes.ts` in `tests/lib/patch-notes.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { getAllPatchNotes, getPatchNoteContent } from '@/lib/patch-notes'

describe('getAllPatchNotes', () => {
  it('returns an array', () => {
    const notes = getAllPatchNotes()
    expect(Array.isArray(notes)).toBe(true)
  })

  it('returns at least one patch note', () => {
    const notes = getAllPatchNotes()
    expect(notes.length).toBeGreaterThan(0)
  })

  it('each note has required fields', () => {
    const notes = getAllPatchNotes()
    for (const note of notes) {
      expect(note.slug).toBeTruthy()
      expect(note.version).toBeTruthy()
      expect(note.title).toBeTruthy()
      expect(Array.isArray(note.tags)).toBe(true)
    }
  })

  it('returns notes sorted newest first by date', () => {
    const notes = getAllPatchNotes()
    for (let i = 1; i < notes.length; i++) {
      expect(notes[i - 1].date >= notes[i].date).toBe(true)
    }
  })
})

describe('getPatchNoteContent', () => {
  it('returns meta and content for a valid slug', () => {
    const { meta, content } = getPatchNoteContent('2026-05')
    expect(meta.slug).toBe('2026-05')
    expect(meta.version).toBe('2026.05')
    expect(content.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 3: Run tests — verify they fail** (no MDX file yet)

```bash
npm test tests/lib/patch-notes.test.ts
```

Expected: FAIL — file not found / empty array.

- [ ] **Step 4: Create `content/patch-notes/2026-05.mdx`**

```mdx
---
version: "2026.05"
date: "2026-05-01"
title: "White-collar labor nerfed"
summary: "AI capability in document-heavy jobs increased, but legal accountability and trust bottlenecks remain unresolved."
tags: ["finance", "legal", "software"]
relatedIndustries: ["software-dev", "financial-services", "legal-services"]
relatedSandboxJobs: ["accountant", "lawyer", "paralegal", "financial analyst"]
---

## Patch v2026.05 — White-collar labor nerfed

**Released:** May 2026

---

### Buffs (AI Capability Increased)

**Document-heavy knowledge work** — Document drafting, review, and summarization now operate at near-human speed across most legal, financial, and compliance contexts. The bottleneck has shifted from *can AI do this task* to *who is legally responsible when it's wrong*.

**Code generation** — Software engineering task automation crossed a threshold. AI now handles boilerplate, test generation, and standard feature implementation with minimal human intervention. Senior engineers increasingly direct rather than write.

**Data analysis pipelines** — Automated report generation and dashboard creation are now standard in most mid-size companies. The analyst role has bifurcated: humans who ask the right questions versus outputs that answer them.

---

### Nerfs (Bottlenecks Holding)

**Legal liability structures** — Courts and regulators have not updated their liability frameworks. A signed document is still legally attributed to a licensed human. This single constraint is keeping humans in the loop across law, medicine, accounting, and insurance — not technical inability.

**Trust in high-stakes contexts** — Patients, clients, and families continue to exhibit strong revealed preferences for human professionals in healthcare, therapy, and financial planning. Adoption studies show willingness-to-use AI drops sharply when stakes and emotional weight increase.

**Physical deployment costs** — Robotics capable of matching human dexterity in unstructured environments remain cost-prohibitive for most industries. Construction, nursing, and complex manufacturing are structurally human for this patch cycle.

---

### Known Issues

- **Accountability vacuum**: AI systems producing consequential outputs have no clear liability framework. Enterprises are adopting AI internally while maintaining human sign-off externally — creating a parallel shadow system.
- **Trust gap by demographic**: Adoption of AI-first services skews heavily toward younger, tech-adjacent users. Mass-market trust has not followed capability.

---

### Related

- [Bottleneck Index](/index) — View updated industry rankings
- [Sandbox: Accountant](/sandbox) — See component breakdown
- [Sandbox: Lawyer](/sandbox) — See component breakdown
```

- [ ] **Step 5: Create `components/PatchNoteLayout.tsx`**

```tsx
import type { PatchNoteMeta } from '@/lib/types'

export function Buff({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-neon pl-4 my-3">
      <span className="text-neon text-xs font-bold mr-2">BUFF</span>
      <span className="text-sm">{children}</span>
    </div>
  )
}

export function Nerf({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-amber pl-4 my-3">
      <span className="text-amber text-xs font-bold mr-2">NERF</span>
      <span className="text-sm">{children}</span>
    </div>
  )
}

export function SectorTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center border border-cyan/30 text-cyan text-xs px-2 py-0.5 rounded mr-1 mb-1">
      {children}
    </span>
  )
}

export function PatchHeader({ meta }: { meta: PatchNoteMeta }) {
  return (
    <div className="border border-border rounded bg-surface p-6 mb-8">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-muted text-xs tracking-widest mb-1">
            PATCH v{meta.version}
          </div>
          <h1 className="text-neon text-2xl font-bold">{meta.title}</h1>
        </div>
        <span className="text-muted text-xs">{meta.date}</span>
      </div>
      <p className="text-muted text-sm mb-4">{meta.summary}</p>
      <div className="flex flex-wrap gap-1">
        {meta.tags.map((tag) => (
          <SectorTag key={tag}>{tag}</SectorTag>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
npm test tests/lib/patch-notes.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/patch-notes.ts tests/lib/patch-notes.test.ts content/ components/PatchNoteLayout.tsx
git commit -m "feat: add patch notes MDX utilities, initial patch, and layout components"
```

---

### Task 10: Patch Notes pages

**Files:**
- Create: `app/patch-notes/page.tsx`
- Create: `app/patch-notes/[slug]/page.tsx`

- [ ] **Step 1: Install `next-mdx-remote` if not yet installed**

```bash
npm ls next-mdx-remote || npm install next-mdx-remote
```

- [ ] **Step 2: Create `app/patch-notes/page.tsx`**

```tsx
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
          Economic and labor updates. What changed and what's still broken.
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
```

- [ ] **Step 3: Create `app/patch-notes/[slug]/page.tsx`**

```tsx
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllPatchNotes, getPatchNoteContent } from '@/lib/patch-notes'
import { PatchHeader, Buff, Nerf, SectorTag } from '@/components/PatchNoteLayout'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  return getAllPatchNotes().map((n) => ({ slug: n.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { meta } = getPatchNoteContent(slug)
  return { title: `Patch v${meta.version} — ${meta.title}` }
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
    <div className="p-6 max-w-3xl mx-auto">
      <PatchHeader meta={meta} />
      <div className="prose prose-sm prose-invert max-w-none font-mono
        prose-headings:text-neon prose-headings:font-mono
        prose-p:text-[#cccccc] prose-p:text-sm
        prose-strong:text-white
        prose-hr:border-border
        prose-a:text-cyan prose-a:no-underline hover:prose-a:underline
        prose-li:text-[#cccccc] prose-li:text-sm">
        <MDXRemote source={content} components={mdxComponents} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add `@tailwindcss/typography` if not installed**

```bash
npm ls @tailwindcss/typography || npm install @tailwindcss/typography
```

Then add to `tailwind.config.ts` plugins:
```ts
plugins: [require('@tailwindcss/typography')],
```

- [ ] **Step 5: Verify patch notes render**

```bash
npm run dev
```

Open `http://localhost:3000/patch-notes`. Expect: list of notes. Click through to `2026-05` detail. Stop with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add app/patch-notes/
git commit -m "feat: add Civilization Patch Notes list and detail pages"
```

---

### Task 11: RSS feed

**Files:**
- Create: `app/patch-notes/feed.xml/route.ts`

- [ ] **Step 1: Create `app/patch-notes/feed.xml/route.ts`**

```ts
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
```

- [ ] **Step 2: Verify RSS feed**

```bash
npm run dev
```

Open `http://localhost:3000/patch-notes/feed.xml` — expect valid RSS XML with one item. Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add app/patch-notes/feed.xml/
git commit -m "feat: add RSS 2.0 feed for patch notes"
```

---

### Task 12: Ingestion script

**Files:**
- Create: `scripts/ingest.ts`

- [ ] **Step 1: Register O*NET API credentials**

Go to `https://services.onetcenter.org/` and register for a free Web Services account. You'll receive `ONET_USERNAME` and `ONET_PASSWORD`. Add them to `.env.local`.

- [ ] **Step 2: Create `scripts/ingest.ts`**

```ts
import fs from 'fs'
import path from 'path'
import { computeAutomationRisk, deriveBottleneckTypes } from '../lib/scores'

const ONET_BASE = 'https://services.onetcenter.org/ws'
const BLS_BASE = 'https://api.bls.gov/publicAPI/v2'

const ONET_AUTH = Buffer.from(
  `${process.env.ONET_USERNAME}:${process.env.ONET_PASSWORD}`
).toString('base64')

// O*NET work activity codes that signal physical work
const PHYSICAL_ACTIVITY_CODES = [
  '4.A.3.b.1', // Performing General Physical Activities
  '4.A.3.b.2', // Handling and Moving Objects
  '4.A.3.b.4', // Operating Vehicles, Mechanized Devices, or Equipment
  '4.A.3.c.3', // Inspecting Equipment, Structures, or Material
]

// O*NET work activity codes that signal knowledge/cognitive work
const COGNITIVE_ACTIVITY_CODES = [
  '4.A.2.a.1', // Analyzing Data or Information
  '4.A.2.b.2', // Processing Information
  '4.A.4.a.1', // Identifying Objects, Actions, and Events
  '4.A.4.b.5', // Making Decisions and Solving Problems
]

// Industry groupings: O*NET SOC code prefixes → industry IDs
const INDUSTRY_MAP: Record<string, string[]> = {
  'software-dev':       ['15-1'],
  'financial-services': ['13-1', '13-2'],
  'healthcare':         ['29-1', '29-2', '31-1'],
  'legal-services':     ['23-1', '23-2'],
  'transportation':     ['53-'],
  'construction':       ['47-'],
  'education':          ['25-'],
  'media':              ['27-'],
  'retail':             ['41-', '43-4'],
  'manufacturing':      ['51-'],
}

function getIndustryId(socCode: string): string {
  for (const [industryId, prefixes] of Object.entries(INDUSTRY_MAP)) {
    if (prefixes.some((p) => socCode.startsWith(p))) return industryId
  }
  return 'other'
}

async function onetGet(path: string) {
  const res = await fetch(`${ONET_BASE}${path}`, {
    headers: { Authorization: `Basic ${ONET_AUTH}`, Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`O*NET ${path} → ${res.status}`)
  return res.json()
}

async function blsGet(seriesIds: string[]) {
  const res = await fetch(`${BLS_BASE}/timeseries/data/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seriesid: seriesIds, startyear: '2023', endyear: '2023' }),
  })
  if (!res.ok) throw new Error(`BLS API → ${res.status}`)
  return res.json()
}

async function main() {
  console.log('Fetching O*NET occupation list...')
  const occList = await onetGet('/occupations/?start=1&end=1000')
  const occs: Array<{ code: string; title: string }> = occList.occupation ?? []

  const industries: Record<string, {
    id: string; name: string; socCodes: string[]
    physicalScores: number[]; cognitiveScores: number[]
    employmentTotal: number
  }> = {}

  for (const [id] of Object.entries(INDUSTRY_MAP)) {
    industries[id] = {
      id, name: id.replace(/-/g, ' '),
      socCodes: [], physicalScores: [], cognitiveScores: [],
      employmentTotal: 0,
    }
  }

  const occupationRecords = []
  const BLS_SERIES: string[] = []

  console.log(`Processing ${occs.length} occupations...`)
  for (const occ of occs.slice(0, 200)) {
    const industryId = getIndustryId(occ.code)
    if (industryId === 'other') continue

    try {
      const activities = await onetGet(`/occupations/${occ.code}/details/work_activities/`)
      const items: Array<{ id: { value: string }; importance: { value: number } }> =
        activities.element ?? []

      const physicalScore =
        items
          .filter((i) => PHYSICAL_ACTIVITY_CODES.includes(i.id.value))
          .reduce((sum, i) => sum + i.importance.value, 0) /
        Math.max(PHYSICAL_ACTIVITY_CODES.length, 1)

      const cognitiveScore =
        items
          .filter((i) => COGNITIVE_ACTIVITY_CODES.includes(i.id.value))
          .reduce((sum, i) => sum + i.importance.value, 0) /
        Math.max(COGNITIVE_ACTIVITY_CODES.length, 1)

      // Normalize O*NET 1-5 importance scores to 0-100
      const automationExposure = Math.round(((cognitiveScore - 1) / 4) * 100)

      const topActivities = items
        .sort((a, b) => b.importance.value - a.importance.value)
        .slice(0, 3)
        .map((i) => i.id.value)

      occupationRecords.push({
        socCode: occ.code,
        title: occ.title,
        industryId,
        automationExposure,
        workActivities: topActivities,
      })

      industries[industryId].socCodes.push(occ.code)
      industries[industryId].physicalScores.push(physicalScore)
      industries[industryId].cognitiveScores.push(cognitiveScore)

      // Build BLS series ID for this occupation
      const socNoDash = occ.code.replace(/[.-]/g, '').padEnd(6, '0').slice(0, 6)
      BLS_SERIES.push(`OEUS000000000000${socNoDash}01`)
    } catch {
      // skip occupations with missing data
    }

    await new Promise((r) => setTimeout(r, 100)) // rate limit
  }

  // Fetch BLS employment data in batches of 50
  console.log('Fetching BLS employment data...')
  for (let i = 0; i < Math.min(BLS_SERIES.length, 200); i += 50) {
    const batch = BLS_SERIES.slice(i, i + 50)
    try {
      const blsData = await blsGet(batch)
      for (const series of blsData.Results?.series ?? []) {
        const code = series.seriesID.slice(16, 22)
        const socCode = `${code.slice(0, 2)}-${code.slice(2, 6)}.00`
        const latest = series.data?.[0]?.value
        if (latest) {
          const industryId = getIndustryId(socCode)
          if (industryId !== 'other') {
            industries[industryId].employmentTotal += Number(latest) * 1000
          }
        }
      }
    } catch {
      console.warn(`BLS batch ${i}-${i + 50} failed, skipping`)
    }
  }

  // Load manual overrides
  const overridesPath = path.join(__dirname, 'manual-overrides.json')
  const overrides: Record<string, { regulation: number; trustNeed: number }> =
    JSON.parse(fs.readFileSync(overridesPath, 'utf-8'))

  // Build industry records
  const industryRecords = Object.values(industries)
    .filter((ind) => ind.socCodes.length > 0)
    .map((ind) => {
      const avg = (arr: number[]) =>
        arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 3

      // O*NET scores are 1-5; normalize cognitive → aiCapability (1-5)
      const rawCog = avg(ind.cognitiveScores)
      const aiCapability = Math.round(Math.min(5, Math.max(1, rawCog)))

      const rawPhys = avg(ind.physicalScores)
      const physicalFriction = Math.round(Math.min(5, Math.max(1, rawPhys)))

      const { regulation, trustNeed } = overrides[ind.id] ?? { regulation: 3, trustNeed: 3 }

      const automationRisk = computeAutomationRisk(aiCapability, regulation, physicalFriction, trustNeed)
      const bottleneckTypes = deriveBottleneckTypes(regulation, physicalFriction, trustNeed)

      return {
        id: ind.id,
        name: ind.id
          .split('-')
          .map((w) => w[0].toUpperCase() + w.slice(1))
          .join(' '),
        aiCapability,
        physicalFriction,
        regulation,
        trustNeed,
        automationRisk,
        bottleneckTypes,
        blsEmployment: ind.employmentTotal || 1000000,
        occupationIds: ind.socCodes,
      }
    })

  // Write output files
  const dataDir = path.join(process.cwd(), 'data')
  fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(path.join(dataDir, 'industries.json'), JSON.stringify(industryRecords, null, 2))
  fs.writeFileSync(path.join(dataDir, 'occupations.json'), JSON.stringify(occupationRecords, null, 2))

  console.log(`✓ Wrote ${industryRecords.length} industries, ${occupationRecords.length} occupations`)
  console.log('Run `npm run dev` to see updated data.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 3: Add ingest script to `package.json`**

In `package.json` scripts:
```json
"ingest": "tsx --env-file=.env.local scripts/ingest.ts"
```

- [ ] **Step 4: Run ingestion (optional — requires O*NET credentials)**

If you have credentials in `.env.local`:
```bash
npm run ingest
```

Expected output:
```
Fetching O*NET occupation list...
Processing N occupations...
Fetching BLS employment data...
✓ Wrote 10 industries, N occupations
```

This overwrites `data/industries.json` and `data/occupations.json` with real data.

- [ ] **Step 5: Commit**

```bash
git add scripts/ingest.ts
git commit -m "feat: add O*NET + BLS data ingestion script"
```

---

### Task 13: Build check and Vercel deploy

**Files:**
- Create: `.env.local` (local only, not committed)

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: successful build. Fix any TypeScript or lint errors before proceeding.

- [ ] **Step 3: Set `NEXT_PUBLIC_BASE_URL` in `.env.local`**

```
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

- [ ] **Step 4: Deploy to Vercel**

```bash
npx vercel --prod
```

Follow prompts: link to existing project or create new. When asked about environment variables, add:
- `ANTHROPIC_API_KEY` — your Anthropic API key
- `NEXT_PUBLIC_BASE_URL` — your production URL (e.g. `https://automationfrontier.com`)
- `ONET_USERNAME` and `ONET_PASSWORD` (if running ingest in CI)

- [ ] **Step 5: Verify production routes**

Check these URLs on the live deployment:
- `/index` — table renders with all 10 industries
- `/sandbox` — search works, "Accountant" quick pick renders instantly
- `/patch-notes` — list shows v2026.05
- `/patch-notes/2026-05` — full MDX renders
- `/patch-notes/feed.xml` — valid RSS XML

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "chore: production build verified and deployed"
```
