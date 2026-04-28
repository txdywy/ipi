# Network Observability Enhancements Design

Date: 2026-04-28
Status: Approved for planning
Project: ipi

## Goal

Upgrade the current browser-based network checkup dashboard so it provides richer visitor network identity data, faster but still stable probe execution, a broader and more representative target catalog, a more refined result-card layout, and a distinctive app favicon.

This work keeps the product as a browser-only network observability dashboard. It does not add a backend, user accounts, persistent storage, or a monitoring control plane.

## User intent and fixed decisions

The following decisions are locked for implementation:

- Visitor IP data should be as rich as practical, including country, country flag, carrier/operator-style information, ASN, ISP, and org when obtainable.
- Probe execution should improve total runtime while preserving result stability ahead of maximum raw throughput.
- Target expansion should add recognizable sites on both the China-mainland and international sides, while keeping the grouped comparison structure balanced.
- The site favicon should move toward a network-map visual style.
- Per-target result cards should be redesigned into a smaller, more polished information-card layout that works well on both desktop and mobile.

## Scope

### In scope

1. Expand the visitor profile data model and aggregation logic.
2. Add more IP intelligence providers and normalize richer metadata into one profile.
3. Improve probe scheduling with limited target-level concurrency while preserving sequential retries per target.
4. Expand the target catalog with additional representative sites.
5. Increase use of local brand assets for target logos when practical.
6. Redesign the per-target result cards and tighten the grouped dashboard layout.
7. Improve the visitor profile panel presentation to match the richer data model.
8. Add a distinctive app favicon and related icon wiring.
9. Add or update tests for data aggregation, scheduling behavior, and UI rendering.

### Out of scope

- Adding any backend proxy or server-side data enrichment service
- Storing historical runs or user-specific preferences
- Building a detailed drill-down page per target
- Turning the app into a full network diagnostic suite
- Introducing provider secrets, paid APIs, or authenticated vendor integrations

## Current-state summary

### Visitor profile

The current visitor profile flow:

- fetches IPv4 and IPv6 addresses via `ipify`
- enriches those addresses via `ipapi.is` and `ipwho.is`
- builds a summary from `address`, `country`, `region`, and `isp`
- surfaces readiness, IPv6 reachability, and source count in the UI

The current model does not fully expose richer identity fields such as a flag, ASN, ASN organization, carrier, or a more detailed network identity summary.

### Probe scheduling

`src/lib/probes/probeRunner.ts` currently executes:

- all targets sequentially
- all retries within a target sequentially

This preserves stable result ordering but causes total runtime to grow linearly with the full target set.

### Target catalog and branding

The current target catalog already separates:

- 中国大陆
- 国际主流
- 困难目标

Some logos are local assets, but many targets still depend on remote favicon URLs. The app itself does not yet have a more distinctive site favicon treatment.

### Result presentation

The dashboard already contains grouped result presentation, summary cards, and a visitor profile panel. However, per-target result presentation is still closer to a straightforward status row/card structure than a compact, refined information card.

## Architecture changes

The implementation should remain inside the existing frontend-only architecture and extend five areas.

### 1. Visitor IP enrichment layer

Files expected to change:

- `src/config/ipProviders.ts`
- `src/lib/ip/fetchIpAddress.ts`
- `src/lib/ip/fetchIpIntel.ts`
- `src/lib/ip/buildVisitorProfile.ts`
- `src/types/index.ts`

Design direction:

- keep address lookup and intelligence lookup conceptually separate
- expand IP intelligence sources to improve field completeness
- normalize each provider result into a shared internal record shape
- merge records field-by-field instead of treating one provider as globally authoritative

### 2. Probe scheduling layer

Files expected to change:

- `src/lib/probes/probeRunner.ts`
- possibly `src/types/index.ts` if progress-state typing needs extension
- possibly `src/app/App.tsx` if UI progress assumptions must be updated

Design direction:

- introduce limited concurrency across targets
- preserve sequential retries within the same target
- preserve a deterministic final results structure
- maintain existing callback-style progress reporting, adapting UI expectations where multiple targets may be in flight

### 3. Target catalog layer

Files expected to change:

- `src/config/targets.ts`
- `public/brand-logos/*`
- possibly related UI helpers if grouping metadata or card display fields need refinement

Design direction:

- add more representative sites on both the China-mainland and international sides
- keep challenge targets curated rather than simply making that group much larger
- prefer stable, recognizable, browser-probe-friendly targets
- use local brand assets when practical to reduce remote-logo fragility

### 4. Presentation layer

Files expected to change:

- `src/components/SummaryCards.tsx`
- `src/components/GroupPanel.tsx`
- `src/components/ResultRow.tsx` or its equivalent target-result component(s)
- `src/components/VisitorProfile.tsx`
- `src/styles.css`
- possibly `src/app/App.tsx` for layout composition adjustments

Design direction:

- redesign per-target result presentation into smaller refined cards
- preserve quick scanning while reducing visual bulk
- tighten spacing and improve hierarchy across group sections
- improve cross-device layout behavior from the start rather than treating mobile as a follow-up

### 5. Brand/icon layer

Files expected to change:

- `public/` favicon assets
- `index.html`

Design direction:

- add a network-map-inspired favicon
- prefer an SVG-first icon where supported
- wire the app icon so browser tabs and bookmark surfaces show a recognizable identity

## Visitor profile data design

### Required profile display goals

The visitor panel should try to expose, when available:

- public IPv4
- public IPv6
- country
- country code
- derived country flag emoji
- region/state/province
- city
- timezone
- ASN
- ASN organization
- ISP
- org
- carrier/operator-style label
- IPv6 reachability
- data-source count
- a concise summary string

### Type model direction

The `VisitorIpRecord` and `VisitorProfile` types should be expanded with optional fields rather than forcing all providers to supply everything.

Representative fields:

- `country`
- `countryCode`
- `countryFlag`
- `region`
- `city`
- `timezone`
- `asn`
- `asnOrg`
- `isp`
- `org`
- `carrier`
- `networkType`

The exact type names can be refined during implementation, but the model should separate:

- raw availability state
- normalized identity fields
- provenance / confidence context

### Provider strategy

Implementation should prefer a rich multi-source approach:

- retain existing sources that already work browser-side
- add more public IP intelligence sources if they are browser-fetchable and do not require secrets
- normalize provider-specific payloads into one common structure
- merge by best-available field, not by first-wins for the entire record

### Merge rules

Suggested merge behavior:

- keep the first valid address result per family
- derive `countryFlag` from `countryCode` where possible
- fill missing fields from later providers
- when providers disagree, prefer the more specific non-empty value over a blank or generic value
- avoid presenting low-confidence derived fields as guaranteed truth if no provider clearly returned them

### UI presentation rules

The visitor profile panel should use layered presentation:

#### Summary row

- IP address
- country + flag
- city/region
- IPv6 status

#### Detail row or detail grid

- ASN
- ISP
- org
- carrier
- source count
- possibly timezone if it fits cleanly

#### Fallback behavior

- do not fail if only a subset of fields is available
- hide absent fields rather than rendering noisy placeholders everywhere
- keep the summary understandable even when only IPv4 plus partial metadata is available

## Probe scheduling and performance design

### Scheduling objective

Reduce the total time of a full dashboard run without sacrificing the interpretability of results.

### Chosen scheduling model

The chosen model is:

- limited concurrency across different targets
- sequential retries within a target

This means:

- multiple sites may be under test simultaneously
- one site still performs attempt 1 → 2 → 3 → 4 → 5 in order
- per-target classification remains based on orderly local attempts

### Why this model

This model matches the user’s stability preference:

- it shortens total wall-clock time
- it avoids the noisiest version of full fan-out concurrency
- it keeps classification semantics easier to reason about

### Concurrency behavior expectations

Implementation should:

- define a conservative concurrency limit
- keep the limit configurable in code, not user-configurable in the UI for this phase
- preserve deterministic completion handling so the final result list remains reliable

### UI implications

The UI may no longer assume only one active target at a time.

Implementation should decide one of these approaches and keep it consistent:

- still show one “focus” target while background targets run concurrently
- or expose a small “multiple tests running” state without cluttering the dashboard

The preferred outcome is to preserve a clean progress narrative rather than exposing raw scheduler complexity.

## Target-catalog expansion design

### Expansion principle

Expand both the China-mainland and international/global coverage, but do so with representative curation instead of uncontrolled growth.

### Candidate categories

#### China-mainland additions

Potential additions include representatives from:

- ecommerce
- social/content
- short video
- cloud/platform
- portal/search ecosystems

Examples likely to be evaluated:

- Alibaba / Taobao / Tmall
- Douyin
- Weibo
- Xiaohongshu
- NetEase
- Pinduoduo

#### International/global additions

Potential additions include representatives from:

- consumer platform ecosystems
- streaming/media
- developer knowledge/community
- communications
- productivity/cloud

Examples likely to be evaluated:

- Apple
- Microsoft
- Netflix
- Discord
- Instagram
- WhatsApp Web
- Stack Overflow

### Challenge group policy

The challenge group should stay curated.

The implementation should not simply move every difficult global site into the challenge group. That group should remain a smaller, more interpretable set of known high-friction or higher-variance targets.

### Branding policy

For target logos:

- prefer local assets when practical
- keep a consistent visual treatment across cards
- reduce dependence on third-party favicon endpoints when possible

## Result-card redesign

### Primary objective

Transform each per-target test result into a smaller, more polished information card that remains readable on desktop and mobile.

### Visual goals

- smaller footprint than the current presentation
- clearer information hierarchy
- stronger polish and consistency
- less text noise
- better scanability across a grid of many sites

### Card structure

Each card should typically contain:

#### Header

- logo
- site name
- short location/category label

#### Main metrics

- primary status label
- success rate
- average latency when available

#### Supporting details

- a small tag cluster
- a short supporting line or emphasis hint
- optional progress or confidence indicator if it improves readability

### Layout behavior

#### Desktop

- use a refined grid with more consistent card sizing
- reduce excessive height variation
- preserve enough spacing to feel premium rather than cramped

#### Mobile

- prioritize legibility over density
- keep the key status and metrics visible without expansion
- avoid compressing cards into unreadably narrow tiles

### Style direction

The chosen visual style is “精致信息卡风” rather than a dense monitoring grid or a bare badge wall.

That implies:

- stronger hierarchy via type scale and spacing
- restrained but clear status coloring
- cleaner card chrome, shadows, borders, and corner rhythm
- shorter copy inside cards

## Visitor profile panel redesign

The richer data model requires a more deliberate panel layout.

### Panel structure

#### Top band

- summary sentence
- IPv4 / IPv6 presence state
- country + flag
- city / region

#### Detail band

- ASN
- ISP
- org
- carrier
- source count
- possibly timezone if it fits without clutter

#### Status treatment

Use compact badges or chips for:

- IPv6 reachability
- profile completeness / partial state
- number of contributing sources

### Presentation rule

The panel should feel like a network identity card, not a raw debugging dump.

## Favicon design

### Direction

Create an application favicon with a network-map aesthetic:

- abstract globe or map-like node layout
- route lines / arcs / connected points
- recognizable at tiny tab-icon sizes
- visually aligned with the dashboard’s network-observability identity

### Delivery expectations

Implementation should:

- add favicon asset(s) under `public/`
- wire them in `index.html`
- prefer SVG favicon support where practical
- keep the icon simple enough to survive small-size rendering

## Testing design

### Required automated coverage

1. **IP aggregation tests**
   - provider normalization
   - field-level merge behavior
   - flag derivation
   - partial-data fallback behavior

2. **Visitor profile UI tests**
   - full data rendering
   - partial data rendering
   - IPv6 unavailable state
   - richer metadata badges/fields

3. **Probe scheduling tests**
   - target-level concurrency actually occurs
   - retries within a single target remain sequential
   - final result aggregation remains correct

4. **Result-card rendering tests**
   - key status and metrics render in the new compact card structure
   - critical layout-affecting content remains present under typical states

### Verification commands

At minimum, implementation verification should run:

- `npm run test`
- `npm run build`

If the UI changes are significant, manual browser review should also validate:

- desktop layout
- mobile-like narrow viewport layout
- visitor profile readability
- card-density and spacing quality

## Risks and mitigations

### Risk: provider inconsistency

Different IP intel providers may disagree on org, ISP, or location granularity.

Mitigation:

- merge field-by-field
- prefer specificity over emptiness
- keep absent or conflicting fields optional rather than forcing false certainty

### Risk: too much concurrency causes noisier measurements

Mitigation:

- limit concurrency conservatively
- keep retries within each target sequential
- preserve current classification logic unless a clear issue appears

### Risk: target growth inflates runtime and UI clutter

Mitigation:

- expand with curation, not bulk
- redesign the result cards before finalizing the larger grid feel
- evaluate whether some candidate sites should be deferred if they add low diagnostic value

### Risk: richer cards become crowded on mobile

Mitigation:

- define hierarchy early
- keep card copy short
- prioritize status, success rate, latency, and identity signals over decorative text

## Implementation order

The implementation plan should follow this sequence:

1. Expand types for visitor profile and any scheduling metadata.
2. Extend IP provider config and normalization logic.
3. Implement richer visitor profile merging and summary building.
4. Upgrade the visitor profile panel UI.
5. Introduce limited target-level concurrency in the probe runner.
6. Expand the target catalog and local brand assets.
7. Redesign result cards and grouped layout.
8. Add and wire the new favicon assets.
9. Add and update tests.
10. Run verification and do final UI review.

## Success criteria

This enhancement set is successful when:

- the visitor profile visibly exposes richer identity data than today
- the dashboard completes a full run faster than the current fully sequential implementation while preserving stable per-target retry behavior
- the target set is broader and still balanced by group
- per-target cards look more compact and more polished on both desktop and mobile
- the app has a recognizable network-map-inspired favicon
- tests cover the new aggregation, scheduling, and UI behavior
