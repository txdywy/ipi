# Network Observability Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the dashboard with richer visitor IP intelligence, stable limited-concurrency probing, a broader target catalog, redesigned compact result cards, and a network-map favicon.

**Architecture:** Extend the existing browser-only frontend in place. First stabilize the shared types and IP aggregation pipeline, then upgrade the visitor profile UI, then change probe scheduling, then expand targets and assets, and finally redesign cards and branding before full verification.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, CSS

---

## File map

### Core files to modify
- `src/types/index.ts` — expand visitor IP/profile types and any probe-progress types needed by limited concurrency
- `src/config/ipProviders.ts` — define additional browser-fetchable IP intelligence providers
- `src/lib/ip/fetchIpIntel.ts` — normalize provider payloads and merge richer metadata field-by-field
- `src/lib/ip/buildVisitorProfile.ts` — build richer summaries and source aggregation
- `src/components/VisitorProfile.tsx` — redesign visitor profile panel for richer identity data
- `src/lib/probes/probeRunner.ts` — introduce conservative target-level concurrency while preserving per-target sequential retries
- `src/config/targets.ts` — expand curated target set and point more logos at local assets
- `src/components/ResultRow.tsx` — redesign each target card into a smaller refined information card
- `src/components/GroupPanel.tsx` — adjust grouped layout if card grid shape changes
- `src/components/SummaryCards.tsx` — tune hierarchy to fit redesigned result area
- `src/app/App.tsx` — adapt UI progress behavior if multiple targets may run concurrently
- `src/styles.css` — implement new visitor panel, card grid, and favicon-adjacent layout polish
- `index.html` — wire favicon assets

### Files to create
- `src/lib/ip/mergeVisitorIpRecord.ts` — focused field-level merge helper for provider aggregation
- `tests/probe-runner-concurrency.test.ts` — verify limited target concurrency and sequential per-target retries
- `public/brand-logos/*.svg` — added local logo assets for new targets
- `public/favicon.svg` — network-map favicon source
- optionally `public/favicon.ico` if generated alongside SVG

### Existing tests to extend
- `tests/visitor-profile.test.ts` — richer metadata, flag derivation, source merging, partial fallbacks
- `tests/visitor-profile-panel.test.tsx` — richer field rendering and compact layout states

---

### Task 1: Expand visitor IP types first

**Files:**
- Modify: `src/types/index.ts`
- Test: `tests/visitor-profile.test.ts`

- [ ] **Step 1: Write the failing type-driven test expectations**

Add assertions that reflect the new fields you want the profile builder to return:

```ts
expect(profile.ipv4?.countryCode).toBe('AU')
expect(profile.ipv4?.countryFlag).toBe('🇦🇺')
expect(profile.ipv4?.timezone).toBe('Australia/Brisbane')
expect(profile.ipv4?.asn).toBe('AS13335')
expect(profile.ipv4?.asnOrg).toBe('CLOUDFLARENET')
expect(profile.ipv4?.carrier).toBe('Cloudflare')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/visitor-profile.test.ts`
Expected: FAIL with missing properties on `VisitorIpRecord` or incorrect profile values.

- [ ] **Step 3: Expand the shared types minimally**

Update `src/types/index.ts` so `VisitorIpRecord` can safely carry richer optional identity fields:

```ts
export interface VisitorIpRecord {
  family: IpAddressKind
  address?: string
  status: 'available' | 'unavailable' | 'inconclusive'
  source: string
  countryCode?: string
  country?: string
  countryFlag?: string
  region?: string
  city?: string
  timezone?: string
  isp?: string
  org?: string
  asn?: string
  asnOrg?: string
  carrier?: string
  networkType?: string
  confidence: Confidence
  notes?: string
}
```

- [ ] **Step 4: Run the focused test again**

Run: `npm run test -- tests/visitor-profile.test.ts`
Expected: FAIL moves forward from missing fields to incorrect runtime values.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts tests/visitor-profile.test.ts
git commit -m "feat: expand visitor profile types"
```

### Task 2: Add a focused merge helper for IP intel fields

**Files:**
- Create: `src/lib/ip/mergeVisitorIpRecord.ts`
- Modify: `src/lib/ip/fetchIpIntel.ts`
- Test: `tests/visitor-profile.test.ts`

- [ ] **Step 1: Write the failing merge behavior test**

Add a case proving later providers fill only missing fields:

```ts
expect(profile.ipv4?.country).toBe('Australia')
expect(profile.ipv4?.org).toBe('Cloudflare')
expect(profile.ipv4?.asnOrg).toBe('CLOUDFLARENET')
expect(profile.ipv4?.timezone).toBe('Australia/Brisbane')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/visitor-profile.test.ts`
Expected: FAIL because current fetch logic returns the first successful provider result only.

- [ ] **Step 3: Create the field-level merge helper**

Create `src/lib/ip/mergeVisitorIpRecord.ts`:

```ts
import type { VisitorIpRecord } from '../../types'

const pick = (current?: string, incoming?: string) => current ?? incoming

export const mergeVisitorIpRecord = (base: VisitorIpRecord, patch: Partial<VisitorIpRecord>): VisitorIpRecord => ({
  ...base,
  status: patch.status ?? base.status,
  source: patch.source ?? base.source,
  address: pick(base.address, patch.address),
  countryCode: pick(base.countryCode, patch.countryCode),
  country: pick(base.country, patch.country),
  countryFlag: pick(base.countryFlag, patch.countryFlag),
  region: pick(base.region, patch.region),
  city: pick(base.city, patch.city),
  timezone: pick(base.timezone, patch.timezone),
  isp: pick(base.isp, patch.isp),
  org: pick(base.org, patch.org),
  asn: pick(base.asn, patch.asn),
  asnOrg: pick(base.asnOrg, patch.asnOrg),
  carrier: pick(base.carrier, patch.carrier),
  networkType: pick(base.networkType, patch.networkType),
  confidence: patch.confidence ?? base.confidence,
  notes: pick(base.notes, patch.notes),
})
```

- [ ] **Step 4: Switch `fetchIpIntel.ts` to use the helper**

Replace the current shallow overwrite helper with the new import:

```ts
import { mergeVisitorIpRecord } from './mergeVisitorIpRecord'
```

Then update provider parse paths to call `mergeVisitorIpRecord(record, patch)` instead of overwriting the full object.

- [ ] **Step 5: Run the focused test again**

Run: `npm run test -- tests/visitor-profile.test.ts`
Expected: FAIL remains, but now due to missing provider fields rather than first-provider overwrite behavior.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ip/mergeVisitorIpRecord.ts src/lib/ip/fetchIpIntel.ts tests/visitor-profile.test.ts
git commit -m "feat: merge visitor IP intel fields by attribute"
```

### Task 3: Enrich provider parsing and derive flags

**Files:**
- Modify: `src/config/ipProviders.ts`
- Modify: `src/lib/ip/fetchIpIntel.ts`
- Modify: `src/lib/ip/buildVisitorProfile.ts`
- Test: `tests/visitor-profile.test.ts`

- [ ] **Step 1: Write failing tests for richer normalized fields**

Extend the mocked payloads to include timezone / org / company-style data and assert flag derivation:

```ts
expect(profile.ipv4?.countryFlag).toBe('🇦🇺')
expect(profile.ipv4?.asnOrg).toBe('CLOUDFLARENET')
expect(profile.ipv4?.carrier).toBe('Cloudflare')
expect(profile.summary).toContain('🇦🇺')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/visitor-profile.test.ts`
Expected: FAIL because those values are not parsed or summarized yet.

- [ ] **Step 3: Extend provider payload parsing**

In `src/lib/ip/fetchIpIntel.ts`, add optional response fields and normalize them:

```ts
interface IpApiIsResponse {
  company?: { name?: string; type?: string }
  location?: { country?: string; country_code?: string; state?: string; city?: string; timezone?: string }
  asn?: { asn?: number | string; org?: string }
  connection?: { isp?: string; org?: string }
}
```

And in the parse result:

```ts
return mergeVisitorIpRecord(record, {
  country: data.location?.country,
  countryCode: data.location?.country_code,
  region: data.location?.state,
  city: data.location?.city,
  timezone: data.location?.timezone,
  isp: data.connection?.isp,
  org: data.connection?.org ?? data.company?.name,
  asn: data.asn?.asn ? `AS${data.asn.asn}` : undefined,
  asnOrg: data.asn?.org,
  carrier: data.company?.name,
  networkType: data.company?.type,
  confidence: 'high',
})
```

- [ ] **Step 4: Add a small flag-derivation helper in `buildVisitorProfile.ts`**

```ts
const toFlag = (countryCode?: string) =>
  countryCode && countryCode.length === 2
    ? String.fromCodePoint(...countryCode.toUpperCase().split('').map((char) => 127397 + char.charCodeAt(0)))
    : undefined
```

Apply it after intel merging so each available record gains `countryFlag` when possible.

- [ ] **Step 5: Improve the summary builder**

Update `buildSummary()` to prefer:

```ts
const parts = [primary.countryFlag, primary.address, primary.country, primary.region, primary.isp ?? primary.org].filter(Boolean)
```

- [ ] **Step 6: Run the test again**

Run: `npm run test -- tests/visitor-profile.test.ts`
Expected: PASS for richer profile aggregation cases.

- [ ] **Step 7: Commit**

```bash
git add src/config/ipProviders.ts src/lib/ip/fetchIpIntel.ts src/lib/ip/buildVisitorProfile.ts tests/visitor-profile.test.ts
git commit -m "feat: enrich visitor IP metadata"
```

### Task 4: Redesign the visitor profile panel

**Files:**
- Modify: `src/components/VisitorProfile.tsx`
- Modify: `src/styles.css`
- Test: `tests/visitor-profile-panel.test.tsx`

- [ ] **Step 1: Write the failing panel test for richer fields**

Add a panel test with the new visible values:

```ts
expect(screen.getByText('🇨🇳 China')).toBeInTheDocument()
expect(screen.getByText('AS4134')).toBeInTheDocument()
expect(screen.getByText('CHINANET')).toBeInTheDocument()
expect(screen.getByText('China Telecom')).toBeInTheDocument()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/visitor-profile-panel.test.tsx`
Expected: FAIL because the component does not render those richer fields yet.

- [ ] **Step 3: Refactor the panel markup for a compact identity-card layout**

In `src/components/VisitorProfile.tsx`, introduce a compact summary + detail grid shape such as:

```tsx
<div className="visitor-profile__hero">
  <div>
    <p className="eyebrow">VISITOR PROFILE</p>
    <h2>当前访问者公网身份</h2>
    <p>{profile.summary ?? '正在尝试识别当前访问者的公网网络信息。'}</p>
  </div>
  <div className="visitor-profile__chips">
    <span className="chip">{ipv6StatusText(profile.hasIpv6Reachability)}</span>
    <span className="chip">{formatSourceCount(profile)} 个来源</span>
  </div>
</div>
```

And inside each IP card render dedicated fields for flag/country, ASN, ISP, org, and carrier.

- [ ] **Step 4: Add only the CSS needed for the new panel structure**

Append focused rules in `src/styles.css` for:

```css
.visitor-profile__hero { display:grid; gap:16px; }
.visitor-profile__chips { display:flex; flex-wrap:wrap; gap:8px; }
.visitor-ip-card__facts { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:10px; }
```

- [ ] **Step 5: Run the panel test**

Run: `npm run test -- tests/visitor-profile-panel.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/VisitorProfile.tsx src/styles.css tests/visitor-profile-panel.test.tsx
git commit -m "feat: redesign visitor profile panel"
```

### Task 5: Add limited target-level concurrency

**Files:**
- Modify: `src/lib/probes/probeRunner.ts`
- Test: `tests/probe-runner-concurrency.test.ts`

- [ ] **Step 1: Write the failing scheduler test**

Create `tests/probe-runner-concurrency.test.ts` with a controlled async probe stub proving two targets can start before the first one fully finishes, while attempts within the same target stay ordered:

```ts
expect(startedTargets.slice(0, 2)).toEqual(['a', 'b'])
expect(attemptLog.filter((x) => x.target === 'a').map((x) => x.attempt)).toEqual([1, 2, 3, 4, 5])
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/probe-runner-concurrency.test.ts`
Expected: FAIL because `runAllProbes()` is fully sequential today.

- [ ] **Step 3: Introduce a small concurrency constant and worker loop**

In `src/lib/probes/probeRunner.ts`, evolve the runner toward a bounded worker pattern:

```ts
const TARGET_CONCURRENCY = 3
```

Then replace the plain `for...of` with a worker queue structure that consumes indices while reusing the existing `runTargetAttempts()` helper.

- [ ] **Step 4: Preserve stable final ordering**

Store results by original target index before returning:

```ts
const orderedResults: ProbeResult[] = new Array(total)
orderedResults[index] = result
return orderedResults.filter(Boolean)
```

- [ ] **Step 5: Run the focused scheduler test**

Run: `npm run test -- tests/probe-runner-concurrency.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/probes/probeRunner.ts tests/probe-runner-concurrency.test.ts
git commit -m "feat: add limited probe concurrency"
```

### Task 6: Adapt app progress state for concurrent targets

**Files:**
- Modify: `src/app/App.tsx`
- Test: `tests/result-row.test.tsx` or add focused app/progress test if needed

- [ ] **Step 1: Write the failing UI expectation**

Add a test or focused assertion that the UI can show a running state without assuming only one target is active.

```ts
expect(screen.getByText('检测中')).toBeInTheDocument()
```

- [ ] **Step 2: Run the focused test**

Run: `npm run test -- tests/result-row.test.tsx`
Expected: FAIL if the single-active-target assumption leaks into rendering.

- [ ] **Step 3: Change app state from one active target to a small running-set model**

In `src/app/App.tsx`, evolve from a single `activeTargetId` assumption to something like:

```ts
const [activeTargetIds, setActiveTargetIds] = useState<string[]>([])
```

Update `onTargetStart` / `onTargetFinish` to add/remove ids while still keeping `activeAttempt` for the currently surfaced attempt indicator if desired.

- [ ] **Step 4: Pass the new running-state shape down minimally**

Use:

```tsx
isActive={activeTargetIds.includes(target.id)}
```

- [ ] **Step 5: Run the focused test**

Run: `npm run test -- tests/result-row.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/App.tsx tests/result-row.test.tsx
git commit -m "feat: support concurrent target progress state"
```

### Task 7: Expand and localize the target catalog

**Files:**
- Modify: `src/config/targets.ts`
- Create: `public/brand-logos/*.svg`
- Test: `npm run build`

- [ ] **Step 1: Add a curated target expansion list in the config**

Append a balanced set such as Apple, Microsoft, Netflix, Discord, Stack Overflow, Alibaba/Taobao, Weibo, Xiaohongshu, and NetEase, keeping group semantics intact.

Example target block:

```ts
{
  id: 'apple-home',
  label: 'Apple',
  group: 'global',
  probeType: 'fetch',
  url: 'https://www.apple.com/',
  logoUrl: '/brand-logos/apple.svg',
  timeoutMs: 7000,
  expectedSignal: 'opaque',
  location: 'Global · Consumer',
  tags: ['终端', '生态'],
  emphasis: '适合观察全球消费平台入口的访问表现。',
}
```

- [ ] **Step 2: Add local logo assets for the new targets**

Create the corresponding SVG files under `public/brand-logos/` and update existing remote-logo targets to local files when practical.

- [ ] **Step 3: Run a build check**

Run: `npm run build`
Expected: PASS and emitted assets resolve without broken imports.

- [ ] **Step 4: Commit**

```bash
git add src/config/targets.ts public/brand-logos
git commit -m "feat: expand target catalog and local logos"
```

### Task 8: Redesign per-target result cards

**Files:**
- Modify: `src/components/ResultRow.tsx`
- Modify: `src/components/GroupPanel.tsx`
- Modify: `src/components/SummaryCards.tsx`
- Modify: `src/styles.css`
- Test: `tests/result-row.test.tsx`

- [ ] **Step 1: Write the failing result-card test**

Assert the compact card still renders the critical metrics:

```ts
expect(screen.getByText('成功率')).toBeInTheDocument()
expect(screen.getByText('平均耗时：120 ms')).toBeInTheDocument()
expect(screen.getByText('表现良好')).toBeInTheDocument()
```

- [ ] **Step 2: Run the focused test**

Run: `npm run test -- tests/result-row.test.tsx`
Expected: FAIL once structure-sensitive assertions are updated for the new layout.

- [ ] **Step 3: Refactor `ResultRow.tsx` into a more compact card hierarchy**

Keep the same data but reshape the markup into header / primary metrics / supporting details:

```tsx
<div className="result-row__header">...</div>
<div className="result-row__primary-metrics">...</div>
<div className="result-row__supporting-meta">...</div>
```

Shorten visible copy where possible; keep target emphasis secondary.

- [ ] **Step 4: Tighten group and summary composition only where needed**

Adjust `GroupPanel.tsx` and `SummaryCards.tsx` to support the denser card grid without introducing unrelated abstractions.

- [ ] **Step 5: Update CSS for desktop/mobile balance**

Add grid rules such as:

```css
.result-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:14px; }
.result-row__primary-metrics { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
@media (max-width: 640px) { .result-row__primary-metrics { grid-template-columns:1fr; } }
```

- [ ] **Step 6: Run the result-card test**

Run: `npm run test -- tests/result-row.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/ResultRow.tsx src/components/GroupPanel.tsx src/components/SummaryCards.tsx src/styles.css tests/result-row.test.tsx
git commit -m "feat: redesign probe result cards"
```

### Task 9: Add the network-map favicon

**Files:**
- Create: `public/favicon.svg`
- Modify: `index.html`
- Test: `npm run build`

- [ ] **Step 1: Add the favicon asset**

Create `public/favicon.svg` using a simple network-map motif: a circular globe outline, 3–4 nodes, and two or three route arcs.

- [ ] **Step 2: Wire the favicon in `index.html`**

Add:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

- [ ] **Step 3: Run the build**

Run: `npm run build`
Expected: PASS and `dist/` contains the favicon asset reference.

- [ ] **Step 4: Commit**

```bash
git add public/favicon.svg index.html
git commit -m "feat: add network map favicon"
```

### Task 10: Run the final verification suite

**Files:**
- Test: `tests/visitor-profile.test.ts`
- Test: `tests/visitor-profile-panel.test.tsx`
- Test: `tests/probe-runner-concurrency.test.ts`
- Test: `tests/result-row.test.tsx`
- Verify: full app build

- [ ] **Step 1: Run the focused tests together**

Run:

```bash
npm run test -- tests/visitor-profile.test.ts tests/visitor-profile-panel.test.tsx tests/probe-runner-concurrency.test.ts tests/result-row.test.tsx
```

Expected: PASS

- [ ] **Step 2: Run the full suite**

Run: `npm run test`
Expected: PASS

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Manual browser verification**

Run: `npm run dev`
Then verify:
- visitor profile shows richer identity data
- dashboard starts and finishes faster than before
- multiple targets can be in flight without confusing the UI
- cards feel smaller and more polished on desktop
- narrow viewport still reads cleanly
- favicon appears in the browser tab

- [ ] **Step 5: Commit**

```bash
git add src tests public index.html
git commit -m "feat: finalize network observability enhancements"
```

---

## Self-review

### Spec coverage
- Rich visitor profile: covered by Tasks 1–4
- Stable limited concurrency: covered by Tasks 5–6
- Broader target catalog and local logos: covered by Task 7
- Compact refined result cards: covered by Task 8
- Network-map favicon: covered by Task 9
- Test and verification coverage: covered by Task 10

### Placeholder scan
- No `TBD`, `TODO`, or deferred “implement later” markers remain in this plan.
- Each code-changing task names exact files and shows the concrete intended shape.

### Type consistency
- `countryFlag`, `timezone`, `asnOrg`, and `carrier` are introduced first in Task 1 and consumed later.
- `mergeVisitorIpRecord` is introduced before `fetchIpIntel.ts` is updated to use it.
- Limited concurrency is added in the runner before app progress state is adapted.

Plan complete and saved to `docs/superpowers/plans/2026-04-28-network-observability-enhancements.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
