import { useMemo, useState } from 'react'
import type { ProbeResult, ProbeStatus, Target } from '../types'

const STATUS_COPY: Record<ProbeStatus, string> = {
  idle: '未开始',
  running: '检测中',
  reachable: '可达',
  slow: '偏慢',
  timeout: '超时',
  challenging: '困难',
  inconclusive: '结论有限',
}

const statusClassName = (status: ProbeStatus) => {
  switch (status) {
    case 'reachable':
      return 'badge badge--reachable'
    case 'slow':
      return 'badge badge--slow'
    case 'timeout':
    case 'challenging':
      return 'badge badge--warn'
    case 'running':
      return 'badge badge--running'
    default:
      return 'badge badge--muted'
  }
}

const getPerformanceValue = (result?: ProbeResult) => {
  if (!result) return 10
  if (result.status === 'reachable') return 94
  if (result.status === 'slow') return 62
  if (result.status === 'inconclusive') return 36
  return 18
}

const getPerformanceLabel = (result?: ProbeResult) => {
  if (!result) return '等待采样'
  if (result.status === 'reachable') return '表现良好'
  if (result.status === 'slow') return '仍可使用'
  if (result.status === 'inconclusive') return '结论有限'
  return '访问困难'
}

interface ResultRowProps {
  target: Target
  result?: ProbeResult
  isRunning: boolean
  isActive: boolean
  attemptCount: number
}

export function ResultRow({ target, result, isRunning, isActive, attemptCount }: ResultRowProps) {
  const [logoFailed, setLogoFailed] = useState(false)
  const status = isActive ? 'running' : result?.status ?? 'idle'
  const reason = isActive
    ? '当前正在进行探测，等待浏览器返回本轮结果。'
    : result?.reason ?? target.emphasis
  const latency = typeof result?.latencyMs === 'number' ? `${result.latencyMs} ms` : '耗时待定'
  const progressValue = getPerformanceValue(result)
  const fallbackLetters = useMemo(() => target.label.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || 'IP', [target.label])

  return (
    <article className={`result-row${isActive ? ' result-row--active' : ''}`}>
      <div className="result-row__topline">
        <div className="result-row__identity">
          {logoFailed ? (
            <span className="result-row__logo-fallback" aria-label={`${target.label} fallback logo`}>
              {fallbackLetters}
            </span>
          ) : (
            <img
              className="result-row__logo"
              src={target.logoUrl}
              alt={`${target.label} logo`}
              loading="lazy"
              onError={() => setLogoFailed(true)}
            />
          )}
          <div>
            <div className="result-row__title-wrap">
              <h3>{target.label}</h3>
              <span className="result-row__location">{target.location}</span>
            </div>
            <p>{reason}</p>
          </div>
        </div>
        <span className={statusClassName(status)}>{STATUS_COPY[status]}</span>
      </div>

      <div className="result-row__tags">
        {target.tags.map((tag) => (
          <span key={tag} className="chip">
            {tag}
          </span>
        ))}
      </div>

      <div className="result-row__meter">
        <div className="result-row__meter-head">
          <span>性能等级</span>
          <strong>{getPerformanceLabel(result)}</strong>
        </div>
        <div className="progress-track">
          <span className={`progress-bar progress-bar--${status}`} style={{ width: `${progressValue}%` }} />
        </div>
      </div>

      <div className="result-row__meta">
        <span>测试次数：{attemptCount}</span>
        <span>置信度：{result?.confidence ?? '等待中'}</span>
        <span>{latency}</span>
      </div>

      {isRunning && !result && !isActive ? <div className="result-row__waiting">等待轮到当前目标…</div> : null}
    </article>
  )
}
