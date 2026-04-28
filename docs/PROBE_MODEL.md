<!-- generated-by: gsd-doc-writer -->

# Probe Model

## What The App Measures

ipi runs probes from the visitor's browser. Each target is sampled multiple times, converted into normalized raw signals, and classified into a user-facing result.

The app measures:

- Whether the browser can complete a resource request.
- Whether the request times out.
- How long successful attempts take.
- Whether repeated attempts are stable enough to trust.
- How the result compares across groups and target categories.

The app does not measure full TCP routing, DNS details, TLS certificate chains, HTTP response bodies, login completion, search usability, or media playback quality.

## Runtime Parameters

The current runner in `src/lib/probes/probeRunner.ts` uses:

| Parameter | Value | Meaning |
| --- | ---: | --- |
| Attempts per target | 3 | Each target is sampled three times before classification. |
| Global target concurrency | 10 | Up to ten targets may be active at the same time. |
| Per-origin concurrency | 2 | No more than two targets from the same origin run concurrently. |

The per-origin cap matters because the catalog includes multiple surfaces from some large providers. It reduces accidental pressure on one origin and keeps the UI progressing across categories instead of blocking behind one provider family.

## Probe Types

Probe adapters live in `src/lib/probes/probeAdapters.ts`.

| Type | Current behavior | Typical use |
| --- | --- | --- |
| `fetch` | Uses `fetch(url, { mode: 'no-cors', cache: 'no-store' })`; opaque responses count as completed browser access. | General website and service entry checks. |
| `image` | Loads a URL through an `Image` element and watches load/error/timeout. | Direct image or favicon checks when useful. |
| `script` | Loads a URL through a script element and watches load/error/timeout. | CDN/script resource checks when useful. |

Most configured targets use `fetch` because it is the broadest browser-safe primitive for cross-origin access observation.

## Raw Signals

Each attempt returns a `ProbeRawResult`:

```ts
{
  targetId: 'github-home',
  signal: 'opaque',
  durationMs: 412,
  ok: true,
  detail: undefined,
}
```

Signal meanings:

- `opaque`: A `no-cors` fetch completed, but the browser hides response details.
- `load`: A browser resource load completed with observable success.
- `timeout`: The request did not finish before `target.timeoutMs`.
- `error`: The browser observed a request failure.

## Classification

Classification happens in `src/lib/classify/classifier.ts`.

| Result | Meaning |
| --- | --- |
| `reachable` | Most attempts completed and average latency is acceptable. |
| `slow` | Most attempts completed, but average latency is above the slow threshold. |
| `timeout` | Non-challenge target attempts repeatedly timed out. |
| `challenging` | A challenge-group target showed low or zero success, or behaved inconsistently enough to flag as access friction. |
| `inconclusive` | The browser observed mixed or failed signals that are not strong enough for a more specific conclusion. |

The current slow threshold is `2500ms` average latency across successful attempts.

## Progress And Animation

The UI tracks:

- Active target ids.
- Active attempt number per target.
- Completed target count.
- Queued target count.
- Global completion percentage.

`App` passes active attempt state into `GroupPanel` and `ResultRow`. Cards currently under test use animated scan and progress states so a user can see which targets are moving, which ones are waiting, and how far the full run has progressed.

## Abort And Rerun Behavior

Starting a new run aborts the previous run through `AbortController`.

When a rerun starts, the app clears completed results and active attempt state, then streams new results into the UI as each target finishes. This avoids mixing stale results with the current run.

## Browser Security Limits

Modern browsers intentionally restrict cross-origin visibility. In practice:

- `no-cors` fetch can confirm that a request completed, but usually cannot inspect status code, headers, redirect chain, or body.
- Bot checks and CAPTCHA pages may still count as completed if the browser receives an opaque response.
- Some failures are indistinguishable from CORS policy, network errors, DNS issues, blocked resources, or provider-side rejection.
- A reachable homepage does not prove that authenticated flows, search pages, API calls, downloads, or video playback work.

Use ipi as a fast comparative dashboard, not as a replacement for packet capture, traceroute, synthetic monitoring, or full end-to-end service tests.
