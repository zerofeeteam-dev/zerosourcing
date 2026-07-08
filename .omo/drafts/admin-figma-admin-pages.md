---
slug: admin-figma-admin-pages
status: planned
intent: clear
review_required: false
pending-action: user may start work from .omo/plans/admin-figma-admin-pages.md or request high-accuracy review
approach: Replace the current single-screen admin stub with Figma-grounded Vite React admin routes, using Supabase directly for auth, CRUD, storage, and access rules. No separate backend server.
---

# Draft: admin-figma-admin-pages

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
| auth | Login page and route guard backed by Supabase Auth email/password session | active | Figma 77:6522, app/admin/src/App.tsx:13 |
| admin-shell | Admin navigation/header/content frame for Portfolio, Blog, Link Pay; skip Figma Chrome Desktop | active | design.md:161 |
| supabase-data | Browser Supabase client, env contract, table/storage access, RLS/admin policy assumptions | active | user clarification 2026-07-08 |
| portfolio | Portfolio list empty/full, filters/search/status chips, create/edit/delete, landing and service section settings | active | Figma 77:6842, 77:7660, 77:7182, 77:7421 |
| blog | Blog list empty/full, filters/search/status chips, create/edit/delete, thumbnail upload, landing and banner settings | active | Figma 77:5431, 77:3833, 77:4857, 77:9550 |
| linkpay | Link Pay list empty/full, filters/search/status chips, create plus detail/edit by reusing the same form surface | active | Figma 210:9309, 210:8534, 210:8874 |
| qa | Type/build/lint, source search for Figma MCP URLs, browser QA for auth/list/form/upload flows | active | package.json:4, app/admin/package.json:6 |

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->
| data backend | Supabase only: `@supabase/supabase-js` in admin, no Node/API server | User clarified no separate backend server | yes |
| admin access | Supabase Auth plus an `admin_users`/role policy gate through RLS | Admin pages must not be public; this is the smallest secure boundary without a server | yes |
| persistence shape | Start with three domain tables: portfolios, blog_posts, link_payments; store repeatable settings as JSON columns unless querying them independently becomes required | Figma needs nested landing/banner/service settings, but no evidence that those need standalone admin screens | yes |
| uploads | Blog thumbnail goes to Supabase Storage with local preview before upload | Figma has a thumbnail upload/preview state | yes |
| linkpay detail | The `상세` action opens the same Link Pay form in detail/edit mode because no separate Figma detail node was provided | Covers visible table action without inventing another page | yes |
| copy typo | Use `등록하기`, not Figma text `동륵하기` | Visible Korean typo should not ship unless strict pixel-copy is requested | yes |
| dependencies | Add only Supabase client; no Tailwind and no React Router by default | Existing admin has no routing/data dependencies, and Figma MCP code is reference only | yes |
| route strategy | Use a small app-local route map instead of React Router | Current route needs are finite and shallow | yes |
| delete behavior | Soft-delete domain rows with `deleted_at` and filter them out | Safer than irreversible hard delete for admin content | yes |
| public site | Keep `apps/web` static content out of this implementation | User asked for admin pages; public Supabase consumption needs its own plan | yes |

## Findings (cited - path:lines)
- `app/admin` is the actual admin package. It is a Vite React app with `dev`, `build`, `lint`, and `check-types` scripts. `app/admin/package.json:1-25`
- Current admin UI is a single static dashboard with sidebar links for dashboard/inquiry/project/settlement; the Figma admin IA requires replacing/expanding it, not tweaking a finished feature. `app/admin/src/App.tsx:13-68`
- Admin entry already imports the root design system before app CSS. `app/admin/src/main.tsx:1-5`
- Root package uses pnpm/turbo scripts, so verification should target both `pnpm --filter admin ...` and repo-level checks when needed. `package.json:4-18`
- Workspace packages include `app/*`, `apps/*`, and `packages/*`, so `app/admin` can depend on local packages if the implementation keeps it worthwhile. `pnpm-workspace.yaml:1-4`
- Typography/color rules require design-system utility composition and exact token reuse instead of ad hoc local text styling/colors. `design.md:54-60`
- UI icons must be SVG/currentColor and reuse the existing icon pattern before adding new sources. `design.md:61-103`
- Layout spacing should use parent `gap`, explicit dividers should be DOM elements, gradient buttons should use the shared Button, and Figma `Chrome Desktop` must not be implemented. `design.md:117-169`
- Existing `packages/ui` exposes a Button that supports variants and icons, but it uses inline style tokens and should be reused only where it reduces admin duplication. `packages/ui/src/button.tsx:8-19`
- Figma metadata was inspected for all 12 supplied nodes. Design context was pulled for representative states across login, portfolio, blog, and linkpay. Generated React+Tailwind snippets are reference material, not target code.

## Decisions (with rationale)
- Plan the admin as a browser-only Supabase application: Supabase Auth for login/session, Supabase tables for CRUD, Supabase Storage for blog thumbnails, and RLS/admin policies for protection.
- Keep the implementation inside `app/admin`; build app-local admin primitives and do not import `@repo/ui` into `app/admin` for this implementation.
- Model repeated landing/banner/service settings as JSON first. Separate tables are deferred until there is a real query/reporting need.
- Use Figma nodes as page/state inventory, not as literal generated code. Skip `Chrome Desktop`, do not add Tailwind, and never keep Figma MCP asset URLs in source.
- Treat list `상세` links as edit/detail routes. Portfolio and blog have supplied edit/upload states; Link Pay reuses the create form for detail/edit because only a create frame was supplied.
- Metis gap analysis found localStorage/API handoff conflict, admin icon ambiguity, schema/RLS/env gaps, Link Pay payment semantics, public-site scope creep, and QA credential risks. The final plan resolves these by superseding the older localStorage/API plan, using Supabase SQL/RLS/storage in-repo, using admin-local currentColor icons, treating Link Pay as manual payment-record management only, excluding `apps/web` integration, and requiring real Supabase QA or an explicit blocker.

## Scope IN
- Routes/pages: login, portfolio list, portfolio create, portfolio edit/detail, blog list, blog create, blog edit/detail, linkpay list, linkpay create, linkpay edit/detail.
- Shared admin shell: header/nav, active menu state, content width, footer if present in the product screen, filters, search fields, table, empty state, status chips, form layout, form actions, upload control, segmented HTML/TEXT editor switch.
- Supabase integration: env-driven client, auth state, route guard, CRUD adapters for the three domains, thumbnail storage upload/delete path, admin-only access assumptions.
- Data behaviors: list filtering by status/type/search, create, temporary save/draft where shown, publish/status persistence, update, delete where the UI exposes delete, date/amount formatting.
- Verification plan: admin typecheck/build/lint, source search for Figma MCP URLs, and browser QA for login guard, each list state, each form path, and thumbnail upload preview.

## Scope OUT (Must NOT have)
- No separate backend/API server.
- No Tailwind installation just because Figma MCP returns Tailwind reference code.
- No implementation of Figma `Chrome Desktop` browser chrome.
- No remote Figma MCP asset URLs in JSX, CSS, config, or data.
- No speculative analytics, bulk actions, role-management UI, payment processor integration, or CMS features not visible in the supplied Figma nodes.
- No large reusable admin framework unless repeated code in this small surface proves it is cheaper than local components.

## Open questions
- None blocking. Approval means proceed with the defaults above, including Supabase-only data access and correcting `동륵하기` to `등록하기`.

## Approval gate
status: approved-and-planned
