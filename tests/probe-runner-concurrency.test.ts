import { describe, expect, it, vi } from 'vitest'
import type { ProbeRawResult, ProbeResult, Target } from '../src/types'

const {
  targets,
  attemptLog,
  startedTargets,
  attemptsByTarget,
  inflightByTarget,
  maxInflightByTarget,
  releaseFirstAttempts,
  probeTargetMock,
  classifyProbeResultMock,
} = vi.hoisted(() => ({
  targets: [
    {
      id: 'a',
      label: 'Alpha',
      group: 'global',
      probeType: 'fetch',
      url: 'https://a.example.com',
      logoUrl: '/a.svg',
      timeoutMs: 1000,
      location: 'A',
      tags: [],
      emphasis: 'A',
    },
    {
      id: 'b',
      label: 'Beta',
      group: 'global',
      probeType: 'fetch',
      url: 'https://b.example.com',
      logoUrl: '/b.svg',
      timeoutMs: 1000,
      location: 'B',
      tags: [],
      emphasis: 'B',
    },
    {
      id: 'c',
      label: 'Gamma',
      group: 'global',
      probeType: 'fetch',
      url: 'https://c.example.com',
      logoUrl: '/c.svg',
      timeoutMs: 1000,
      location: 'C',
      tags: [],
      emphasis: 'C',
    },
    {
      id: 'd',
      label: 'Delta',
      group: 'global',
      probeType: 'fetch',
      url: 'https://d.example.com',
      logoUrl: '/d.svg',
      timeoutMs: 1000,
      location: 'D',
      tags: [],
      emphasis: 'D',
    },
  ] as Target[],
  attemptLog: [] as Array<{ target: string; attempt: number }>,
  startedTargets: [] as string[],
  attemptsByTarget: new Map<string, number>(),
  inflightByTarget: new Map<string, number>(),
  maxInflightByTarget: new Map<string, number>(),
  releaseFirstAttempts: { current: new Map<string, () => void>() },
  probeTargetMock: vi.fn<(target: Target) => Promise<ProbeRawResult>>(),
  classifyProbeResultMock: vi.fn((target: Target, raw: ProbeRawResult[]): ProbeResult => ({
    target,
    status: 'reachable',
    confidence: 'high',
    latencyMs: raw.at(-1)?.durationMs,
    successRate: 1,
    attemptCount: raw.length,
    reason: `${target.id} ok`,
    raw,
  })),
}))

vi.mock('../src/config/targets', () => ({ TARGETS: targets }))
vi.mock('../src/lib/probes/probeAdapters', () => ({ probeTarget: probeTargetMock }))
vi.mock('../src/lib/classify/classifier', () => ({ classifyProbeResult: classifyProbeResultMock }))

import { runAllProbes } from '../src/lib/probes/probeRunner'

const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

const waitForValue = async <T>(read: () => T, predicate: (value: T) => boolean) => {
  for (let iteration = 0; iteration < 40; iteration += 1) {
    const value = read()
    if (predicate(value)) {
      return value
    }
    await flush()
  }

  return read()
}

describe('runAllProbes concurrency', () => {
  it('caps concurrent targets at three and keeps attempts sequential within each target', async () => {
    attemptLog.length = 0
    startedTargets.length = 0
    attemptsByTarget.clear()
    inflightByTarget.clear()
    maxInflightByTarget.clear()
    releaseFirstAttempts.current.clear()
    probeTargetMock.mockReset()
    classifyProbeResultMock.mockClear()

    probeTargetMock.mockImplementation(async (target) => {
      const attemptNumber = (attemptsByTarget.get(target.id) ?? 0) + 1
      attemptsByTarget.set(target.id, attemptNumber)

      const inflightCount = (inflightByTarget.get(target.id) ?? 0) + 1
      inflightByTarget.set(target.id, inflightCount)
      maxInflightByTarget.set(target.id, Math.max(maxInflightByTarget.get(target.id) ?? 0, inflightCount))

      attemptLog.push({ target: target.id, attempt: attemptNumber })

      if (attemptNumber === 1) {
        startedTargets.push(target.id)
      }

      try {
        if (attemptNumber === 1 && ['a', 'b', 'c'].includes(target.id)) {
          await new Promise<void>((resolve) => {
            releaseFirstAttempts.current.set(target.id, resolve)
          })
        }

        return {
          targetId: target.id,
          signal: 'opaque',
          durationMs: attemptNumber,
          ok: true,
        }
      } finally {
        inflightByTarget.set(target.id, (inflightByTarget.get(target.id) ?? 1) - 1)
      }
    })

    const runPromise = runAllProbes()

    const firstWave = await waitForValue(() => startedTargets.slice(), (value) => value.length === 3)

    expect(firstWave).toEqual(['a', 'b', 'c'])
    expect(startedTargets).not.toContain('d')
    expect(attemptLog.filter((entry) => entry.target === 'a').map((entry) => entry.attempt)).toEqual([1])
    expect(attemptLog.filter((entry) => entry.target === 'b').map((entry) => entry.attempt)).toEqual([1])
    expect(attemptLog.filter((entry) => entry.target === 'c').map((entry) => entry.attempt)).toEqual([1])
    expect(maxInflightByTarget.get('a')).toBe(1)
    expect(maxInflightByTarget.get('b')).toBe(1)
    expect(maxInflightByTarget.get('c')).toBe(1)

    releaseFirstAttempts.current.get('a')?.()

    const secondWave = await waitForValue(() => startedTargets.slice(), (value) => value.length === 4)

    expect(secondWave).toEqual(['a', 'b', 'c', 'd'])

    releaseFirstAttempts.current.get('b')?.()
    releaseFirstAttempts.current.get('c')?.()

    const results = await runPromise

    expect(attemptLog.filter((entry) => entry.target === 'a').map((entry) => entry.attempt)).toEqual([1, 2, 3, 4, 5])
    expect(attemptLog.filter((entry) => entry.target === 'b').map((entry) => entry.attempt)).toEqual([1, 2, 3, 4, 5])
    expect(attemptLog.filter((entry) => entry.target === 'c').map((entry) => entry.attempt)).toEqual([1, 2, 3, 4, 5])
    expect(attemptLog.filter((entry) => entry.target === 'd').map((entry) => entry.attempt)).toEqual([1, 2, 3, 4, 5])
    expect(maxInflightByTarget.get('a')).toBe(1)
    expect(maxInflightByTarget.get('b')).toBe(1)
    expect(maxInflightByTarget.get('c')).toBe(1)
    expect(maxInflightByTarget.get('d')).toBe(1)
    expect(results.map((result) => result.target.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(classifyProbeResultMock).toHaveBeenCalledTimes(4)
  })
})
