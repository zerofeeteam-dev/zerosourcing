# Web Page Ownership Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every single-page web section, helper, dataset, and stylesheet into its owning App Router route without changing copy, DOM, or visual values, and connect only the click actions whose destinations are proven by the current code.

**Architecture:** Shared components remain under `apps/web/components` only when they render on at least two routes. Route-only sections are inlined into their `page.tsx`, pure data moves to a sibling `content.ts`, and route-only CSS moves to the sibling `page.module.css`. Existing shared server/client boundaries stay intact except `/faq`, whose page must become a client component because its route-only navigation hooks are inlined.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Node test runner, pnpm.

## Global Constraints

- Read `AGENTS.md` and `design.md` in full before UI edits.
- Work from the current worktree and preserve all user changes; never use reset, checkout, or restore.
- Do not stage or commit.
- Do not change copy, DOM order, `data-node-id`, aria attributes, CSS declaration values, media queries, specificity, typography composes, color tokens, gaps, padding, radii, or grid breakpoints.
- Use a failing route `page.test.mjs` before production edits and verify the failure reason.
- Keep `Header`, `Footer`, `SectionShell`, `Icon`, `VideoBanner`, `BottomCtaBanner`, `FaqSection`, `ServicePortfolioSection`, `BusinessTypesSection`, `ProcessSection`, `ProofMetrics`, `ProofPartnerLogoBanner`, and `CardCarousel` shared.
- Keep shared `partner-logos.ts`; it renders on `/` and `/about`.
- Do not add duplicate `onClick` handlers to `Link`, form submission, or native `details/summary` behavior.
- Baseline screenshots already exist under `artifacts/screenshots/structure-refactor/before` at 1920, 1080, 640, and 390 px.

---

### Task 1: Company homepage ownership

**Files:**
- Create: `apps/web/app/service/company-homepage/content.ts`
- Create: `apps/web/app/service/company-homepage/page.module.css`
- Create: `apps/web/app/service/company-homepage/page.test.mjs`
- Modify: `apps/web/app/service/company-homepage/page.tsx`
- Delete: `apps/web/components/CompanyHomepageTypesSection.tsx`
- Delete: `apps/web/components/CompanyHomepageTypesSection.module.css`
- Delete: `apps/web/components/CompanyHomepageSeoGeoSection.tsx`
- Delete: `apps/web/components/CompanyHomepageSeoGeoSection.module.css`
- Delete: `apps/web/components/CompanyHomepageScopeSection.tsx`
- Delete: `apps/web/components/CompanyHomepageScopeSection.module.css`

**Interfaces:**
- Produces `companyHomepageTypes`, `companyHomepageScopeItems`, and `companyHomepageFaqs` as `as const` exports.
- `companyHomepageTypes` uses `IconName` and `satisfies` for icon validation.

- [ ] Write structure/content/design-value assertions that fail because route ownership does not exist yet.
- [ ] Run `node --test apps/web/app/service/company-homepage/page.test.mjs` and confirm failure is caused by the existing component imports/files and missing route files.
- [ ] Move pure data, inline the three sections in their current order, merge and collision-rename only CSS selectors, then delete the six component files.
- [ ] Re-run the route test until green.

### Task 2: About page ownership

**Files:**
- Create: `apps/web/app/about/content.ts`
- Create: `apps/web/app/about/page.module.css`
- Create: `apps/web/app/about/page.test.mjs`
- Modify: `apps/web/app/about/page.tsx`
- Modify: `apps/web/components/ProofMetrics.tsx` only to accept readonly data.
- Delete: the four `About*Section.tsx` files and their four CSS modules.

**Interfaces:**
- Produces `aboutPrinciples`, `aboutHowItems`, `aboutProofMetrics`, `aboutCompanyInfoRows`, and `aboutOffice` as JSX-free `as const` exports.
- Keeps `styles from "../page.module.css"` for shared `.page` and `.headerLayer`; uses `aboutStyles` only for route-owned CSS.

- [ ] Write and run the failing route test.
- [ ] Inline the four sections and preserve map iframe attributes and every approved node id.
- [ ] Merge route CSS with only these cross-file renames: intro/principles `.section`, principles/how `.copy`.
- [ ] Delete the eight route-only component files and re-run the route test.

### Task 3: Home page ownership

**Files:**
- Create: `apps/web/app/content.ts`
- Create: `apps/web/app/page.test.mjs`
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/page.module.css`
- Modify: `apps/web/components/FaqSection.tsx` to require page-owned items.
- Modify: `apps/web/components/partner-logos.ts` to own the shared logo type.
- Modify: `apps/web/components/ProofMetrics.tsx` only if Task 2 has not already widened the readonly input.
- Delete: the six home-only section TSX files and their six CSS modules.

**Interfaces:**
- Produces `homeProblemQuotes`, `homeProofMetrics`, `homeReviews`, `homeServiceScopeSteps`, `homePortfolios`, `homeInsights`, and `homeFaqs` as JSX-free `as const` exports.
- Keeps `partnerLogos` shared and passes `homeFaqs` explicitly to `FaqSection`.

- [ ] Write and run the failing route test.
- [ ] Inline the six sections and all home-only helper render functions without changing DOM order.
- [ ] Merge CSS with deterministic route-prefixed names only for actual cross-file collisions.
- [ ] Remove the default FAQ dataset from the shared component, delete the twelve route-only files, and re-run the route test.

### Task 4: FAQ route ownership

**Files:**
- Create: `apps/web/app/faq/content.ts`
- Create: `apps/web/app/faq/page.test.mjs`
- Modify: `apps/web/app/faq/page.tsx`
- Delete: `apps/web/app/faq/CategoryNav.tsx`
- Preserve without value changes: `apps/web/app/faq/page.module.css`

**Interfaces:**
- Produces all eight FAQ arrays plus `categories` and `navGroups` as readonly typed exports.
- Uses `IconName` and `satisfies` for category icon names.

- [ ] Write and run the failing route test.
- [ ] Add `"use client"`, inline the existing sticky/active/scroll logic, and import route data.
- [ ] Preserve `NAV_STICKY_TOP = 128`, 140 ms idle release, passive scroll listener, reduced-motion branch, cleanup, details/summary, dividers, and CSS unchanged.
- [ ] Delete `CategoryNav.tsx` and re-run the route test.

### Task 5: Proven click interactions

**Files:**
- Create: `apps/web/components/click-interactions.test.mjs`
- Modify: `apps/web/components/Header.tsx`
- Modify: `apps/web/components/ServiceCard.tsx`
- Modify: `apps/web/components/BusinessTypesSection.tsx`
- Modify: `apps/web/components/cta-events.ts`

**Interfaces:**
- Adds typed CTA actions for `/service/mvp`, `/service/app`, `/service/company-homepage`, and the existing quick contact flow.
- Converts the leaf `ServiceCard` to a client component and keeps serializable props across the boundary.

- [ ] Write assertions for native Service links and four ServiceCard action handlers, then confirm RED.
- [ ] Restore Header Service navigation to `Link` while retaining the mobile close handler and desktop focus dropdown.
- [ ] Add typed action ids to the four service cards and call `emitCtaClick` from their buttons.
- [ ] Leave the contact privacy `보기` button unchanged because no policy route, URL, or policy body exists to implement without guessing.
- [ ] Re-run the interaction test until green.

### Task 6: Integration and visual verification

- [ ] Run `node --test apps/web/**/*.test.mjs`.
- [ ] Run `pnpm --filter web lint`.
- [ ] Run `pnpm --filter web check-types`.
- [ ] Build from an isolated copy so the user's existing `next dev` process cannot share the production `.next` directory.
- [ ] Run `git diff --check` and search for every deleted component name/import.
- [ ] Start the isolated production build on a separate port and verify `/`, `/about`, `/service/company-homepage`, and `/faq` return HTTP 200.
- [ ] Capture all four routes at 1920, 1080, 640, and 390 px under `artifacts/screenshots/structure-refactor/after` and compare section order, card dimensions, line breaks, icons, spacing, and responsive columns.
- [ ] Browser-test Header Service navigation, all four ServiceCard actions, FAQ category scrolling/`aria-current`, and native FAQ expansion.
