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
- `src/lib/probes/probeRunner.ts` — defines probe runtime constants such as attempts per target and concurrency limits.

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
| Target groups | `mainland`, `hmt`, `global`, `gaming`, `challenge` | `src/config/targets.ts` and `src/types/index.ts` |
| Attempts per target | `3` | `src/lib/probes/probeRunner.ts` |
| Global target concurrency | `10` | `src/lib/probes/probeRunner.ts` |
| Per-origin concurrency | `2` | `src/lib/probes/probeRunner.ts` |
| Slow latency threshold | `2500ms` | `src/lib/classify/classifier.ts` |
| IP intelligence provider timeout | `4000ms` | `src/lib/ip/fetchIpIntel.ts` |
| IP address fetch `mode` | `'cors'` when a provider does not specify `corsMode` | `src/lib/ip/fetchIpAddress.ts` |
| IP intelligence fetch `mode` | `'cors'` when a provider does not specify `corsMode` | `src/lib/ip/fetchIpIntel.ts` |
| Missing IP provider result | Returns an `unavailable` record with source `config` | `src/lib/ip/fetchIpAddress.ts` |
| IPv6 provider error confidence | `'low'` on fetch failure | `src/lib/ip/fetchIpAddress.ts` |
| IPv4 provider error confidence | `'medium'` on fetch failure | `src/lib/ip/fetchIpAddress.ts` |

## Target catalog settings

`GROUPS` controls the UI sections and their explanatory copy. `TARGETS` controls the actual probe list. A target must use a `group` that exists in `GroupKey`, otherwise TypeScript should fail during build.

The current catalog is documented in more detail in `docs/TARGET_CATALOG.md`.

## Probe runtime settings

Probe runtime constants currently live in source code rather than environment config:

- `ATTEMPTS_PER_TARGET = 3`
- `TARGET_CONCURRENCY = 10`
- `ORIGIN_CONCURRENCY = 2`

These are intentionally not exposed as user-facing controls yet. If the target list grows significantly, consider promoting them into a typed config object so tests and documentation can import the same values.

## IP provider settings

IP providers are public browser-side endpoints. Do not put private API keys in `src/config/ipProviders.ts`.

Use `docs/IP_PROVIDERS.md` when changing provider order, adding parsers, or deciding whether a provider is suitable for frontend use.

## Per-environment overrides

No per-environment override mechanism is currently configured.

- No `.env.development`, `.env.production`, or `.env.test` files were found.
- No environment-conditional config loading was found in the application source.
- The same target list, IP providers, and Vite base path apply across local development and production builds unless you edit the checked-in TypeScript config files directly.

If you need environment-specific behavior later, the least invasive extension would be to introduce Vite-supported `import.meta.env` variables and document them here once they are added.
