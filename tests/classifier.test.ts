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

const classify = (attempts: ProbeRawResult[]) => classifyProbeResult(target, attempts)

describe('classifyProbeResult', () => {
  it('aggregates mostly fast successful probes as reachable', () => {
    const result = classify([
      { targetId: target.id, signal: 'load', ok: true, durationMs: 240, detail: 'ok' },
      { targetId: target.id, signal: 'load', ok: true, durationMs: 260, detail: 'ok' },
      { targetId: target.id, signal: 'opaque', ok: true, durationMs: 310, detail: 'opaque' },
      { targetId: target.id, signal: 'load', ok: true, durationMs: 280, detail: 'ok' },
      { targetId: target.id, signal: 'error', ok: false, durationMs: 900, detail: 'failed' },
    ])

    expect(result.status).toBe('reachable')
    expect(result.confidence).toBe('high')
    expect(result.successRate).toBe(80)
    expect(result.latencyMs).toBe(273)
    expect(result.attemptCount).toBe(5)
  })

  it('marks mostly successful but slow probes as slow', () => {
    const result = classify([
      { targetId: target.id, signal: 'load', ok: true, durationMs: 2900 },
      { targetId: target.id, signal: 'load', ok: true, durationMs: 3100 },
      { targetId: target.id, signal: 'load', ok: true, durationMs: 3300 },
      { targetId: target.id, signal: 'load', ok: true, durationMs: 3000 },
      { targetId: target.id, signal: 'timeout', ok: false, durationMs: 5000 },
    ])

    expect(result.status).toBe('slow')
    expect(result.latencyMs).toBe(3075)
    expect(result.successRate).toBe(80)
  })

  it('marks mostly failed probes as inconclusive', () => {
    const result = classify([
      { targetId: target.id, signal: 'error', ok: false, durationMs: 1000 },
      { targetId: target.id, signal: 'timeout', ok: false, durationMs: 5000 },
      { targetId: target.id, signal: 'error', ok: false, durationMs: 1200 },
      { targetId: target.id, signal: 'load', ok: true, durationMs: 600 },
      { targetId: target.id, signal: 'error', ok: false, durationMs: 800 },
    ])

    expect(result.status).toBe('inconclusive')
    expect(result.successRate).toBe(20)
    expect(result.confidence).toBe('low')
  })

  it('marks challenge targets with zero successful probes as challenging', () => {
    const challengeTarget: Target = { ...target, group: 'challenge' }
    const result = classifyProbeResult(challengeTarget, [
      { targetId: challengeTarget.id, signal: 'timeout', ok: false, durationMs: 7000 },
      { targetId: challengeTarget.id, signal: 'error', ok: false, durationMs: 900 },
      { targetId: challengeTarget.id, signal: 'timeout', ok: false, durationMs: 7000 },
      { targetId: challengeTarget.id, signal: 'error', ok: false, durationMs: 950 },
      { targetId: challengeTarget.id, signal: 'timeout', ok: false, durationMs: 7000 },
    ])

    expect(result.status).toBe('challenging')
    expect(result.confidence).toBe('medium')
    expect(result.successRate).toBe(0)
    expect(result.attemptCount).toBe(5)
  })
})
