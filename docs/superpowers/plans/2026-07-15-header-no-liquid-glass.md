# Header No-Liquid-Glass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Align the shared site header with Figma node 611:5728 by removing the Liquid Glass treatment while retaining the ordinary, low-opacity blurred header surface shown in the revised design.

**Architecture:** Header already has the Liquid Glass runtime, SVG filter, and refraction dependencies removed, so this is a focused visual-contract update rather than a component rewrite. Keep the existing navigation, CTAs, dropdown, and mobile menu intact; update the Figma trace ID and make Header.module.css own the flat surface, exact desktop spacing, and no-shadow rule. A small source-contract test will prevent the removed runtime treatment from returning accidentally.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Node test runner, pnpm.

## Figma Findings

- The revised desktop header is node 611:5728: 80px high, 40px radius, 40px left padding, 20px right padding, and no visible outline.
- The frame has no Liquid Glass refraction, inset highlights, saturation boost, or drop shadow. It retains only Figma's ordinary rgba(255, 255, 255, 0.04) fill with a 10px backdrop blur; this is a simple surface treatment, not the removed SVG/filter effect.
- Its logo, primary navigation, chevron, and two 52px gradient CTAs match the existing shared component. The only layout discrepancy is the left-group gap: Figma uses 32px, while the implementation currently uses 24px.
- The existing ZerosourcingLogo.svg is already the correct 168 × 24 brand asset, and every needed product icon is already registered in Icon.tsx; no asset or icon work is needed.

## Global Constraints

- Follow design.md: use the existing typography classes, color tokens, shared Icon, shared Button variant="gradient", and parent gap for related spacing.
- Keep all existing routes, active-state logic, service-dropdown behavior, CTA event dispatch, and mobile-menu behavior unchanged.
- Do not reintroduce GlassSurface, glassFilter, liquidGlassFilter, SVG displacement filters, color-mix highlight stacks, saturation boosts, or theme-specific glass variables.
- Retain Figma's basic 10px CSS backdrop blur and 4% white fill; remove the current external shadow and header outline so the header reads as the revised flat surface.
- Do not change packages/ui/src/button.tsx, apps/web/components/Icon.tsx, the logo asset, page-level header wrappers, or unrelated dirty worktree files.
- Add no dependencies. Stage only the files named in this plan.

---

### Task 1: Lock the revised header surface into the shared component

**Files:**

- Create: apps/web/components/Header.surface.test.mjs
- Modify: apps/web/components/Header.tsx
- Modify: apps/web/components/Header.module.css
- Test: apps/web/components/Header.surface.test.mjs

**Interfaces:**

- Consumes: the existing Header(): ReactElement API, Button, Icon, Figma node 611:5728, and the existing CSS-module selectors.
- Produces: the same Header DOM and interaction API with the revised non-refraction desktop visual contract; Header.surface.test.mjs verifies that contract directly from the source files.

- [ ] **Step 1: Write the failing surface-contract test**

Create apps/web/components/Header.surface.test.mjs with this exact test. It verifies both the Figma trace ID and the distinction between the retained basic blur and the removed Liquid Glass implementation.

~~~js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const headerPath = new URL("./Header.tsx", import.meta.url);
const stylesPath = new URL("./Header.module.css", import.meta.url);

function firstRule(css, selector) {
  const match = css.match(
    new RegExp("\\." + selector + "\\s*\\{([\\s\\S]*?)\\n\\}", "u"),
  );

  assert.ok(match, "Missing ." + selector + " rule");
  return match[1];
}

test("Header uses Figma's non-liquid-glass surface", async () => {
  const [header, styles] = await Promise.all([
    readFile(headerPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);
  const headerRule = firstRule(styles, "header");
  const leftRule = firstRule(styles, "left");

  assert.match(
    header,
    /<header className=\{styles\.header\} data-node-id="611:5728">/u,
  );
  assert.doesNotMatch(
    header,
    /useLayoutEffect|useRef|GlassSurface|ensureLiquidGlassFilter|supportsGlassRefraction|glassFilter|liquidGlassFilter/u,
  );
  assert.doesNotMatch(headerRule, /\bborder:/u);
  assert.match(headerRule, /border-radius: 40px;/u);
  assert.match(headerRule, /background-color: rgb\(255 255 255 \/ 4%\);/u);
  assert.match(headerRule, /-webkit-backdrop-filter: blur\(10px\);/u);
  assert.match(headerRule, /backdrop-filter: blur\(10px\);/u);
  assert.doesNotMatch(
    headerRule,
    /box-shadow:|color-mix|saturate|url\(|--c-glass|--glass-reflex/u,
  );
  assert.match(leftRule, /gap: 32px;/u);
});
~~~

- [ ] **Step 2: Run the test and confirm the expected RED result**

Run:

~~~bash
node --test apps/web/components/Header.surface.test.mjs
~~~

Expected: FAIL. The current source still has node ID 269:32520, an opaque white background, a 0 6px 16px shadow, and a 24px left-group gap.

- [ ] **Step 3: Apply the minimal Figma-alignment changes**

In apps/web/components/Header.tsx, update only the design trace attribute; do not change component state, links, buttons, or imports.

~~~tsx
<header className={styles.header} data-node-id="611:5728">
~~~

In apps/web/components/Header.module.css, replace the surface declarations at the top of .header and the left-group gap with the following. Do not add any box-shadow or Liquid Glass variables.

~~~css
.header {
  --header-content: var(--color-gray-800);
  --header-action: var(--color-brand-500);

  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: min(1360px, 100%);
  height: 80px;
  margin: 0 auto;
  padding: 0 20px 0 40px;
  border-radius: 40px;
  background-color: rgb(255 255 255 / 4%);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

.left {
  display: flex;
  align-items: center;
  gap: 32px;
}
~~~

- [ ] **Step 4: Run the focused regression checks and confirm GREEN**

Run:

~~~bash
node --test apps/web/components/Header.surface.test.mjs apps/web/components/click-interactions.test.mjs
~~~

Expected: all three tests pass. The new test locks the visual-source contract, and the two existing interaction tests confirm that the desktop and mobile Service links retain their native-link behavior.

- [ ] **Step 5: Commit only the completed header change**

Run:

~~~bash
git add apps/web/components/Header.surface.test.mjs apps/web/components/Header.tsx apps/web/components/Header.module.css
git commit -m "refactor(header): remove liquid glass treatment"
~~~

Expected: one conventional commit containing only the header source, CSS, and its focused regression test. Do not stage any pre-existing admin or content-management changes.

### Task 2: Validate shared-header quality across its responsive modes

**Files:**

- Verify: apps/web/components/Header.tsx
- Verify: apps/web/components/Header.module.css
- Verify: apps/web/components/Header.surface.test.mjs

**Interfaces:**

- Consumes: the completed shared-header surface and all existing page-level .headerLayer wrappers.
- Produces: static and browser evidence that the visual-only change does not regress any shared header route or responsive behavior.

- [ ] **Step 1: Run web linting**

Run:

~~~bash
pnpm --filter web lint
~~~

Expected: exit code 0 with no ESLint warnings or errors.

- [ ] **Step 2: Run type validation**

Run:

~~~bash
pnpm --filter web check-types
~~~

Expected: exit code 0 after Next.js type generation and TypeScript checking.

- [ ] **Step 3: Build the production bundle**

Run:

~~~bash
pnpm --filter web build
~~~

Expected: Next.js completes the production build without CSS-module or route-generation failures.

- [ ] **Step 4: Inspect the shared header in a browser at the affected breakpoints**

Run the existing local web app and inspect /, /service/mvp, and /blog at these viewport widths:

- 1440px: the header is fixed 20px from the top, maxes at 1360px, has no outline, a 40px radius, 40px/20px horizontal padding, a subtle 10px blur, and no drop-shadow, refraction, sheen, or distortion.
- 1024px: the desktop navigation and both 52px CTAs remain visible; the logo-to-navigation gap is 32px; the Service menu opens by hover and remains reachable by keyboard focus.
- 1023px and 390px: the desktop navigation and CTAs are hidden, the 64px mobile header and menu button remain usable, and opening/closing the menu preserves its existing link destinations and focusable close button.

Expected: only the surface and desktop left-group spacing change. Navigation destinations, active link color, CTA clicks, dropdown behavior, and mobile-menu behavior remain unchanged.

- [ ] **Step 5: Confirm the commit scope before handoff**

Run:

~~~bash
git show --stat --oneline HEAD
git status --short
~~~

Expected: HEAD contains only the three Task 1 files. Any unrelated pre-existing worktree changes remain unstaged and untouched.

## Self-Review

- **Spec coverage:** Task 1 maps the Figma surface, removes the Liquid Glass-only effects, corrects the 24px-to-32px layout difference, and preserves all header functionality. Task 2 verifies the visual result across the shared routes and the existing responsive switch.
- **Placeholder scan:** The plan names every touched file, includes the complete regression test and replacement CSS, and supplies exact commands and expected outcomes.
- **Type consistency:** The plan changes no TypeScript API. Header remains the exported client component, and the new test reads its existing source and CSS-module selectors only.
