<!-- generated-by: gsd-doc-writer -->

# Operations Guide

## Deployment Model

ipi is a static browser application. A production build emits files into `dist/` and does not require a custom backend.

Build:

```bash
npm run build
```

Preview locally:

```bash
npm run preview
```

Because Vite is configured with `base: './'`, the built assets are intended to work from relative paths.

## Runtime Dependencies

At runtime, the app depends on:

- The visitor's browser.
- Public target websites configured in `src/config/targets.ts`.
- Public IP address providers.
- Public IP intelligence providers.

No project-owned API server, database, queue, or scheduled job is currently required.

## Expected Browser Behavior

The dashboard starts a run automatically when the page loads. During a run:

- Up to ten targets are active globally.
- Up to two targets per origin are active.
- Each target receives three attempts.
- Results stream into the UI as targets finish.
- Starting a new run aborts the previous one.

Large runs are expected to take time on slow or restricted networks. That is normal for a 153-target catalog.

## Troubleshooting

### Many targets are `inconclusive`

Possible causes:

- Browser extensions blocking requests.
- Corporate, campus, or public Wi-Fi filtering.
- DNS or proxy policy differences.
- CORS, bot protection, or opaque response behavior.
- A target blocking automated or cross-origin resource requests.

Use group-level patterns rather than a single target result. For example, many CDN and package registry failures together are more informative than one failed media site.

### Many targets are `timeout`

Possible causes:

- Network congestion.
- High packet loss.
- Overloaded local proxy or VPN path.
- Browser or OS connection limits.
- A timeout value that is too strict for the user's environment.

Review `timeoutMs` in `src/config/targets.ts` before increasing global concurrency.

### Visitor IP profile is partial

Partial profile means only IPv4 or only IPv6 finished, or enrichment data was incomplete. This can happen when:

- The network has no usable IPv6 path.
- A provider is temporarily unavailable.
- A provider rate-limits the browser.
- A provider does not allow browser CORS for a specific request.

The target probes can still be useful even when IP enrichment is partial.

### Challenge targets look reachable

This is expected in some cases. Browser `no-cors` fetch can report an opaque completed response even if the server returned a login page, bot check, consent screen, or CAPTCHA page. The result means the browser completed a request, not that the service is fully usable.

## Performance Notes

The current runner balances speed and restraint:

- Global concurrency keeps the run from becoming too slow.
- Per-origin concurrency avoids flooding one provider family.
- Sequential attempts per target make each target's classification easier to reason about.
- UI state updates are streamed per target rather than waiting for the full catalog.

If the catalog grows substantially, consider:

- Virtualizing long result lists.
- Splitting optional target groups behind toggles.
- Persisting the last run in browser storage.
- Adding adaptive concurrency based on device and browser responsiveness.
- Adding a backend worker only if body/status inspection becomes a hard requirement.

## Privacy And Data Handling

The app performs checks from the user's browser. It does not currently send results to a project backend or persist them across sessions.

Third-party target websites and IP metadata providers may still observe browser requests made during a run. This is inherent to browser-side network testing.
