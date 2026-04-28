import { IP_INTEL_PROVIDERS } from '../../config/ipProviders'
import type { VisitorIpRecord } from '../../types'
import { mergeVisitorIpRecord } from './mergeVisitorIpRecord'

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
    timezone?: string
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
  timezone?: {
    id?: string
  }
  asn?: {
    org?: string
  }
  connection?: {
    isp?: string
    org?: string
    asn?: number | string
    type?: string
  }
  message?: string
}

const parseIpApiIs = async (record: VisitorIpRecord, response: Response) => {
  const data = (await response.json()) as IpApiIsResponse

  return mergeVisitorIpRecord(record, {
    status: 'available',
    country: data.location?.country,
    countryCode: data.location?.country_code,
    region: data.location?.state,
    city: data.location?.city,
    timezone: data.location?.timezone,
    isp: data.connection?.isp,
    org: data.connection?.org ?? data.asn?.org ?? data.company?.name,
    asn: data.asn?.asn ? `AS${data.asn.asn}` : undefined,
    asnOrg: data.asn?.org,
    carrier: data.company?.name,
    networkType: data.company?.type,
    confidence: 'high',
  })
}

const parseIpWhoIs = async (record: VisitorIpRecord, response: Response) => {
  const data = (await response.json()) as IpWhoIsResponse

  if (data.success === false) {
    return mergeVisitorIpRecord(record, {
      status: record.status === 'available' ? 'available' : 'inconclusive',
      confidence: record.status === 'available' ? record.confidence : 'low',
      notes: data.message ?? '归属信息接口未返回成功结果。',
    })
  }

  return mergeVisitorIpRecord(record, {
    status: 'available',
    country: data.country,
    countryCode: data.country_code,
    region: data.region,
    city: data.city,
    timezone: data.timezone?.id,
    isp: data.connection?.isp,
    org: data.connection?.org,
    asn: data.connection?.asn ? `AS${data.connection.asn}` : undefined,
    asnOrg: data.asn?.org,
    networkType: data.connection?.type,
    confidence: 'medium',
  })
}

export const fetchIpIntel = async (record: VisitorIpRecord): Promise<VisitorIpRecord> => {
  if (record.status !== 'available' || !record.address) {
    return record
  }

  const providers = IP_INTEL_PROVIDERS.filter((provider) => provider.supportsFamilies.includes(record.family))
  let mergedRecord = record
  let hasSuccessfulResponse = false

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

      hasSuccessfulResponse = true
      const nextRecord = mergeVisitorIpRecord(mergedRecord, { source: `${mergedRecord.source} + ${provider.label}` })

      if (provider.parser === 'ipapi-is') {
        mergedRecord = await parseIpApiIs(nextRecord, response)
        continue
      }

      if (provider.parser === 'ipwhois') {
        mergedRecord = await parseIpWhoIs(nextRecord, response)
      }
    } catch {
      continue
    }
  }

  if (hasSuccessfulResponse) {
    return mergedRecord
  }

  return mergeVisitorIpRecord(record, {
    status: record.status === 'available' ? 'available' : 'inconclusive',
    confidence: 'medium',
    notes: record.notes ?? '公网地址已识别，但未能补充更多归属信息。',
  })
}
