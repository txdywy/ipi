import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { buildVisitorProfile } from '../src/lib/ip/buildVisitorProfile'

const mockFetch = vi.fn()

describe('buildVisitorProfile', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    mockFetch.mockReset()
  })

  it('builds a ready profile when ipv4 and ipv6 are both available', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ip: '1.1.1.1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ip: '240c::1' }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          location: { country: 'Australia', country_code: 'AU', state: 'Queensland', city: 'Brisbane' },
          connection: { isp: 'Cloudflare' },
          asn: { asn: 13335, org: 'CLOUDFLARENET' },
          company: { type: 'hosting' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          location: { country: 'China', country_code: 'CN', state: 'Beijing', city: 'Beijing' },
          connection: { isp: 'China Telecom' },
          asn: { asn: 4134, org: 'CHINANET' },
          company: { type: 'residential' },
        }),
      })

    const profile = await buildVisitorProfile()

    expect(profile.status).toBe('ready')
    expect(profile.ipv4?.address).toBe('1.1.1.1')
    expect(profile.ipv6?.address).toBe('240c::1')
    expect(profile.hasIpv6Reachability).toBe(true)
    expect(profile.summary).toContain('1.1.1.1')
    expect(profile.dataSources.length).toBe(2)
  })

  it('builds a partial profile when only ipv4 is available', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ip: '8.8.8.8' }) })
      .mockRejectedValueOnce(new Error('ipv6 unavailable'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          country: 'United States',
          country_code: 'US',
          region: 'California',
          city: 'Mountain View',
          connection: { isp: 'Google', org: 'Google LLC', asn: 15169, type: 'business' },
        }),
      })
      .mockResolvedValueOnce({ ok: false, status: 500 })

    const profile = await buildVisitorProfile()

    expect(profile.status).toBe('partial')
    expect(profile.ipv4?.status).toBe('available')
    expect(profile.ipv6?.status).not.toBe('available')
    expect(profile.hasIpv6Reachability).toBe('unknown')
  })

  it('builds an unavailable profile when neither address can be resolved', async () => {
    mockFetch.mockRejectedValue(new Error('network error'))

    const profile = await buildVisitorProfile()

    expect(profile.status).toBe('unavailable')
    expect(profile.summary).toBe('未取得公开 IP 结果。')
    expect(profile.hasIpv6Reachability).toBe('unknown')
  })
})
