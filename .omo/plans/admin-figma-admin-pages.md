# admin-figma-admin-pages - Work Plan

## TL;DR (For humans)
**What you'll get:** A Supabase-backed admin surface for login, Portfolio, Blog, and Link Pay based on the supplied Figma frames. It includes guarded routes, list empty/data states, create/edit/delete flows, blog thumbnail upload, and agent-run QA evidence.

**Why this approach:** The current admin is a single static Vite screen, while the approved requirement is a real admin app with no separate backend. Supabase becomes the auth, database, storage, and authorization boundary, and the old localStorage/API-handoff plan is superseded.

**What it will NOT do:** It will not add a backend/API server, payment processor integration, Tailwind, public `apps/web` content consumption, or speculative CMS features outside the supplied Figma nodes.

**Effort:** Large
**Risk:** Medium - the UI is straightforward, but Supabase schema/RLS/storage and auth QA must be correct before the admin can be trusted.
**Decisions to sanity-check:** Supabase-only persistence, `admin_users` RLS gate, JSON settings for nested Figma rows, app-local routing instead of React Router, Link Pay as manual payment-record management only.

Your next move: start implementation with `$start-work .omo/plans/admin-figma-admin-pages.md`, or ask for a high-accuracy plan review first. Full execution detail follows below.

---

> TL;DR (machine): Large, Medium risk. Replace the static admin stub with Supabase Auth/RLS/Storage-backed admin routes for login, portfolio, blog, and linkpay; no server, no Tailwind, no public-web integration.

## Scope
### Must have
- Replace the current `app/admin` static dashboard with routed admin pages for:
  - `/login`
  - `/portfolio`
  - `/portfolio/new`
  - `/portfolio/:slug`
  - `/blog`
  - `/blog/new`
  - `/blog/:slug`
  - `/link-pay`
  - `/link-pay/new`
  - `/link-pay/:id`
- Implement the supplied Figma page inventory:
  - Login: `77:6522`
  - Portfolio list data/empty: `77:6842`, `77:7660`
  - Portfolio create/edit: `77:7182`, `77:7421`
  - Blog list empty/data: `77:5431`, `77:3833`
  - Blog create/upload-preview edit: `77:4857`, `77:9550`
  - Link Pay list empty/data/create: `210:9309`, `210:8534`, `210:8874`
- Supabase-only data boundary:
  - Add browser Supabase client using anon key only.
  - Add SQL migration files in-repo for tables, constraints, RLS, storage bucket policies, and seed/admin setup notes.
  - Use Supabase Auth email/password login.
  - Use `public.admin_users` as the admin authorization gate.
  - Never use a service-role key in frontend code.
- Admin UI behavior:
  - Session restore, logout, public-only login, protected admin routes, non-admin denial.
  - List filtering/search by the controls visible in Figma.
  - Empty states and populated table states.
  - Create, temporary-save/draft where Figma shows it, publish/status persistence, edit, and delete where Figma exposes delete.
  - Blog thumbnail PNG/JPEG/WEBP upload up to 50MB, local preview, remove, storage cleanup on replacement/delete.
  - Link Pay stores manual payment records only: status, customer, payment name, amount, optional nullable payment URL. It does not create a real payable checkout link.
- Design rules:
  - Read and follow `design.md` before implementation.
  - Use `design-system.css` typography classes through CSS module `composes: ... from global`.
  - Use `var(--color-...)` only when the exact hex already exists in `design-system.css`.
  - Use parent `gap` for spacing, explicit DOM divider elements, and accessible form labels.
  - Skip Figma `Chrome Desktop`.
  - Use inline/admin-local `currentColor` SVG icons for `app/admin` unless a shared icon package is created; do not import app-private `apps/web` icon components into `app/admin`.
- Verification:
  - `pnpm --filter admin check-types`
  - `pnpm --filter admin lint`
  - `pnpm --filter admin build`
  - Supabase local or remote test project verification for auth/RLS/storage.
  - Browser QA through the real admin app, including denied and successful paths.
  - Final source sweep for Figma MCP URLs.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- No separate backend server, API routes, BFF, serverless functions, or "later backend endpoint" handoff.
- No `localStorage` session or local repository persistence. `docs/admin-implementation-plan.md` lines 54-60 and 195-217 are superseded by this plan.
- No Tailwind installation or Tailwind-generated Figma code pasted into the app.
- No Figma MCP asset URLs in JSX, CSS, config, data, docs, or plan evidence.
- No implementation of Figma nodes named `Chrome Desktop`.
- No public `apps/web` integration in this plan. Existing static arrays in `apps/web/app/blog/blog-posts.ts` and `apps/web/app/portfolio/portfolio-items.ts` remain untouched unless a later plan explicitly makes public pages consume Supabase.
- No payment processor, checkout session creation, payment gateway SDK, or real payable URL generation.
- No generic CRUD framework, admin meta-framework, role matrix UI, analytics, bulk actions, pagination, WYSIWYG editor dependency, or speculative CMS sections beyond the visible Figma controls.
- No importing `apps/web` private components into `app/admin`.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: none for formal unit/E2E tests because the project note says UI implementation testing is omitted. Still run typecheck, lint, build, Supabase verification, source search, and real browser QA. If the executor adds non-trivial non-UI logic, add the smallest assert/self-check or test for that logic only.
- Evidence location: every todo writes `.omo/evidence/task-<N>-admin-figma-admin-pages.md` with exact commands, pass/fail output summaries, browser URLs, screenshots paths when available, and any blocked credential/environment notes.
- Required command checks:
  - `pnpm --filter admin check-types`
  - `pnpm --filter admin lint`
  - `pnpm --filter admin build`
  - `rg -n "https://www\\.figma\\.com/api/mcp/asset|https://www\\.figma\\.com/api/" app/admin apps packages`
- Required Supabase checks:
  - Run local Supabase through `supabase start` or `npx supabase@latest start` when available, then apply migrations and seed an admin user.
  - If local Supabase cannot run because Docker or credentials are missing, do not claim complete. Record the blocker in evidence and use a user-provided test Supabase project before final QA.
  - Verify an authenticated non-admin cannot read/write protected tables.
  - Verify an admin can read/write protected tables and upload/delete blog thumbnails.
- Required browser QA:
  - Start the app with `pnpm --filter admin dev`.
  - Use the browser at `http://localhost:3002`.
  - Drive login denied, login success, logout, refresh session restore, portfolio list/form, blog list/form/upload, linkpay list/form, validation failures, duplicate slug, upload invalid file, and delete/cancel flows.

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.
- Wave 1 - foundation:
  - Todo 1: Supabase schema, env, and dependency contract.
  - Todo 2: app-local route map, Supabase client, auth state, and guards.
  - Todo 3: admin shell and shared UI primitives.
  - Todo 4: typed data repositories and error/state helpers.
  - Todo 5: login/logout screen and auth QA.
- Wave 2 - domain implementation:
  - Todo 6: portfolio list/form CRUD.
  - Todo 7: blog list/form CRUD and Storage upload.
  - Todo 8: Link Pay list/form CRUD.
  - Todo 9: cross-page polish, responsive behavior, accessibility, and source policy.
  - Todo 10: full verification evidence and handoff.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | None | 2, 4, 5, 6, 7, 8, 10 | 3 |
| 2 | 1 | 5, 6, 7, 8, 10 | 3 |
| 3 | None | 5, 6, 7, 8, 9 | 1, 2 after interfaces are known |
| 4 | 1, 2 | 6, 7, 8, 10 | 3 |
| 5 | 1, 2, 3 | 6, 7, 8, 10 | 4 after auth client shape is set |
| 6 | 1, 2, 3, 4, 5 | 9, 10 | 7, 8 |
| 7 | 1, 2, 3, 4, 5 | 9, 10 | 6, 8 |
| 8 | 1, 2, 3, 4, 5 | 9, 10 | 6, 7 |
| 9 | 6, 7, 8 | 10 | None |
| 10 | 1-9 | Final verification wave | None |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [ ] 1. Supabase schema, RLS, storage, env, and dependency contract
  What to do / Must NOT do: Add the minimum Supabase foundation needed by the admin. Add `@supabase/supabase-js` to `app/admin`. Add `app/admin/.env.example` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_STORAGE_BUCKET=blog-thumbnails`, and optional `VITE_PUBLIC_SITE_URL` only for displaying stored optional payment URLs. Add SQL migrations under `supabase/migrations/` for `admin_users`, `portfolios`, `blog_posts`, `link_payments`, updated-at triggers, `deleted_at` soft-delete columns on the three domain tables, constraints, indexes, RLS policies, and a public-read/admin-write `blog-thumbnails` bucket. Add seed/setup notes under `supabase/README.md` or `supabase/seed.sql` for creating a Supabase Auth admin user and inserting its `auth.users.id` into `admin_users`. Do not add any backend server, service-role key, API routes, or localStorage fallback.
  Parallelization: Wave 1 | Blocked by: None | Blocks: 2, 4, 5, 6, 7, 8, 10
  References (executor has NO interview context - be exhaustive): user clarified Supabase-only on 2026-07-08; `.omo/drafts/admin-figma-admin-pages.md:17-31`; `app/admin/package.json:1-25`; `docs/admin-implementation-plan.md:54-60` and `docs/admin-implementation-plan.md:195-217` are superseded; `apps/web/app/blog/blog-posts.ts:13-104` and `apps/web/app/portfolio/portfolio-items.ts:11-80` show public site still uses static arrays and is out of scope.
  Acceptance criteria (agent-executable): `pnpm install --lockfile-only` or the repo's normal package install updates lockfile consistently; `pnpm --filter admin check-types` reaches at least the same or better state after dependency/config changes; migration SQL contains `enable row level security`, policies using `admin_users`, unique slug constraints for portfolio/blog, amount check for link payments, and storage policy for `blog-thumbnails`; evidence includes a schema summary and the exact Supabase command attempted.
  QA scenarios (name the exact tool + invocation): Happy: run `supabase start` or `npx supabase@latest start`, apply migrations, seed one admin user, then run SQL checks proving admin rows and protected tables exist. Failure: sign in as an authenticated user not present in `admin_users` and verify protected table select/insert is denied by RLS. Evidence `.omo/evidence/task-1-admin-figma-admin-pages.md`.
  Commit: Y | feat(admin): add supabase schema and env contract

- [ ] 2. App-local routing, Supabase client, auth state, and guards
  What to do / Must NOT do: Replace the one-screen `App` flow with a tiny app-local route map and navigation helper using `window.location.pathname`, `history.pushState`, and `popstate`. Do not add React Router unless this route map becomes insufficient. Add `src/lib/supabase.ts`, `src/lib/auth.ts`, typed session/admin-check helpers, loading/denied states, public-only `/login`, protected admin routes, redirect authenticated users from `/login` to `/portfolio`, redirect unauthenticated users to `/login`, and logout. Do not use localStorage for session; use Supabase Auth session APIs only.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 5, 6, 7, 8, 10
  References (executor has NO interview context - be exhaustive): `app/admin/src/App.tsx:13-68`; `app/admin/src/main.tsx:1-11`; `docs/admin-implementation-plan.md:26-41`; `.omo/drafts/admin-figma-admin-pages.md:17-23`; `app/admin/package.json:6-15`.
  Acceptance criteria (agent-executable): `pnpm --filter admin check-types` passes; direct visits to `/portfolio`, `/blog`, and `/link-pay` route through the guard; direct visit to `/login` while authenticated redirects to `/portfolio`; no `localStorage` usage exists in `app/admin/src` for auth or data.
  QA scenarios (name the exact tool + invocation): Happy: start `pnpm --filter admin dev`, open `http://localhost:3002/login`, sign in with seeded admin, verify URL changes to `/portfolio`, refresh and stay authenticated. Failure: sign out or clear Supabase session, open `/portfolio`, verify redirect to `/login`; sign in as non-admin and verify an access-denied state with no protected data. Evidence `.omo/evidence/task-2-admin-figma-admin-pages.md`.
  Commit: Y | feat(admin): add supabase auth routing guard

- [ ] 3. Admin shell and shared UI primitives
  What to do / Must NOT do: Build the admin shell matching the Figma product surface: header nav with `Portfolio`, `Blog`, `Link Pay`, active state, content region, footer if present inside the product frame, table shell, filters/search row, empty state, status chips, form section, field rows, bottom action bar, upload control shell, segmented `HTML 작성` / `TEXT Editer 작성` switch using corrected internal naming where needed, and accessible buttons. Use app-local CSS modules and `design-system.css` typography composition. Build app-local admin Button/Input/Select/Table/Upload primitives for this implementation; do not import `@repo/ui` into `app/admin` because current shared components use inline hex/fixed widths or starter-card behavior. For `app/admin`, use inline/admin-local `currentColor` SVG icons rather than importing app-private `apps/web` icon components.
  Parallelization: Wave 1 | Blocked by: None | Blocks: 5, 6, 7, 8, 9
  References (executor has NO interview context - be exhaustive): `design.md:54-60`, `design.md:61-103`, `design.md:117-169`; `design-system.css:1-220`; `app/admin/src/App.css:16-176`; `packages/ui/package.json:5-7`; `packages/ui/src/button.tsx:8-19`; `packages/ui/src/input.tsx:21-66`; `packages/ui/src/select.tsx:14-33` and `packages/ui/src/select.tsx:286-357`; `packages/ui/src/card.tsx:3-27`.
  Acceptance criteria (agent-executable): CSS modules for admin text styles use `composes: ... from global` for typography; source search in `app/admin/src` shows no raw Figma API URLs; all labels are real `<label>` or `aria-label`; table empty state and status chip components can render portfolio/blog/linkpay examples; `pnpm --filter admin lint` passes for the changed files.
  QA scenarios (name the exact tool + invocation): Happy: render `/portfolio`, `/blog`, and `/link-pay` with seeded data and verify nav active state, filters, table shell, status chips, and empty state can all be seen by toggling filters to no results. Failure: keyboard-tab through nav, filter controls, table detail links, and bottom buttons; verify focus is visible and order is usable. Evidence `.omo/evidence/task-3-admin-figma-admin-pages.md`.
  Commit: Y | feat(admin): add admin shell primitives

- [ ] 4. Typed Supabase repositories, validation, and failure states
  What to do / Must NOT do: Add small typed repository modules for portfolios, blog posts, link payments, and thumbnails. Keep them boring: no generic CRUD framework. Add shared validation helpers for slug, amount, required fields, thumbnail type/size, and draft/publish requirements. Add typed error mapping for duplicate slug, RLS denied, auth expired, network failure, upload failure, and save failure. Add double-submit prevention in mutations. Add rollback cleanup: if thumbnail upload succeeds but row save fails, delete the uploaded object; if replacing a thumbnail succeeds and row update succeeds, delete the old object; if row update fails, keep the old object and show an error.
  Parallelization: Wave 1 | Blocked by: 1, 2 | Blocks: 6, 7, 8, 10
  References (executor has NO interview context - be exhaustive): `docs/admin-implementation-plan.md:62-107`; `docs/admin-implementation-plan.md:219-228`; `.omo/drafts/admin-figma-admin-pages.md:24-31` and `.omo/drafts/admin-figma-admin-pages.md:48-57`; `apps/web/app/blog/blog-posts.ts:1-11`; `apps/web/app/portfolio/portfolio-items.ts:69-80`.
  Acceptance criteria (agent-executable): repository modules expose explicit functions such as `listPortfolios`, `createPortfolio`, `updatePortfolio`, `deletePortfolio`, not one generic dynamic CRUD function; slug validation rejects uppercase/space/slash; amount validation stores integer KRW; upload helper rejects non-PNG/JPEG/WEBP and files over 50MB; `pnpm --filter admin check-types` passes with no `as any`, `@ts-ignore`, or `@ts-expect-error`.
  QA scenarios (name the exact tool + invocation): Happy: run a small admin browser flow or temporary dev-only driver through create/update/list/delete for each domain against seeded Supabase. Failure: attempt duplicate blog slug, invalid portfolio slug, negative/non-numeric Link Pay amount, oversized or invalid thumbnail file; verify inline errors and no duplicate rows/stray storage objects. Evidence `.omo/evidence/task-4-admin-figma-admin-pages.md`.
  Commit: Y | feat(admin): add typed supabase repositories

- [ ] 5. Login and logout page
  What to do / Must NOT do: Implement the Figma login page `로그인_P`: email, password, submit button, validation, loading, auth error, and redirect behavior. Use Supabase Auth email/password. Add logout control in authenticated shell. Do not add sign-up, password reset, social login, or remember-me unless later requested.
  Parallelization: Wave 1 | Blocked by: 1, 2, 3 | Blocks: 6, 7, 8, 10
  References (executor has NO interview context - be exhaustive): Figma `77:6522`; `docs/admin-implementation-plan.md:111-118`; `.omo/drafts/admin-figma-admin-pages.md:17`; `design.md:54-60`; `app/admin/src/App.tsx:13-68`.
  Acceptance criteria (agent-executable): `/login` renders the email/password form; empty submit shows required errors; invalid credentials show a non-destructive error; valid admin credentials redirect to `/portfolio`; authenticated `/login` redirects to `/portfolio`; logout returns to `/login`; `pnpm --filter admin build` passes.
  QA scenarios (name the exact tool + invocation): Happy: browser open `http://localhost:3002/login`, fill seeded admin email/password, submit, confirm `/portfolio` and logout. Failure: submit empty form, wrong password, and non-admin account; verify field errors/auth error/denied state without protected data rendering. Evidence `.omo/evidence/task-5-admin-figma-admin-pages.md`.
  Commit: Y | feat(admin): implement supabase login

- [ ] 6. Portfolio list, create, edit, draft/publish, and delete
  What to do / Must NOT do: Implement portfolio pages from the supplied list and form frames. Fields: status, type (`application`, `company_homepage`, `mvp`), slug, title, company/customer name, product description, estimate label, development period, repeatable core features, repeatable work scopes, content mode, content, SEO description, landing published state, service published state, `landing_sections` JSON, `service_sections` JSON. Use corrected visible submit copy `등록하기`, not Figma typo `동륵하기`. `상세` opens edit route by slug. Delete is available only in edit mode, must ask for confirmation, and soft-deletes by setting `deleted_at`; lists and detail lookups exclude soft-deleted rows. Do not integrate public portfolio pages.
  Parallelization: Wave 2 | Blocked by: 1, 2, 3, 4, 5 | Blocks: 9, 10 | Can parallelize with: 7, 8
  References (executor has NO interview context - be exhaustive): Figma `77:6842`, `77:7660`, `77:7182`, `77:7421`; `docs/admin-implementation-plan.md:119-137`; `apps/web/app/portfolio/portfolio-items.ts:7-80`; `.omo/drafts/admin-figma-admin-pages.md:19` and `.omo/drafts/admin-figma-admin-pages.md:53-56`.
  Acceptance criteria (agent-executable): `/portfolio` renders populated rows from Supabase and empty state when filtered to no rows; type/status/search filters work together; `/portfolio/new` creates draft and published records; `/portfolio/:slug` edits existing records; duplicate slug shows inline error; refresh after save keeps Supabase data; no `apps/web` static array is modified.
  QA scenarios (name the exact tool + invocation): Happy: browser create a portfolio with two features and two scopes, save draft, publish, return to list, search by title, open detail, edit estimate, refresh and confirm persistence. Failure: duplicate slug, invalid slug, missing required title/company, delete confirmation cancel then confirm; verify list state and RLS behavior. Evidence `.omo/evidence/task-6-admin-figma-admin-pages.md`.
  Commit: Y | feat(admin): implement portfolio management

- [ ] 7. Blog list, create, edit, thumbnail Storage upload, draft/publish, and delete
  What to do / Must NOT do: Implement blog pages from the supplied list/form/upload-preview frames. Fields: status, type (`insight`, `mvp`, `application`, `company_homepage`), title, slug, published date using native date input first, thumbnail alt, thumbnail storage path/public URL, content mode, content, SEO description, landing published state, banner published state, `landing_sections` JSON, `banner_sections` JSON. Thumbnail upload accepts PNG/JPEG/WEBP up to 50MB, renders local preview before save, supports remove, and cleans storage on replacement/delete. Use corrected `등록하기`. Do not add WYSIWYG or public blog integration.
  Parallelization: Wave 2 | Blocked by: 1, 2, 3, 4, 5 | Blocks: 9, 10 | Can parallelize with: 6, 8
  References (executor has NO interview context - be exhaustive): Figma `77:5431`, `77:3833`, `77:4857`, `77:9550`; `docs/admin-implementation-plan.md:138-155`; `apps/web/app/blog/blog-posts.ts:1-104`; `.omo/drafts/admin-figma-admin-pages.md:20` and `.omo/drafts/admin-figma-admin-pages.md:53-56`.
  Acceptance criteria (agent-executable): `/blog` renders populated rows from Supabase and empty state when filtered to no rows; type/status/search filters work; `/blog/new` creates draft/published records; `/blog/:slug` edits existing records; thumbnail preview/remove matches Figma states; invalid file type/size blocks upload; duplicate slug shows inline error; refresh after save keeps data and image.
  QA scenarios (name the exact tool + invocation): Happy: browser create blog post with WEBP thumbnail and alt text, save draft, publish, return to list, filter/search, edit thumbnail, refresh and confirm new thumbnail. Failure: missing title, duplicate slug, invalid date, invalid thumbnail type, oversized file, upload success plus forced row-save failure if practical; verify cleanup/error messaging. Evidence `.omo/evidence/task-7-admin-figma-admin-pages.md`.
  Commit: Y | feat(admin): implement blog management

- [ ] 8. Link Pay list, create, detail/edit, and status management
  What to do / Must NOT do: Implement Link Pay pages from supplied frames. Fields: status (`pending`, `paid`), customer name, payment name, amount KRW integer, optional payment URL nullable. The create form shows customer name, payment name, amount with trailing `원`; it stores numeric amount only. `상세` opens `/link-pay/:id` and reuses the same form in detail/edit mode. Because no backend server/payment provider exists, do not create checkout sessions, QR codes, PG SDK calls, or claim a real payable URL was generated. A nullable `payment_url` may be displayed/copied only if already stored or manually entered in a future UI.
  Parallelization: Wave 2 | Blocked by: 1, 2, 3, 4, 5 | Blocks: 9, 10 | Can parallelize with: 6, 7
  References (executor has NO interview context - be exhaustive): Figma `210:9309`, `210:8534`, `210:8874`; `docs/admin-implementation-plan.md:157-173`; `.omo/drafts/admin-figma-admin-pages.md:21`; `.omo/drafts/admin-figma-admin-pages.md:48`.
  Acceptance criteria (agent-executable): `/link-pay` renders populated rows and empty state; status/search filters work; `/link-pay/new` creates a pending record; `/link-pay/:id` edits customer/payment/amount/status; amount formats as Korean comma-separated KRW in list and stores an integer; no payment SDK/package/API route is added.
  QA scenarios (name the exact tool + invocation): Happy: browser create Link Pay record for `CJ제일제당`, amount `99999999`, confirm list shows `99,999,999`, mark paid, refresh and confirm status. Failure: empty customer/payment name, non-numeric amount, negative amount, non-admin RLS write denial; verify inline errors and no row mutation. Evidence `.omo/evidence/task-8-admin-figma-admin-pages.md`.
  Commit: Y | feat(admin): implement link pay management

- [ ] 9. Cross-page polish, responsiveness, accessibility, and source-policy cleanup
  What to do / Must NOT do: Make the implemented admin coherent across all pages. Apply Figma typography/spacing/color within repo design rules, not Tailwind. Ensure desktop Figma layout is primary and tablet/mobile degrade to usable single-column or horizontally scrollable tables without text overlap. Add loading, empty, error, disabled, saving, and success states. Ensure all forms have labels above inputs, helper/error text below, visible focus, keyboard-usable select/menu/upload/remove buttons, no placeholder-as-label, no button text wrap on desktop, and contrast that passes practical admin use. Remove Figma MCP URLs and do not implement `Chrome Desktop`.
  Parallelization: Wave 2 | Blocked by: 6, 7, 8 | Blocks: 10
  References (executor has NO interview context - be exhaustive): `design.md:54-60`, `design.md:117-169`; frontend taste rules loaded for form contrast/loading/empty/error/accessibility, but dashboard/landing rules are out of scope; `.omo/drafts/admin-figma-admin-pages.md:34-67`; `app/admin/src/App.css:149-176`.
  Acceptance criteria (agent-executable): `pnpm --filter admin lint` passes; `rg -n "https://www\\.figma\\.com/api/mcp/asset|https://www\\.figma\\.com/api/" app/admin apps packages` returns no matches; browser at 1280, 768, and 375 widths shows no overlapping text/buttons in login, list, and form pages; keyboard tab order reaches every interactive control.
  QA scenarios (name the exact tool + invocation): Happy: browser screenshots or visual notes for `/login`, `/portfolio`, `/portfolio/new`, `/blog`, `/blog/new`, `/link-pay`, `/link-pay/new` at 1280/768/375. Failure: force empty lists, Supabase network/RLS error, saving disabled state, and invalid forms; verify each state is visible and recoverable. Evidence `.omo/evidence/task-9-admin-figma-admin-pages.md`.
  Commit: Y | polish(admin): finalize responsive admin states

- [ ] 10. Full verification evidence and implementation handoff
  What to do / Must NOT do: Run the full verification sequence after all implementation tasks. Do not claim complete from code review alone. Capture command outputs, Supabase/RLS proof, browser QA notes/screenshots, and the final source sweep in `.omo/evidence/task-10-admin-figma-admin-pages.md`. Record any environment blockers exactly; do not fake Supabase or browser results. If there are unrelated dirty worktree changes, leave them alone and name them in evidence.
  Parallelization: Final local task | Blocked by: 1-9 | Blocks: final verification wave
  References (executor has NO interview context - be exhaustive): `app/admin/package.json:6-11`; `package.json:4-18`; `pnpm-workspace.yaml:1-4`; `.omo/drafts/admin-figma-admin-pages.md:57`; project AGENTS instruction forbids Figma API URL leftovers.
  Acceptance criteria (agent-executable): Run and record `pnpm --filter admin check-types`, `pnpm --filter admin lint`, `pnpm --filter admin build`, Supabase admin/non-admin RLS checks, storage upload/delete check, and `rg -n "https://www\\.figma\\.com/api/mcp/asset|https://www\\.figma\\.com/api/" app/admin apps packages`; all pass or any pre-existing/environment blocker is named with exact output.
  QA scenarios (name the exact tool + invocation): Happy: browser end-to-end path logs in as admin, creates/edits/deletes one portfolio, one blog with thumbnail, and one Link Pay record, then refreshes and confirms persistence. Failure: browser logs in as non-admin or unauthenticated user and verifies denial/redirect; attempts invalid slug, duplicate slug, invalid upload, invalid amount, and canceled delete. Evidence `.omo/evidence/task-10-admin-figma-admin-pages.md`.
  Commit: Y | test(admin): verify supabase admin flows

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
  - Verify every Todo 1-10 acceptance criterion has evidence.
  - Reject if any implementation adds a backend/API route, localStorage persistence, Tailwind, payment processor, public `apps/web` integration, Figma `Chrome Desktop`, or Figma API URL.
- [ ] F2. Code quality review
  - Review changed files for type safety, no `as any`, no `@ts-ignore`, no speculative abstraction, and no app-private `apps/web` imports into `app/admin`.
  - Confirm `@repo/ui` is not imported into `app/admin`.
- [ ] F3. Real manual QA
  - Drive the browser through login/logout, denied access, every list, every form, upload preview/remove, invalid input, duplicate slug, delete cancel/confirm, and refresh persistence.
  - Reject if QA is only screenshots or command output without interaction.
- [ ] F4. Scope fidelity
  - Confirm public `apps/web` static arrays remain out of scope and untouched.
  - Confirm Link Pay is manual record/status management only and does not imply real payment collection.
  - Confirm the final user handoff names any missing Supabase credentials/local Docker blocker instead of claiming success.

## Commit strategy
- Prefer one commit per Todo if the user asks for commits.
- Commit order should follow dependencies:
  1. `feat(admin): add supabase schema and env contract`
  2. `feat(admin): add supabase auth routing guard`
  3. `feat(admin): add admin shell primitives`
  4. `feat(admin): add typed supabase repositories`
  5. `feat(admin): implement supabase login`
  6. `feat(admin): implement portfolio management`
  7. `feat(admin): implement blog management`
  8. `feat(admin): implement link pay management`
  9. `polish(admin): finalize responsive admin states`
  10. `test(admin): verify supabase admin flows`
- Do not include unrelated dirty worktree files in any commit. Before each commit, run `git status --short` and stage only the Todo's files.
- Do not commit `.env.local`, Supabase secrets, service-role keys, uploaded test assets with private data, or browser screenshots containing credentials.

## Success criteria
- `.omo/evidence/task-1-admin-figma-admin-pages.md` through `.omo/evidence/task-10-admin-figma-admin-pages.md` exist and contain the required command/QA proof.
- The admin can be started with `pnpm --filter admin dev` and visited at `http://localhost:3002`.
- Supabase Auth is the only session source; no localStorage session fallback exists.
- RLS prevents non-admin authenticated users from reading/writing protected admin data.
- Admin users can manage Portfolio, Blog, and Link Pay records from the browser.
- Blog thumbnail upload, preview, replacement, remove, and storage cleanup are verified.
- Portfolio/blog slugs are unique and validated.
- Link Pay amount is stored as integer KRW and displayed formatted.
- `pnpm --filter admin check-types`, `pnpm --filter admin lint`, and `pnpm --filter admin build` pass, or any blocker is proven external/pre-existing with exact output.
- `rg -n "https://www\\.figma\\.com/api/mcp/asset|https://www\\.figma\\.com/api/" app/admin apps packages` returns no matches.
- Final browser QA covers login denied/success, logout, empty/data states, create/edit/delete, validation errors, upload errors, and refresh persistence.
