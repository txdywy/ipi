export type GroupKey = 'mainland' | 'global' | 'challenge'

export type ProbeType = 'image' | 'script' | 'fetch'

export type ProbeStatus = 'idle' | 'running' | 'reachable' | 'slow' | 'timeout' | 'challenging' | 'inconclusive'

export type ProbeSignal = 'load' | 'error' | 'opaque' | 'timeout'

export type Confidence = 'high' | 'medium' | 'low'

export interface Target {
  id: string
  label: string
  group: GroupKey
  probeType: ProbeType
  url: string
  logoUrl: string
  timeoutMs: number
  expectedSignal?: 'load' | 'opaque'
  notes?: string
  location: string
  tags: string[]
  emphasis: string
}

export interface ProbeRawResult {
  targetId: string
  signal: ProbeSignal
  durationMs: number
  ok: boolean
  detail?: string
}

export interface ProbeResult {
  target: Target
  status: ProbeStatus
  confidence: Confidence
  latencyMs?: number
  successRate: number
  attemptCount: number
  reason: string
  raw: ProbeRawResult[]
}

export interface GroupMeta {
  key: GroupKey
  label: string
  description: string
  eyebrow: string
  headline: string
}
