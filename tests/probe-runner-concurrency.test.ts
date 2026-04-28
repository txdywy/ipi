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
  targets: Array.from({ length: 12 }, (_, index) => {
    const id = String.fromCharCode(97 + index)
    return {
      id,
      label: id.toUpperCase(),
      group: 'global',
      probeType: 'fetch',
      url: `https://${id}.example.com`,
      logoUrl: `/${id}.svg`,
      timeoutMs: 1000,
      location: id.toUpperCase(),
      tags: [],
      emphasis: id.toUpperCase(),
    }
  }) as Target[],
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
  it('caps concurrent targets at ten and keeps attempts sequential within each target', async () => {
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
        if (attemptNumber === 1 && ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].includes(target.id)) {
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

    const firstWave = await waitForValue(() => startedTargets.slice(), (value) => value.length === 10)

    expect(firstWave).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'])
    expect(startedTargets).not.toContain('k')
    for (const targetId of firstWave) {
      expect(attemptLog.filter((entry) => entry.target === targetId).map((entry) => entry.attempt)).toEqual([1])
      expect(maxInflightByTarget.get(targetId)).toBe(1)
    }

    releaseFirstAttempts.current.get('a')?.()

    const secondWave = await waitForValue(() => startedTargets.slice(), (value) => value.length === 11)

    expect(secondWave).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'])

    for (const targetId of ['b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']) {
      releaseFirstAttempts.current.get(targetId)?.()
    }

    const results = await runPromise

    for (const target of targets) {
      expect(attemptLog.filter((entry) => entry.target === target.id).map((entry) => entry.attempt)).toEqual([1, 2, 3])
      expect(maxInflightByTarget.get(target.id)).toBe(1)
    }
    expect(results.map((result) => result.target.id)).toEqual(targets.map((target) => target.id))
    expect(classifyProbeResultMock).toHaveBeenCalledTimes(12)
  })

  it('does not classify or publish a target after the run is aborted during an attempt', async () => {
    attemptLog.length = 0
    startedTargets.length = 0
    attemptsByTarget.clear()
    inflightByTarget.clear()
    maxInflightByTarget.clear()
    releaseFirstAttempts.current.clear()
    probeTargetMock.mockReset()
    classifyProbeResultMock.mockClear()

    const controller = new AbortController()
    let releaseAttempt: (() => void) | undefined
    const onTargetFinish = vi.fn()

    probeTargetMock.mockImplementation(async (target) => {
      const attemptNumber = (attemptsByTarget.get(target.id) ?? 0) + 1
      attemptsByTarget.set(target.id, attemptNumber)

      if (target.id === 'a' && attemptNumber === 3) {
        await new Promise<void>((resolve) => {
          releaseAttempt = resolve
        })
      }

      return {
        targetId: target.id,
        signal: 'opaque',
        durationMs: attemptNumber,
        ok: true,
      }
    })

    const runPromise = runAllProbes({
      signal: controller.signal,
      onTargetFinish,
    })

    await waitForValue(() => attemptsByTarget.get('a') ?? 0, (value) => value === 3)

    controller.abort()
    releaseAttempt?.()

    const results = await runPromise

    expect(results.find((result) => result.target.id === 'a')).toBeUndefined()
    expect(onTargetFinish).not.toHaveBeenCalledWith(expect.objectContaining({ target: targets[0] }), expect.any(Number), expect.any(Number))
    expect(classifyProbeResultMock).not.toHaveBeenCalledWith(targets[0], expect.any(Array))
  })
})
