import { TARGETS } from '../../config/targets'
import type { ProbeRawResult, ProbeResult, Target } from '../../types'
import { classifyProbeResult } from '../classify/classifier'
import { probeTarget } from './probeAdapters'

const ATTEMPTS_PER_TARGET = 5
const TARGET_CONCURRENCY = 3

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
  let nextIndex = 0
  let completedCount = 0

  const runNextTarget = async (): Promise<void> => {
    if (callbacks.signal?.aborted) return

    const index = nextIndex
    nextIndex += 1

    if (index >= total) {
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

      await runNextTarget()
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      throw error
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => runNextTarget()))

  return orderedResults.filter((result): result is ProbeResult => Boolean(result))
}

export { ATTEMPTS_PER_TARGET }
