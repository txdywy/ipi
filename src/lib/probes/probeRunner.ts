import { TARGETS } from '../../config/targets'
import type { ProbeResult, Target } from '../../types'
import { classifyProbeResult } from '../classify/classifier'
import { probeTarget } from './probeAdapters'

interface ProbeRunCallbacks {
  onTargetStart?: (target: Target, index: number, total: number) => void
  onTargetFinish?: (result: ProbeResult, completed: number, total: number) => void
}

export const runAllProbes = async (callbacks: ProbeRunCallbacks = {}): Promise<ProbeResult[]> => {
  const results: ProbeResult[] = []
  const total = TARGETS.length

  for (const [index, target] of TARGETS.entries()) {
    callbacks.onTargetStart?.(target, index, total)
    const raw = await probeTarget(target)
    const result = classifyProbeResult(target, raw)
    results.push(result)
    callbacks.onTargetFinish?.(result, results.length, total)
  }

  return results
}
