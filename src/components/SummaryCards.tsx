import { GROUPS } from '../config/targets'
import { ATTEMPTS_PER_TARGET } from '../lib/probes/probeRunner'
import type { ProbeResult, ProbeStatus, VisitorProfile } from '../types'

const STATUSES: Array<{ key: ProbeStatus; label: string }> = [
  { key: 'reachable', label: '顺畅' },
  { key: 'slow', label: '偏慢' },
  { key: 'challenging', label: '困难' },
  { key: 'inconclusive', label: '有限' },
]

const averageLatency = (results: ProbeResult[]) => {
  const values = results
    .flatMap((result) => (typeof result.latencyMs === 'number' ? [result.latencyMs] : []))
    .sort((a, b) => a - b)

  if (values.length === 0) return '--'

  // Trimmed Mean: Remove top and bottom 10% to reduce outlier impact
  const trimCount = Math.floor(values.length * 0.1)
  const trimmedValues = values.slice(trimCount, values.length - trimCount)
  const targetValues = trimmedValues.length > 0 ? trimmedValues : values

  const sum = targetValues.reduce((s, v) => s + v, 0)
  return `${Math.round(sum / targetValues.length)} ms`
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
  visitorProfile: VisitorProfile
}

export function SummaryCards({ results, completedCount, totalCount, runState, visitorProfile }: SummaryCardsProps) {
  const completion = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)
  const reachableCount = results.filter((result) => result.status === 'reachable').length
  const coverage = `${completedCount}/${totalCount}`
  const groupLabels = GROUPS.map(g => g.label).join('、')

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
        <p>基于每个目标 {ATTEMPTS_PER_TARGET} 次探测的成功占比汇总。</p>
      </article>

      <article className="summary-card card">
        <span className="summary-card__label">平均耗时</span>
        <strong>{averageLatency(results)}</strong>
        <p>剔除极端离群值后的平均成功响应耗时。</p>
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
        <span className="summary-card__label">访问者画像</span>
        <strong>
          {visitorProfile.status === 'ready'
            ? '已识别'
            : visitorProfile.status === 'partial'
              ? '部分识别'
              : visitorProfile.status === 'loading'
                ? '识别中'
                : '结果有限'}
        </strong>
        <p>{visitorProfile.summary ?? '正在尝试补充当前访问者的公网网络信息。'}</p>
      </article>

      <article className="summary-card card">
        <span className="summary-card__label">分组数量</span>
        <strong>{GROUPS.length}</strong>
        <p>当前覆盖{groupLabels}等 {GROUPS.length} 个观测维度。</p>
      </article>
    </section>
  )
}
