# Liquid Glass Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recreate the supplied CodePen liquid-glass three-theme switcher as an isolated `/liquid-glass` route without changing existing production pages.

**Architecture:** Keep `page.tsx` as a Server Component that owns metadata and the article demo, and isolate native radio behavior plus previous-direction tracking in one small Client Component. Route-scoped CSS reproduces the 244x70 glass geometry, theme variables, refraction, highlights, and 400ms toggle motion while existing homepage and shared `GlassSurface` code remain untouched.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Node test runner.

## Global Constraints

- Read and follow `design.md` before UI changes.
- Preserve all pre-existing uncommitted changes.
- Do not change the homepage, header, video banner, or shared glass implementation.
- Use accessible radio labels, visible keyboard focus, and reduced-motion handling.
- Use `/liquid-glass` as the isolated reproduction route.

---

### Task 1: Lock the reproduction contract with a failing test

**Files:**
- Create: `apps/web/app/liquid-glass/page.test.mjs`
- Modify: `apps/web/components/Icon.tsx`
- Test: `apps/web/app/liquid-glass/page.test.mjs`

**Interfaces:**
- Consumes: Files under `apps/web/app/liquid-glass/`.
- Produces: A source-level contract for route metadata, three radio options, exact geometry, SVG displacement wiring, theme selectors, accessibility, and reduced-motion fallback.

- [x] **Step 1: Write the failing test**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const route = new URL("./", import.meta.url);
const read = (name) => readFile(new URL(name, route), "utf8");

test("liquid glass route reproduces the three-option switcher", async () => {
  const [page, switcher, styles, icons] = await Promise.all([
    read("page.tsx"),
    read("LiquidGlassSwitcher.tsx"),
    read("page.module.css"),
    read("../../components/Icon.tsx"),
  ]);

  assert.match(page, /<LiquidGlassSwitcher \/>/);
  assert.equal(switcher.match(/type="radio"/g)?.length, 3);
  assert.match(switcher, /aria-label="Light theme"/);
  assert.match(switcher, /aria-label="Dark theme"/);
  assert.match(switcher, /aria-label="Dim theme"/);
  assert.match(icons, /"theme-light"/);
  assert.match(icons, /"theme-dark"/);
  assert.match(icons, /"theme-dim"/);
  assert.match(styles, /width: 244px/);
  assert.match(styles, /height: 70px/);
  assert.match(styles, /translate: 76px 0/);
  assert.match(styles, /translate: 152px 0/);
  assert.match(styles, /backdrop-filter:[\s\S]*blur\(8px\)[\s\S]*saturate/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /prefers-reduced-motion/);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test apps/web/app/liquid-glass/page.test.mjs`

Expected: FAIL because the `/liquid-glass` route files do not exist.

---

### Task 2: Implement the exact switcher route

**Files:**
- Create: `apps/web/app/liquid-glass/LiquidGlassSwitcher.tsx`
- Create: `apps/web/app/liquid-glass/page.tsx`
- Create: `apps/web/app/liquid-glass/page.module.css`
- Modify: `apps/web/components/Icon.tsx`
- Modify: `apps/web/app/liquid-glass/page.test.mjs`

**Interfaces:**
- Consumes: `ensureGlassFilter()` and `supportsGlassRefraction()` from `apps/web/components/glassFilter.ts`.
- Produces: `LiquidGlassSwitcher(): ReactElement` and the `/liquid-glass` route.

- [x] **Step 1: Register the three theme icons**

Add `theme-light`, `theme-dark`, and `theme-dim` entries to `IconName` and the `icons` map, using the supplied CodePen path data with `fill="currentColor"`.

- [x] **Step 2: Implement the Client Component**

Use a fieldset with three native radio inputs (`light`, `dark`, `dim`), track the previous option from the fieldset's native `change` event so CSS can choose the stretch origin, and apply the existing displacement filter to the 244x70 fieldset after layout. Every radio receives an explicit `aria-label` and the shared sun/moon/dim SVGs are `aria-hidden`.

- [x] **Step 3: Implement the Server Component page**

Export route metadata, render `<LiquidGlassSwitcher />`, and render the same long-form article/image composition used to make content visibly pass behind the fixed glass surface.

- [x] **Step 4: Implement route-scoped visual parity**

Reproduce the CodePen dimensions and values: 244x70 container, 68px options, 8px gaps, 84px toggle, 0/76/152px positions, 400ms cubic-bezier movement, light/dark/dim variables, translucent `color-mix()` fills, layered inset shadows, 8px backdrop blur, and 150%/200% saturation. Compose repository typography utilities, add `:focus-visible`, and disable scale/translation animation under `prefers-reduced-motion: reduce`.

- [x] **Step 5: Run test to verify it passes**

Run: `node --test apps/web/app/liquid-glass/page.test.mjs`

Expected: PASS.

- [x] **Step 6: Run route quality checks**

Run: `pnpm --filter web lint`

Expected: PASS with zero warnings.

Run: `pnpm --filter web check-types`

Expected: PASS.

---

### Task 3: Verify the visible result

**Files:**
- Verify: `apps/web/app/liquid-glass/page.tsx`
- Verify: `apps/web/app/liquid-glass/LiquidGlassSwitcher.tsx`
- Verify: `apps/web/app/liquid-glass/page.module.css`

**Interfaces:**
- Consumes: The completed `/liquid-glass` route.
- Produces: Desktop and mobile visual evidence plus verified radio interaction.

- [x] **Step 1: Start or reuse the web dev server**

Run the existing `web` dev server on port 3000 when available; if another valid server owns that port, reuse it instead of starting a duplicate process.

- [x] **Step 2: Capture the route**

Run: `pnpm screenshot -- http://127.0.0.1:3000/liquid-glass --output artifacts/liquid-glass`

Expected: PNG captures at 1920, 1080, 640, and 390px.

- [x] **Step 3: Verify interaction**

Confirm light, dark, and dim radio selection changes the page palette and moves the toggle to 0px, 76px, and 152px respectively; confirm keyboard focus is visible.

- [x] **Step 4: Final regression check**

Run: `node --test apps/web/app/liquid-glass/page.test.mjs apps/web/components/Header.glass.test.mjs apps/web/components/VideoBanner.liquid-glass.test.mjs`

Expected: all tests pass.
