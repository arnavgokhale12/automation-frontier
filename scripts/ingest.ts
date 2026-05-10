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
