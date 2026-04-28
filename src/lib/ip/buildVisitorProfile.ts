import { fetchIpAddress } from './fetchIpAddress'
import { fetchIpIntel } from './fetchIpIntel'
import type { VisitorProfile } from '../../types'

const toFlag = (countryCode?: string) =>
  countryCode && countryCode.length === 2
    ? String.fromCodePoint(...countryCode.toUpperCase().split('').map((char) => 127397 + char.charCodeAt(0)))
    : undefined

const withDerivedFields = <T extends VisitorProfile['ipv4']>(record: T): T => {
  if (!record || record.status !== 'available') return record

  return {
    ...record,
    countryFlag: record.countryFlag ?? toFlag(record.countryCode),
  }
}

const buildSummary = (profile: VisitorProfile) => {
  const primary = [profile.ipv4, profile.ipv6].find((record) => record?.status === 'available')
  if (!primary) return '未取得公开 IP 结果。'

  const parts = [primary.countryFlag, primary.address, primary.country, primary.region, primary.isp ?? primary.org].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : '已识别当前访问者的公开网络地址。'
}

export const buildVisitorProfile = async (): Promise<VisitorProfile> => {
  const [ipv4Base, ipv6Base] = await Promise.all([fetchIpAddress('ipv4'), fetchIpAddress('ipv6')])
  const [ipv4Raw, ipv6Raw] = await Promise.all([fetchIpIntel(ipv4Base), fetchIpIntel(ipv6Base)])
  const ipv4 = withDerivedFields(ipv4Raw)
  const ipv6 = withDerivedFields(ipv6Raw)

  const records = [ipv4, ipv6].filter((record) => record.status === 'available')
  const dataSources = [ipv4.source, ipv6.source].filter(Boolean)
  const hasIpv6Reachability = ipv6.status === 'available' ? true : ipv6.status === 'unavailable' ? false : 'unknown'

  const status: VisitorProfile['status'] =
    records.length === 2 ? 'ready' : records.length === 1 ? 'partial' : 'unavailable'

  return {
    status,
    ipv4,
    ipv6,
    hasIpv6Reachability,
    fetchedAt: new Date().toISOString(),
    dataSources,
    summary: buildSummary({
      status,
      ipv4,
      ipv6,
      hasIpv6Reachability,
      fetchedAt: new Date().toISOString(),
      dataSources,
    }),
  }
}
