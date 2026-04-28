<!-- generated-by: gsd-doc-writer -->

# IP Providers

## Purpose

The visitor profile panel identifies the current browser's public IPv4 and IPv6 addresses, then enriches available addresses with geographic and network metadata.

The provider list is defined in `src/config/ipProviders.ts`.

## Current Providers

Address discovery:

| Provider | Family | Endpoint |
| --- | --- | --- |
| ipify IPv4 | IPv4 | `https://api.ipify.org?format=json` |
| ipify IPv6 | IPv6 | `https://api6.ipify.org?format=json` |

IP intelligence enrichment:

| Provider | Families | Notes |
| --- | --- | --- |
| `ipapi.is` | IPv4, IPv6 | First enrichment source; provides company, ASN, connection, and location fields when available. |
| `ipapi.co` | IPv4, IPv6 | Secondary source; useful for location, ASN, and organization fields. |
| `FreeIPAPI` | IPv4, IPv6 | Backup source with country, region, city, timezone, ASN, and proxy hint fields. |
| `api.ip.sb` | IPv4, IPv6 | Backup source with country, region, city, ISP, organization, and ASN fields. |

## Merge Strategy

`buildVisitorProfile()` runs IPv4 and IPv6 flows in parallel:

1. Fetch the public address for each family.
2. Emit a partial UI update as soon as an address is known.
3. Enrich each available address through the configured intelligence providers.
4. Merge provider fields into one `VisitorIpRecord`.
5. Finalize country flags, data source list, IPv6 reachability, and summary text.

The merge helper preserves earlier useful fields and fills missing data from later providers. This lets one provider supply location while another supplies ASN or organization details.

## Provider Failure Behavior

Provider failures are tolerated:

- If IPv4 lookup fails, IPv6 can still produce a partial profile.
- If IPv6 lookup fails, IPv4 can still produce a partial profile.
- If address lookup succeeds but all enrichment providers fail, the profile still displays the public address and notes that attribution details were unavailable.
- Each enrichment provider has a browser-side timeout of `4000ms`.

## Adding A Provider

To add an IP intelligence provider:

1. Add an entry to `IP_INTEL_PROVIDERS` in `src/config/ipProviders.ts`.
2. Add a parser name to `IpIntelProvider['parser']` in `src/types/index.ts`.
3. Implement parser logic in `src/lib/ip/fetchIpIntel.ts`.
4. Add or update Vitest coverage in `tests/visitor-profile.test.ts` or `tests/fetch-ip-intel.test.ts`.
5. Confirm the provider supports HTTPS and browser CORS from the deployment origin.

To add an address provider:

1. Add an entry to `IP_ADDRESS_PROVIDERS`.
2. Confirm its response shape matches an existing parser or add a parser in `fetchIpAddress.ts`.
3. Test unavailable and malformed response behavior.

## Selection Criteria

Good browser-side providers should have:

- HTTPS endpoints.
- Browser CORS support.
- IPv4 and IPv6 support, or a clear single-family role.
- Reasonable unauthenticated quota for lightweight user-triggered checks.
- Stable JSON response shape.
- Clear terms for public client-side usage.

Avoid providers that require private API keys in frontend code unless the app gains a backend proxy.

## Privacy Notes

ipi requests public IP metadata from third-party services directly from the visitor's browser. That means those providers may receive the visitor's IP address and browser request metadata.

The app does not currently store profiles, send them to a project backend, or persist them beyond the running page state.
