import type { ProbeRawResult, ProbeResult, Target } from '../../types'

const SLOW_THRESHOLD_MS = 2500

export const classifyProbeResult = (
  target: Target,
  raw: ProbeRawResult,
): ProbeResult => {
  if (raw.signal === 'timeout') {
    return {
      target,
      raw,
      status: target.group === 'challenge' ? 'challenging' : 'timeout',
      confidence: target.group === 'challenge' ? 'medium' : 'high',
      reason:
        target.group === 'challenge'
          ? '长时间没有完成访问，这类目标在当前网络里更容易表现出明显波动。'
          : '在设定时间内没有完成访问。',
    }
  }

  if (raw.ok && (raw.signal === 'load' || raw.signal === 'opaque')) {
    if (raw.durationMs > SLOW_THRESHOLD_MS) {
      return {
        target,
        raw,
        status: 'slow',
        confidence: 'high',
        latencyMs: Math.round(raw.durationMs),
        reason: '目标可达，但耗时偏高。',
      }
    }

    return {
      target,
      raw,
      status: 'reachable',
      confidence: raw.signal === 'opaque' ? 'medium' : 'high',
      latencyMs: Math.round(raw.durationMs),
      reason:
        raw.signal === 'opaque'
          ? '浏览器拿到了可访问响应，但跨域限制使更多细节不可见。'
          : '访问成功，且在预期时间内完成。',
    }
  }

  if (target.group === 'challenge') {
    return {
      target,
      raw,
      status: 'challenging',
      confidence: 'medium',
      reason: '访问失败，且该目标本身更容易在当前链路上出现波动。',
    }
  }

  return {
    target,
    raw,
    status: 'inconclusive',
    confidence: 'low',
    reason: '浏览器侧只观察到失败信号，无法可靠判断具体原因。',
  }
}
