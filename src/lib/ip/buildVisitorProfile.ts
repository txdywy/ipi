import { fetchIpAddress } from './fetchIpAddress'
import { fetchIpIntel } from './fetchIpIntel'
import type { VisitorProfile, VisitorIpRecord } from '../../types'

const toFlag = (countryCode?: string) =>
  countryCode && countryCode.length === 2
    ? String.fromCodePoint(...countryCode.toUpperCase().split('').map((char) => 127397 + char.charCodeAt(0)))
    : undefined

const withDerivedFields = (record?: VisitorIpRecord): VisitorIpRecord | undefined => {
  if (!record || record.status !== 'available') return record

  return {
    ...record,
    countryFlag: record.countryFlag ?? toFlag(record.countryCode),
  }
}

const buildSummary = (profile: { ipv4?: VisitorIpRecord; ipv6?: VisitorIpRecord }) => {
  const primary = [profile.ipv4, profile.ipv6].find((record) => record?.status === 'available')
  if (!primary) return '未取得公开 IP 结果。'

  const parts = [primary.countryFlag, primary.address, primary.country, primary.region, primary.isp ?? primary.org].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : '已识别当前访问者的公开网络地址。'
}

const finalizeProfile = (profile: VisitorProfile): VisitorProfile => {
  const ipv4 = withDerivedFields(profile.ipv4)
  const ipv6 = withDerivedFields(profile.ipv6)
  const records = [ipv4, ipv6].filter((record): record is VisitorIpRecord => record?.status === 'available')
  const dataSources = Array.from(new Set([ipv4?.source, ipv6?.source].filter((source): source is string => Boolean(source))))
  const hasIpv6Reachability = ipv6?.status === 'available' ? true : ipv6?.status === 'unavailable' ? false : 'unknown'
  const status: VisitorProfile['status'] =
    records.length === 2 ? 'ready' : records.length === 1 ? 'partial' : 'unavailable'

  return {
    ...profile,
    status,
    ipv4,
    ipv6,
    hasIpv6Reachability,
    dataSources,
    summary: buildSummary({ ipv4, ipv6 }),
  }
}

export const buildVisitorProfile = async (onUpdate?: (profile: VisitorProfile) => void): Promise<VisitorProfile> => {
  const profile: VisitorProfile = {
    status: 'loading',
    hasIpv6Reachability: 'unknown',
    dataSources: [],
    fetchedAt: new Date().toISOString(),
  }

  const updateState = (patch: Partial<VisitorProfile>) => {
    Object.assign(profile, patch)
    Object.assign(profile, finalizeProfile(profile))
    onUpdate?.({ ...profile })
  }

  const runForFamily = async (family: 'ipv4' | 'ipv6') => {
    try {
      const base = await fetchIpAddress(family)
      updateState({ [family]: base })

      if (base.status === 'available') {
        const full = await fetchIpIntel(base)
        updateState({ [family]: full })
      }
    } catch {
      // Errors handled within fetchers
    }
  }

  await Promise.all([runForFamily('ipv4'), runForFamily('ipv6')])
  return finalizeProfile(profile)
}
