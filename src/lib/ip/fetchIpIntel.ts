import { IP_INTEL_PROVIDERS } from '../../config/ipProviders'
import type { VisitorIpRecord } from '../../types'

interface IpApiIsResponse {
  ip?: string
  company?: {
    name?: string
    type?: string
  }
  location?: {
    country?: string
    country_code?: string
    state?: string
    city?: string
  }
  asn?: {
    asn?: number | string
    org?: string
  }
  connection?: {
    isp?: string
    org?: string
  }
}

interface IpWhoIsResponse {
  success?: boolean
  ip?: string
  country?: string
  country_code?: string
  region?: string
  city?: string
  connection?: {
    isp?: string
    org?: string
    asn?: number | string
    type?: string
  }
  message?: string
}

const mergeRecord = (record: VisitorIpRecord, patch: Partial<VisitorIpRecord>): VisitorIpRecord => ({
  ...record,
  ...patch,
})

const parseIpApiIs = async (record: VisitorIpRecord, response: Response) => {
  const data = (await response.json()) as IpApiIsResponse

  return mergeRecord(record, {
    country: data.location?.country,
    countryCode: data.location?.country_code,
    region: data.location?.state,
    city: data.location?.city,
    isp: data.connection?.isp,
    org: data.connection?.org ?? data.asn?.org ?? data.company?.name,
    asn: data.asn?.asn ? `AS${data.asn.asn}` : undefined,
    networkType: data.company?.type,
    confidence: 'high',
  })
}

const parseIpWhoIs = async (record: VisitorIpRecord, response: Response) => {
  const data = (await response.json()) as IpWhoIsResponse

  if (data.success === false) {
    return mergeRecord(record, {
      status: 'inconclusive',
      confidence: 'low',
      notes: data.message ?? '归属信息接口未返回成功结果。',
    })
  }

  return mergeRecord(record, {
    country: data.country,
    countryCode: data.country_code,
    region: data.region,
    city: data.city,
    isp: data.connection?.isp,
    org: data.connection?.org,
    asn: data.connection?.asn ? `AS${data.connection.asn}` : undefined,
    networkType: data.connection?.type,
    confidence: 'medium',
  })
}

export const fetchIpIntel = async (record: VisitorIpRecord): Promise<VisitorIpRecord> => {
  if (record.status !== 'available' || !record.address) {
    return record
  }

  const providers = IP_INTEL_PROVIDERS.filter((provider) => provider.supportsFamilies.includes(record.family))

  for (const provider of providers) {
    try {
      const response = await fetch(`${provider.endpoint}${record.address}`, {
        method: 'GET',
        cache: 'no-store',
        mode: provider.corsMode ?? 'cors',
      })

      if (!response.ok) {
        continue
      }

      if (provider.parser === 'ipapi-is') {
        return await parseIpApiIs(mergeRecord(record, { source: `${record.source} + ${provider.label}` }), response)
      }

      if (provider.parser === 'ipwhois') {
        return await parseIpWhoIs(mergeRecord(record, { source: `${record.source} + ${provider.label}` }), response)
      }
    } catch {
      continue
    }
  }

  return mergeRecord(record, {
    status: record.status === 'available' ? 'available' : 'inconclusive',
    confidence: 'medium',
    notes: record.notes ?? '公网地址已识别，但未能补充更多归属信息。',
  })
}
