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

  const rings = [20, 40, 60, 80, 100].map((pct) =>
    AXES.map((_, i) => {
      const { x, y } = point(i, pct)
      return `${x},${y}`
    }).join(' ')
  )

  return (
    <svg viewBox="0 0 320 320" className="mx-auto w-full max-w-xs">
      {rings.map((pts, ri) => (
        <polygon
          key={ri}
          points={pts}
          fill="none"
          stroke="#263242"
          strokeWidth={1}
        />
      ))}

      {AXES.map((_, i) => {
        const end = axisEnd(i)
        return (
          <line
            key={i}
            x1={CX} y1={CY}
            x2={end.x} y2={end.y}
            stroke="#263242"
            strokeWidth={1}
          />
        )
      })}

      <polygon
        points={polygon}
        fill="#38bdf820"
        stroke="#38bdf8"
        strokeWidth={1.5}
      />

      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#4ade80" />
      ))}

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
            fill="#8a95a6"
            fontFamily="monospace"
          >
            {ax.label.toUpperCase()}
          </text>
        )
      })}
    </svg>
  )
}
