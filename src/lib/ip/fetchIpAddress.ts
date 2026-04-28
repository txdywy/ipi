import { IP_ADDRESS_PROVIDERS } from '../../config/ipProviders'
import type { IpAddressProvider, IpAddressKind, VisitorIpRecord } from '../../types'

const parseAddress = async (provider: IpAddressProvider, response: Response) => {
  if (provider.responseType === 'json') {
    const data = (await response.json()) as { ip?: string }
    return data.ip?.trim()
  }

  return (await response.text()).trim()
}

const fallbackRecord = (
  family: IpAddressKind,
  source: string,
  confidence: VisitorIpRecord['confidence'],
  notes: string,
  status: VisitorIpRecord['status'] = 'unavailable',
): VisitorIpRecord => ({
  family,
  status,
  source,
  confidence,
  notes,
})

export const fetchIpAddress = async (family: IpAddressKind): Promise<VisitorIpRecord> => {
  const provider = IP_ADDRESS_PROVIDERS.find((item) => item.family === family)

  if (!provider) {
    return fallbackRecord(family, 'config', 'low', '当前未配置可用的地址来源。')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(provider.endpoint, {
      method: 'GET',
      cache: 'no-store',
      mode: provider.corsMode ?? 'cors',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return fallbackRecord(family, provider.label, 'low', `地址接口返回 ${response.status}。`, 'inconclusive')
    }

    const address = await parseAddress(provider, response)

    if (!address) {
      return fallbackRecord(family, provider.label, 'low', '地址接口返回为空。', 'inconclusive')
    }

    return {
      family,
      address,
      status: 'available',
      source: provider.label,
      confidence: 'high',
    }
  } catch (error) {
    clearTimeout(timeoutId)
    const isTimeout = error instanceof DOMException && error.name === 'AbortError'
    const message = isTimeout ? '请求超时 (5s)' : (error instanceof Error ? error.message : 'Unknown address lookup error')
    return fallbackRecord(family, provider.label, family === 'ipv6' ? 'low' : 'medium', message, 'inconclusive')
  }
}
