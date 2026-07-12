# Blog 390px Responsive Alignment Implementation Plan

> **For Codex:** Execute these steps in order. The task is intentionally sequential: capture the baseline, set the shared carousel contract, apply page-local responsive rules, then verify all target widths.

**Goal:** Align the blog page with Figma node `403:17357` at 390px while preserving the existing 1080px, 640px, 768px, and 1079px behavior. All new visual changes must be scoped to `max-width: 480px` unless a shared component needs a narrowly named responsive input.

**Baseline captures:**

- `/private/tmp/zerosourcing-blog-original-1080.png` — 1080px viewport
- `/private/tmp/zerosourcing-blog-original-640.png` — 640px viewport
- `/private/tmp/zerosourcing-blog-original-390.png` — 390px viewport

## Confirmed visual deltas at 390px

| Area | Current source | Figma 390px target | Responsive change |
| --- | --- | --- | --- |
| Header outer gutter | `16px` from the 768px rule | `20px` | Override only at `max-width: 480px` |
| Top carousel card | `346px` card width and `240px` thumbnail height | `330px` card width and `220px` thumbnail height | Add an opt-in carousel mobile width and use it only for the blog |
| Top-card text block | `padding: 8px 0 0`; inherited 21px description line height | `8px 0`; 14/20 description | Page-local 480px override |
| List card image | `180px` height below 560px | `240px` height | Page-local 480px override |
| Footer policy links | `12px` vertical gap | `16px` vertical gap | Correct existing 480px footer override |
| Intro line wrapping | One deliberate break plus natural wrapping | Three stable Figma lines at 390px | Add a 480px-only line-break structure only if the implementation test proves the source cannot retain the target lines through normal width rules |

The shared glass-header treatment is deliberately not changed in this pass: it is shared by all pages and exceeds the requested 480px responsive scope. The blog-owned outer gutter is adjusted independently.

## 1. Establish the shared carousel responsive contract

**Files:**

- Modify: `apps/web/components/CardCarousel.tsx`
- Modify: `apps/web/components/CardCarousel.module.css`
- Modify: `apps/web/components/CardCarousel.test.mjs`

1. Write a failing source-contract test that requires an optional `mobileItemWidth` prop and a corresponding CSS custom property.
2. Add `mobileItemWidth?: number` to `CardCarouselProps`.
3. Emit `--carousel-item-width-mobile` only when the prop is supplied; otherwise retain `minItemWidth` as the effective width.
4. At `max-width: 480px`, use the mobile width only in carousel mode. Keep the existing `max-width: 1080px` 8px gap rule unchanged.
5. Do not alter carousel conversion logic: it must still use `minItemWidth`, so cards remain an equal-width row whenever that is possible above 480px.

## 2. Apply the blog-only 480px rules

**Files:**

- Modify: `apps/web/app/blog/page.tsx`
- Modify: `apps/web/app/blog/blog.module.css`
- Modify: `apps/web/app/blog/blog-390-responsive.test.mjs` (new)

1. Write a failing source-contract test for the 390px values below.
2. Pass `mobileItemWidth={330}` to the blog top-post `CardCarousel`; retain the existing `minItemWidth={346}` for 481px and above.
3. In a new `@media (max-width: 480px)` block, set:

   ```css
   .headerLayer { padding-inline: 20px; }
   .topThumbnail { height: 220px; }
   .topCopy { padding-block: 8px; }
   .topDescription { line-height: 20px; }
   .listThumbnail { height: 240px; }
   ```

4. Verify the current intro naturally resolves to the target three-line form at 390px after the layout width changes. If it does not, add semantic spans in `page.tsx` and show them only below 480px; do not insert desktop-only formatting changes.
5. Do not modify 640px or 1080px-specific values while making this section.

## 3. Correct the shared footer’s already-scoped mobile gap

**Files:**

- Modify: `apps/web/components/Footer.module.css`

1. Replace the existing `max-width: 480px` `.policyGroup` gap of `12px` with `16px`.
2. Keep all desktop footer behavior and mobile address visibility unchanged.

## 4. Verification

**Automated checks, in order:**

1. `node apps/web/components/CardCarousel.test.mjs`
2. `node apps/web/app/blog/blog-390-responsive.test.mjs`
3. Existing blog source-contract tests:
   - `blog-brand-mark.test.mjs`
   - `blog-list-card-768.test.mjs`
   - `blog-list-description.test.mjs`
   - `blog-title-768.test.mjs`
4. `pnpm --filter web check-types`
5. `pnpm --filter web lint`
6. `pnpm --filter web build`

**Visual checks:** Reload the local blog after the code change and capture 1080px, 640px, and 390px. Confirm:

- 1080px: desktop navigation, existing card width, and no 390px overrides.
- 640px: existing tablet card and list-item values are unchanged.
- 390px: 20px outer gutter; 330×220 top cards; 240px list images; 16px policy-link gap; no horizontal overflow.

## Safety / rollback

- Preserve all unrelated dirty files in the working tree.
- The only shared API addition is optional and default-preserving; callers that do not supply `mobileItemWidth` remain visually unchanged.
- If a source-contract or type check fails, stop at that failure, correct the narrow change, then rerun from the failing check onward.
