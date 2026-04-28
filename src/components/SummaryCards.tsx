import type { ProbeResult, ProbeStatus } from '../types'

const STATUSES: Array<{ key: ProbeStatus; label: string }> = [
  { key: 'reachable', label: '可达' },
  { key: 'slow', label: '偏慢' },
  { key: 'likely_interfered', label: '高干扰' },
  { key: 'inconclusive', label: '结论有限' },
]

export function SummaryCards({ results }: { results: ProbeResult[] }) {
  const total = results.length

  return (
    <section className="summary-grid">
      <article className="card summary-card summary-card--highlight">
        <span className="summary-card__label">总览</span>
        <strong>{total > 0 ? `${total} 个目标已检测` : '等待开始检测'}</strong>
        <p>{total > 0 ? '这是一份当前网络的即时快照。' : '点击开始检测后生成结果快照。'}</p>
      </article>
      {STATUSES.map((status) => {
        const count = results.filter((result) => result.status === status.key).length
        return (
          <article key={status.key} className="card summary-card">
            <span className="summary-card__label">{status.label}</span>
            <strong>{count}</strong>
            <p>{total > 0 ? `占比 ${Math.round((count / total) * 100)}%` : '尚无数据'}</p>
          </article>
        )
      })}
    </section>
  )
}
