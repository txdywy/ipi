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

  const parts = [record.region, record.city, record.networkType].filter(Boolean)
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

const formatSourceChip = (profile: VisitorProfile) => `${profile.dataSources.length} 个来源`

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

const formatCountryText = (record?: VisitorIpRecord) => {
  if (!record) return '等待查询'

  const parts = [record.countryFlag, record.country].filter(Boolean)
  if (parts.length > 0) return parts.join(' ')
  return '待补充'
}

const formatDetailValue = (value?: string, fallback = '待补充') => value ?? fallback

interface VisitorIpCardProps {
  label: 'IPv4' | 'IPv6'
  record?: VisitorIpRecord
}

function VisitorIpCard({ label, record }: VisitorIpCardProps) {
  return (
    <article className="visitor-ip-card">
      <div className="visitor-ip-card__header">
        <div>
          <span className="summary-card__label">{label}</span>
          <strong>{formatRecordHeadline(record)}</strong>
        </div>
        <div className="visitor-ip-card__confidence">
          <span className="summary-card__label">可信度</span>
          <strong>{formatConfidence(record)}</strong>
        </div>
      </div>

      <p className="visitor-ip-card__country">{formatCountryText(record)}</p>
      <p>{formatRecordMeta(record)}</p>

      <dl className="visitor-ip-card__facts">
        <div>
          <dt>ASN</dt>
          <dd>{formatDetailValue(record?.asn)}</dd>
        </div>
        <div>
          <dt>组织</dt>
          <dd>{formatDetailValue(record?.asnOrg ?? record?.org)}</dd>
        </div>
        <div>
          <dt>ISP</dt>
          <dd>{formatDetailValue(record?.isp)}</dd>
        </div>
        <div>
          <dt>Carrier</dt>
          <dd>{formatDetailValue(record?.carrier)}</dd>
        </div>
        <div>
          <dt>来源</dt>
          <dd>{formatDetailValue(record?.source, '等待查询')}</dd>
        </div>
      </dl>
    </article>
  )
}

export function VisitorProfile({ profile }: VisitorProfileProps) {
  return (
    <section className="visitor-profile card">
      <div className="visitor-profile__hero">
        <div className="visitor-profile__hero-copy">
          <p className="eyebrow">VISITOR PROFILE</p>
          <h2>当前访问者公网身份</h2>
          <p className="visitor-profile__hero-summary">
            {profile.summary ?? '正在尝试识别当前访问者的公网网络信息。'}
          </p>
          <p className="visitor-profile__hero-note">
            这里展示浏览器侧可直接获取的公网 IP 与基础归属信息。结果来自公开数据源，可能受 IPv6 可用性、接口返回字段与地区策略影响。
          </p>
        </div>

        <div className="visitor-profile__chips">
          <div className="visitor-profile__chip">
            <span className="summary-card__label">当前状态</span>
            <strong>{formatStatusLabel(profile.status)}</strong>
          </div>
          <div className="visitor-profile__chip">
            <span className="summary-card__label">IPv6 观测</span>
            <strong>{ipv6StatusText(profile.hasIpv6Reachability)}</strong>
          </div>
          <div className="visitor-profile__chip">
            <span className="summary-card__label">数据来源</span>
            <strong>{formatSourceChip(profile)}</strong>
          </div>
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

      <p className="visitor-profile__source-note">{formatSourceText(profile)}</p>

      <div className="visitor-profile__grid">
        <VisitorIpCard label="IPv4" record={profile.ipv4} />
        <VisitorIpCard label="IPv6" record={profile.ipv6} />
      </div>
    </section>
  )
}
