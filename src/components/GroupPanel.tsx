import type { ProbeResult, Target } from '../types'
import { ResultRow } from './ResultRow'

interface GroupPanelItem {
  target: Target
  result?: ProbeResult
}

interface GroupPanelProps {
  title: string
  eyebrow: string
  headline: string
  description: string
  items: GroupPanelItem[]
  isRunning: boolean
  activeTargetIds: string[]
  activeAttemptsByTarget: Record<string, number>
}

export function GroupPanel({
  title,
  eyebrow,
  headline,
  description,
  items,
  isRunning,
  activeTargetIds,
  activeAttemptsByTarget,
}: GroupPanelProps) {
  const resolvedCount = items.filter((item) => item.result).length
  const completion = items.length === 0 ? 0 : Math.round((resolvedCount / items.length) * 100)

  return (
    <section className="group-panel card">
      <header className="group-panel__header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <strong>{headline}</strong>
        </div>
        <div className="group-panel__summary">
          <p>{description}</p>
          <div className="group-panel__progress">
            <span>{resolvedCount}/{items.length} 已返回</span>
            <span>{completion}%</span>
          </div>
          <div className="progress-track progress-track--thin">
            <span className="progress-bar progress-bar--group" style={{ width: `${completion}%` }} />
          </div>
        </div>
      </header>

      <div className="group-panel__list">
        {items.map((item) => (
          <ResultRow
            key={item.target.id}
            target={item.target}
            result={item.result}
            isRunning={isRunning}
            isActive={activeTargetIds.includes(item.target.id)}
            activeAttempt={activeAttemptsByTarget[item.target.id] ?? 0}
          />
        ))}
      </div>
    </section>
  )
}
