# Admin Page Implementation Plan

## Purpose

Build the `app/admin` product admin from the provided Figma admin frames. The current admin app is only a single dashboard mock, so the first real boundary is not a dashboard: it is authentication plus content/payment management for Portfolio, Blog, and Link Pay.

## Source Frames

| Node | Screen | Implementation meaning |
| --- | --- | --- |
| `77:6522` | 로그인_P | Admin login |
| `77:6842` | 포트폴리오_P | Portfolio list with rows |
| `77:7660` | 포트폴리오_P | Portfolio list empty state |
| `77:7182` | 포폴등록_P | Portfolio create form |
| `77:7421` | 포폴등록_P | Portfolio edit form |
| `77:5431` | 블로그_P | Blog list empty state |
| `77:3833` | 블로그_P | Blog list with rows |
| `77:4857` | 블로그등록_P | Blog create form, empty thumbnail upload |
| `77:9550` | 블로그등록_P | Blog edit form, thumbnail preview |
| `210:9309` | 링크페이_P | Link Pay list empty state |
| `210:8534` | 링크페이_P | Link Pay list with rows |
| `210:8874` | 링크페이등록_P | Link Pay create form |

Skip all Figma nodes named `Chrome Desktop`; they are browser preview decoration, not product UI.

## Product Routes

| Route | Page | Access |
| --- | --- | --- |
| `/login` | Login | Public only |
| `/portfolio` | Portfolio list | Admin |
| `/portfolio/new` | Portfolio create | Admin |
| `/portfolio/:slug` | Portfolio edit/detail | Admin |
| `/blog` | Blog list | Admin |
| `/blog/new` | Blog create | Admin |
| `/blog/:slug` | Blog edit/detail | Admin |
| `/link-pay` | Link Pay list | Admin |
| `/link-pay/new` | Link Pay create | Admin |
| `/link-pay/:id` | Link Pay detail/edit | Admin, needed because list has `상세` |

Use a tiny app-local route map first. Do not add React Router unless nested routing, loaders, or route-level data APIs become necessary.

## Shared Admin Shell

- Replace the current sidebar dashboard shell with the Figma top header and footer layout.
- Header nav: `Portfolio`, `Blog`, `Link Pay`.
- Login page uses the same brand/header/footer spacing, but no authenticated nav actions.
- Authenticated pages share one content width and table/form shell.
- Use `design.md` and `design-system.css` typography/color utilities. CSS modules should compose typography utilities instead of redefining font styles.
- UI icons must go through the existing icon pattern or inline `currentColor` SVG. Do not keep Figma MCP asset URLs in source.

## Core Data

### Session

- `email`
- `expiresAt`
- `createdAt`

For the first frontend-only version, use `localStorage` session state. Swap to API-backed session once a backend contract exists.

### Portfolio

- `id`
- `status`: `draft` or `published`
- `type`: `application`, `company-homepage`, or `mvp`
- `slug`
- `companyName`
- `productDescription`
- `estimate`
- `developmentPeriod`
- `coreFeatures: string[]`
- `workScopes: string[]`
- `content`
- `seoDescription`
- `landingSections: LandingSection[]`
- `serviceSections: ServiceSection[]`
- `createdAt`
- `updatedAt`

### Blog Post

- `id`
- `status`: `draft` or `published`
- `type`: `insight`, `mvp`, `application`, or `company-homepage`
- `title`
- `slug`
- `publishedAt`
- `thumbnailAlt`
- `thumbnailUrl`
- `content`
- `seoDescription`
- `landingSections: LandingSection[]`
- `bannerSections: BannerSection[]`
- `createdAt`
- `updatedAt`

### Link Payment

- `id`
- `status`: `pending` or `paid`
- `customerName`
- `paymentName`
- `amount`
- `paymentUrl`
- `createdAt`
- `updatedAt`

## Page Requirements

### Login

- Email input and password input.
- Submit button.
- Required validation for both fields.
- On valid submit, create session and redirect to `/portfolio`.
- If already authenticated, redirect away from `/login`.

### Portfolio List

- Title: `포트폴리오 등록 현황`.
- Filters: type, status.
- Search by portfolio title/name.
- Table columns: status, type, portfolio title, customer, landing, created date, detail.
- Empty state text: `조회할 데이터가 없습니다.`
- `신규 포폴 등록` opens `/portfolio/new`.
- `상세` opens `/portfolio/:slug`.

### Portfolio Create/Edit

- Shared form component with `mode: "create" | "edit"`.
- Fields: type select, slug, company name, product description, estimate, development period, core features, work scopes, content, SEO description.
- Slug accepts English lowercase, numbers, and hyphen only.
- Core features and work scopes support add/remove rows.
- Landing settings and service-section settings open nested section editors or inline lists.
- Bottom actions: back/cancel, delete for edit mode, save/publish. Button labels should be confirmed from the final Figma component text before coding because the metadata only exposes button instances.

### Blog List

- Title: `블로그 등록 현황`.
- Filters: type, status.
- Search by blog title.
- Table columns: status, type, blog title, landing, banner, created date, detail.
- Empty state text: `조회할 데이터가 없습니다.`
- `신규 블로그 등록` opens `/blog/new`.
- `상세` opens `/blog/:slug`.

### Blog Create/Edit

- Shared form component with `mode: "create" | "edit"`.
- Fields: type select, title, slug, published date, thumbnail alt, thumbnail file, content, SEO description.
- Use native date input first; add a custom date picker only if Figma parity requires it after the screen is functional.
- Thumbnail accepts PNG, JPEG, and WEBP up to 50MB. Preview and remove are required.
- Landing settings and banner settings open nested section editors or inline lists.
- Bottom actions: back/cancel, delete for edit mode, save/publish.

### Link Pay List

- Title: `링크페이 등록 현황`.
- Filters: status.
- Search by payment name.
- Table columns: status, customer name, payment name, amount, created date, detail.
- Empty state text: `조회할 데이터가 없습니다.`
- `신규 링크페이 등록` opens `/link-pay/new`.
- `상세` opens `/link-pay/:id`.

### Link Pay Create/Detail

- Fields: customer name, payment name, amount.
- Amount input shows `원` suffix and stores numeric value only.
- Create action generates a payment URL.
- Detail page should show the generated URL with copy action once backend/payment URL generation exists.

## Implementation Slices

1. Admin foundation
   - Add app-local route map, auth guard, header, footer, layout, shared table shell, shared form field styles.
   - Keep data in seeded fixtures plus `localStorage`.

2. Login
   - Implement login screen, validation, session restore, logout.

3. Portfolio
   - Implement list, filters, search, empty/data states.
   - Implement create/edit form and local CRUD.

4. Blog
   - Implement list, filters, search, empty/data states.
   - Implement create/edit form, thumbnail preview/remove, and local CRUD.

5. Link Pay
   - Implement list, filters, search, empty/data states.
   - Implement create/detail and payment URL placeholder.

6. API handoff
   - Replace local repositories with API calls when backend endpoints are ready.
   - Keep the UI components and page state unchanged.

## Backend Contract Needed Later

If this admin must persist beyond local browser state, add these minimal endpoints:

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/session`
- `GET /api/admin/portfolios`
- `POST /api/admin/portfolios`
- `PATCH /api/admin/portfolios/:id`
- `DELETE /api/admin/portfolios/:id`
- `GET /api/admin/blog-posts`
- `POST /api/admin/blog-posts`
- `PATCH /api/admin/blog-posts/:id`
- `DELETE /api/admin/blog-posts/:id`
- `GET /api/admin/link-payments`
- `POST /api/admin/link-payments`
- `PATCH /api/admin/link-payments/:id`
- `POST /api/admin/uploads`

## Edge Cases

- Duplicate slug.
- Empty filtered/search result.
- Invalid date.
- Invalid amount or non-numeric amount.
- Unsaved changes while leaving a form.
- File type or 50MB limit violation.
- Missing thumbnail alt when thumbnail exists.
- Published item with missing SEO description.

## Verification Plan

- `pnpm --filter admin check-types`
- `pnpm --filter admin lint`
- Manual route checks for login, list empty state, list data state, create, edit, delete, and refresh persistence.
- Source search before finishing Figma-derived implementation: run the Figma MCP URL sweep from `AGENTS.md`.

## Deliberate Skips

- No generic CRUD framework. Portfolio, Blog, and Link Pay are similar but not identical.
- No new router dependency until route behavior outgrows a small app-local route map.
- No WYSIWYG editor dependency until content editing needs formatting beyond a textarea/Markdown field.
- No pagination until real data volume requires it.
- No role/permission matrix until there is more than one admin role.
