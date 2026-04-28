<!-- generated-by: gsd-doc-writer -->

# Target Catalog

## Purpose

The target catalog is the core test surface of ipi. It is intentionally broad: the app should help a visitor compare how the current browser network reaches domestic services, regional academic and public resources, global developer infrastructure, high-friction social and AI services, CDN surfaces, and gaming platforms.

The catalog is defined in `src/config/targets.ts`.

## Current Coverage

The dashboard currently includes 153 targets across five groups.

| Group | Count | Intent |
| --- | ---: | --- |
| 中国大陆 | 20 | Mainland search, social, ecommerce, video, universities, research institutes, and public education organizations. |
| 港澳台 | 9 | High-profile universities and research institutions in Hong Kong, Macau, and Taiwan. |
| 国际主流 | 87 | Developer ecosystems, package registries, CDN providers, cloud platforms, Microsoft and Google services, news/media, portals, and globally recognized academic organizations. |
| 游戏娱乐 | 17 | Domestic and international game stores, game publishers, console networks, game communities, esports, and live streaming. |
| 困难目标 | 20 | AI assistants, Google Scholar, account surfaces, social video, messaging, streaming, and other services that often expose access friction. |

## Inclusion Rules

Add a target when it satisfies at least one of these conditions:

- It is a high-recognition service that users naturally expect in a network access check.
- It represents a distinct network surface, such as CDN, cloud, developer package registry, academic publisher, university, game platform, video service, or social app.
- It helps compare regional routing across China mainland, Hong Kong/Macau/Taiwan, Japan, Korea, North America, Europe, or global infrastructure.
- It is known to trigger access friction, account gates, bot checks, or regional availability differences.
- It is a useful dependency surface for developers, such as Python, npm, Rust, JS CDN, Git hosting, or package download infrastructure.

Avoid adding low-recognition duplicates unless they cover a materially different network path or user scenario.

## Target Shape

Every target uses this contract:

```ts
{
  id: 'github-home',
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
}
```

Field guidance:

- `id` must be stable and unique. Prefer service plus surface, for example `google-scholar` or `steam-store`.
- `label` should be short enough to render in compact result cards.
- `group` must be one of `mainland`, `hmt`, `global`, `gaming`, or `challenge`.
- `probeType` is currently usually `fetch`; keep `image` and `script` for resources that are explicitly intended to load that way.
- `url` should point to a representative HTTPS endpoint.
- `logoUrl` should prefer a checked-in asset when the brand is central to the UI; remote favicons are acceptable for long-tail entries.
- `timeoutMs` should usually stay between `6000` and `9000` so slow networks get a fair chance without stalling the whole run.
- `tags` should describe user-facing category, not implementation details.
- `emphasis` should explain why this target is useful to test.

## Grouping Guidance

Use `mainland` for services whose primary user expectation is mainland China access.

Use `hmt` for Hong Kong, Macau, and Taiwan education, public, or research surfaces.

Use `global` for broadly reachable international infrastructure, developer, academic, cloud, CDN, news, media, and public service surfaces.

Use `gaming` for game stores, launchers, publishers, communities, console networks, esports, and game-related live services.

Use `challenge` for targets where the most useful signal is access friction: CAPTCHA surfaces, account gates, regional restrictions, blocked surfaces, or services likely to return inconsistent browser-level results.

## Maintenance Checklist

Before committing target catalog changes:

1. Confirm the new endpoint is HTTPS and represents the intended service.
2. Confirm the target has a stable `id`, compact `label`, useful `location`, and clear `tags`.
3. Keep related targets near each other in `src/config/targets.ts`.
4. Recount group totals when documentation mentions counts.
5. Run `npm run check` and `npm run lint`.
6. In the browser, verify compact cards still fit at desktop and mobile widths when labels are long.

## Known Limits

Browser-side probes cannot inspect most cross-origin response bodies. A target may return an opaque response, a redirect, a login gate, or a challenge page and still look "completed" from the browser's fetch perspective.

For that reason, the catalog is designed for comparative access observation, not for proving a service is fully usable after login, search, media playback, package download, or CAPTCHA completion.
