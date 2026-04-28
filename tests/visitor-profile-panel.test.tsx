import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VisitorProfile as VisitorProfilePanel } from '../src/components/VisitorProfile'
import type { VisitorProfile } from '../src/types'

const readyProfile: VisitorProfile = {
  status: 'ready',
  hasIpv6Reachability: true,
  dataSources: ['ipify', 'ipapi.is'],
  summary: '🇦🇺 · 1.1.1.1 · Australia · Queensland · Cloudflare',
  ipv4: {
    family: 'ipv4',
    address: '1.1.1.1',
    status: 'available',
    source: 'ipapi.is',
    countryCode: 'AU',
    countryFlag: '🇦🇺',
    country: 'Australia',
    region: 'Queensland',
    city: 'Brisbane',
    isp: 'Cloudflare',
    org: 'CLOUDFLARENET',
    asn: 'AS13335',
    asnOrg: 'CLOUDFLARENET',
    carrier: 'Cloudflare',
    networkType: 'hosting',
    confidence: 'high',
  },
  ipv6: {
    family: 'ipv6',
    address: '240c::1',
    status: 'available',
    source: 'ipapi.is',
    countryCode: 'CN',
    countryFlag: '🇨🇳',
    country: 'China',
    region: 'Beijing',
    city: 'Beijing',
    isp: 'China Telecom',
    org: 'CHINANET',
    asn: 'AS4134',
    asnOrg: 'CHINANET',
    carrier: 'China Telecom',
    networkType: 'residential',
    confidence: 'medium',
  },
}

const limitedProfile: VisitorProfile = {
  status: 'unavailable',
  hasIpv6Reachability: 'unknown',
  dataSources: [],
  summary: undefined,
  ipv4: {
    family: 'ipv4',
    status: 'unavailable',
    source: 'ipify',
    confidence: 'low',
    notes: '公开来源暂时不可用。',
  },
}

const getCard = (label: 'IPv4' | 'IPv6') => screen.getByText(label).closest('article') as HTMLElement | null

const expectFact = (card: HTMLElement, label: string, value: string) => {
  const fact = within(card).getByText(label).closest('div') as HTMLElement | null
  expect(fact).not.toBeNull()
  expect(within(fact!).getByText(value)).toBeInTheDocument()
}

const expectQuickStat = (stats: HTMLElement, label: string, value: string) => {
  const tile = within(stats).getByText(label).closest('article') as HTMLElement | null
  expect(tile).not.toBeNull()
  expect(within(tile!).getByText(value)).toBeInTheDocument()
}

const expectChip = (label: string, value: string) => {
  const chip = screen.getByText(label).closest('.visitor-profile__chip') as HTMLElement | null
  expect(chip).not.toBeNull()
  expect(within(chip!).getByText(value)).toBeInTheDocument()
}

describe('VisitorProfile panel', () => {
  it('renders enhanced visitor identity stats and metadata', () => {
    render(<VisitorProfilePanel profile={readyProfile} />)

    const quickStats = screen.getByLabelText('visitor profile quick stats')
    const ipv4Card = getCard('IPv4')
    const ipv6Card = getCard('IPv6')

    expect(screen.getByText('当前访问者公网身份')).toBeInTheDocument()
    expect(screen.getByText('信息完整')).toBeInTheDocument()
    expectChip('IPv6 观测', '已观测到 IPv6')
    expectChip('数据来源', '2 个来源')
    expectQuickStat(quickStats, '画像覆盖', '双栈已补全')
    expectQuickStat(quickStats, 'IPv4 状态', '1.1.1.1')
    expectQuickStat(quickStats, 'IPv6 状态', '240c::1')
    expectQuickStat(quickStats, '数据源数量', '2 个')
    expect(screen.getByText('数据来源：ipify / ipapi.is')).toBeInTheDocument()
    expect(screen.getByText('🇦🇺 · 1.1.1.1 · Australia · Queensland · Cloudflare')).toBeInTheDocument()
    expect(ipv4Card).not.toBeNull()
    expect(ipv6Card).not.toBeNull()
    expect(within(ipv4Card!).getByText('🇦🇺 Australia')).toBeInTheDocument()
    expect(within(ipv6Card!).getByText('🇨🇳 China')).toBeInTheDocument()
    expectFact(ipv4Card!, 'ASN', 'AS13335')
    expectFact(ipv6Card!, 'ASN', 'AS4134')
    expectFact(ipv4Card!, '组织', 'CLOUDFLARENET')
    expectFact(ipv6Card!, '组织', 'CHINANET')
    expectFact(ipv4Card!, 'ISP', 'Cloudflare')
    expectFact(ipv6Card!, 'ISP', 'China Telecom')
    expectFact(ipv4Card!, 'Carrier', 'Cloudflare')
    expectFact(ipv6Card!, 'Carrier', 'China Telecom')
    expect(within(ipv4Card!).getByText('高')).toBeInTheDocument()
    expect(within(ipv6Card!).getByText('中')).toBeInTheDocument()
  })

  it('renders fallback copy when profile data is limited', () => {
    render(<VisitorProfilePanel profile={limitedProfile} />)

    const quickStats = screen.getByLabelText('visitor profile quick stats')
    const ipv6Card = getCard('IPv6')

    expect(screen.getByText('结果有限')).toBeInTheDocument()
    expectChip('IPv6 观测', 'IPv6 结果有限')
    expectChip('数据来源', '0 个来源')
    expectQuickStat(quickStats, '画像覆盖', '公开结果有限')
    expectQuickStat(quickStats, '数据源数量', '0 个')
    expect(screen.getByText('尚未返回数据源信息。')).toBeInTheDocument()
    expect(ipv6Card).not.toBeNull()
    expectFact(ipv6Card!, '来源', '等待查询')
    expect(within(ipv6Card!).getAllByText('待补充').length).toBeGreaterThan(0)
    expect(screen.getAllByText('公开来源暂时不可用。').length).toBeGreaterThan(0)
  })
})
