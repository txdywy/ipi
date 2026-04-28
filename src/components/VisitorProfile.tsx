import type { VisitorIpRecord, VisitorProfile } from '../types'

interface VisitorProfileProps {
  profile: VisitorProfile
}

const formatRecordHeadline = (record?: VisitorIpRecord) => {
  if (!record) return '未取得结果'
  if (record.status === 'available') return record.address ?? '已识别地址'
  if (record.status === 'inconclusive') return '结果有限'
  return '未观测到结果'
}

const formatRecordMeta = (record?: VisitorIpRecord) => {
  if (!record) return '等待查询'

  const parts = [record.country, record.region, record.city, record.isp ?? record.org].filter(Boolean)
  if (parts.length > 0) return parts.join(' · ')
  return record.notes ?? '公开来源暂未补充更多信息。'
}

const formatStatusLabel = (status: VisitorProfile['status']) => {
  if (status === 'loading') return '识别中'
  if (status === 'ready') return '信息完整'
  if (status === 'partial') return '部分可见'
  return '结果有限'
}

const formatSourceText = (profile: VisitorProfile) => {
  if (profile.dataSources.length === 0) return '尚未返回数据源信息。'
  return `数据来源：${profile.dataSources.join(' / ')}`
}

const formatSourceCount = (profile: VisitorProfile) => `${profile.dataSources.length} 个`

const formatProfileCoverage = (profile: VisitorProfile) => {
  if (profile.status === 'ready') return '双栈已补全'
  if (profile.status === 'partial') return '单栈为主'
  if (profile.status === 'loading') return '查询中'
  return '公开结果有限'
}

const ipv6StatusText = (value: VisitorProfile['hasIpv6Reachability']) => {
  if (value === true) return '已观测到 IPv6'
  if (value === false) return '未观测到 IPv6'
  return 'IPv6 结果有限'
}

const formatConfidence = (record?: VisitorIpRecord) => {
  if (!record) return '待补充'
  if (record.confidence === 'high') return '高'
  if (record.confidence === 'medium') return '中'
  return '低'
}

const formatNetworkDescriptor = (record?: VisitorIpRecord) => {
  if (!record) return '公开来源未提供网络画像。'

  const parts = [record.networkType, record.org, record.asn ? `AS${record.asn}` : undefined].filter(Boolean)
  if (parts.length > 0) return parts.join(' · ')
  return record.notes ?? '公开来源未提供网络画像。'
}

export function VisitorProfile({ profile }: VisitorProfileProps) {
  return (
    <section className="visitor-profile card">
      <div className="visitor-profile__intro">
        <p className="eyebrow">VISITOR PROFILE</p>
        <h2>当前访问者公网身份</h2>
        <p>
          这里展示浏览器侧可直接获取的公网 IP 与基础归属信息。结果来自公开数据源，可能受 IPv6 可用性、接口返回字段与地区策略影响。
        </p>
      </div>

      <div className="visitor-profile__summary">
        <div className="visitor-profile__summary-card visitor-profile__summary-card--hero">
          <span className="summary-card__label">当前状态</span>
          <strong>{formatStatusLabel(profile.status)}</strong>
          <p>{profile.summary ?? '正在尝试识别当前访问者的公网网络信息。'}</p>
        </div>
        <div className="visitor-profile__summary-card">
          <span className="summary-card__label">IPv6 观测</span>
          <strong>{ipv6StatusText(profile.hasIpv6Reachability)}</strong>
          <p>{formatSourceText(profile)}</p>
        </div>
      </div>

      <div className="visitor-profile__stats" aria-label="visitor profile quick stats">
        <article className="visitor-profile__stat-tile">
          <span className="summary-card__label">画像覆盖</span>
          <strong>{formatProfileCoverage(profile)}</strong>
        </article>
        <article className="visitor-profile__stat-tile">
          <span className="summary-card__label">IPv4 状态</span>
          <strong>{formatRecordHeadline(profile.ipv4)}</strong>
        </article>
        <article className="visitor-profile__stat-tile">
          <span className="summary-card__label">IPv6 状态</span>
          <strong>{formatRecordHeadline(profile.ipv6)}</strong>
        </article>
        <article className="visitor-profile__stat-tile">
          <span className="summary-card__label">数据源数量</span>
          <strong>{formatSourceCount(profile)}</strong>
        </article>
      </div>

      <div className="visitor-profile__grid">
        <article className="visitor-ip-card">
          <span className="summary-card__label">IPv4</span>
          <strong>{formatRecordHeadline(profile.ipv4)}</strong>
          <p>{formatRecordMeta(profile.ipv4)}</p>
          <dl className="visitor-ip-card__meta">
            <div>
              <dt>来源</dt>
              <dd>{profile.ipv4?.source ?? '等待查询'}</dd>
            </div>
            <div>
              <dt>可信度</dt>
              <dd>{formatConfidence(profile.ipv4)}</dd>
            </div>
            <div>
              <dt>网络画像</dt>
              <dd>{formatNetworkDescriptor(profile.ipv4)}</dd>
            </div>
          </dl>
        </article>
        <article className="visitor-ip-card">
          <span className="summary-card__label">IPv6</span>
          <strong>{formatRecordHeadline(profile.ipv6)}</strong>
          <p>{formatRecordMeta(profile.ipv6)}</p>
          <dl className="visitor-ip-card__meta">
            <div>
              <dt>来源</dt>
              <dd>{profile.ipv6?.source ?? '等待查询'}</dd>
            </div>
            <div>
              <dt>可信度</dt>
              <dd>{formatConfidence(profile.ipv6)}</dd>
            </div>
            <div>
              <dt>网络画像</dt>
              <dd>{formatNetworkDescriptor(profile.ipv6)}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  )
}
