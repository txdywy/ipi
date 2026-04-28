import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildVisitorProfile } from '../src/lib/ip/buildVisitorProfile'

const mockFetch = vi.fn()

const jsonResponse = (data: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
})

const installFetchMap = (routes: Record<string, unknown | Error | ((url: string) => unknown)>) => {
  mockFetch.mockImplementation(async (input: string | URL) => {
    const url = String(input)
    const handler = routes[url]

    if (handler instanceof Error) {
      throw handler
    }

    if (typeof handler === 'function') {
      const result = handler(url)
      if (result instanceof Error) {
        throw result
      }
      return result
    }

    if (handler !== undefined) {
      return handler
    }

    throw new Error(`Unexpected fetch: ${url}`)
  })
}

describe('buildVisitorProfile', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    mockFetch.mockReset()
  })

  it('builds a ready profile when ipv4 and ipv6 are both available', async () => {
    installFetchMap({
      'https://api.ipify.org?format=json': jsonResponse({ ip: '1.1.1.1' }),
      'https://api6.ipify.org?format=json': jsonResponse({ ip: '240c::1' }),
      'https://api.ipapi.is/?q=1.1.1.1': jsonResponse({
        location: {
          country: 'Australia',
          country_code: 'AU',
          state: 'Queensland',
          city: 'Brisbane',
          timezone: 'Australia/Brisbane',
        },
        connection: { isp: 'Cloudflare' },
        asn: { asn: 13335, org: 'CLOUDFLARENET', type: 'hosting' },
        company: { name: 'Cloudflare', type: 'hosting' },
      }),
      'https://ipapi.co/1.1.1.1/json/': jsonResponse({
        country_name: 'Australia',
        country_code: 'AU',
        region: 'Queensland',
        city: 'Brisbane',
        timezone: 'Australia/Brisbane',
        org: 'Cloudflare, Inc.',
        asn: 'AS13335',
        version: 'IPv4',
      }),
      'https://api.ip.sb/geoip/1.1.1.1': jsonResponse({
        country: 'Australia',
        country_code: 'AU',
        region: 'Queensland',
        city: 'Brisbane',
        timezone: 'Australia/Brisbane',
        isp: 'Cloudflare',
        organization: 'Cloudflare',
        asn_organization: 'Cloudflare, Inc.',
        asn: 13335,
      }),
      'http://ip-api.com/json/1.1.1.1?fields=status,message,country,countryCode,regionName,city,timezone,isp,org,as,asname,mobile,proxy,hosting': jsonResponse({
        status: 'success',
        country: 'Australia',
        countryCode: 'AU',
        regionName: 'Queensland',
        city: 'South Brisbane',
        timezone: 'Australia/Brisbane',
        isp: 'Cloudflare, Inc',
        org: 'APNIC and Cloudflare DNS Resolver project',
        as: 'AS13335 Cloudflare, Inc.',
        asname: 'CLOUDFLARENET',
        hosting: true,
      }),
      'https://ipwho.is/1.1.1.1': jsonResponse({ success: false, message: 'CORS is not supported on the Free plan' }, 403),
      'https://api.ipapi.is/?q=240c%3A%3A1': jsonResponse({
        location: { country: 'China', country_code: 'CN', state: 'Beijing', city: 'Beijing', timezone: 'Asia/Shanghai' },
        connection: { isp: 'China Telecom' },
        asn: { asn: 4134, org: 'CHINANET' },
        company: { type: 'residential' },
      }),
      'https://ipapi.co/240c%3A%3A1/json/': jsonResponse({
        country_name: 'China',
        country_code: 'CN',
        region: 'Beijing',
        city: 'Beijing',
        timezone: 'Asia/Shanghai',
        org: 'China Telecom',
        asn: 'AS4134',
        version: 'IPv6',
      }),
      'https://api.ip.sb/geoip/240c%3A%3A1': jsonResponse({
        country: 'China',
        country_code: 'CN',
        region: 'Beijing',
        city: 'Beijing',
        timezone: 'Asia/Shanghai',
        isp: 'China Telecom',
        organization: 'China Telecom',
        asn_organization: 'CHINANET',
        asn: 4134,
      }),
      'https://ipwho.is/240c%3A%3A1': jsonResponse({ success: false, message: 'CORS is not supported on the Free plan' }, 403),
    })

    const profile = await buildVisitorProfile()

    expect(profile.status).toBe('ready')
    expect(profile.ipv4?.address).toBe('1.1.1.1')
    expect(profile.ipv4?.countryCode).toBe('AU')
    expect(profile.ipv4?.countryFlag).toBe('🇦🇺')
    expect(profile.ipv4?.timezone).toBe('Australia/Brisbane')
    expect(profile.ipv4?.asn).toBe('AS13335')
    expect(profile.ipv4?.asnOrg).toBe('CLOUDFLARENET')
    expect(profile.ipv4?.carrier).toBe('Cloudflare')
    expect(profile.ipv4?.networkType).toBe('hosting')
    expect(profile.ipv6?.address).toBe('240c::1')
    expect(profile.hasIpv6Reachability).toBe(true)
    expect(profile.summary).toContain('🇦🇺')
    expect(profile.summary).toContain('1.1.1.1')
    expect(profile.dataSources.length).toBe(2)
    expect(profile.ipv4?.source).toContain('ipapi.co')
    expect(profile.ipv4?.source).toContain('api.ip.sb')
    expect(profile.ipv4?.source).toContain('ip-api.com')
  })

  it('fills missing ipv4 intel fields from later providers without overwriting earlier values', async () => {
    installFetchMap({
      'https://api.ipify.org?format=json': jsonResponse({ ip: '1.1.1.1' }),
      'https://api6.ipify.org?format=json': new Error('ipv6 unavailable'),
      'https://api.ipapi.is/?q=1.1.1.1': jsonResponse({
        location: { country: 'Australia', country_code: 'AU', state: 'Queensland', city: 'Brisbane' },
      }),
      'https://ipapi.co/1.1.1.1/json/': jsonResponse({
        country_name: 'New Zealand',
        country_code: 'NZ',
        region: 'Auckland',
        city: 'Auckland',
        timezone: 'Australia/Brisbane',
        org: 'Cloudflare',
        asn: 'AS13335',
        version: 'IPv4',
      }),
      'https://api.ip.sb/geoip/1.1.1.1': jsonResponse({
        isp: 'Cloudflare',
        asn_organization: 'CLOUDFLARENET',
        asn: 13335,
      }),
      'http://ip-api.com/json/1.1.1.1?fields=status,message,country,countryCode,regionName,city,timezone,isp,org,as,asname,mobile,proxy,hosting': jsonResponse({
        status: 'success',
        country: 'Australia',
        countryCode: 'AU',
        regionName: 'Queensland',
        city: 'South Brisbane',
        timezone: 'Australia/Brisbane',
        isp: 'Cloudflare, Inc',
        org: 'APNIC and Cloudflare DNS Resolver project',
        as: 'AS13335 Cloudflare, Inc.',
        asname: 'CLOUDFLARENET',
        hosting: true,
      }),
      'https://ipwho.is/1.1.1.1': jsonResponse({ success: false, message: 'CORS is not supported on the Free plan' }, 403),
    })

    const profile = await buildVisitorProfile()

    expect(profile.status).toBe('partial')
    expect(profile.ipv4?.country).toBe('Australia')
    expect(profile.ipv4?.region).toBe('Queensland')
    expect(profile.ipv4?.org).toBe('Cloudflare')
    expect(profile.ipv4?.isp).toBe('Cloudflare')
    expect(profile.ipv4?.asn).toBe('AS13335')
    expect(profile.ipv4?.asnOrg).toBe('CLOUDFLARENET')
    expect(profile.ipv4?.timezone).toBe('Australia/Brisbane')
  })

  it('keeps an available profile when a later provider returns an inconclusive payload', async () => {
    installFetchMap({
      'https://api.ipify.org?format=json': jsonResponse({ ip: '1.1.1.1' }),
      'https://api6.ipify.org?format=json': new Error('ipv6 unavailable'),
      'https://api.ipapi.is/?q=1.1.1.1': jsonResponse({
        location: {
          country: 'Australia',
          country_code: 'AU',
          state: 'Queensland',
          city: 'Brisbane',
          timezone: 'Australia/Brisbane',
        },
        connection: { isp: 'Cloudflare' },
        asn: { asn: 13335, org: 'CLOUDFLARENET' },
        company: { name: 'Cloudflare', type: 'hosting' },
      }),
      'https://ipapi.co/1.1.1.1/json/': jsonResponse({
        country_name: 'Australia',
        country_code: 'AU',
        region: 'Queensland',
        city: 'Brisbane',
        timezone: 'Australia/Brisbane',
        org: 'Cloudflare',
        asn: 'AS13335',
        version: 'IPv4',
      }),
      'https://api.ip.sb/geoip/1.1.1.1': jsonResponse({
        country: 'Australia',
        country_code: 'AU',
        region: 'Queensland',
        city: 'Brisbane',
        timezone: 'Australia/Brisbane',
        isp: 'Cloudflare',
        organization: 'Cloudflare',
        asn_organization: 'CLOUDFLARENET',
        asn: 13335,
      }),
      'http://ip-api.com/json/1.1.1.1?fields=status,message,country,countryCode,regionName,city,timezone,isp,org,as,asname,mobile,proxy,hosting': jsonResponse({
        status: 'fail',
        message: 'quota exceeded',
      }),
      'https://ipwho.is/1.1.1.1': jsonResponse({
        success: false,
        message: 'quota exceeded',
      }),
    })

    const profile = await buildVisitorProfile()

    expect(profile.status).toBe('partial')
    expect(profile.ipv4?.status).toBe('available')
    expect(profile.ipv4?.countryFlag).toBe('🇦🇺')
    expect(profile.ipv4?.notes).toBe('quota exceeded')
  })

  it('builds a partial profile when only ipv4 is available', async () => {
    installFetchMap({
      'https://api.ipify.org?format=json': jsonResponse({ ip: '8.8.8.8' }),
      'https://api6.ipify.org?format=json': new Error('ipv6 unavailable'),
      'https://api.ipapi.is/?q=8.8.8.8': jsonResponse({ status: 'fail' }, 404),
      'https://ipapi.co/8.8.8.8/json/': jsonResponse({
        country_name: 'United States',
        country_code: 'US',
        region: 'California',
        city: 'Mountain View',
        timezone: 'America/Los_Angeles',
        org: 'Google LLC',
        asn: 'AS15169',
        version: 'IPv4',
      }),
      'https://api.ip.sb/geoip/8.8.8.8': jsonResponse({
        isp: 'Google',
        organization: 'Google LLC',
        asn_organization: 'Google LLC',
        asn: 15169,
      }),
      'http://ip-api.com/json/8.8.8.8?fields=status,message,country,countryCode,regionName,city,timezone,isp,org,as,asname,mobile,proxy,hosting': jsonResponse({
        status: 'success',
        country: 'United States',
        countryCode: 'US',
        regionName: 'California',
        city: 'Mountain View',
        timezone: 'America/Los_Angeles',
        isp: 'Google LLC',
        org: 'Google LLC',
        as: 'AS15169 Google LLC',
        asname: 'GOOGLE',
        hosting: true,
      }),
      'https://ipwho.is/8.8.8.8': jsonResponse({ success: false, message: 'CORS is not supported on the Free plan' }, 403),
    })

    const profile = await buildVisitorProfile()

    expect(profile.status).toBe('partial')
    expect(profile.ipv4?.status).toBe('available')
    expect(profile.ipv4?.countryCode).toBe('US')
    expect(profile.ipv4?.isp).toBe('Google')
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
