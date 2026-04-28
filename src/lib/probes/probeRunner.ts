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
}

const runTargetAttempts = async (
  target: Target,
  onTargetAttempt?: (target: Target, attemptNumber: number, totalAttempts: number) => void,
) => {
  const attempts: ProbeRawResult[] = []

  for (let attemptNumber = 1; attemptNumber <= ATTEMPTS_PER_TARGET; attemptNumber += 1) {
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
  let completed = 0

  const runNextTarget = async (): Promise<void> => {
    const index = nextIndex
    nextIndex += 1

    if (index >= total) {
      return
    }

    const target = TARGETS[index]
    callbacks.onTargetStart?.(target, index, total)
    const attempts = await runTargetAttempts(target, callbacks.onTargetAttempt)
    const result = classifyProbeResult(target, attempts)

    orderedResults[index] = result
    completed += 1
    callbacks.onTargetFinish?.(result, completed, total)

    await runNextTarget()
  }

  await Promise.all(Array.from({ length: workerCount }, () => runNextTarget()))

  return orderedResults.filter((result): result is ProbeResult => Boolean(result))
}

export { ATTEMPTS_PER_TARGET }
