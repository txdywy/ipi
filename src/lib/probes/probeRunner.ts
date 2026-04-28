import { TARGETS } from '../../config/targets'
import type { ProbeResult } from '../../types'
import { classifyProbeResult } from '../classify/classifier'
import { probeTarget } from './probeAdapters'

export const runAllProbes = async (): Promise<ProbeResult[]> => {
  const results: ProbeResult[] = []

  for (const target of TARGETS) {
    const raw = await probeTarget(target)
    results.push(classifyProbeResult(target, raw))
  }

  return results
}
