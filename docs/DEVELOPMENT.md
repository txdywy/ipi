<!-- generated-by: gsd-doc-writer -->

# Development Guide

## Prerequisites

- Node.js compatible with the current Vite and TypeScript toolchain.
- npm.
- A modern browser for manual UI checks.

Install dependencies:

```bash
npm install
```

## Local Workflow

Start the development server:

```bash
npm run dev
```

Build a production bundle:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Run lint:

```bash
npm run lint
```

Run the main verification command:

```bash
npm run check
```

`npm run check` currently runs the Vitest suite and production build.

## Suggested Change Workflow

For target catalog changes:

1. Edit `src/config/targets.ts`.
2. Keep labels compact enough for result cards.
3. Recount group totals if documentation references counts.
4. Run `npm run check` and `npm run lint`.
5. Manually inspect the dashboard at desktop and mobile widths.

For probe behavior changes:

1. Edit `src/lib/probes/*` or `src/lib/classify/classifier.ts`.
2. Add focused tests under `tests/`.
3. Verify abort, rerun, concurrency, and result ordering behavior.
4. Run `npm run check` and `npm run lint`.

For IP provider changes:

1. Edit `src/config/ipProviders.ts`, `src/types/index.ts`, and parser code as needed.
2. Add fixture-backed tests for success, failure, and incomplete payloads.
3. Confirm provider CORS behavior in a browser, not only through command-line tools.

For UI changes:

1. Keep the result card layout compact.
2. Confirm long service labels do not overflow.
3. Verify active, queued, completed, slow, timeout, challenging, and inconclusive states.
4. Keep reduced-motion users in mind when adding animation.

## Test Coverage Map

Current tests cover:

- Result classification rules.
- Probe runner concurrency.
- App concurrent progress state.
- Visitor profile enrichment and fallback behavior.
- IP intelligence fetch handling.
- Result row and group panel rendering.
- Visitor profile panel rendering.

When adding a new behavior, prefer a small focused test over a broad snapshot. The project currently uses Vitest, jsdom, and Testing Library.

## Code Style

- Use TypeScript types from `src/types/index.ts` for cross-module contracts.
- Keep configuration declarative.
- Keep browser network collection logic outside React components.
- Keep UI components focused on rendering already-classified data.
- Prefer explicit labels and reasons in user-facing results.

## Release Checklist

Before publishing a branch:

```bash
npm run lint
npm run check
git diff --check
```

Then verify:

- The app starts with `npm run dev`.
- The first auto-run begins without user interaction.
- The rerun button aborts stale work and starts a new run.
- The visitor profile panel reaches `ready`, `partial`, or `unavailable` without blocking probe results.
- Compact cards remain readable with 153 targets.
