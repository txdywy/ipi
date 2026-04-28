import type { ProbeRawResult, ProbeResult, Target } from '../../types'

const SLOW_THRESHOLD_MS = 2500

const isSuccessfulAttempt = (attempt: ProbeRawResult) => attempt.ok && (attempt.signal === 'load' || attempt.signal === 'opaque')

const averageLatency = (attempts: ProbeRawResult[]) => {
  const successfulAttempts = attempts.filter(isSuccessfulAttempt)
  if (successfulAttempts.length === 0) return undefined

  const total = successfulAttempts.reduce((sum, attempt) => sum + attempt.durationMs, 0)
  return Math.round(total / successfulAttempts.length)
}

export const classifyProbeResult = (
  target: Target,
  raw: ProbeRawResult[],
): ProbeResult => {
  const successCount = raw.filter(isSuccessfulAttempt).length
  const attemptCount = raw.length
  const successRate = attemptCount === 0 ? 0 : Math.round((successCount / attemptCount) * 100)
  const latencyMs = averageLatency(raw)

  if (successCount === 0) {
    if (target.group === 'challenge') {
      return {
        target,
        raw,
        status: 'challenging',
        confidence: 'medium',
        successRate,
        attemptCount,
        reason: '连续多次探测都没有成功，这类目标在当前网络里更容易表现出明显波动。',
      }
    }

    const hasTimeout = raw.some((attempt) => attempt.signal === 'timeout')
    return {
      target,
      raw,
      status: hasTimeout ? 'timeout' : 'inconclusive',
      confidence: hasTimeout ? 'high' : 'low',
      successRate,
      attemptCount,
      reason: hasTimeout ? '多次探测都未能在设定时间内完成访问。' : '浏览器侧多次只观察到失败信号，无法可靠判断具体原因。',
    }
  }

  if (successRate >= 60) {
    if (typeof latencyMs === 'number' && latencyMs > SLOW_THRESHOLD_MS) {
      return {
        target,
        raw,
        status: 'slow',
        confidence: successRate === 100 ? 'high' : 'medium',
        latencyMs,
        successRate,
        attemptCount,
        reason: '多数探测可以完成，但平均耗时偏高。',
      }
    }

    return {
      target,
      raw,
      status: 'reachable',
      confidence: successRate >= 80 ? 'high' : 'medium',
      latencyMs,
      successRate,
      attemptCount,
      reason:
        successRate === 100
          ? '多次探测均成功，访问表现稳定。'
          : '多数探测成功，整体访问表现稳定。',
    }
  }

  if (target.group === 'challenge') {
    return {
      target,
      raw,
      status: 'challenging',
      confidence: 'medium',
      latencyMs,
      successRate,
      attemptCount,
      reason: '成功率偏低，且该目标本身更容易在当前链路上出现波动。',
    }
  }

  return {
    target,
    raw,
    status: 'inconclusive',
    confidence: 'low',
    latencyMs,
    successRate,
    attemptCount,
    reason: '有少量成功返回，但整体波动较大，当前浏览器侧结论有限。',
  }
}
