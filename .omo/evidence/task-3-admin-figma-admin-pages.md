# Todo 3 Evidence - Admin Shell And Shared UI Primitives

## Scope

- Worktree: `/Users/sangkun/nocoders/zerosourcing-v2`
- Todo: `.omo/plans/admin-figma-admin-pages.md` Todo 3, lines 147-153.
- Allowed write paths used:
  - `app/admin/src/components/**`
  - `.omo/evidence/task-3-admin-figma-admin-pages.md`
- Forbidden write paths not edited: `app/admin/src/App.tsx`, `app/admin/package.json`, `pnpm-lock.yaml`, `supabase/**`, `app/admin/.env.example`.

## Baseline / First Proof

- `app/admin/src/App.tsx:1-11` had hard-coded `metrics` and `requests` arrays.
- `app/admin/src/App.tsx:13-68` rendered one static dashboard screen directly in `App`, with global class names such as `admin-shell`, `sidebar`, `metric-card`, and `table-panel`.
- `app/admin/src/App.tsx:18-24` only exposed the old dashboard/inquiry/project/settlement nav labels, not the required `Portfolio`, `Blog`, `Link Pay` product nav.
- `app/admin/src/App.css:16-176` owned the global shell/list styling for that static screen. No reusable admin component layer existed under `app/admin/src/components` before this Todo.
- `find app/admin/src -maxdepth 4 -type d | sort` before edits returned only `app/admin/src`.
- `packages/ui/src/button.tsx:27-40`, `packages/ui/src/input.tsx:21-66`, `packages/ui/src/select.tsx:286-357`, and `packages/ui/src/card.tsx:3-27` confirm `@repo/ui` is not a fit for this Todo: inline style objects, fixed widths, inline hex usage, and starter-card behavior. I did not import it.

## Thought Experiments

- Importing `@repo/ui` would be faster, but it would violate Todo 3 because those components carry inline hex/fixed-width/starter behavior. App-local primitives are the smaller correct boundary.
- Editing `App.tsx` would allow a browser showcase, but Todo 3 explicitly excludes that file and Todo 2/5 own route/app integration. I kept primitives exported and recorded browser QA as pending integration.
- A single form primitive file initially looked simpler, but the post-write pure-LOC check found `AdminForm.tsx` at 261 lines. I split `AdminEditorModeSegmentedControl` into `AdminEditorMode.tsx`; final files are all below 250 pure LOC.
- Building custom combobox behavior now would add keyboard/focus risk before route data exists. Native `select`, `radio`, and `file` controls keep the accessibility contract stable for later page tasks.
- No Figma MCP asset was needed for these primitives. Icons are inline app-local SVGs using `currentColor`.

## Implemented

- `app/admin/src/components/admin/AdminShell.tsx`
  - `AdminShell`, `AdminPageHeader`, default `adminNavItems` with `Portfolio`, `Blog`, `Link Pay`.
- `app/admin/src/components/admin/AdminButton.tsx`
  - Accessible `AdminButton` and required-label `AdminIconButton`.
- `app/admin/src/components/admin/AdminTable.tsx`
  - `AdminTableShell`, `AdminFilterBar`, `AdminSearchField`, generic typed `AdminTable`, `AdminEmptyState`, `AdminStatusChip`.
- `app/admin/src/components/admin/AdminForm.tsx`
  - `AdminFormSection`, real-label field rows, text/textarea/select fields, bottom action bar.
- `app/admin/src/components/admin/AdminEditorMode.tsx`
  - Segmented `HTML 작성` / `TEXT Editer 작성` control with internal mode values `html` and `text`.
- `app/admin/src/components/admin/AdminUpload.tsx`
  - Upload control shell with real file input, visible file trigger, accepted-file text, preview slot, remove action.
- `app/admin/src/components/admin/icons.tsx`
  - Admin-local inline SVG icons using `currentColor`.
- `app/admin/src/components/admin/*.module.css`
  - CSS Modules using `composes: ... from global` for typography and palette tokens for exact matches.
- `app/admin/src/components/index.ts`
  - Public export surface for later Todo integration.

## Commands

### Typecheck

Command:

```bash
pnpm --filter admin check-types
```

Result: pass.

Output summary:

```text
> admin@0.1.0 check-types /Users/sangkun/nocoders/zerosourcing-v2/app/admin
> tsc --noEmit
```

### Lint

Command:

```bash
pnpm --filter admin lint
```

Result: pass.

Output summary:

```text
> admin@0.1.0 lint /Users/sangkun/nocoders/zerosourcing-v2/app/admin
> eslint --max-warnings 0
```

### Figma MCP URL Sweep

Command:

```bash
rg -n "https://www\\.figma\\.com/api/mcp/asset|https://www\\.figma\\.com/api/" app/admin/src
```

Result: no matches. `rg` exited 1 with empty output.

### Forbidden Import / Escape Hatch Sweep

Command:

```bash
rg -n "@repo/ui|apps/web|tailwind|Chrome Desktop|as any|@ts-ignore|@ts-expect-error|https://www\\.figma\\.com/api" app/admin/src
```

Result: no matches. `rg` exited 1 with empty output.

### Typography Composition Proof

Command:

```bash
rg -n "composes: .* from global" app/admin/src/components
```

Result: pass. Matches include:

```text
app/admin/src/components/admin/AdminButton.module.css:2:  composes: pretendard-bold-14 from global;
app/admin/src/components/admin/AdminTable.module.css:24:  composes: pretendard-bold-18 from global;
app/admin/src/components/admin/AdminShell.module.css:19:  composes: pretendard-bold-20 from global;
app/admin/src/components/admin/AdminUpload.module.css:14:  composes: pretendard-bold-14 from global;
app/admin/src/components/admin/AdminForm.module.css:17:  composes: pretendard-bold-18 from global;
```

### Direct Font Declaration Sweep

Command:

```bash
rg -n "font-family|font-size|font-weight|line-height|letter-spacing" app/admin/src/components --glob '*.module.css'
```

Result: no matches. `rg` exited 1 with empty output.

### Accessibility Shape Probe

Command:

```bash
rg -n "<label|htmlFor=|aria-label=|type=\"button\"|type=\"file\"|type=\"radio\"" app/admin/src/components/admin
```

Result: pass. Relevant matches:

```text
app/admin/src/components/admin/AdminButton.tsx:74:      aria-label={ariaLabel}
app/admin/src/components/admin/AdminTable.tsx:122:      <label className={styles.filterLabel} htmlFor={id}>
app/admin/src/components/admin/AdminTable.tsx:146:      <table aria-label={ariaLabel} className={styles.table}>
app/admin/src/components/admin/AdminUpload.tsx:55:        <label className={styles.label} htmlFor={id}>
app/admin/src/components/admin/AdminUpload.tsx:72:            type="file"
app/admin/src/components/admin/AdminUpload.tsx:74:          <label className={styles.trigger} htmlFor={id}>
app/admin/src/components/admin/AdminForm.tsx:110:        <label className={styles.label} htmlFor={htmlFor}>
app/admin/src/components/admin/AdminEditorMode.tsx:50:              type="radio"
app/admin/src/components/admin/AdminShell.tsx:53:      <aside aria-label="Admin navigation" className={styles.sidebar}>
```

### File Size Check

Command:

```bash
for file in app/admin/src/components/admin/*.tsx app/admin/src/components/admin/*.module.css app/admin/src/components/index.ts; do printf '%s ' "$file"; awk '!/^[[:space:]]*$/ && !/^[[:space:]]*(\/\/|#|--)/' "$file" | wc -l; done
```

Result: pass. Largest files:

```text
app/admin/src/components/admin/AdminForm.tsx      211
app/admin/src/components/admin/AdminTable.module.css      187
app/admin/src/components/admin/AdminTable.tsx      177
app/admin/src/components/admin/AdminForm.module.css      166
```

## QA Evidence

- Component/render-shaped QA only. Route integration is intentionally pending because this Todo does not allow editing `app/admin/src/App.tsx`.
- TypeScript compiles every exported component under `app/admin/src/components/**`, so later Todo pages can import them without type errors.
- Accessibility API review:
  - Form primitives require `label` and `id`; rendered controls use real `<label htmlFor=...>`.
  - Search input has a real label, not placeholder-only labeling.
  - `AdminIconButton` requires `ariaLabel`.
  - Button defaults use `type="button"` unless explicitly overridden.
  - Editor mode uses native radio inputs for keyboard behavior.
  - Upload uses a real file input and visible trigger label.
  - Table primitive requires `ariaLabel`.

## Adversarial Classes

- `dirty_worktree`: applies. `git status --short` showed unrelated changes in `apps/web/**`, `packages/ui/src/radio.tsx`, workspace config files, and untracked `supabase/`, `docs/`, and `apps/web/app/api/`. I did not touch those paths.
- `stale_state`: applies. I re-read `app/admin/src/App.tsx` after implementation and reran final typecheck/lint/source sweeps after the editor-control split.
- `misleading_success_output`: applies. Lint/typecheck pass does not prove routed browser behavior because the primitives are not mounted by the current static `App.tsx`. I recorded browser QA as pending Todo 2/5 integration.
- `Figma URL stale asset`: applies. No Figma MCP asset URLs were added; the final source sweep over `app/admin/src` returned no matches.
- Supabase/RLS/storage classes: not applicable to Todo 3; no Supabase code was edited.
- Dev-server cleanup class: not applicable; no dev server was started.

## Cleanup

- No dev server was started, so no process needed stopping.
- No package install was run.
- No commit was made.
- `pnpm --filter admin build` was not run because this Todo only required lint/check-types/source sweeps and a build would write `app/admin/dist`, outside the owned write paths.

## Risks / Follow-up Boundary

- The primitives are not visible in the current app until a later Todo wires route pages into `App.tsx`.
- Browser visual QA and keyboard-tab verification through `/portfolio`, `/blog`, and `/link-pay` remain pending Todo 2/5/6-8 integration.
- The visible segmented control label keeps the task-specified `TEXT Editer 작성`; the internal type-safe value is `text`.
