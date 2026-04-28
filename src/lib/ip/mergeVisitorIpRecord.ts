import type { VisitorIpRecord } from '../../types'

const pick = (current?: string, incoming?: string) => current ?? incoming

export const mergeVisitorIpRecord = (
  base: VisitorIpRecord,
  patch: Partial<VisitorIpRecord>,
): VisitorIpRecord => ({
  ...base,
  status: patch.status ?? base.status,
  source: patch.source ?? base.source,
  address: pick(base.address, patch.address),
  countryCode: pick(base.countryCode, patch.countryCode),
  countryFlag: pick(base.countryFlag, patch.countryFlag),
  country: pick(base.country, patch.country),
  region: pick(base.region, patch.region),
  city: pick(base.city, patch.city),
  timezone: pick(base.timezone, patch.timezone),
  isp: pick(base.isp, patch.isp),
  org: pick(base.org, patch.org),
  asn: pick(base.asn, patch.asn),
  asnOrg: pick(base.asnOrg, patch.asnOrg),
  carrier: pick(base.carrier, patch.carrier),
  networkType: pick(base.networkType, patch.networkType),
  confidence: patch.confidence ?? base.confidence,
  notes: pick(base.notes, patch.notes),
})
