# Header Liquid Glass Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current shared header surface styling with the exact light Liquid Glass treatment proven on `/liquid-glass`, while preserving every header link, CTA, dropdown, and mobile-menu behavior.

**Architecture:** Keep `Header` as the existing Client Component and retain its content structure. Remove the `GlassSurface` wrapper so none of the current global `zsGlass` gradient/rim/dispersion styles apply, then wire the existing cached `ensureGlassFilter()` helper directly to the header and let `Header.module.css` own the CodePen-derived fill, highlights, shadows, blur, and fallback.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Node test runner.

## Global Constraints

- Follow `design.md` typography, color, icon, and spacing rules.
- Preserve the existing logo, navigation routes, CTA events, service dropdown behavior, and mobile menu behavior.
- Do not modify `GlassSurface`, `glassFilter`, or the `/liquid-glass` reference route.
- Preserve all unrelated uncommitted work and do not create a commit.
- Verify the visible homepage in the existing browser after static checks pass.

---

### Task 1: Replace the header surface contract

**Files:**
- Modify: `apps/web/components/Header.glass.test.mjs`
- Modify: `apps/web/components/Header.tsx`
- Modify: `apps/web/components/Header.module.css`
- Test: `apps/web/components/Header.glass.test.mjs`

**Interfaces:**
- Consumes: `ensureGlassFilter(options): string` and `supportsGlassRefraction(): boolean` from `apps/web/components/glassFilter.ts`.
- Produces: The existing `Header(): ReactElement` API with unchanged navigation and CTA behavior, rendered through a native `<header>` element.

- [x] **Step 1: Write the failing surface-contract test**

Update `Header.glass.test.mjs` to require a native `<header>`, direct cached-refraction wiring, the exact 8px blur and 150% saturation, the CodePen-derived 12% glass fill and inset-shadow stack, and the absence of `GlassSurface` / `zsGlass` styling.

- [x] **Step 2: Run the test and verify RED**

Run: `node --test apps/web/components/Header.glass.test.mjs`

Expected: FAIL because `Header.tsx` still imports and renders `GlassSurface` and the module does not yet own the new surface visuals.

- [x] **Step 3: Implement the direct Liquid Glass header**

Replace `<GlassSurface as="header">` with `<header ref={headerRef}>`. In `useLayoutEffect`, size the cached SVG displacement filter from the actual header dimensions, apply `blur(8px) url(...) saturate(1.5)`, and refresh it through a debounced `ResizeObserver`. Keep the CSS fallback active when URL-backed backdrop filters are unsupported.

- [x] **Step 4: Replace the header surface CSS**

Give `.header` the same light-palette variables, `color-mix()` translucent fill, layered inset highlights/shadows, 8px blur, 150% saturation, and pill radius used by `/liquid-glass`. Keep only the existing structural layout and responsive rules needed for its children.

- [x] **Step 5: Run focused tests and verify GREEN**

Run: `node --test apps/web/components/Header.glass.test.mjs apps/web/components/click-interactions.test.mjs apps/web/app/liquid-glass/page.test.mjs`

Expected: all tests pass, proving the surface changed while navigation and the reference route remain intact.

### Task 2: Verify build quality and the live homepage

**Files:**
- Verify: `apps/web/components/Header.tsx`
- Verify: `apps/web/components/Header.module.css`

**Interfaces:**
- Consumes: The completed header surface.
- Produces: Static and browser evidence for the shared header across routes.

- [x] **Step 1: Run lint and type checks**

Run: `pnpm --filter web lint`

Run: `pnpm --filter web check-types`

Expected: both commands exit successfully with no warnings or type errors.

- [x] **Step 2: Run the production build**

Run: `pnpm --filter web build`

Expected: Next.js generates all routes successfully.

- [x] **Step 3: Verify the visible result**

Open `http://localhost:3000/`, confirm the header owns the new Liquid Glass surface, verify the Service dropdown and mobile breakpoint remain usable, and confirm there are no browser console errors.
