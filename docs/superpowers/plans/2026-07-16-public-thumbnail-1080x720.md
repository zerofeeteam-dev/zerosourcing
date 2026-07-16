# Public 1080×720 Thumbnail Frames Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every public Blog and Portfolio thumbnail frame render at the 1080×720 (3:2) ratio on desktop and mobile.

**Architecture:** Keep `ManagedThumbnail` as the shared renderer; it already applies `object-fit: cover`. Replace each caller CSS module’s legacy ratio and fixed height with `aspect-ratio: 3 / 2`, preserving each card’s current width, fallback color, radius, and navigation markup.

**Tech Stack:** Next.js App Router, React, CSS Modules, Node `node:test`, pnpm.

## Global Constraints

- Every public Blog and Portfolio thumbnail frame must be `1080 / 720` (`3 / 2`) at every breakpoint.
- Keep `ManagedThumbnail`’s `object-fit: cover`, existing widths, 16px radius, and `var(--color-gray-100)` fallback color.
- Remove fixed thumbnail heights and `aspect-ratio: auto` overrides that can violate the ratio.
- Do not alter `apps/web/app/portfolio/[slug]/portfolio-detail.module.css` `.bannerFrame`; it is the separate Figma-specified 9:4 banner presentation, not a thumbnail.
- Do not change admin upload-box geometry; admin already normalizes newly saved image files to 1080×720.
- Follow `design.md` typography, token, icon, and layout rules.

---

### Task 1: Add a regression test and normalize home/service frames

**Files:**

- Create: `apps/web/app/thumbnail-aspect-ratio.test.mjs`
- Modify: `apps/web/app/page.module.css:529-534,628-631,656-658,681-686,739-743`
- Modify: `apps/web/components/ServicePortfolioSection.module.css:39-44`

**Interfaces:**

- Consumes: `ManagedThumbnail` caller classes `portfolioThumbnail`, `insightThumbnail`, and `thumbnail`.
- Produces: 3:2 frames for Home Portfolio cards, Home Blog insight cards, and service Portfolio cards.

- [x] **Step 1: Write the failing CSS contract test**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function rule(styles, selector) {
  const match = styles.match(
    new RegExp(`\\.${selector}\\s*\\{([\\s\\S]*?)\\n\\}`),
  );
  assert.ok(match, `${selector} rule must exist`);
  return match[1];
}

function assertThreeByTwo(styles, selector) {
  const css = rule(styles, selector);
  const selectorRules = styles.match(
    new RegExp(`\\.${selector}\\s*\\{[^}]*\\}`, "g"),
  );
  assert.match(css, /aspect-ratio:\s*3\s*\/\s*2;/);
  assert.ok(selectorRules, `${selector} rules must exist`);
  for (const selectorRule of selectorRules) {
    assert.doesNotMatch(selectorRule, /(?:^|\n)\s*height:/);
    assert.doesNotMatch(selectorRule, /aspect-ratio:\s*auto;/);
  }
}

test("home and service managed thumbnails use 1080 by 720 frames", async () => {
  const [home, service] = await Promise.all([
    readFile(new URL("./page.module.css", import.meta.url), "utf8"),
    readFile(
      new URL(
        "../components/ServicePortfolioSection.module.css",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  assertThreeByTwo(home, "portfolioThumbnail");
  assertThreeByTwo(home, "insightThumbnail");
  assertThreeByTwo(service, "thumbnail");
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter web exec node --test app/thumbnail-aspect-ratio.test.mjs`

Expected: FAIL because the current home/service frames use 325:200 and fixed 240px dimensions.

- [x] **Step 3: Replace legacy dimensions with the 3:2 frame**

```css
/* app/page.module.css */
.portfolioThumbnail,
.insightThumbnail {
  width: 100%;
  aspect-ratio: 3 / 2;
  border-radius: 16px;
  background: var(--color-gray-100);
}

/* Remove the 768px/560px portfolio and 640px insight height overrides. */

/* components/ServicePortfolioSection.module.css */
.thumbnail {
  width: 100%;
  aspect-ratio: 3 / 2;
  border-radius: 16px;
  background: var(--color-gray-100);
}
```

- [x] **Step 4: Run the focused test to verify it passes**

Run: `pnpm --filter web exec node --test app/thumbnail-aspect-ratio.test.mjs`

Expected: PASS with all three selectors at `aspect-ratio: 3 / 2` and no fixed height.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/page.module.css apps/web/components/ServicePortfolioSection.module.css apps/web/app/thumbnail-aspect-ratio.test.mjs
git commit -m "fix(web): normalize home thumbnail ratios"
```

### Task 2: Normalize all Blog thumbnail frames

**Files:**

- Modify: `apps/web/app/blog/blog.module.css:97-101,172-184,298-304,377-380,393-396,405-418`
- Modify: `apps/web/app/blog/[slug]/blog-detail.module.css:207-213,287-291`
- Modify: `apps/web/app/thumbnail-aspect-ratio.test.mjs`

**Interfaces:**

- Consumes: Blog `ManagedThumbnail` call sites in `BlogListClient.tsx` and `blog/[slug]/page.tsx`.
- Produces: 3:2 featured/fallback, top-carousel, list, and related-post frames.

- [x] **Step 1: Extend the test with every Blog thumbnail selector**

```js
test("blog managed thumbnails use 1080 by 720 frames", async () => {
  const [blog, detail] = await Promise.all([
    readFile(new URL("./blog/blog.module.css", import.meta.url), "utf8"),
    readFile(
      new URL("./blog/[slug]/blog-detail.module.css", import.meta.url),
      "utf8",
    ),
  ]);
  assertThreeByTwo(blog, "featuredThumbnail");
  assertThreeByTwo(blog, "featuredCard");
  assertThreeByTwo(blog, "topThumbnail");
  assertThreeByTwo(blog, "listThumbnail");
  assertThreeByTwo(detail, "relatedThumbnail");
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter web exec node --test app/thumbnail-aspect-ratio.test.mjs`

Expected: FAIL because Blog frames currently use 320px, 240px, 166px, and 152px fixed heights.

- [x] **Step 3: Keep widths but derive every Blog image height from 3:2**

```css
/* app/blog/blog.module.css */
.featuredThumbnail,
.topThumbnail,
.listThumbnail {
  aspect-ratio: 3 / 2;
}

/* Remove height declarations from these selectors, including 768px, 560px,
   and 480px responsive overrides; preserve existing widths and flex-basis. */

/* app/blog/[slug]/blog-detail.module.css */
.relatedThumbnail {
  width: 220px;
  aspect-ratio: 3 / 2;
  border-radius: 16px;
  background: var(--color-gray-100);
  flex: 0 0 220px;
}

/* At 480px preserve width: 100% and flex-basis: auto, but remove height. */
```

- [x] **Step 4: Run Blog regression tests**

Run: `pnpm --filter web exec node --test app/thumbnail-aspect-ratio.test.mjs app/blog/blog-featured-fallback.test.mjs app/blog/blog-list-card-768.test.mjs`

Expected: PASS; featured fallback remains accessible and Blog cards retain their current markup.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/blog/blog.module.css 'apps/web/app/blog/[slug]/blog-detail.module.css' apps/web/app/thumbnail-aspect-ratio.test.mjs
git commit -m "fix(blog): normalize public thumbnail ratios"
```

### Task 3: Normalize Portfolio index thumbnail frames and verify the public app

**Files:**

- Modify: `apps/web/app/portfolio/page.module.css:126-133,298-303,341-343,380-385,409-410`
- Modify: `apps/web/app/thumbnail-aspect-ratio.test.mjs`

**Interfaces:**

- Consumes: `thumbnail` and `cardThumbnail` passed to `ManagedThumbnail` by `PortfolioListClient.tsx`.
- Produces: 3:2 featured and grid-card frames at desktop, tablet, and mobile sizes.

- [x] **Step 1: Extend the test with Portfolio index selectors and breakpoint guards**

```js
test("portfolio index thumbnails use 1080 by 720 frames at every breakpoint", async () => {
  const styles = await readFile(
    new URL("./portfolio/page.module.css", import.meta.url),
    "utf8",
  );
  assertThreeByTwo(styles, "thumbnail");
  assertThreeByTwo(styles, "cardThumbnail");
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter web exec node --test app/thumbnail-aspect-ratio.test.mjs`

Expected: FAIL because the Portfolio feature frame uses 520:320 and responsive rules use fixed heights and `aspect-ratio: auto`.

- [x] **Step 3: Set 3:2 frames and remove all conflicting responsive heights**

```css
.thumbnail {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  border-radius: 16px;
  background: var(--color-gray-100);
}

.cardThumbnail {
  width: 100%;
  aspect-ratio: 3 / 2;
  border-radius: 16px;
  background: var(--color-gray-100);
}

/* Remove max-height: 320px plus every breakpoint-specific height or
   aspect-ratio override for .thumbnail and .cardThumbnail. */
```

- [x] **Step 4: Inventory every public thumbnail call site and run all checks**

Run: `rg -n "<ManagedThumbnail" apps/web --glob '*.tsx' && pnpm --filter web check-types && pnpm --filter web test && pnpm --filter web build && git diff --check`

Expected: each call site maps to a tested 3:2 CSS class; type checks, tests, production build, and whitespace check all pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/portfolio/page.module.css apps/web/app/thumbnail-aspect-ratio.test.mjs
git commit -m "fix(portfolio): normalize public thumbnail ratios"
```

## Self-Review

- **Spec coverage:** Tasks 1–3 cover every current public Blog/Portfolio `ManagedThumbnail` call site: home Portfolio, home Blog insight, service Portfolio, Blog featured/top/list/related, and Portfolio featured/grid.
- **Intentional exclusion:** Portfolio detail `bannerFrame` remains Figma’s 9:4 presentation because it is not a thumbnail; its stored source asset already follows the admin’s 1080×720 normalization.
- **Placeholder scan:** Every task contains exact files, selectors, commands, expected outcomes, and implementation snippets.
- **Type consistency:** CSS-only geometry changes preserve the existing `ManagedThumbnail` and public-content interfaces.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-16-public-thumbnail-1080x720.md`. Two execution options:

1. **Subagent-Driven (recommended)** — Dispatch a fresh subagent per task and review between tasks.
2. **Inline Execution** — Execute tasks in this session with checkpoints.
