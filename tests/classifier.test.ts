import { describe, expect, it } from 'vitest'
import { classifyProbeResult } from '../src/lib/classify/classifier'
import type { ProbeRawResult, Target } from '../src/types'

const target: Target = {
  id: 'demo',
  label: 'Demo',
  group: 'global',
  probeType: 'image',
  url: 'https://example.com/demo.png',
  logoUrl: 'https://example.com/favicon.ico',
  timeoutMs: 5000,
  expectedSignal: 'load',
  location: 'Global · Demo',
  tags: ['演示'],
  emphasis: '示例目标。',
}

const classify = (raw: ProbeRawResult) => classifyProbeResult(target, raw)

describe('classifyProbeResult', () => {
  it('marks fast successful probes as reachable', () => {
    const result = classify({
      targetId: target.id,
      signal: 'load',
      ok: true,
      durationMs: 280,
    })

    expect(result.status).toBe('reachable')
    expect(result.confidence).toBe('high')
  })

  it('marks slow successful probes as slow', () => {
    const result = classify({
      targetId: target.id,
      signal: 'load',
      ok: true,
      durationMs: 3100,
    })

    expect(result.status).toBe('slow')
    expect(result.latencyMs).toBe(3100)
  })

  it('marks generic failures as inconclusive', () => {
    const result = classify({
      targetId: target.id,
      signal: 'error',
      ok: false,
      durationMs: 1000,
    })

    expect(result.status).toBe('inconclusive')
  })

  it('marks challenge timeouts as challenging', () => {
    const challengeTarget: Target = { ...target, group: 'challenge' }
    const result = classifyProbeResult(challengeTarget, {
      targetId: challengeTarget.id,
      signal: 'timeout',
      ok: false,
      durationMs: 7000,
    })

    expect(result.status).toBe('challenging')
    expect(result.confidence).toBe('medium')
  })
})
