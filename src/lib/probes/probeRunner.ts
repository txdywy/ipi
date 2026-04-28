import { TARGETS } from '../../config/targets'
import type { ProbeRawResult, ProbeResult, Target } from '../../types'
import { classifyProbeResult } from '../classify/classifier'
import { probeTarget } from './probeAdapters'

const ATTEMPTS_PER_TARGET = 5

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
  const results: ProbeResult[] = []
  const total = TARGETS.length

  for (const [index, target] of TARGETS.entries()) {
    callbacks.onTargetStart?.(target, index, total)
    const attempts = await runTargetAttempts(target, callbacks.onTargetAttempt)
    const result = classifyProbeResult(target, attempts)
    results.push(result)
    callbacks.onTargetFinish?.(result, results.length, total)
  }

  return results
}

export { ATTEMPTS_PER_TARGET }
