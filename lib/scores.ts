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
