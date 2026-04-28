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
      status: target.group === 'interference' ? 'likely_interfered' : 'timeout',
      confidence: target.group === 'interference' ? 'medium' : 'high',
      reason:
        target.group === 'interference'
          ? '长时间没有完成访问，符合高干扰目标常见异常表现。'
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
          ? '浏览器拿到了可访问响应，但跨域限制使细节不可见。'
          : '访问成功，且在预期时间内完成。',
    }
  }

  if (target.group === 'interference') {
    return {
      target,
      raw,
      status: 'likely_interfered',
      confidence: 'medium',
      reason: '访问失败，且该目标属于更容易受干扰的类别。',
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
