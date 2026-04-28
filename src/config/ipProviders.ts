import type { IpAddressProvider, IpIntelProvider } from '../types'

export const IP_ADDRESS_PROVIDERS: IpAddressProvider[] = [
  {
    key: 'ipify-v4',
    label: 'ipify IPv4',
    family: 'ipv4',
    endpoint: 'https://api.ipify.org?format=json',
    responseType: 'json',
    corsMode: 'cors',
    parser: 'ipify',
  },
  {
    key: 'ipify-v6',
    label: 'ipify IPv6',
    family: 'ipv6',
    endpoint: 'https://api6.ipify.org?format=json',
    responseType: 'json',
    corsMode: 'cors',
    parser: 'ipify',
  },
]

export const IP_INTEL_PROVIDERS: IpIntelProvider[] = [
  {
    key: 'ipapi-is',
    label: 'ipapi.is',
    endpoint: 'https://api.ipapi.is/',
    corsMode: 'cors',
    parser: 'ipapi-is',
    supportsFamilies: ['ipv4', 'ipv6'],
  },
  {
    key: 'ipwhois-app',
    label: 'ipwho.is',
    endpoint: 'https://ipwho.is/',
    corsMode: 'cors',
    parser: 'ipwhois',
    supportsFamilies: ['ipv4', 'ipv6'],
  },
]
