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
    key: 'ipapi-co',
    label: 'ipapi.co',
    endpoint: 'https://ipapi.co/',
    corsMode: 'cors',
    parser: 'ipapi-co',
    supportsFamilies: ['ipv4', 'ipv6'],
  },
  {
    key: 'ip-sb',
    label: 'api.ip.sb',
    endpoint: 'https://api.ip.sb/geoip/',
    corsMode: 'cors',
    parser: 'ip-sb',
    supportsFamilies: ['ipv4', 'ipv6'],
  },
  {
    key: 'ip-api',
    label: 'ip-api.com',
    endpoint: 'http://ip-api.com/json/',
    corsMode: 'cors',
    parser: 'ip-api',
    supportsFamilies: ['ipv4'],
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
