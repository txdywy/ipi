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
- Each configured target is probed 5 times and then classified into statuses such as `reachable`, `slow`, `challenging`, or `inconclusive`.
- Targets are grouped into three sections: 中国大陆, 国际主流, and 困难目标.
- A separate visitor profile panel attempts to resolve the current visitor's public IPv4 and IPv6 addresses and enrich them with geolocation and network metadata.

## Usage details

### Target coverage

The current dashboard covers 23 web targets across three groups:

- 中国大陆: Baidu, Tencent, Zhihu, Bilibili, JD, Taobao, Weibo, Xiaohongshu
- 国际主流: GitHub, Wikipedia, Cloudflare, OpenAI, AWS, Apple, Microsoft, Stack Overflow
- 困难目标: Claude, Discord, Netflix, Google, YouTube, Telegram, X, Reddit

### Visitor identity panel

The visitor profile flow uses browser fetch requests against these public providers:

- `ipify IPv4`
- `ipify IPv6`
- `ipapi.is`
- `ipwho.is`

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
