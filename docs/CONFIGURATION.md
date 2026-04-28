<!-- generated-by: gsd-doc-writer -->

# Configuration

## Environment variables

No environment variables are currently defined in the repository.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| None | No | N/A | The application does not read `process.env` or `import.meta.env` values in the current codebase. |

## Config file format

This project uses TypeScript modules for runtime and build configuration instead of `.env`, JSON, YAML, or TOML config files.

Primary configuration files:

- `src/config/targets.ts` — defines the probe target catalog through `GROUPS` and `TARGETS` arrays.
- `src/config/ipProviders.ts` — defines public IP address and IP intelligence providers through `IP_ADDRESS_PROVIDERS` and `IP_INTEL_PROVIDERS` arrays.
- `vite.config.ts` — defines the Vite and Vitest build/test configuration.

Minimal examples from the current config structure:

```ts
export const TARGETS = [
  {
    id: 'github-favicon',
    label: 'GitHub',
    group: 'global',
    probeType: 'fetch',
    url: 'https://github.com/',
    logoUrl: '/brand-logos/github.svg',
    timeoutMs: 7000,
    expectedSignal: 'opaque',
    location: 'Global · Dev',
    tags: ['开发', '协作'],
    emphasis: '适合观察全球开发平台的基础访问情况。',
  },
]
```

```ts
export const IP_ADDRESS_PROVIDERS = [
  {
    key: 'ipify-v4',
    label: 'ipify IPv4',
    family: 'ipv4',
    endpoint: 'https://api.ipify.org?format=json',
    responseType: 'json',
    corsMode: 'cors',
    parser: 'ipify',
  },
]
```

```ts
export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
})
```

## Required vs optional settings

There are no required environment settings enforced at startup in the current codebase.

- No `.env.example`, `.env.sample`, or environment-specific `.env.*` files were found.
- No `process.env`, `import.meta.env`, or `NODE_ENV` checks were found in `src/`.
- No startup validation logic such as `if (!process.env.X) throw ...` or schema-based environment parsing was found.

Operationally, the app depends on the hard-coded provider and target definitions in:

- `src/config/ipProviders.ts`
- `src/config/targets.ts`

If those files are changed incorrectly, probe behavior may degrade, but the repository does not currently define a separate required/optional configuration boundary.

## Defaults

The following defaults are defined in source code:

| Setting | Default | Where it is set |
| --- | --- | --- |
| Vite public base path | `'./'` | `vite.config.ts` |
| IP address fetch `mode` | `'cors'` when a provider does not specify `corsMode` | `src/lib/ip/fetchIpAddress.ts` |
| IP intelligence fetch `mode` | `'cors'` when a provider does not specify `corsMode` | `src/lib/ip/fetchIpIntel.ts` |
| Missing IP provider result | Returns an `unavailable` record with source `config` | `src/lib/ip/fetchIpAddress.ts` |
| IPv6 provider error confidence | `'low'` on fetch failure | `src/lib/ip/fetchIpAddress.ts` |
| IPv4 provider error confidence | `'medium'` on fetch failure | `src/lib/ip/fetchIpAddress.ts` |

## Per-environment overrides

No per-environment override mechanism is currently configured.

- No `.env.development`, `.env.production`, or `.env.test` files were found.
- No environment-conditional config loading was found in the application source.
- The same target list, IP providers, and Vite base path apply across local development and production builds unless you edit the checked-in TypeScript config files directly.

If you need environment-specific behavior later, the least invasive extension would be to introduce Vite-supported `import.meta.env` variables and document them here once they are added.