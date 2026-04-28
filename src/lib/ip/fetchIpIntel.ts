import { IP_INTEL_PROVIDERS } from '../../config/ipProviders'
import type { IpIntelProvider, VisitorIpRecord } from '../../types'
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
    type?: string
  }
  connection?: {
    isp?: string
    org?: string
  }
}

interface IpApiCoResponse {
  ip?: string
  city?: string
  region?: string
  country_name?: string
  country_code?: string
  timezone?: string
  org?: string
  asn?: string
  version?: string
}

interface IpSbResponse {
  ip?: string
  country?: string
  country_code?: string
  region?: string
  city?: string
  timezone?: string
  isp?: string
  organization?: string
  asn_organization?: string
  asn?: number | string
}

interface FreeIpApiResponse {
  ipVersion?: number
  countryName?: string
  countryCode?: string
  regionName?: string
  cityName?: string
  timeZones?: string[]
  asn?: string
  asnOrganization?: string
  isProxy?: boolean
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

const buildProviderUrl = (provider: IpIntelProvider, address: string) => {
  const encodedAddress = encodeURIComponent(address)

  if (provider.parser === 'ipapi-is') {
    return `${provider.endpoint}?q=${encodedAddress}`
  }

  if (provider.parser === 'ipapi-co') {
    return `${provider.endpoint}${encodedAddress}/json/`
  }

  return `${provider.endpoint}${encodedAddress}`
}

const PROVIDER_TIMEOUT_MS = 4000

const fetchProvider = async (provider: IpIntelProvider, address: string) => {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)

  try {
    return await fetch(buildProviderUrl(provider, address), {
      method: 'GET',
      cache: 'no-store',
      mode: provider.corsMode ?? 'cors',
      signal: controller.signal,
    })
  } finally {
    window.clearTimeout(timeoutId)
  }
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
    networkType: data.company?.type ?? data.asn?.type,
    confidence: 'high',
  })
}

const parseIpApiCo = async (record: VisitorIpRecord, response: Response) => {
  const data = (await response.json()) as IpApiCoResponse

  return mergeVisitorIpRecord(record, {
    status: 'available',
    country: data.country_name,
    countryCode: data.country_code,
    region: data.region,
    city: data.city,
    timezone: data.timezone,
    org: data.org,
    asn: data.asn,
    networkType: data.version,
    confidence: 'high',
  })
}

const parseIpSb = async (record: VisitorIpRecord, response: Response) => {
  const data = (await response.json()) as IpSbResponse

  return mergeVisitorIpRecord(record, {
    status: 'available',
    country: data.country,
    countryCode: data.country_code,
    region: data.region,
    city: data.city,
    timezone: data.timezone,
    isp: data.isp,
    org: data.organization,
    asn: data.asn ? `AS${data.asn}` : undefined,
    asnOrg: data.asn_organization,
    carrier: data.organization,
    confidence: 'medium',
  })
}

const parseFreeIpApi = async (record: VisitorIpRecord, response: Response) => {
  const data = (await response.json()) as FreeIpApiResponse

  return mergeVisitorIpRecord(record, {
    status: 'available',
    country: data.countryName,
    countryCode: data.countryCode,
    region: data.regionName,
    city: data.cityName,
    timezone: data.timeZones?.[0],
    org: data.asnOrganization,
    asn: data.asn ? `AS${data.asn.replace(/^AS/i, '')}` : undefined,
    asnOrg: data.asnOrganization,
    networkType: data.isProxy ? 'proxy' : data.ipVersion ? `IPv${data.ipVersion}` : undefined,
    confidence: 'medium',
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
      const response = await fetchProvider(provider, record.address)

      if (!response.ok) {
        continue
      }

      hasSuccessfulResponse = true
      const nextRecord = mergeVisitorIpRecord(mergedRecord, { source: `${mergedRecord.source} + ${provider.label}` })

      if (provider.parser === 'ipapi-is') {
        mergedRecord = await parseIpApiIs(nextRecord, response)
        continue
      }

      if (provider.parser === 'ipapi-co') {
        mergedRecord = await parseIpApiCo(nextRecord, response)
        continue
      }

      if (provider.parser === 'ip-sb') {
        mergedRecord = await parseIpSb(nextRecord, response)
        continue
      }

      if (provider.parser === 'freeipapi') {
        mergedRecord = await parseFreeIpApi(nextRecord, response)
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
