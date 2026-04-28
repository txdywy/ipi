import { TARGETS } from '../config/targets'
import type { ProbeResult, ProbeStatus } from '../types'

const STATUSES: Array<{ key: ProbeStatus; label: string }> = [
  { key: 'reachable', label: '顺畅' },
  { key: 'slow', label: '偏慢' },
  { key: 'challenging', label: '困难' },
  { key: 'inconclusive', label: '有限' },
]

const averageLatency = (results: ProbeResult[]) => {
  const values = results.flatMap((result) => (typeof result.latencyMs === 'number' ? [result.latencyMs] : []))
  if (values.length === 0) return '--'
  return `${Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)} ms`
}

const averageSuccessRate = (results: ProbeResult[]) => {
  if (results.length === 0) return '--'
  return `${Math.round(results.reduce((sum, result) => sum + result.successRate, 0) / results.length)}%`
}

interface SummaryCardsProps {
  results: ProbeResult[]
  completedCount: number
  totalCount: number
  runState: 'idle' | 'running' | 'done'
}

export function SummaryCards({ results, completedCount, totalCount, runState }: SummaryCardsProps) {
  const completion = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)
  const reachableCount = results.filter((result) => result.status === 'reachable').length
  const coverage = `${completedCount}/${totalCount}`

  return (
    <section className="summary-grid">
      <article className="summary-card summary-card--hero card">
        <span className="summary-card__label">本轮快照</span>
        <strong>{runState === 'idle' ? '等待首轮自动检测' : `${coverage} 目标已采样`}</strong>
        <p>
          {runState === 'running'
            ? `正在逐项更新结果，当前完成度 ${completion}%。`
            : runState === 'done'
              ? '这是当前访问者网络环境的一次即时体检。'
              : '页面载入后会自动开始第一轮检测。'}
        </p>
        <div className="progress-track progress-track--summary">
          <span className="progress-bar progress-bar--group" style={{ width: `${completion}%` }} />
        </div>
      </article>

      <article className="summary-card card">
        <span className="summary-card__label">顺畅通过</span>
        <strong>{reachableCount}</strong>
        <p>{results.length > 0 ? `占全部结果 ${Math.round((reachableCount / results.length) * 100)}%` : '等待结果'}</p>
      </article>

      <article className="summary-card card">
        <span className="summary-card__label">平均成功率</span>
        <strong>{averageSuccessRate(results)}</strong>
        <p>基于每个目标 5 次探测的成功占比汇总。</p>
      </article>

      <article className="summary-card card">
        <span className="summary-card__label">平均耗时</span>
        <strong>{averageLatency(results)}</strong>
        <p>仅统计浏览器可以观测到成功返回的平均耗时。</p>
      </article>

      {STATUSES.map((status) => {
        const count = results.filter((result) => result.status === status.key).length
        return (
          <article key={status.key} className="summary-card card">
            <span className="summary-card__label">{status.label}</span>
            <strong>{count}</strong>
            <p>{results.length > 0 ? `已返回结果中的 ${Math.round((count / results.length) * 100)}%` : '等待结果'}</p>
          </article>
        )
      })}

      <article className="summary-card card">
        <span className="summary-card__label">分组数量</span>
        <strong>{new Set(TARGETS.map((target) => target.group)).size}</strong>
        <p>当前覆盖中国大陆、国际主流与困难目标三组。</p>
      </article>
    </section>
  )
}
