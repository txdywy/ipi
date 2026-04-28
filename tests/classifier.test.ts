import { describe, expect, it } from 'vitest'
import { classifyProbeResult } from '../src/lib/classify/classifier'
import type { ProbeRawResult, Target } from '../src/types'

const target: Target = {
  id: 'demo',
  label: 'Demo',
  group: 'global',
  probeType: 'image',
  url: 'https://example.com/demo.png',
  timeoutMs: 5000,
  expectedSignal: 'load',
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

  it('marks interference timeouts as likely interfered', () => {
    const interferenceTarget: Target = { ...target, group: 'interference' }
    const result = classifyProbeResult(interferenceTarget, {
      targetId: interferenceTarget.id,
      signal: 'timeout',
      ok: false,
      durationMs: 7000,
    })

    expect(result.status).toBe('likely_interfered')
    expect(result.confidence).toBe('medium')
  })
})
