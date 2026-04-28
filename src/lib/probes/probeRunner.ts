import { TARGETS } from '../../config/targets'
import type { ProbeRawResult, ProbeResult, Target } from '../../types'
import { classifyProbeResult } from '../classify/classifier'
import { probeTarget } from './probeAdapters'

const ATTEMPTS_PER_TARGET = 3
const TARGET_CONCURRENCY = 10
const ORIGIN_CONCURRENCY = 2

interface ProbeRunCallbacks {
  onTargetStart?: (target: Target, index: number, total: number) => void
  onTargetAttempt?: (target: Target, attemptNumber: number, totalAttempts: number) => void
  onTargetFinish?: (result: ProbeResult, completed: number, total: number) => void
  signal?: AbortSignal
}

const runTargetAttempts = async (
  target: Target,
  onTargetAttempt?: (target: Target, attemptNumber: number, totalAttempts: number) => void,
  signal?: AbortSignal,
) => {
  const attempts: ProbeRawResult[] = []

  for (let attemptNumber = 1; attemptNumber <= ATTEMPTS_PER_TARGET; attemptNumber += 1) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    onTargetAttempt?.(target, attemptNumber, ATTEMPTS_PER_TARGET)
    attempts.push(await probeTarget(target))
  }

  return attempts
}

export const runAllProbes = async (callbacks: ProbeRunCallbacks = {}): Promise<ProbeResult[]> => {
  const total = TARGETS.length
  const orderedResults: Array<ProbeResult | undefined> = new Array(total)
  const workerCount = Math.min(TARGET_CONCURRENCY, total)
  const queuedIndexes = TARGETS.map((_, index) => index)
  const activeOrigins = new Map<string, number>()
  let completedCount = 0

  const getOrigin = (target: Target) => {
    try {
      return new URL(target.url).origin
    } catch {
      return target.url
    }
  }

  const acquireNextIndex = () => {
    for (let queueIndex = 0; queueIndex < queuedIndexes.length; queueIndex += 1) {
      const targetIndex = queuedIndexes[queueIndex]
      const origin = getOrigin(TARGETS[targetIndex])
      if ((activeOrigins.get(origin) ?? 0) < ORIGIN_CONCURRENCY) {
        queuedIndexes.splice(queueIndex, 1)
        activeOrigins.set(origin, (activeOrigins.get(origin) ?? 0) + 1)
        return targetIndex
      }
    }

    return undefined
  }

  const releaseOrigin = (target: Target) => {
    const origin = getOrigin(target)
    const nextCount = (activeOrigins.get(origin) ?? 1) - 1
    if (nextCount <= 0) {
      activeOrigins.delete(origin)
      return
    }
    activeOrigins.set(origin, nextCount)
  }

  const runNextTarget = async (): Promise<void> => {
    if (callbacks.signal?.aborted) return

    const index = acquireNextIndex()

    if (typeof index !== 'number') {
      return
    }

    const target = TARGETS[index]
    callbacks.onTargetStart?.(target, index, total)

    try {
      const attempts = await runTargetAttempts(target, callbacks.onTargetAttempt, callbacks.signal)
      const result = classifyProbeResult(target, attempts)

      orderedResults[index] = result
      completedCount += 1
      callbacks.onTargetFinish?.(result, completedCount, total)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      throw error
    } finally {
      releaseOrigin(target)
    }

    await runNextTarget()
  }

  await Promise.all(Array.from({ length: workerCount }, () => runNextTarget()))

  return orderedResults.filter((result): result is ProbeResult => Boolean(result))
}

export { ATTEMPTS_PER_TARGET }
