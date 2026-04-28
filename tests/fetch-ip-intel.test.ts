import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchIpIntel } from '../src/lib/ip/fetchIpIntel'
import type { VisitorIpRecord } from '../src/types'

const baseRecord: VisitorIpRecord = {
  family: 'ipv4',
  address: '1.1.1.1',
  status: 'available',
  source: 'ipify IPv4',
  confidence: 'high',
}

describe('fetchIpIntel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('skips a stalled provider after the provider timeout budget', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          country_name: 'Australia',
          country_code: 'AU',
          org: 'Cloudflare',
          asn: 'AS13335',
        }),
      })
      .mockResolvedValue({ ok: false, status: 500 })

    vi.stubGlobal('fetch', fetchMock)

    const profilePromise = fetchIpIntel(baseRecord)
    await vi.advanceTimersByTimeAsync(5000)
    const profile = await profilePromise

    expect(profile).toMatchObject({
      countryCode: 'AU',
      org: 'Cloudflare',
      asn: 'AS13335',
    })
  })
})
