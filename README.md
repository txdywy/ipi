<!-- generated-by: gsd-doc-writer -->
# ipi

A Vite + React browser-based network checkup dashboard for quickly sampling how the current visitor can reach a curated set of domestic, global, and hard-to-reach web targets.

![Version](https://img.shields.io/badge/version-0.1.0-blue)

## Installation

```bash
npm install
```

## Quick start

1. Install dependencies.
   ```bash
   npm install
   ```
2. Start the development server.
   ```bash
   npm run dev
   ```
3. Open the local Vite URL shown in the terminal.
4. Wait for the page to auto-run the first checkup and render the grouped results.

## Usage examples

### Run the dashboard locally

```bash
npm run dev
```

This starts the Vite development server and loads the app, which immediately begins a first-round network check across all configured targets.

### Create a production build

```bash
npm run build
```

This compiles TypeScript with `tsc -b` and outputs a production-ready Vite build to `dist/`.

### Run the test suite

```bash
npm run test
```

This runs the Vitest suite, including classifier logic and visitor profile data-fetching behavior.

## How it works

- The app auto-starts a browser-side checkup when the page loads.
- Each configured target is probed 3 times with limited concurrency and then classified into statuses such as `reachable`, `slow`, `challenging`, or `inconclusive`.
- Targets are grouped into five sections: 中国大陆, 港澳台, 国际主流, 游戏娱乐, and 困难目标.
- A separate visitor profile panel attempts to resolve the current visitor's public IPv4 and IPv6 addresses and enrich them with geolocation and network metadata.

## Usage details

### Target coverage

The current dashboard covers 153 web targets across five groups:

- 中国大陆: search, social, ecommerce, short-video services, universities, research institutes, and public education organizations.
- 港澳台: high-profile universities and regional research institutions in Hong Kong, Macau, and Taiwan.
- 国际主流: developer ecosystems, package registries, CDN providers, cloud platforms, Microsoft and Google services, Japan/Korea portals, major news/media sites, and globally recognized academic organizations.
- 游戏娱乐: domestic and international game stores, publishers, console networks, game communities, and live-streaming services.
- 困难目标: AI assistants, Google Scholar and account surfaces, Meta/TikTok/social video, messaging, streaming, and other higher-friction international services.

### Visitor identity panel

The visitor profile flow uses browser fetch requests against these public providers:

- `ipify IPv4`
- `ipify IPv6`
- `ipapi.is`
- `ipapi.co`
- `FreeIPAPI`
- `api.ip.sb`

The UI reports IPv4 and IPv6 availability, inferred network metadata, source count, and a short summary string built from the first available record.

### Result interpretation

The summary cards aggregate:

- completed target count
- reachable target count
- average success rate
- average observable latency
- per-status counts
- visitor profile readiness

The dashboard presents browser-observable behavior only; it does not claim to be a full network diagnostic tool.

## Documentation

More detailed project notes live in `docs/`:

- [Architecture](docs/ARCHITECTURE.md) — module boundaries, data flow, and runtime responsibilities.
- [Configuration](docs/CONFIGURATION.md) — target and IP provider config shape, defaults, and extension points.
- [Target catalog](docs/TARGET_CATALOG.md) — current target taxonomy, inclusion rules, and maintenance checklist.
- [Probe model](docs/PROBE_MODEL.md) — browser probe behavior, classification rules, concurrency, and known limits.
- [IP providers](docs/IP_PROVIDERS.md) — public IP discovery and attribution provider behavior.
- [Development guide](docs/DEVELOPMENT.md) — local workflow, checks, testing strategy, and release notes.
- [Operations guide](docs/OPERATIONS.md) — deployment assumptions, troubleshooting, and browser-side caveats.
