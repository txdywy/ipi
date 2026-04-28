import type { ProbeResult } from '../types'
import { ResultRow } from './ResultRow'

interface GroupPanelProps {
  title: string
  description: string
  results: ProbeResult[]
  isRunning: boolean
}

export function GroupPanel({ title, description, results, isRunning }: GroupPanelProps) {
  return (
    <section className="card group-panel">
      <header className="group-panel__header">
        <div>
          <p className="eyebrow">TARGET GROUP</p>
          <h2>{title}</h2>
        </div>
        <p>{description}</p>
      </header>
      <div className="group-panel__list">
        {results.length > 0 ? (
          results.map((result) => <ResultRow key={result.target.id} result={result} />)
        ) : (
          <div className="result-row result-row--empty">
            <span>{isRunning ? '检测进行中，结果即将出现…' : '尚未开始检测'}</span>
          </div>
        )}
      </div>
    </section>
  )
}
