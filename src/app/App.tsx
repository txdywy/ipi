import { useMemo, useState } from 'react'
import { GROUPS } from '../config/targets'
import { GroupPanel } from '../components/GroupPanel'
import { SummaryCards } from '../components/SummaryCards'
import { runAllProbes } from '../lib/probes/probeRunner'
import type { ProbeResult } from '../types'

type RunState = 'idle' | 'running' | 'done'

const formatTime = (value: Date | null) => {
  if (!value) return '尚未检测'
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(value)
}

export function App() {
  const [runState, setRunState] = useState<RunState>('idle')
  const [results, setResults] = useState<ProbeResult[]>([])
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null)

  const grouped = useMemo(
    () =>
      GROUPS.map((group) => ({
        ...group,
        results: results.filter((result) => result.target.group === group.key),
      })),
    [results],
  )

  const startCheckup = async () => {
    setRunState('running')
    const nextResults = await runAllProbes()
    setResults(nextResults)
    setLastRunAt(new Date())
    setRunState('done')
  }

  const statusText =
    runState === 'idle'
      ? '准备开始'
      : runState === 'running'
        ? '检测中'
        : '检测完成'

  return (
    <div className="shell">
      <div className="shell__glow shell__glow--left" />
      <div className="shell__glow shell__glow--right" />
      <main className="page">
        <section className="hero card">
          <div>
            <p className="eyebrow">IPI NETWORK CHECKUP</p>
            <h1>当前网络访问体检</h1>
            <p className="hero__copy">
              面向当前访问者，快速观察这条网络对中国大陆、国际主流与高干扰目标站点的访问表现。
            </p>
          </div>
          <div className="hero__actions">
            <button className="primary-button" onClick={() => void startCheckup()} disabled={runState === 'running'}>
              {runState === 'running' ? '检测进行中…' : results.length > 0 ? '重新检测' : '开始检测'}
            </button>
            <div className="hero__meta">
              <span>状态：{statusText}</span>
              <span>最近一次：{formatTime(lastRunAt)}</span>
            </div>
          </div>
        </section>

        <SummaryCards results={results} />

        <section className="method card">
          <div>
            <h2>如何理解结果</h2>
            <p>
              这是基于浏览器侧资源访问行为的前端检测，不等于完整网络诊断。对跨域、证书、链路策略等底层原因，页面只会给出谨慎分类而不是绝对判断。
            </p>
          </div>
          <div className="method__legend">
            <span className="pill pill--reachable">可达</span>
            <span className="pill pill--slow">偏慢</span>
            <span className="pill pill--warn">高干扰 / 超时</span>
            <span className="pill pill--muted">结论有限</span>
          </div>
        </section>

        <section className="groups">
          {grouped.map((group) => (
            <GroupPanel key={group.key} title={group.label} description={group.description} results={group.results} isRunning={runState === 'running'} />
          ))}
        </section>
      </main>
    </div>
  )
}
