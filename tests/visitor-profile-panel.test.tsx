import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VisitorProfile as VisitorProfilePanel } from '../src/components/VisitorProfile'
import type { VisitorProfile } from '../src/types'

const readyProfile: VisitorProfile = {
  status: 'ready',
  hasIpv6Reachability: true,
  dataSources: ['ipify', 'ipapi.is'],
  summary: '1.1.1.1 · Australia · Queensland · Cloudflare',
  ipv4: {
    family: 'ipv4',
    address: '1.1.1.1',
    status: 'available',
    source: 'ipapi.is',
    country: 'Australia',
    region: 'Queensland',
    city: 'Brisbane',
    isp: 'Cloudflare',
    org: 'CLOUDFLARENET',
    asn: '13335',
    networkType: 'hosting',
    confidence: 'high',
  },
  ipv6: {
    family: 'ipv6',
    address: '240c::1',
    status: 'available',
    source: 'ipapi.is',
    country: 'China',
    region: 'Beijing',
    city: 'Beijing',
    isp: 'China Telecom',
    org: 'CHINANET',
    asn: '4134',
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

describe('VisitorProfile panel', () => {
  it('renders enhanced visitor identity stats and metadata', () => {
    render(<VisitorProfilePanel profile={readyProfile} />)

    const quickStats = screen.getByLabelText('visitor profile quick stats')
    const ipv4Card = screen.getByText('IPv4').closest('article')
    const ipv6Card = screen.getByText('IPv6').closest('article')

    expect(screen.getByText('当前状态')).toBeInTheDocument()
    expect(screen.getByText('信息完整')).toBeInTheDocument()
    expect(screen.getByText('已观测到 IPv6')).toBeInTheDocument()
    expect(within(quickStats).getByText('双栈已补全')).toBeInTheDocument()
    expect(screen.getByText('数据来源：ipify / ipapi.is')).toBeInTheDocument()
    expect(within(quickStats).getByText('2 个')).toBeInTheDocument()
    expect(within(quickStats).getByText('1.1.1.1')).toBeInTheDocument()
    expect(within(quickStats).getByText('240c::1')).toBeInTheDocument()
    expect(ipv4Card).not.toBeNull()
    expect(ipv6Card).not.toBeNull()
    expect(within(ipv4Card!).getByText('高')).toBeInTheDocument()
    expect(within(ipv6Card!).getByText('中')).toBeInTheDocument()
    expect(within(ipv4Card!).getByText('hosting · CLOUDFLARENET · AS13335')).toBeInTheDocument()
    expect(within(ipv6Card!).getByText('residential · CHINANET · AS4134')).toBeInTheDocument()
  })

  it('renders fallback copy when profile data is limited', () => {
    render(<VisitorProfilePanel profile={limitedProfile} />)

    const quickStats = screen.getByLabelText('visitor profile quick stats')
    const ipv6Card = screen.getByText('IPv6').closest('article')

    expect(screen.getByText('结果有限')).toBeInTheDocument()
    expect(screen.getByText('IPv6 结果有限')).toBeInTheDocument()
    expect(within(quickStats).getByText('公开结果有限')).toBeInTheDocument()
    expect(within(quickStats).getByText('0 个')).toBeInTheDocument()
    expect(screen.getByText('尚未返回数据源信息。')).toBeInTheDocument()
    expect(ipv6Card).not.toBeNull()
    expect(within(ipv6Card!).getAllByText('等待查询')).toHaveLength(2)
    expect(within(ipv6Card!).getByText('待补充')).toBeInTheDocument()
    expect(screen.getAllByText('公开来源暂时不可用。').length).toBeGreaterThan(0)
  })
})
