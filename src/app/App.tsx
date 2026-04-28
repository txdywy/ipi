import { useEffect, useMemo, useState } from 'react'
import { GroupPanel } from '../components/GroupPanel'
import { SummaryCards } from '../components/SummaryCards'
import { VisitorProfile } from '../components/VisitorProfile'
import { GROUPS, TARGETS } from '../config/targets'
import { buildVisitorProfile } from '../lib/ip/buildVisitorProfile'
import { ATTEMPTS_PER_TARGET, runAllProbes } from '../lib/probes/probeRunner'
import type { ProbeResult, VisitorProfile as VisitorProfileData } from '../types'

type RunState = 'idle' | 'running' | 'done'

let hasAutoStarted = false

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
  const [activeTargetIds, setActiveTargetIds] = useState<string[]>([])
  const [activeAttemptTargetId, setActiveAttemptTargetId] = useState<string | null>(null)
  const [activeAttempt, setActiveAttempt] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [runCount, setRunCount] = useState(0)
  const [visitorProfile, setVisitorProfile] = useState<VisitorProfileData>({
    status: 'loading',
    hasIpv6Reachability: 'unknown',
    dataSources: [],
    summary: '正在尝试识别当前访问者的公网网络信息。',
  })

  const totalCount = TARGETS.length

  const grouped = useMemo(
    () =>
      GROUPS.map((group) => ({
        ...group,
        items: TARGETS.filter((target) => target.group === group.key).map((target) => ({
          target,
          result: results.find((result) => result.target.id === target.id),
        })),
      })),
    [results],
  )

  const activeAttemptTarget =
    TARGETS.find((target) => target.id === activeAttemptTargetId && activeTargetIds.includes(target.id)) ?? null

  const startCheckup = async () => {
    if (runState === 'running') return

    setRunState('running')
    setResults([])
    setCompletedCount(0)
    setActiveTargetIds([])
    setActiveAttemptTargetId(null)
    setActiveAttempt(0)
    setRunCount((value) => value + 1)

    const nextResults = await runAllProbes({
      onTargetStart: (target) => {
        setActiveTargetIds((current) => (current.includes(target.id) ? current : [...current, target.id]))
        setActiveAttemptTargetId(target.id)
        setActiveAttempt(0)
      },
      onTargetAttempt: (target, attemptNumber) => {
        setActiveAttemptTargetId(target.id)
        setActiveAttempt(attemptNumber)
      },
      onTargetFinish: (result, completed) => {
        setResults((current) => [...current, result])
        setCompletedCount(completed)
        setActiveTargetIds((current) => current.filter((targetId) => targetId !== result.target.id))
      },
    })

    setResults(nextResults)
    setCompletedCount(nextResults.length)
    setLastRunAt(new Date())
    setActiveTargetIds([])
    setActiveAttemptTargetId(null)
    setActiveAttempt(0)
    setRunState('done')
  }

  useEffect(() => {
    let active = true

    const loadVisitorProfile = async () => {
      const profile = await buildVisitorProfile()
      if (active) {
        setVisitorProfile(profile)
      }
    }

    void loadVisitorProfile()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (hasAutoStarted) return
    hasAutoStarted = true
    void startCheckup()
  }, [])

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
      <div className="shell__grid" />
      <main className="page">
        <section className="hero card">
          <div className="hero__intro">
            <p className="eyebrow">IPI NETWORK CHECKUP</p>
            <h1>当前网络访问体检</h1>
            <p className="hero__copy">
              页面打开即自动完成第一轮检测，重点观察当前访问者对中国大陆、国际主流与困难目标的网页资源访问表现。
            </p>
            <div className="hero__chips">
              <span className="hero-chip">纯前端采样</span>
              <span className="hero-chip">每目标 5 次探测</span>
              <span className="hero-chip">PC / Mobile 自适应</span>
            </div>
          </div>

          <div className="hero__panel">
            <div className="hero__status-card">
              <span className="hero__status-label">当前状态</span>
              <strong>{statusText}</strong>
              <p>
                {runState === 'running'
                  ? activeAttemptTarget
                    ? `正在并发检测 ${activeTargetIds.length} 个目标，当前显示 ${activeAttemptTarget.label} 的第 ${activeAttempt || 1}/${ATTEMPTS_PER_TARGET} 次探测，汇总结果会按目标逐项落入页面。`
                    : activeTargetIds.length > 0
                      ? `正在并发检测 ${activeTargetIds.length} 个目标，汇总结果会按目标逐项落入页面。`
                      : '正在准备第一项目标的多次探测。'
                  : '结果会保留为当前网络环境的一次即时快照。'}
              </p>
            </div>

            <div className="hero__stat-grid">
              <div>
                <span>目标数量</span>
                <strong>{totalCount}</strong>
              </div>
              <div>
                <span>检测轮次</span>
                <strong>{runCount}</strong>
              </div>
              <div>
                <span>最近一次</span>
                <strong>{formatTime(lastRunAt)}</strong>
              </div>
              <div>
                <span>当前进度</span>
                <strong>{completedCount}/{totalCount}</strong>
              </div>
            </div>

            <div className="hero__progress-block">
              <div className="hero__progress-meta">
                <span>全局测试进度</span>
                <strong>{Math.round((completedCount / totalCount) * 100)}%</strong>
              </div>
              <div className="progress-track progress-track--hero">
                <span className="progress-bar progress-bar--group" style={{ width: `${Math.round((completedCount / totalCount) * 100)}%` }} />
              </div>
            </div>

            <button className="primary-button" onClick={() => void startCheckup()} disabled={runState === 'running'}>
              {runState === 'running' ? '本轮检测进行中…' : '重新测试'}
            </button>
          </div>
        </section>

        <VisitorProfile profile={visitorProfile} />

        <SummaryCards
          results={results}
          completedCount={completedCount}
          totalCount={totalCount}
          runState={runState}
          visitorProfile={visitorProfile}
        />

        <section className="method card">
          <div>
            <p className="eyebrow">HOW TO READ</p>
            <h2>如何理解这些颜色与结论</h2>
            <p>
              这是基于浏览器侧资源访问行为的前端检测，不等于完整网络诊断。页面重点呈现“能否顺利拿到响应、是否偏慢、是否出现明显困难”，而不会把所有失败都解释成同一种底层原因。
            </p>
          </div>
          <div className="method__legend">
            <span className="pill pill--reachable">顺畅</span>
            <span className="pill pill--slow">偏慢</span>
            <span className="pill pill--warn">困难 / 超时</span>
            <span className="pill pill--muted">结论有限</span>
          </div>
        </section>

        <section className="groups">
          {grouped.map((group) => (
            <GroupPanel
              key={group.key}
              title={group.label}
              eyebrow={group.eyebrow}
              headline={group.headline}
              description={group.description}
              items={group.items}
              isRunning={runState === 'running'}
              activeTargetIds={activeTargetIds}
            />
          ))}
        </section>
      </main>
    </div>
  )
}
