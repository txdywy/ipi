export type GroupKey = 'mainland' | 'global' | 'challenge'

export type ProbeType = 'image' | 'script' | 'fetch'

export type ProbeStatus = 'idle' | 'running' | 'reachable' | 'slow' | 'timeout' | 'challenging' | 'inconclusive'

export type ProbeSignal = 'load' | 'error' | 'opaque' | 'timeout'

export type Confidence = 'high' | 'medium' | 'low'

export type IpAddressKind = 'ipv4' | 'ipv6'

export type VisitorProfileStatus = 'idle' | 'loading' | 'ready' | 'partial' | 'unavailable'

export interface VisitorIpRecord {
  family: IpAddressKind
  address?: string
  status: 'available' | 'unavailable' | 'inconclusive'
  source: string
  countryCode?: string
  countryFlag?: string
  country?: string
  region?: string
  city?: string
  timezone?: string
  isp?: string
  org?: string
  asn?: string
  asnOrg?: string
  carrier?: string
  networkType?: string
  confidence: Confidence
  notes?: string
}

export interface VisitorProfile {
  status: VisitorProfileStatus
  ipv4?: VisitorIpRecord
  ipv6?: VisitorIpRecord
  hasIpv6Reachability: boolean | 'unknown'
  fetchedAt?: string
  dataSources: string[]
  summary?: string
}

export interface IpAddressProvider {
  key: string
  label: string
  family: IpAddressKind
  endpoint: string
  responseType: 'json' | 'text'
  corsMode?: RequestMode
  parser: 'ipify' | 'plain-text'
}

export interface IpIntelProvider {
  key: string
  label: string
  endpoint: string
  corsMode?: RequestMode
  parser: 'ipapi-is' | 'ipwhois'
  supportsFamilies: IpAddressKind[]
}

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
