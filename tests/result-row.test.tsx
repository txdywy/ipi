import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ResultRow } from '../src/components/ResultRow'
import type { ProbeResult, Target } from '../src/types'

const target: Target = {
  id: 'github-favicon',
  label: 'GitHub',
  group: 'global',
  probeType: 'image',
  url: 'https://github.githubassets.com/favicons/favicon.png',
  logoUrl: 'https://github.githubassets.com/favicons/favicon.png',
  timeoutMs: 7000,
  expectedSignal: 'load',
  location: 'Global · Dev',
  tags: ['开发', '协作'],
  emphasis: '适合观察全球开发平台的基础访问情况。',
}

const result: ProbeResult = {
  target,
  status: 'reachable',
  confidence: 'high',
  latencyMs: 273,
  successRate: 80,
  attemptCount: 5,
  reason: '多数探测成功，整体访问表现稳定。',
  raw: [
    { targetId: target.id, signal: 'load', ok: true, durationMs: 240 },
    { targetId: target.id, signal: 'load', ok: true, durationMs: 260 },
    { targetId: target.id, signal: 'opaque', ok: true, durationMs: 310 },
    { targetId: target.id, signal: 'load', ok: true, durationMs: 280 },
    { targetId: target.id, signal: 'error', ok: false, durationMs: 900 },
  ],
}

describe('ResultRow', () => {
  it('shows compact aggregated stats while preserving logo fallback behavior', () => {
    render(
      <ResultRow
        target={target}
        result={result}
        isRunning={false}
        isActive={false}
        activeAttempt={0}
        totalAttempts={5}
      />,
    )

    expect(screen.getByText('成功率 80%')).toBeInTheDocument()
    expect(screen.getByText('平均 273 ms')).toBeInTheDocument()
    expect(screen.getByText('5 次探测')).toBeInTheDocument()
    expect(screen.getByAltText('GitHub logo')).toHaveClass('result-row__logo--favicon')

    fireEvent.error(screen.getByAltText('GitHub logo'))

    expect(screen.getByLabelText('GitHub fallback logo')).toBeInTheDocument()
  })

  it('uses the configured total attempt count for active progress text', () => {
    render(
      <ResultRow
        target={target}
        isRunning
        isActive
        activeAttempt={2}
        totalAttempts={5}
      />,
    )

    expect(screen.getByText('2/5 进行中')).toBeInTheDocument()
  })
})
