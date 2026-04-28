import type { ProbeResult, ProbeStatus } from '../types'

const STATUS_COPY: Record<ProbeStatus, string> = {
  idle: '未开始',
  running: '检测中',
  reachable: '可达',
  slow: '偏慢',
  timeout: '超时',
  likely_interfered: '高干扰',
  inconclusive: '结论有限',
}

const statusClassName = (status: ProbeStatus) => {
  switch (status) {
    case 'reachable':
      return 'badge badge--reachable'
    case 'slow':
      return 'badge badge--slow'
    case 'timeout':
    case 'likely_interfered':
      return 'badge badge--warn'
    default:
      return 'badge badge--muted'
  }
}

export function ResultRow({ result }: { result: ProbeResult }) {
  return (
    <article className="result-row">
      <div className="result-row__main">
        <div>
          <h3>{result.target.label}</h3>
          <p>{result.reason}</p>
        </div>
        <span className={statusClassName(result.status)}>{STATUS_COPY[result.status]}</span>
      </div>
      <div className="result-row__meta">
        <span>置信度：{result.confidence}</span>
        <span>{typeof result.latencyMs === 'number' ? `${result.latencyMs} ms` : '耗时不可见'}</span>
      </div>
    </article>
  )
}
