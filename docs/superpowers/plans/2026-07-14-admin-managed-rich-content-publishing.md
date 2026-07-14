# Admin-Managed Rich Content Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 어드민에서 포트폴리오·블로그를 원문 HTML 또는 WYSIWYG로 작성·게시하면, 공개 목록·상세·홈·서비스 카드·메타데이터·사이트맵이 Supabase의 동일한 게시 레코드를 단일 원본으로 표시하게 한다.

**Architecture:** Admin은 원문 HTML과 Tiptap WYSIWYG를 별도 저작 모드로 저장한다. 원문은 변환 없이 보존하고 격리된 iframe으로 렌더링하며, WYSIWYG는 Tiptap JSON을 편집 원본으로, 생성 HTML을 공개 스냅샷으로 저장한 뒤 서버 allowlist 정화를 거쳐 호스트 DOM에 렌더링한다. Next.js Server Components는 publishable key와 RLS를 통해 게시·미삭제 행만 직접 조회하며 런타임 fixture fallback은 두지 않는다.

**Tech Stack:** React 19.2, Vite 6, Tiptap 3.27.1, Next.js 16.2 App Router, Supabase Postgres/Storage/RLS, native PostgREST fetch, sanitize-html, TypeScript 5.9, Vitest, Testing Library, Playwright screenshot workflow

## Global Constraints

- UI 변경 전 확인한 `design.md`의 typography, color token, icon, spacing, divider, min-size 규칙을 모든 Admin/Public UI에 적용한다.
- WYSIWYG 라이브러리는 Tiptap 3.27.1 코어와 확장만 사용한다. `@tiptap/*` 패키지는 모두 같은 고정 버전을 사용하고 Tiptap 완성형 UI 컴포넌트·템플릿은 React 19 호환성과 기존 디자인 시스템 일관성 때문에 사용하지 않는다.
- Admin 신규 작성 기본값은 `wysiwyg`다. `raw_html`은 완전한 HTML 문서, 전역 CSS, script가 필요한 고급 콘텐츠용이다.
- `raw_html`은 저장 전에 trim, format, sanitize, Tiptap parse를 수행하지 않는다. 이전 WYSIWYG 문서가 있으면 `content_json`에 비활성 편집 초안으로 보존하지만 공개 렌더에는 절대 사용하지 않는다.
- `wysiwyg`는 `content_json`을 편집 원본으로 저장하고 같은 저장 요청에서 `editor.getHTML()` 결과를 `content`에 저장한다.
- 기존 `content_mode = 'html' | 'text'`는 출력 호환성을 위해 유지한다. 새 WYSIWYG와 원문 HTML은 모두 `content_mode = 'html'`이며 기존 text 행은 legacy plain-text로 계속 읽는다.
- 원문 HTML → WYSIWYG 자동 변환은 금지한다. 전환 확인 시 원문을 `content_source_backup`에 보존하고, 보존된 `content_json`이 있으면 그 WYSIWYG 초안을 다시 열고 없으면 빈 문서에서 시작한다.
- WYSIWYG → 원문 전환은 `이전 원문 복원` 또는 `현재 생성 HTML로 시작`을 명시적으로 선택하게 하며, 어느 쪽이든 현재 WYSIWYG JSON은 보존한다.
- 공개 웹은 `status = 'published' and deleted_at is null`만 읽는다. draft·soft-delete는 목록, 상세, metadata, sitemap, 홈, 서비스 어디에도 노출하지 않는다.
- 운영 환경에는 fixture fallback을 두지 않는다. Supabase 설정 누락은 명시적 구성 오류이며, 레코드 부재는 404/빈 상태다.
- 공개 웹은 `SUPABASE_PUBLISHABLE_KEY`만 사용한다. service role·secret key는 앱 코드와 브라우저에 절대 사용하지 않는다.
- 공개 조회는 Server Component가 직접 수행한다. 내부 GET Route Handler를 추가하지 않는다.
- 초기 캐시 정책은 `cache: "no-store"`다. Admin 게시·수정·비공개 결과는 다음 요청에서 즉시 반영한다.
- 목록 조회에서는 본문 `content`와 `content_json`을 요청하지 않는다. 상세에서만 공개 본문 스냅샷을 요청한다.
- `content_json`, `content_source_backup`은 anon column grant에서 제외한다.
- 원문 HTML iframe은 `sandbox="allow-scripts"`만 사용한다. `allow-same-origin`, forms, popup, top-navigation은 허용하지 않는다.
- WYSIWYG HTML은 공개 렌더 직전에 allowlist sanitizer를 다시 통과한다. script, style, iframe, form, SVG/MathML, event handler, javascript URL은 제거한다.
- WYSIWYG 본문에서 H1은 제공하지 않는다. 상세 페이지의 H1은 제목 필드가 담당하고 본문 heading은 H2~H4만 허용한다.
- 이미지 MIME은 PNG, JPEG, WEBP만 허용하고 Base64/data URL은 저장하지 않는다.
- 공개 WYSIWYG 이미지 `src`는 해당 레코드의 Supabase Storage scope 아래 HTTPS URL만 허용한다. 외부 추적 이미지, 다른 레코드 scope, data/blob URL은 sanitizer가 제거한다.
- 본문 asset 경로는 slug가 바뀌어도 유지되도록 `content/{portfolio|blog}/{content_asset_scope}/images/{uuid}.{ext}`를 사용한다.
- `content_asset_base_enabled`는 기존 원문 HTML의 URL 의미를 보존하기 위해 기본 `false`다. raw 상대경로 asset을 명시적으로 사용할 때만 켜며 Admin 미리보기와 공개 iframe이 같은 조건으로 Storage `<base>`를 주입한다.
- 기존 썸네일 경로는 호환성을 위해 변경하지 않는다.
- `landing_published`는 홈 카드, `service_published`는 유형별 서비스 페이지, `banner_published`는 블로그 대표 배너 후보 의미로 사용한다.
- 공개 정렬은 `published_at desc, created_at desc`다. 일반 수정으로 카드 순서가 바뀌지 않게 `updated_at` 정렬은 사용하지 않는다.
- `published_at`은 최초 게시 시각이다. 일반 수정과 draft→재게시에서는 유지하며, 관리자가 순서를 바꾸는 별도 기능은 이번 범위에 넣지 않는다.
- 현재 작업 트리의 `docs/reviews/` 등 사용자 변경은 수정하거나 되돌리지 않는다.
- Blog 요약은 기존 SEO 설명, 그마저 없으면 제목으로 backfill한다. 기존 `published` 빈 본문은 상태를 임의 변경하지 않고 사전 감사·Admin 보정 후 후속 migration에서 published-content 제약을 validate한다.
- 본문 asset은 draft 전환·soft delete 때 자동 삭제하지 않는다. UUID scope를 유지해 복구를 가능하게 하고, 저장하지 않고 이탈해 생긴 orphan 정리는 별도 보존기간 기반 작업으로 다룬다.
- 기존 `zerosourcing` bucket은 public-read이므로 draft 본문/행은 RLS로 숨겨져도 UUID URL을 아는 사용자는 asset 자체를 읽을 수 있다. 이 계획의 비공개 보장은 DB 콘텐츠 행까지이며, draft asset 기밀성이 필요하면 별도 private staging bucket→publish promotion을 후속 범위로 잡는다.

## Library Decision

Tiptap 3을 선택한다.

- Tiptap은 MIT, React/Vite 공식 통합, HTML/JSON 입출력, headless toolbar, image/file extension을 제공해 현재 Admin 디자인 시스템에 맞추기 쉽다.
- Lexical은 MIT/React 19 지원은 좋지만 동일 기능의 toolbar, image node, 고충실도 HTML import/export 구현량이 더 크다.
- CKEditor 5와 TinyMCE 8은 완성형 UI와 source editing이 강점이지만 폐쇄형 서비스에서 GPL 또는 상용 라이선스 검토가 필요하다.
- 임의 HTML은 어떤 schema editor에서도 손실될 수 있으므로 Tiptap source mode로 흉내 내지 않고 `raw_html`을 별도 경로로 유지한다.

공식 근거:

- Tiptap React 설치: https://tiptap.dev/docs/editor/getting-started/install/react
- Tiptap HTML/JSON 저장: https://tiptap.dev/docs/guides/output-json-html
- Tiptap StarterKit: https://tiptap.dev/docs/editor/extensions/functionality/starterkit
- Tiptap Image/FileHandler: https://tiptap.dev/docs/editor/extensions/nodes/image
- Lexical HTML serialization: https://lexical.dev/docs/concepts/serialization
- CKEditor licensing: https://ckeditor.com/docs/ckeditor5/latest/getting-started/licensing/license-and-legal.html
- TinyMCE licensing: https://www.tiny.cloud/docs/tinymce/latest/license-key/

---

## File Map

### Database

- Create: `supabase/migrations/20260714000000_admin_managed_public_content.sql`
- Create after content cleanup: `supabase/migrations/20260715000000_validate_admin_managed_public_content.sql`
- Create: `supabase/tests/admin_managed_public_content.sql`

### Shared content contract

- Create: `packages/content/package.json`
- Create: `packages/content/tsconfig.json`
- Create: `packages/content/eslint.config.mjs`
- Create: `packages/content/src/types.ts`
- Create: `packages/content/src/asset-url.ts`
- Create: `packages/content/src/RawHtmlFrame.tsx`
- Create: `packages/content/src/RawHtmlFrame.module.css`
- Create: `packages/content/src/rich-content.css`

### Admin

- Modify: `apps/admin/package.json`
- Create: `apps/admin/vitest.config.ts`
- Modify: `apps/admin/src/main.tsx`
- Modify: `apps/admin/src/components/admin/AdminEditorMode.tsx`
- Modify: `apps/admin/src/components/admin/icons.tsx`
- Modify: `apps/admin/src/components/admin/index.ts`
- Create: `apps/admin/src/components/content/AdminContentEditor.tsx`
- Create: `apps/admin/src/components/content/AdminContentEditor.module.css`
- Create: `apps/admin/src/components/content/AdminRichTextEditor.tsx`
- Create: `apps/admin/src/components/content/AdminRichTextToolbar.tsx`
- Create: `apps/admin/src/components/content/contentEditorExtensions.ts`
- Create: `apps/admin/src/components/content/AdminContentEditor.test.tsx`
- Create: `apps/admin/src/lib/contentAssetStorage.ts`
- Create: `apps/admin/src/lib/contentAssetStorage.test.ts`
- Create: `apps/admin/src/lib/managedContent.ts`
- Modify: `apps/admin/src/lib/thumbnailStorage.ts`
- Create: `apps/admin/src/lib/thumbnailStorage.test.ts`
- Modify: `apps/admin/src/lib/adminRepositoryTypes.ts`
- Modify: `apps/admin/src/lib/portfolioRepository.ts`
- Modify: `apps/admin/src/lib/blogRepository.ts`
- Modify: `apps/admin/src/lib/adminValidation.ts`
- Modify: `apps/admin/src/pages/portfolio/portfolioTypes.ts`
- Modify: `apps/admin/src/pages/portfolio/portfolioModel.ts`
- Modify: `apps/admin/src/pages/portfolio/PortfolioFormFields.tsx`
- Modify: `apps/admin/src/pages/portfolio/PortfolioFormPage.tsx`
- Create: `apps/admin/src/pages/portfolio/portfolioModel.test.ts`
- Modify: `apps/admin/src/pages/blog/blogTypes.ts`
- Modify: `apps/admin/src/pages/blog/blogModel.ts`
- Modify: `apps/admin/src/pages/blog/BlogFormFields.tsx`
- Modify: `apps/admin/src/pages/blog/BlogFormPage.tsx`
- Modify: `apps/admin/src/pages/blog/blogFormModel.test.ts`
- Modify: `apps/admin/src/visual-test.tsx`

### Public web

- Create: `apps/web/.env.example`
- Modify: `apps/web/.gitignore`
- Modify: `apps/web/package.json`
- Create: `apps/web/vitest.config.ts`
- Modify: `apps/web/next.config.js`
- Modify: `apps/web/app/layout.tsx`
- Create: `apps/web/app/error.tsx`
- Create: `apps/web/app/error.module.css`
- Create: `apps/web/lib/public-content/config.ts`
- Create: `apps/web/lib/public-content/postgrest.ts`
- Create: `apps/web/lib/public-content/postgrest-core.ts`
- Create: `apps/web/lib/public-content/types.ts`
- Create: `apps/web/lib/public-content/queries.ts`
- Create: `apps/web/lib/public-content/selectors.ts`
- Create: `apps/web/lib/public-content/sanitize-rich-content.ts`
- Create: `apps/web/lib/public-content/public-content.test.ts`
- Create: `apps/web/components/ManagedContent.tsx`
- Create: `apps/web/components/ManagedContent.module.css`
- Create: `apps/web/components/ManagedThumbnail.tsx`
- Create: `apps/web/components/ManagedThumbnail.module.css`
- Create: `apps/web/app/portfolio/PortfolioListClient.tsx`
- Modify: `apps/web/app/portfolio/page.tsx`
- Modify: `apps/web/app/portfolio/page.module.css`
- Modify: `apps/web/app/portfolio/[slug]/page.tsx`
- Modify: `apps/web/app/portfolio/[slug]/portfolio-detail.module.css`
- Create: `apps/web/app/blog/BlogListClient.tsx`
- Modify: `apps/web/app/blog/page.tsx`
- Modify: `apps/web/app/blog/blog.module.css`
- Modify: `apps/web/app/blog/[slug]/page.tsx`
- Modify: `apps/web/app/blog/[slug]/blog-detail.module.css`
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/page.module.css`
- Modify: `apps/web/app/content.ts`
- Modify: `apps/web/components/ServicePortfolioSection.tsx`
- Modify: `apps/web/components/ServicePortfolioSection.module.css`
- Modify: `apps/web/app/service/mvp/page.tsx`
- Modify: `apps/web/app/service/app/page.tsx`
- Modify: `apps/web/app/service/company-homepage/page.tsx`
- Modify: `apps/web/app/sitemap.ts`
- Delete after cutover: `apps/web/app/portfolio/portfolio-items.ts`
- Delete after cutover: `apps/web/app/blog/blog-posts.ts`

### Regression/E2E

- Modify: `apps/web/app/detail-html-height.test.mjs`
- Modify: `apps/web/app/site-metadata.test.mjs`
- Modify: `apps/web/app/portfolio/portfolio-card-navigation.test.mjs`
- Modify: `apps/web/app/home-card-navigation.test.mjs`
- Modify: `apps/web/components/service-portfolio-navigation.test.mjs`
- Create: `apps/web/tests/e2e/admin-managed-content.spec.ts`

## Public Exposure Rules

| Surface | Query rule |
| --- | --- |
| Portfolio list/detail/sitemap | published and not deleted |
| Blog list/detail/sitemap | published and not deleted |
| Home portfolio | published, not deleted, `landing_published = true`, newest 6 |
| Home insight | published, not deleted, `landing_published = true`, newest 3 |
| Service portfolio | published, not deleted, `service_published = true`, matching type, newest 3 |
| Portfolio featured | first landing-enabled row, otherwise first published row |
| Blog featured banner | first banner-enabled row, otherwise first published row |
| Blog top cards | newest 3 excluding featured |
| Blog list | all published rows excluding featured, searchable client-side |
| Blog related | newest 3 of same type excluding current slug |

### Task 1: Add the backward-compatible publishing schema and RLS

**Files:**
- Create: `supabase/migrations/20260714000000_admin_managed_public_content.sql`
- Create: `supabase/tests/admin_managed_public_content.sql`

**Interfaces:**
- Produces: `content_authoring_mode: "raw_html" | "wysiwyg"`
- Produces: nullable `content_json`, `content_source_backup`, stable `content_asset_scope`, opt-in `content_asset_base_enabled`, `published_at`
- Produces: Portfolio thumbnail fields and Blog `summary`
- Produces: anon read access to public columns of published, non-deleted rows only

- [ ] **Step 1: Write the failing SQL contract test**

Create `supabase/tests/admin_managed_public_content.sql`:

```sql
begin;

select plan(34);

select has_column('public', 'portfolios', 'content_authoring_mode');
select has_column('public', 'portfolios', 'content_json');
select has_column('public', 'portfolios', 'content_asset_scope');
select has_column('public', 'portfolios', 'content_asset_base_enabled');
select has_column('public', 'portfolios', 'published_at');
select has_column('public', 'portfolios', 'thumbnail_public_url');
select has_column('public', 'blog_posts', 'summary');
select has_column('public', 'blog_posts', 'content_authoring_mode');
select has_column('public', 'blog_posts', 'content_json');
select has_column('public', 'blog_posts', 'content_asset_scope');
select has_column('public', 'blog_posts', 'content_asset_base_enabled');
select has_column('public', 'blog_posts', 'published_at');

select col_is_unique('public', 'portfolios', 'slug');
select col_is_unique('public', 'blog_posts', 'slug');

insert into public.portfolios (
  status, type, slug, title, company_name, content
) values
  ('draft', 'mvp', 'pgtap-portfolio-draft', 'draft', 'test', ''),
  ('published', 'mvp', 'pgtap-portfolio-published', 'published', 'test', '<p>published</p>');

insert into public.blog_posts (
  status, type, slug, title, summary, content
) values
  ('draft', 'insight', 'pgtap-blog-draft', 'draft', '', ''),
  ('published', 'insight', 'pgtap-blog-published', 'published', 'summary', '<p>published</p>');

select ok(
  (select published_at is not null from public.portfolios where slug = 'pgtap-portfolio-published'),
  'portfolio insert records published_at'
);
select ok(
  (select published_at is not null from public.blog_posts where slug = 'pgtap-blog-published'),
  'blog insert records published_at'
);

select ok(
  not has_column_privilege('anon', 'public.portfolios', 'content_json', 'select'),
  'anon cannot select portfolio editor JSON'
);
select ok(
  not has_column_privilege('anon', 'public.blog_posts', 'content_source_backup', 'select'),
  'anon cannot select blog source backup'
);

select throws_ok(
  $$insert into public.portfolios (
    status, type, slug, title, company_name, content_authoring_mode, content_json, content
  ) values (
    'draft', 'mvp', 'pgtap-invalid-wysiwyg-portfolio', 'invalid', 'test', 'wysiwyg', null, '<p>x</p>'
  )$$,
  '23514',
  'WYSIWYG portfolio requires a document JSON object'
);
select throws_ok(
  $$insert into public.blog_posts (
    status, type, slug, title, summary, content_authoring_mode, content_json, content
  ) values (
    'draft', 'insight', 'pgtap-invalid-wysiwyg-blog', 'invalid', 'summary', 'wysiwyg', '{}'::jsonb, '<p>x</p>'
  )$$,
  '23514',
  'WYSIWYG blog requires a doc root'
);

set local role anon;
select is(
  (select count(*)::integer from public.portfolios where slug like 'pgtap-portfolio-%'),
  1,
  'anon reads the published portfolio but not the draft'
);
select is(
  (select count(*)::integer from public.blog_posts where slug like 'pgtap-blog-%'),
  1,
  'anon reads the published blog post but not the draft'
);
select lives_ok(
  $$select slug from public.portfolios
    where status = 'published' and deleted_at is null
    order by published_at desc, created_at desc$$,
  'anon can run the real portfolio filter and order query'
);
select lives_ok(
  $$select slug from public.blog_posts
    where status = 'published' and deleted_at is null
    order by published_at desc, created_at desc$$,
  'anon can run the real blog filter and order query'
);
select throws_ok(
  $$insert into public.portfolios (type, slug, title, company_name)
    values ('mvp', 'anon-write-portfolio', 'blocked', 'blocked')$$,
  '42501',
  'anon cannot insert portfolios'
);
select throws_ok(
  $$update public.portfolios set title = 'blocked'
    where slug = 'pgtap-portfolio-published'$$,
  '42501',
  'anon cannot update portfolios'
);
select throws_ok(
  $$delete from public.portfolios where slug = 'pgtap-portfolio-published'$$,
  '42501',
  'anon cannot delete portfolios'
);
select throws_ok(
  $$insert into public.blog_posts (type, slug, title)
    values ('insight', 'anon-write-blog', 'blocked')$$,
  '42501',
  'anon cannot insert blog posts'
);
select throws_ok(
  $$update public.blog_posts set title = 'blocked'
    where slug = 'pgtap-blog-published'$$,
  '42501',
  'anon cannot update blog posts'
);
select throws_ok(
  $$delete from public.blog_posts where slug = 'pgtap-blog-published'$$,
  '42501',
  'anon cannot delete blog posts'
);

reset role;
select policies_are(
  'public',
  'portfolios',
  array[
    'admins can read portfolios',
    'admins can insert portfolios',
    'admins can update portfolios',
    'admins can delete portfolios',
    'published portfolios are publicly readable'
  ]
);
select policies_are(
  'public',
  'blog_posts',
  array[
    'admins can read blog posts',
    'admins can insert blog posts',
    'admins can update blog posts',
    'admins can delete blog posts',
    'published blog posts are publicly readable'
  ]
);

select has_index('public', 'portfolios', 'portfolios_public_publish_idx');
select has_index('public', 'blog_posts', 'blog_posts_public_publish_idx');

select finish();
rollback;
```

- [ ] **Step 2: Run the SQL test and verify it fails**

```bash
supabase test db supabase/tests/admin_managed_public_content.sql
```

Expected: missing-column and missing-policy assertions fail.

- [ ] **Step 3: Add the additive migration**

Create `supabase/migrations/20260714000000_admin_managed_public_content.sql` with these exact contracts:

```sql
alter table public.portfolios
  add column if not exists content_authoring_mode text not null default 'raw_html',
  add column if not exists content_json jsonb,
  add column if not exists content_schema_version integer not null default 1,
  add column if not exists content_source_backup text,
  add column if not exists content_asset_scope uuid not null default gen_random_uuid(),
  add column if not exists content_asset_base_enabled boolean not null default false,
  add column if not exists published_at timestamptz,
  add column if not exists thumbnail_path text,
  add column if not exists thumbnail_public_url text,
  add column if not exists thumbnail_alt text not null default '';

alter table public.blog_posts
  add column if not exists summary text not null default '',
  add column if not exists content_authoring_mode text not null default 'raw_html',
  add column if not exists content_json jsonb,
  add column if not exists content_schema_version integer not null default 1,
  add column if not exists content_source_backup text,
  add column if not exists content_asset_scope uuid not null default gen_random_uuid(),
  add column if not exists content_asset_base_enabled boolean not null default false,
  add column if not exists published_at timestamptz;

update public.portfolios
set
  content_authoring_mode = 'raw_html',
  published_at = case
    when status = 'published' then coalesce(published_at, updated_at, created_at)
    else published_at
  end;

update public.blog_posts
set
  summary = case
    when length(btrim(summary)) = 0
      then coalesce(nullif(btrim(seo_description), ''), title)
    else summary
  end,
  content_authoring_mode = 'raw_html',
  published_at = case
    when status = 'published' then coalesce(published_at, updated_at, created_at)
    else published_at
  end;

alter table public.portfolios
  drop constraint if exists portfolios_content_authoring_mode_check,
  drop constraint if exists portfolios_content_document_check,
  drop constraint if exists portfolios_published_content_check,
  add constraint portfolios_content_authoring_mode_check
    check (content_authoring_mode in ('raw_html', 'wysiwyg')),
  add constraint portfolios_content_document_check
    check (
      (
        content_authoring_mode = 'raw_html'
        and (
          content_json is null
          or (
            jsonb_typeof(content_json) = 'object'
            and coalesce(content_json ->> 'type' = 'doc', false)
          )
        )
      )
      or (
        content_authoring_mode = 'wysiwyg'
        and content_mode = 'html'
        and content_json is not null
        and jsonb_typeof(content_json) = 'object'
        and coalesce(content_json ->> 'type' = 'doc', false)
      )
    ),
  add constraint portfolios_published_content_check
    check (status <> 'published' or length(btrim(content)) > 0) not valid,
  add constraint portfolios_content_schema_version_check
    check (content_schema_version >= 1);

alter table public.blog_posts
  drop constraint if exists blog_posts_content_authoring_mode_check,
  drop constraint if exists blog_posts_content_document_check,
  drop constraint if exists blog_posts_published_content_check,
  add constraint blog_posts_content_authoring_mode_check
    check (content_authoring_mode in ('raw_html', 'wysiwyg')),
  add constraint blog_posts_content_document_check
    check (
      (
        content_authoring_mode = 'raw_html'
        and (
          content_json is null
          or (
            jsonb_typeof(content_json) = 'object'
            and coalesce(content_json ->> 'type' = 'doc', false)
          )
        )
      )
      or (
        content_authoring_mode = 'wysiwyg'
        and content_mode = 'html'
        and content_json is not null
        and jsonb_typeof(content_json) = 'object'
        and coalesce(content_json ->> 'type' = 'doc', false)
      )
    ),
  add constraint blog_posts_published_content_check
    check (
      status <> 'published'
      or (
        length(btrim(content)) > 0
        and length(btrim(summary)) > 0
      )
    ) not valid,
  add constraint blog_posts_content_schema_version_check
    check (content_schema_version >= 1);

create or replace function public.set_content_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists set_portfolios_published_at on public.portfolios;
create trigger set_portfolios_published_at
  before insert or update on public.portfolios
  for each row execute function public.set_content_published_at();

drop trigger if exists set_blog_posts_published_at on public.blog_posts;
create trigger set_blog_posts_published_at
  before insert or update on public.blog_posts
  for each row execute function public.set_content_published_at();

create index if not exists portfolios_public_publish_idx
  on public.portfolios (published_at desc, created_at desc)
  where status = 'published' and deleted_at is null;

create index if not exists blog_posts_public_publish_idx
  on public.blog_posts (published_at desc, created_at desc)
  where status = 'published' and deleted_at is null;

grant select, insert, update, delete on table public.portfolios to authenticated;
grant select, insert, update, delete on table public.blog_posts to authenticated;
grant all on table public.portfolios to service_role;
grant all on table public.blog_posts to service_role;

revoke all on table public.portfolios from public;
revoke all on table public.blog_posts from public;
revoke all on table public.portfolios from anon;
revoke all on table public.blog_posts from anon;

grant select (
  status, deleted_at, slug, title, type, company_name, product_description, estimate_label,
  development_period, core_features, work_scopes, content_mode,
  content_authoring_mode, content, content_asset_scope, seo_description,
  content_asset_base_enabled,
  thumbnail_public_url, thumbnail_alt, landing_published, service_published,
  created_at, updated_at, published_at
) on public.portfolios to anon;

grant select (
  status, deleted_at, slug, title, type, summary, published_date, thumbnail_public_url,
  thumbnail_alt, content_mode, content_authoring_mode, content,
  content_asset_scope, seo_description, landing_published, banner_published,
  content_asset_base_enabled,
  created_at, updated_at, published_at
) on public.blog_posts to anon;

drop policy if exists "published portfolios are publicly readable"
  on public.portfolios;
create policy "published portfolios are publicly readable"
  on public.portfolios for select to anon
  using (status = 'published' and deleted_at is null);

drop policy if exists "published blog posts are publicly readable"
  on public.blog_posts;
create policy "published blog posts are publicly readable"
  on public.blog_posts for select to anon
  using (status = 'published' and deleted_at is null);
```

- [ ] **Step 4: Re-run the SQL test**

```bash
supabase test db supabase/tests/admin_managed_public_content.sql
```

Expected: 34 assertions pass, including insert-time `published_at`, document-shape constraints, real PostgREST filter privileges, anon write denial, real draft/published RLS rows, and private authoring-column checks.

- [ ] **Step 5: Commit the database contract**

```bash
git add supabase/migrations/20260714000000_admin_managed_public_content.sql supabase/tests/admin_managed_public_content.sql
git commit -m "feat(content): add managed publishing schema"
```

### Task 2: Add the shared content types, iframe, and rich-text stylesheet

**Files:**
- Create: `packages/content/package.json`
- Create: `packages/content/tsconfig.json`
- Create: `packages/content/eslint.config.mjs`
- Create: `packages/content/src/types.ts`
- Create: `packages/content/src/asset-url.ts`
- Create: `packages/content/src/RawHtmlFrame.tsx`
- Create: `packages/content/src/RawHtmlFrame.module.css`
- Create: `packages/content/src/rich-content.css`
- Modify: `apps/admin/package.json`
- Modify: `apps/web/package.json`

**Interfaces:**
- Produces: `ContentAuthoringMode`, `ContentOutputMode`, `TiptapDocument`
- Produces: `RawHtmlFrame({ html, title, assetBaseUrl? })`
- Produces: shared `.rich-content` visual contract used by Admin editor and public WYSIWYG output

- [ ] **Step 1: Create the package manifest and configs**

`packages/content/package.json`:

```json
{
  "name": "@repo/content",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./types": "./src/types.ts",
    "./asset-url": "./src/asset-url.ts",
    "./raw-html-frame": "./src/RawHtmlFrame.tsx",
    "./rich-content.css": "./src/rich-content.css"
  },
  "scripts": {
    "check-types": "tsc --noEmit",
    "lint": "eslint . --max-warnings 0"
  },
  "peerDependencies": {
    "react": ">=19.2.0",
    "react-dom": ">=19.2.0"
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@types/react": "19.2.2",
    "@types/react-dom": "19.2.2",
    "eslint": "^9.39.1",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "typescript": "5.9.2"
  }
}
```

`packages/content/tsconfig.json`:

```json
{
  "extends": "@repo/typescript-config/react-library.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

`packages/content/eslint.config.mjs`:

```js
import { config } from "@repo/eslint-config/react-internal";

export default config;
```

Add `"@repo/content": "workspace:*"` to both app dependency objects.

- [ ] **Step 2: Add the shared content types**

Create `packages/content/src/types.ts`:

```ts
export const contentAuthoringModes = ["raw_html", "wysiwyg"] as const;
export type ContentAuthoringMode = (typeof contentAuthoringModes)[number];

export const contentOutputModes = ["html", "text"] as const;
export type ContentOutputMode = (typeof contentOutputModes)[number];

export const SUPPORTED_CONTENT_SCHEMA_VERSION = 1 as const;

export type TiptapNode = {
  readonly attrs?: Readonly<Record<string, unknown>>;
  readonly content?: readonly TiptapNode[];
  readonly marks?: readonly Readonly<Record<string, unknown>>[];
  readonly text?: string;
  readonly type: string;
};

export type TiptapDocument = TiptapNode & {
  readonly type: "doc";
};
```

Create `packages/content/src/asset-url.ts` and use it from both apps:

```ts
export type ContentEntity = "blog" | "portfolio";

export function createContentAssetBaseUrl(input: {
  readonly assetScope: string;
  readonly bucket: string;
  readonly entity: ContentEntity;
  readonly supabaseUrl: string;
}): string {
  if (!URL.canParse(input.supabaseUrl)) {
    throw new Error("A valid Supabase URL is required.");
  }
  const path = [
    "storage", "v1", "object", "public", input.bucket,
    "content", input.entity, input.assetScope,
  ].map(encodeURIComponent).join("/");
  return new URL(`/${path}/`, input.supabaseUrl).toString();
}
```

- [ ] **Step 3: Implement the isolated raw HTML frame**

Create `packages/content/src/RawHtmlFrame.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./RawHtmlFrame.module.css";

const MESSAGE_TYPE = "zerosourcing:raw-html-height";
const MIN_HEIGHT = 160;
const MAX_HEIGHT = 200_000;

const bridge = `<script>
(() => {
  const send = () => {
    const root = document.documentElement;
    const body = document.body;
    const height = Math.max(
      root.scrollHeight,
      root.offsetHeight,
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0
    );
    window.parent.postMessage({
      type: "zerosourcing:raw-html-height",
      height
    }, "*");
  };
  const resizeObserver = new ResizeObserver(send);
  const mutationObserver = new MutationObserver(send);
  const start = () => {
    resizeObserver.observe(document.documentElement);
    if (document.body) resizeObserver.observe(document.body);
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true
    });
    send();
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
  document.addEventListener("load", send, true);
  window.addEventListener("load", send);
  window.addEventListener("resize", send);
  if (document.fonts) document.fonts.ready.then(send);
})();
</script>`;

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function buildRawHtmlSource(
  html: string,
  assetBaseUrl?: string,
): string {
  const base = assetBaseUrl
    ? `<base href="${escapeAttribute(assetBaseUrl)}">`
    : "";
  const runtime = `${base}${bridge}`;
  // Only recognize a standards-mode prefix. Never search for head/base tags:
  // those strings may legally occur inside comments, scripts, or templates.
  const doctype = /^(\uFEFF?\s*<!doctype\s+html\s*>)/i.exec(html);
  if (doctype) {
    return `${doctype[1]}${runtime}${html.slice(doctype[1].length)}`;
  }
  return `${runtime}${html}`;
}

type RawHtmlFrameProps = {
  readonly assetBaseUrl?: string;
  readonly html: string;
  readonly title: string;
};

export function RawHtmlFrame({
  assetBaseUrl,
  html,
  title,
}: RawHtmlFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(MIN_HEIGHT);
  const source = useMemo(
    () => buildRawHtmlSource(html, assetBaseUrl),
    [assetBaseUrl, html],
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!event.data || typeof event.data !== "object") return;
      const data = event.data as { height?: unknown; type?: unknown };
      if (data.type !== MESSAGE_TYPE || typeof data.height !== "number") return;
      if (!Number.isFinite(data.height) || data.height <= 0) return;
      setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.ceil(data.height))));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      className={styles.frame}
      ref={frameRef}
      referrerPolicy="no-referrer"
      sandbox="allow-scripts"
      srcDoc={source}
      style={{ height }}
      title={title}
    />
  );
}
```

The 160px initial/clamped height is the documented `design.md` size exception: a sandboxed opaque-origin frame cannot be measured by the parent before its resize bridge reports. It is not a content-layout minimum and is replaced by the measured height immediately after load.

`buildRawHtmlSource` always places the Storage asset base first, immediately after an initial HTML5 doctype when present. This keeps standards mode without trying to rewrite arbitrary author markup. Because the first `<base>` wins, an author-supplied `<base>` is deliberately ignored whenever `assetBaseUrl` is provided; Admin must show that warning and also warn that fragment-only links need manual QA. Add focused tests for a normal document, comment/script strings containing `<head>` or `<base>`, a BOM + doctype, an author-supplied base, missing doctype, late-loading images, and web fonts. The stored `html` string is never modified—only the transient iframe `srcDoc` is composed.

Create `packages/content/src/RawHtmlFrame.module.css`:

```css
.frame {
  display: block;
  width: 100%;
  border: 0;
  background: var(--color-gray-50);
}
```

- [ ] **Step 4: Define the shared WYSIWYG visual contract**

Create `packages/content/src/rich-content.css`. Scope every rule under `.rich-content`; use `gap` on structural wrappers and reset margins only because generated document flow cannot receive React layout wrappers.

```css
.rich-content {
  color: var(--color-gray-800);
  font-family: Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  overflow-wrap: anywhere;
}

.rich-content :where(h2, h3, h4, p, ul, ol, blockquote, pre, figure) {
  margin: 0;
}

.rich-content :where(h2) {
  padding-top: 48px;
  font-size: 28px;
  font-weight: 700;
  line-height: 36px;
}

.rich-content :where(h3) {
  padding-top: 36px;
  font-size: 22px;
  font-weight: 700;
  line-height: 32px;
}

.rich-content :where(h4) {
  padding-top: 28px;
  font-size: 18px;
  font-weight: 700;
  line-height: 26px;
}

.rich-content :where(p, ul, ol, blockquote, pre, figure) {
  padding-top: 20px;
}

.rich-content :where(ul, ol) {
  padding-left: 24px;
}

.rich-content :where(blockquote) {
  padding-left: 20px;
  border-left: 3px solid var(--color-gray-300);
  color: var(--color-gray-600);
}

.rich-content :where(pre) {
  overflow-x: auto;
  padding: 20px;
  border-radius: 8px;
  color: var(--color-gray-50);
  background: var(--color-gray-900);
}

.rich-content :where(a) {
  color: var(--color-brand-600);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.rich-content :where(img) {
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
}

.rich-content :where(hr) {
  margin: 40px 0 20px;
  border: 0;
  border-top: 1px solid var(--color-gray-200);
}

@media (max-width: 640px) {
  .rich-content {
    font-size: 14px;
    line-height: 21px;
  }

  .rich-content :where(h2) {
    padding-top: 36px;
    font-size: 24px;
    line-height: 32px;
  }
}
```

- [ ] **Step 5: Verify the shared package**

```bash
pnpm install
pnpm --filter @repo/content check-types
pnpm --filter @repo/content lint
```

Expected: dependency install, type checking, and lint complete with code 0.

- [ ] **Step 6: Commit the shared contract**

```bash
git add packages/content apps/admin/package.json apps/web/package.json pnpm-lock.yaml
git commit -m "feat(content): add shared rendering contract"
```

### Task 3: Prove Tiptap 3 works in React 19 before building the full editor

**Files:**
- Modify: `apps/admin/package.json`
- Create: `apps/admin/vitest.config.ts`
- Create: `apps/admin/src/components/content/contentEditorExtensions.ts`
- Create: `apps/admin/src/components/content/AdminRichTextEditor.tsx`
- Create: `apps/admin/src/components/content/AdminRichTextEditor.test.tsx`

**Interfaces:**
- Produces: `createContentEditorExtensions(uploadImage)`
- Produces: `AdminRichTextEditor({ document, documentKey, disabled, onChange, onUploadError, uploadImage })`
- Emits: `{ html: string; document: TiptapDocument }`

- [ ] **Step 1: Install exact editor and test dependencies**

```bash
pnpm --filter admin add '@repo/content@workspace:*' @tiptap/core@3.27.1 @tiptap/react@3.27.1 @tiptap/pm@3.27.1 @tiptap/starter-kit@3.27.1 @tiptap/extension-image@3.27.1 @tiptap/extension-placeholder@3.27.1 @tiptap/extension-text-align@3.27.1 @tiptap/extension-file-handler@3.27.1
pnpm --filter admin add -D vitest jsdom @testing-library/react @testing-library/user-event
```

After installation, replace the generated ranges in `apps/admin/package.json` with the exact resolved versions and commit `pnpm-lock.yaml`; do not leave `latest` tags in the manifest or plan-generated commands.

Add these scripts to `apps/admin/package.json`:

```json
{
  "test": "pnpm run test:model && pnpm run test:unit",
  "test:model": "node --no-warnings=ExperimentalWarning --experimental-transform-types --loader ./tests/typescript-loader.mjs --test src/components/admin/AdminTable.test.tsx src/pages/blog/blogFormModel.test.ts src/pages/blog/blogModel.test.ts",
  "test:unit": "vitest run",
  "test:watch": "vitest"
}
```

Create `apps/admin/vitest.config.ts` so Vitest never collects the existing `node:test` suites:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "src/components/content/**/*.test.ts",
      "src/components/content/**/*.test.tsx",
      "src/lib/contentAssetStorage.test.ts",
      "src/lib/thumbnailStorage.test.ts",
    ],
  },
});
```

- [ ] **Step 2: Write the failing React 19 editor test**

Create `apps/admin/src/components/content/AdminRichTextEditor.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AdminRichTextEditor } from "./AdminRichTextEditor";

describe("AdminRichTextEditor", () => {
  it("mounts in StrictMode and emits Tiptap JSON plus HTML", async () => {
    const onChange = vi.fn();
    render(
      <StrictMode>
        <AdminRichTextEditor
          disabled={false}
          document={{ type: "doc", content: [{ type: "paragraph" }] }}
          documentKey="new"
          onChange={onChange}
          onContentError={vi.fn()}
          onUploadError={vi.fn()}
          uploadImage={vi.fn()}
        />
      </StrictMode>,
    );

    const editor = await screen.findByRole("textbox", {
      name: "본문 WYSIWYG 편집기",
    });
    await userEvent.click(editor);
    await userEvent.keyboard("테스트 본문");

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.lastCall?.[0].html).toContain("테스트 본문");
    expect(onChange.mock.lastCall?.[0].document.type).toBe("doc");
  });
});
```

- [ ] **Step 3: Run the focused test and verify it fails**

```bash
pnpm --filter admin test:unit -- AdminRichTextEditor.test.tsx
```

Expected: module-not-found failure for `AdminRichTextEditor`.

- [ ] **Step 4: Add the exact extension set**

Create `apps/admin/src/components/content/contentEditorExtensions.ts`:

```ts
import FileHandler from "@tiptap/extension-file-handler";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";
import type { Editor } from "@tiptap/core";

export type UploadEditorImage = (file: File) => Promise<{
  readonly alt: string;
  readonly url: string;
}>;

async function insertFiles(
  editor: Editor,
  files: readonly File[],
  uploadImage: UploadEditorImage,
  position: number,
) {
  let nextPosition = position;
  for (const file of files) {
    const uploaded = await uploadImage(file);
    editor.commands.insertContentAt(nextPosition, {
      attrs: { alt: uploaded.alt, src: uploaded.url },
      type: "image",
    });
    nextPosition += 1;
  }
}

export function createContentEditorExtensions(
  uploadImage: UploadEditorImage,
  onUploadError: (error: unknown) => void,
) {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      link: {
        defaultProtocol: "https",
        openOnClick: false,
        protocols: ["http", "https", "mailto", "tel"],
      },
    }),
    Image.configure({ allowBase64: false, inline: false }),
    Placeholder.configure({ placeholder: "본문을 작성해 주세요." }),
    TextAlign.configure({
      alignments: ["left", "center", "right"],
      types: ["heading", "paragraph"],
    }),
    FileHandler.configure({
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
      consumePasteEvent: true,
      onDrop: (editor, files, position) => {
        void insertFiles(editor, files, uploadImage, position)
          .catch(onUploadError);
      },
      onPaste: (editor, files) => {
        void insertFiles(
          editor,
          files,
          uploadImage,
          editor.state.selection.from,
        ).catch(onUploadError);
      },
    }),
  ];
}
```

- [ ] **Step 5: Implement the minimal editor shell**

Create `apps/admin/src/components/content/AdminRichTextEditor.tsx` with `useEditor`, `EditorContent`, the shared `rich-content` class, and this exact update contract. Admin is Vite-only, so do not apply the SSR-only `immediatelyRender: false` setting:

```tsx
import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import type { TiptapDocument } from "@repo/content/types";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createContentEditorExtensions,
  type UploadEditorImage,
} from "./contentEditorExtensions";

type AdminRichTextEditorProps = {
  readonly disabled: boolean;
  readonly document: TiptapDocument;
  readonly documentKey: string;
  readonly onChange: (value: {
    readonly document: TiptapDocument;
    readonly html: string;
  }) => void;
  readonly onContentError: (error: unknown) => void;
  readonly onUploadError: (error: unknown) => void;
  readonly uploadImage: UploadEditorImage;
};

export function AdminRichTextEditor({
  disabled,
  document,
  documentKey,
  onChange,
  onContentError,
  onUploadError,
  uploadImage,
}: AdminRichTextEditorProps) {
  const [hasContentError, setHasContentError] = useState(false);
  const incomingDocument = useRef(document);
  incomingDocument.current = document;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onUploadErrorRef = useRef(onUploadError);
  onUploadErrorRef.current = onUploadError;
  const onContentErrorRef = useRef(onContentError);
  onContentErrorRef.current = onContentError;
  const uploadImageRef = useRef(uploadImage);
  uploadImageRef.current = uploadImage;
  const extensions = useMemo(
    () => createContentEditorExtensions(
      (file) => uploadImageRef.current(file),
      (error) => onUploadErrorRef.current(error),
    ),
    [documentKey],
  );
  const editor = useEditor({
    content: document as JSONContent,
    editable: !disabled && !hasContentError,
    enableContentCheck: true,
    editorProps: {
      attributes: {
        "aria-label": "본문 WYSIWYG 편집기",
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    extensions,
    onUpdate: ({ editor: currentEditor }) => {
      onChangeRef.current({
        document: currentEditor.getJSON() as TiptapDocument,
        html: currentEditor.getHTML(),
      });
    },
    onContentError: ({ error }) => {
      setHasContentError(true);
      onContentErrorRef.current(error);
    },
  }, [documentKey]);

  useEffect(() => {
    if (!editor) return;
    setHasContentError(false);
    editor.commands.setContent(incomingDocument.current as JSONContent, {
      emitUpdate: false,
    });
  }, [documentKey, editor]);

  useEffect(() => {
    editor?.setEditable(!disabled && !hasContentError);
  }, [disabled, editor, hasContentError]);

  return (
    <EditorContent
      className="rich-content"
      editor={editor}
    />
  );
}
```

Route `onContentError` through the dedicated editor-schema error callback. The Form page then enters read-only/error state and disables every save action; never let Tiptap silently drop unknown nodes and overwrite a document created by a newer schema.

Extend the POC test with `rerender`: start with the empty document and `documentKey="new"`, rerender with a saved paragraph and `documentKey="saved-row-v1"`, assert that text appears without firing `onChange`, then toggle `disabled` and assert `contenteditable="false"`. Also rerender with new upload callbacks while keeping the same key and verify the current callbacks—not stale closures—are used. Feed an invalid/unknown node and assert the content error makes the editor read-only without emitting a replacement document. Spy on `console.error`/`console.warn`, filter only explicitly documented jsdom noise, and require no React/Tiptap lifecycle warnings under StrictMode. Keep `documentKey` unchanged during ordinary keystroke-driven parent rerenders so the cursor is never reset.

- [ ] **Step 6: Run the POC gate**

```bash
pnpm --filter admin test:unit -- AdminRichTextEditor.test.tsx
pnpm --filter admin check-types
pnpm --filter admin build
```

Expected: StrictMode test, type check, and Vite production build pass without duplicate initialization warnings.

- [ ] **Step 7: Commit the POC**

```bash
git add apps/admin/package.json apps/admin/src/components/content pnpm-lock.yaml
git commit -m "feat(admin): prove tiptap editor integration"
```

### Task 4: Persist the two authoring modes in both Admin repositories

**Files:**
- Create: `apps/admin/src/lib/managedContent.ts`
- Modify: `apps/admin/src/lib/adminRepositoryTypes.ts`
- Modify: `apps/admin/src/lib/portfolioRepository.ts`
- Modify: `apps/admin/src/lib/blogRepository.ts`
- Modify: `apps/admin/src/pages/portfolio/portfolioTypes.ts`
- Modify: `apps/admin/src/pages/portfolio/portfolioModel.ts`
- Create: `apps/admin/src/pages/portfolio/portfolioModel.test.ts`
- Modify: `apps/admin/src/pages/blog/blogTypes.ts`
- Modify: `apps/admin/src/pages/blog/blogModel.ts`
- Modify: `apps/admin/src/pages/blog/blogFormModel.test.ts`

**Interfaces:**
- Consumes: shared `ContentAuthoringMode`, `ContentOutputMode`, `TiptapDocument`
- Produces: repository rows and inputs with authoring metadata
- Produces: draft-empty allowed, publish-empty rejected validation

- [ ] **Step 1: Add failing model tests for raw round-trip, WYSIWYG payload, and publish validation**

Add equivalent Portfolio and Blog tests. Portfolio examples:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPortfolioInput,
  createEmptyPortfolioFormState,
  portfolioFormFromRow,
} from "./portfolioModel";

test("raw HTML round-trips without trimming or normalization", () => {
  const source = "<!DOCTYPE html>\n<html><body>  <p>원문</p>\n</body></html>\n";
  const form = portfolioFormFromRow({
    id: "00000000-0000-4000-8000-000000000001",
    status: "draft",
    type: "mvp",
    slug: "raw-test",
    title: "원문 테스트",
    company_name: "원문 테스트",
    product_description: "",
    estimate_label: "",
    development_period: "",
    core_features: [],
    work_scopes: [],
    content_mode: "html",
    content_authoring_mode: "raw_html",
    content: source,
    content_asset_base_enabled: false,
    content_json: null,
    content_schema_version: 1,
    content_source_backup: null,
    content_asset_scope: "00000000-0000-4000-8000-000000000002",
    seo_description: "",
    thumbnail_path: null,
    thumbnail_public_url: null,
    thumbnail_alt: "",
    landing_published: false,
    service_published: false,
    landing_sections: [],
    service_sections: [],
    published_at: null,
    created_at: "2026-07-14T00:00:00.000Z",
    updated_at: "2026-07-14T00:00:00.000Z",
    deleted_at: null,
  });
  assert.equal(form.content, source);
  assert.equal(form.contentAuthoringMode, "raw_html");
  assert.equal(form.contentJson, null);
  const rebuilt = buildPortfolioInput(form);
  assert.ok(rebuilt.input);
  assert.equal(rebuilt.input.content, source);
});

test("published WYSIWYG content emits JSON and generated HTML together", () => {
  const base = createEmptyPortfolioFormState();
  const result = buildPortfolioInput({
    ...base,
    status: "published",
    type: "mvp",
    slug: "wysiwyg-test",
    companyName: "WYSIWYG 테스트",
    title: "WYSIWYG 테스트",
    contentMode: "html",
    contentAuthoringMode: "wysiwyg",
    content: "<p>본문</p>",
    contentJson: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "본문" }],
        },
      ],
    },
  });
  assert.ok(result.input);
  assert.equal(result.input.content, "<p>본문</p>");
  assert.equal(result.input.contentAuthoringMode, "wysiwyg");
  assert.equal(result.input.contentJson?.type, "doc");
});

test("draft may be empty but publish requires visible content", () => {
  const base = {
    ...createEmptyPortfolioFormState(),
    type: "mvp" as const,
    slug: "empty-test",
    companyName: "빈 본문 테스트",
    title: "빈 본문 테스트",
  };
  assert.ok(buildPortfolioInput({ ...base, status: "draft" }).input);
  const published = buildPortfolioInput({ ...base, status: "published" });
  assert.equal(published.input, undefined);
  assert.equal(published.errors.content, "게시하려면 본문을 입력해 주세요.");
});
```

Blog tests use `summary: "카드 요약"` and assert that published content also requires a non-empty summary.

- [ ] **Step 2: Run model tests and verify failure**

```bash
node --no-warnings=ExperimentalWarning --experimental-transform-types --loader ./apps/admin/tests/typescript-loader.mjs --test apps/admin/src/pages/portfolio/portfolioModel.test.ts apps/admin/src/pages/blog/blogFormModel.test.ts
```

Expected: missing properties/functions and publish validation assertions fail.

- [ ] **Step 3: Expand the repository contract**

In `apps/admin/src/lib/adminRepositoryTypes.ts`, import shared types and add this reusable content contract:

```ts
import {
  SUPPORTED_CONTENT_SCHEMA_VERSION,
  type ContentAuthoringMode,
  type ContentOutputMode,
  type TiptapDocument,
} from "@repo/content/types";

export type ContentMode = ContentOutputMode;

export type ManagedContentRow = {
  readonly content: string;
  readonly content_asset_base_enabled: boolean;
  readonly content_asset_scope: string;
  readonly content_authoring_mode: ContentAuthoringMode;
  readonly content_json: TiptapDocument | null;
  readonly content_mode: ContentMode;
  readonly content_schema_version: number;
  readonly content_source_backup: string | null;
  readonly published_at: string | null;
};

type ManagedContentInputBase = {
  readonly content: string;
  readonly contentAssetBaseEnabled: boolean;
  readonly contentAssetScope: string;
  readonly contentSchemaVersion: typeof SUPPORTED_CONTENT_SCHEMA_VERSION;
  readonly contentSourceBackup: string | null;
};

export type ManagedContentInput = ManagedContentInputBase & (
  | {
      readonly contentAuthoringMode: "raw_html";
      readonly contentJson: TiptapDocument | null;
      readonly contentMode: ContentMode;
    }
  | {
      readonly contentAuthoringMode: "wysiwyg";
      readonly contentJson: TiptapDocument;
      readonly contentMode: "html";
    }
);
```

Make `PortfolioRow` and `BlogPostRow` extend `ManagedContentRow`. Make both create inputs extend `ManagedContentInput`. Add Portfolio `thumbnail_path`, `thumbnail_public_url`, `thumbnail_alt`; add Blog `summary`.

At the DB→form boundary, validate that `content_schema_version === SUPPORTED_CONTENT_SCHEMA_VERSION` and every non-null JSON value is an object rooted at `type: "doc"`; active WYSIWYG rows require it, while raw rows may carry it only as an inactive WYSIWYG draft. If validation fails, the Form page shows `이 글은 현재 에디터보다 새로운 형식이어서 수정할 수 없습니다.` and disables every save action; never cast and overwrite an unknown schema.

- [ ] **Step 4: Update repository column lists and mappers**

Add these columns to both select strings:

```text
content_authoring_mode,content_json,content_schema_version,content_source_backup,content_asset_scope,content_asset_base_enabled,published_at
```

Add Portfolio:

```text
thumbnail_path,thumbnail_public_url,thumbnail_alt
```

Add Blog:

```text
summary
```

Use the same explicit mapping in both insert and update builders:

```ts
content: input.content,
content_asset_base_enabled: input.contentAssetBaseEnabled,
content_asset_scope: input.contentAssetScope,
content_authoring_mode: input.contentAuthoringMode,
content_json: input.contentJson,
content_mode: input.contentMode,
content_schema_version: input.contentSchemaVersion,
content_source_backup: input.contentSourceBackup,
```

At the row/form boundary map `content_asset_base_enabled` ↔ `contentAssetBaseEnabled`; do not infer it from HTML text or from whether Storage currently contains files.

Portfolio also maps:

```ts
thumbnail_alt: input.thumbnailAlt,
thumbnail_path: input.thumbnailPath,
thumbnail_public_url: input.thumbnailPublicUrl,
```

Blog maps:

```ts
summary: input.summary,
```

- [ ] **Step 5: Replace constant empty forms with factories**

Use a factory so every new record gets a stable asset namespace:

```ts
const emptyDocument = {
  type: "doc",
  content: [{ type: "paragraph" }],
} as const satisfies TiptapDocument;

export function createEmptyPortfolioFormState(): PortfolioFormState {
  return {
    companyName: "",
    content: "",
    contentAssetBaseEnabled: false,
    contentAssetScope: crypto.randomUUID(),
    contentAuthoringMode: "wysiwyg",
    contentJson: emptyDocument,
    contentMode: "html",
    contentSchemaVersion: 1,
    contentSourceBackup: null,
    coreFeatures: [""],
    developmentPeriod: "",
    estimateLabel: "",
    landingPublished: false,
    landingSections: "{}",
    productDescription: "",
    seoDescription: "",
    servicePublished: false,
    serviceSections: "{}",
    slug: "",
    status: "draft",
    thumbnailAlt: "",
    thumbnailPath: null,
    thumbnailPublicUrl: null,
    title: "",
    type: "",
    workScopes: [""],
  };
}
```

Create the corresponding Blog factory with `summary: ""`, `contentAssetBaseEnabled: false`, existing thumbnail fields, `landingSections: "[]"`, and `bannerSections: "[]"`.

In both Form pages initialize with `useState(() => createEmpty...FormState())`; call the factory again only when entering a new-record route or intentionally resetting after save. Update `visual-test.tsx` the same way. Never call either factory during render, because that would rotate `contentAssetScope` and stale every uploaded image URL.

- [ ] **Step 6: Add deterministic content validation**

Add `content` to `PortfolioFieldKey`. Create `apps/admin/src/lib/managedContent.ts` so both form models depend on one pure helper:

```ts
import type {
  ContentAuthoringMode,
  ContentOutputMode,
  TiptapDocument,
  TiptapNode,
} from "@repo/content/types";

function documentHasVisibleContent(node: TiptapNode): boolean {
  if (node.type === "image" || node.type === "horizontalRule") return true;
  if (typeof node.text === "string" && node.text.trim().length > 0) return true;
  return node.content?.some(documentHasVisibleContent) ?? false;
}

export function managedContentIsEmpty(form: {
  readonly content: string;
  readonly contentAuthoringMode: ContentAuthoringMode;
  readonly contentJson: TiptapDocument | null;
  readonly contentMode: ContentOutputMode;
}): boolean {
  if (form.contentMode === "text" || form.contentAuthoringMode === "raw_html") {
    return form.content.trim().length === 0;
  }
  return !form.contentJson || !documentHasVisibleContent(form.contentJson);
}
```

Import `managedContentIsEmpty` from `../../lib/managedContent` in both form models. When `status === "published"`, reject empty content in both form builders. Blog also rejects an empty `summary` with `"게시하려면 카드 요약을 입력해 주세요."`.

- [ ] **Step 7: Re-run model and type tests**

Append `src/pages/portfolio/portfolioModel.test.ts` to the `test:model` script now that the file exists.

```bash
pnpm --filter admin test:model
pnpm --filter admin check-types
```

Expected: all model tests and type checking pass.

- [ ] **Step 8: Commit the persistence contract**

```bash
git add apps/admin/src/lib apps/admin/src/pages/portfolio apps/admin/src/pages/blog
git commit -m "feat(admin): persist rich content modes"
```

### Task 5: Build the shared Admin authoring UI and content asset upload

**Files:**
- Modify: `apps/admin/src/main.tsx`
- Modify: `apps/admin/src/components/admin/AdminEditorMode.tsx`
- Modify: `apps/admin/src/components/admin/icons.tsx`
- Modify: `apps/admin/src/components/admin/index.ts`
- Create: `apps/admin/src/components/content/AdminContentEditor.tsx`
- Create: `apps/admin/src/components/content/AdminContentEditor.module.css`
- Create: `apps/admin/src/components/content/AdminRichTextToolbar.tsx`
- Modify: `apps/admin/src/components/content/AdminRichTextEditor.tsx`
- Create: `apps/admin/src/components/content/AdminContentEditor.test.tsx`
- Create: `apps/admin/src/lib/contentAssetStorage.ts`
- Create: `apps/admin/src/lib/contentAssetStorage.test.ts`
- Modify: `apps/admin/src/lib/thumbnailStorage.ts`
- Create: `apps/admin/src/lib/thumbnailStorage.test.ts`
- Modify: `apps/admin/src/lib/adminValidation.ts`
- Modify: `apps/admin/src/pages/portfolio/PortfolioFormFields.tsx`
- Modify: `apps/admin/src/pages/portfolio/PortfolioFormPage.tsx`
- Modify: `apps/admin/src/pages/blog/BlogFormFields.tsx`
- Modify: `apps/admin/src/pages/blog/BlogFormPage.tsx`
- Modify: `apps/admin/src/visual-test.tsx`

**Interfaces:**
- Produces: one `AdminContentEditor` used by Portfolio and Blog
- Produces: `uploadContentAsset(config, input)` for immutable WYSIWYG images
- Produces: `uploadRawHtmlAsset(config, input)` for source-relative HTML asset paths
- Emits: `onBusyChange(true)` while canonical editor HTML is not ready or any image upload is pending
- Produces: HTML source preview through the same `RawHtmlFrame` used publicly
- Produces: WYSIWYG toolbar and Storage-backed image insertion

- [ ] **Step 1: Write failing component tests**

Create `AdminContentEditor.test.tsx` with these cases:

```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdminContentEditor } from "./AdminContentEditor";

const rawValue = {
  content: "<!DOCTYPE html><html><body><p>원문</p></body></html>",
  contentAssetBaseEnabled: false,
  contentAssetScope: "00000000-0000-4000-8000-000000000001",
  contentAuthoringMode: "raw_html" as const,
  contentJson: null,
  contentMode: "html" as const,
  contentSchemaVersion: 1 as const,
  contentSourceBackup: null,
};

function Harness({
  entity,
  onObservedChange,
}: {
  entity: "blog" | "portfolio";
  onObservedChange: ReturnType<typeof vi.fn>;
}) {
  const [value, setValue] = useState(rawValue);
  return (
    <AdminContentEditor
      disabled={false}
      entity={entity}
      onBusyChange={vi.fn()}
      onChange={(next) => {
        setValue(next);
        onObservedChange(next);
      }}
      value={value}
    />
  );
}

describe("AdminContentEditor", () => {
  it("keeps raw HTML unchanged while editing", async () => {
    const onChange = vi.fn();
    render(
      <Harness entity="portfolio" onObservedChange={onChange} />,
    );
    const source = screen.getByRole("textbox", { name: "HTML 원문" });
    expect(source).toHaveValue(rawValue.content);
    await userEvent.type(source, "\n<!-- qa -->");
    expect(onChange.mock.lastCall?.[0].content).toContain("<!-- qa -->");
  });

  it("backs up raw source before switching to WYSIWYG", async () => {
    const onChange = vi.fn();
    render(
      <Harness entity="blog" onObservedChange={onChange} />,
    );
    await userEvent.click(screen.getByLabelText("WYSIWYG 에디터"));
    await userEvent.click(screen.getByRole("button", {
      name: "현재 원문을 백업하고 새 문서 시작",
    }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "",
        contentAuthoringMode: "wysiwyg",
        contentSourceBackup: rawValue.content,
      }),
    );
  });
});
```

Add interaction cases that (a) insert a dropped image at the supplied document position, (b) show a local upload placeholder, (c) disable save/publish and both mode controls while the upload is pending, (d) replace the placeholder with the Storage HTTPS URL on success, and (e) remove it and show an inline error on failure without an unhandled rejection. Verify the selected-image control can set meaningful alt text or deliberately mark an image decorative with empty alt. Finally, persist and reload the three-mode-switch sequence from Step 7 so the inactive raw source and WYSIWYG JSON both survive a repository round trip.

- [ ] **Step 2: Add content image validation and Storage helper tests**

The test must assert PNG/JPEG/WEBP acceptance, 10MB rejection, the stable path pattern, and a returned public HTTPS URL. Use a fake Supabase Storage client and expect the WYSIWYG path:

```text
content/blog/00000000-0000-4000-8000-000000000001/images/<uuid>.webp
```

Add raw-asset cases that accept `images/meetit-feature-01.png`, store it at the same relative path under the asset scope, and reject absolute paths, backslashes, empty segments, `.` and `..` traversal.

Add one shared-contract assertion that `adminContentAssetBaseUrl(config, entity, scope)` exactly equals the public `createContentAssetBaseUrl` result for the same Supabase URL, bucket, entity, and scope. Verify the Admin preview passes that URL only when `contentAssetBaseEnabled` is true.

- [ ] **Step 3: Run tests and verify failure**

```bash
pnpm --filter admin test:unit -- AdminContentEditor.test.tsx contentAssetStorage.test.ts
```

Expected: missing AdminContentEditor and storage helper failures.

- [ ] **Step 4: Implement content asset Storage**

Create `apps/admin/src/lib/contentAssetStorage.ts`:

```ts
import { createContentAssetBaseUrl } from "@repo/content/asset-url";
import { StorageApiError } from "@supabase/supabase-js";
import type { SupabaseConfig } from "./supabase";
import {
  authExpiredFailure,
  networkFailure,
  permissionDeniedFailure,
  supabaseDisabledFailure,
  uploadFailure,
} from "./adminErrors";
import type { AdminRepositoryResult } from "./adminRepositoryTypes";
import { adminErr, adminOk } from "./adminTypes";

export type ContentEntity = "blog" | "portfolio";

export type ContentAssetUploadInput = {
  readonly assetScope: string;
  readonly entity: ContentEntity;
  readonly file: File;
};

export type RawHtmlAssetUploadInput = ContentAssetUploadInput & {
  readonly relativePath: string;
};

const allowedMimeTypes = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);
export const contentImageMaxSizeBytes = 10 * 1024 * 1024;

function bucketName(): string {
  return import.meta.env.VITE_SUPABASE_STORAGE_BUCKET?.trim() || "zerosourcing";
}

export function adminContentAssetBaseUrl(
  config: SupabaseConfig,
  entity: ContentEntity,
  assetScope: string,
): string | undefined {
  if (config.kind === "disabled") return undefined;
  return createContentAssetBaseUrl({
    assetScope,
    bucket: bucketName(),
    entity,
    supabaseUrl: config.url,
  });
}

function storageFailure(error: StorageApiError) {
  if (error.status === 401) return authExpiredFailure();
  if (error.status === 403) return permissionDeniedFailure();
  if (error.status >= 500) return networkFailure();
  return uploadFailure();
}

export async function uploadContentAsset(
  config: SupabaseConfig,
  input: ContentAssetUploadInput,
): Promise<AdminRepositoryResult<{
  readonly alt: string;
  readonly path: string;
  readonly publicUrl: string;
}>> {
  if (config.kind === "disabled") return adminErr(supabaseDisabledFailure(config));
  const extension = allowedMimeTypes.get(input.file.type);
  if (!extension || input.file.size > contentImageMaxSizeBytes) {
    return adminErr(uploadFailure());
  }
  const path =
    `content/${input.entity}/${input.assetScope}/images/${crypto.randomUUID()}.${extension}`;
  const bucket = bucketName();
  const { data, error } = await config.client.storage.from(bucket).upload(
    path,
    input.file,
    {
      cacheControl: "31536000",
      contentType: input.file.type,
      upsert: false,
    },
  );
  if (error) {
    return adminErr(
      error instanceof StorageApiError ? storageFailure(error) : uploadFailure(),
    );
  }
  const publicUrl =
    config.client.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
  return adminOk({
    alt: input.file.name.replace(/\.[^.]+$/, ""),
    path: data.path,
    publicUrl,
  });
}

function safeRelativeAssetPath(value: string): string | null {
  if (
    !value ||
    value.length > 512 ||
    value.startsWith("/") ||
    value.includes("\\") ||
    /[%?#\u0000-\u001f\u007f]/.test(value) ||
    value.split("/").some((segment) =>
      !segment || segment === "." || segment === ".." || segment.length > 128
    )
  ) {
    return null;
  }
  return value;
}

export async function uploadRawHtmlAsset(
  config: SupabaseConfig,
  input: RawHtmlAssetUploadInput,
): Promise<AdminRepositoryResult<{
  readonly path: string;
  readonly publicUrl: string;
  readonly relativePath: string;
}>> {
  if (config.kind === "disabled") return adminErr(supabaseDisabledFailure(config));
  const relativePath = safeRelativeAssetPath(input.relativePath);
  const extension = allowedMimeTypes.get(input.file.type);
  if (!relativePath || !extension || input.file.size > contentImageMaxSizeBytes) {
    return adminErr(uploadFailure());
  }
  const suffix = relativePath.toLowerCase().split(".").pop() ?? "";
  const allowedSuffixes =
    input.file.type === "image/jpeg" ? ["jpg", "jpeg"] : [extension];
  if (!allowedSuffixes.includes(suffix)) {
    return adminErr(uploadFailure());
  }
  const path =
    `content/${input.entity}/${input.assetScope}/${relativePath}`;
  const bucket = bucketName();
  const { data, error } = await config.client.storage.from(bucket).upload(
    path,
    input.file,
    {
      cacheControl: "31536000",
      contentType: input.file.type,
      upsert: false,
    },
  );
  if (error) {
    return adminErr(
      error instanceof StorageApiError ? storageFailure(error) : uploadFailure(),
    );
  }
  const publicUrl =
    config.client.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
  return adminOk({ path: data.path, publicUrl, relativePath });
}
```

Preserve both `.jpg` and `.jpeg` names when MIME is JPEG; never rename or rewrite the HTML source automatically.

- [ ] **Step 5: Replace the editor mode labels**

`AdminEditorMode` becomes `ContentAuthoringMode`. Render exactly:

```ts
const editorModeOptions = [
  {
    description: "완전한 HTML 문서와 script/style을 그대로 보존합니다.",
    label: "HTML 원문",
    value: "raw_html",
  },
  {
    description: "제목·목록·링크·이미지를 화면에서 편집합니다.",
    label: "WYSIWYG 에디터",
    value: "wysiwyg",
  },
] as const;
```

Keep the existing accessible fieldset/radio pattern and remove the `TEXT Editer` typo.

- [ ] **Step 6: Build the toolbar and asynchronous image lifecycle with the existing Admin button/icon patterns**

`AdminRichTextToolbar` must render buttons for paragraph, H2, H3, H4, bold, italic, underline, strike, link, bullet list, ordered list, blockquote, horizontal rule, left/center/right alignment, image upload, undo, redo. Each formatting button binds `aria-pressed` to the subscribed toolbar-state snapshot; divider marks are explicit `<span aria-hidden="true" />` elements.

Subscribe toolbar state with Tiptap's `useEditorState` and compute `isActive`/`can().chain()` inside its selector; reading `editor.isActive()` only during the parent render is not sufficient because Tiptap 3 does not rerender React for every selection transaction. Keep upload, focus, disabled, and error colors on the existing Admin tokens from `design.md`.

The image button uses:

```tsx
<input
  accept="image/png,image/jpeg,image/webp"
  aria-label="본문 이미지 업로드"
  disabled={disabled}
  onChange={(event) => {
    const file = event.currentTarget.files?.[0];
    if (file) void onImage(file);
    event.currentTarget.value = "";
  }}
  type="file"
/>
```

Add missing toolbar SVG paths to `apps/admin/src/components/admin/icons.tsx`; all use `currentColor`.

Upgrade the Task 3 file handler before wiring the real forms. On drop, consume FileHandler's `position`; on paste, consume the current selection. For every file:

1. Insert an image node immediately at that position with a unique private `uploadId`, a `blob:` preview URL, and upload-state styling. Extend the Image node so `uploadId` is present in editor JSON but never rendered into HTML.
2. Increment a pending-upload counter and report it through `onBusyChange`; disable save, publish, record navigation, asset-scope rotation, and mode switching until the counter returns to zero.
3. Adapt `AdminRepositoryResult<{ alt, path, publicUrl }>` to the editor promise: success returns `{ alt, url: publicUrl }`; failure throws a user-safe typed error that the editor catches and renders inline.
4. On success, locate the node by `uploadId`—not by the current selection—and atomically replace `blob:` with the immutable Storage URL. On failure, remove that placeholder and announce the error through an `aria-live="polite"` region. Always revoke the object URL in `finally`.
5. If the user deletes the placeholder while upload is in flight, do not reinsert it when the promise completes. Record the now-unreferenced object for later Storage cleanup rather than mutating the document.

Add a selected-image panel with `대체 텍스트` and `장식용 이미지` controls. Store a private boolean `decorative` attribute in editor JSON and omit that attribute from rendered HTML; decorative images render `alt=""`. File-stem text is only a temporary default; publishing is blocked while a non-decorative image has empty alt. Test multiple-file order, stale callbacks after scope rotation, node deletion during upload, failure cleanup, and that serialized/published HTML never contains `blob:`, `uploadId`, or `decorative`.

- [ ] **Step 7: Build AdminContentEditor**

The component owns mode switching and renders:

```tsx
<AdminEditorModeSegmentedControl
  disabled={disabled}
  fullWidth
  id="managed-content-mode"
  label="본문 작성 방식"
  name="managed-content-mode"
  onChange={changeMode}
  value={value.contentAuthoringMode}
/>
```

Handle legacy `contentMode === "text"` before rendering that control. Show the existing text in a plain textarea plus a `<pre>` preview so Admin and public both escape markup. Offer explicit `HTML 원문으로 변환` and `WYSIWYG로 변환` actions; both require confirmation, HTML-escape `<`, `>`, `&`, and quotes first, and only then construct `<p>/<br>` output or Tiptap text nodes. Never send a legacy text row to `RawHtmlFrame` merely because its backfilled authoring mode is `raw_html`.

Raw mode renders a textarea labeled `HTML 원문`, an asset upload/copy panel, and:

```tsx
<RawHtmlFrame
  assetBaseUrl={value.contentAssetBaseEnabled ? assetBaseUrl : undefined}
  html={value.content}
  title="HTML 원문 미리보기"
/>
```

Add `HTML 파일 불러오기` beside the textarea with `accept=".html,.htm,text/html"`. Read the selected file with `File.text()`, show the filename/size, and require an overwrite confirmation when the textarea is non-empty. The file itself is not uploaded; its exact decoded string becomes `content` and follows the same no-trim/no-format path as paste. Cover UTF-8 Korean, trailing newline, cancellation, and overwrite in the controlled component test.

Do not rebuild a 100KB+ `srcDoc` on every keystroke. Keep the textarea value live, but update the frame only on an explicit `미리보기 새로고침` action (and once after record load); show `편집 내용이 아직 미리보기에 반영되지 않았습니다.` until refreshed. The button must remain available in draft mode and use the exact current textarea string without formatting. When an asset base is active, warn that an author `<base>` is overridden and require fragment-link QA because the injected Storage base changes URL resolution.

The raw asset panel accepts multiple PNG/JPEG/WEBP files. For each file use `file.webkitRelativePath` when present; otherwise propose `images/${file.name}`. Show an editable relative-path review before upload, because `webkitRelativePath` may include an unwanted parent folder. Show the exact stored relative path and public URL after upload. The first relative upload asks to enable `Storage 상대경로 기준`; accepting sets `contentAssetBaseEnabled: true`, while existing and absolute-URL documents remain false. This makes source references such as `images/meetit-feature-01.png` resolve through the iframe `<base>` without changing the pasted source. On later edits, the HTML source remains the asset manifest; do not guess deletions by parsing it.

Raw assets are immutable (`upsert: false`). A `새 asset 버전` action explicitly rotates `contentAssetScope` after confirmation, then requires the complete relative asset set to be uploaded again; this cache-busts replacements without changing the source or slug. WYSIWYG images keep their UUID filenames and never rotate the scope during ordinary edits.

WYSIWYG mode lazy-loads `AdminRichTextEditor`, gives it `key={documentKey}`, and sends both JSON and HTML to `onChange`. Derive `documentKey` from the route record id plus the `updated_at` captured by that fetch, or from a per-form UUID for an unsaved record; freeze it during typing and ordinary save responses. Increment it only when another/asynchronously loaded record replaces the current document or an asset-scope rotation requires new upload callbacks. This prevents a late fetch from overwriting the local document and prevents old scope closures from receiving new uploads. Use these mode transition rules:

```ts
const emptyDocument: TiptapDocument = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function switchRawToWysiwyg(
  current: AdminManagedContentValue,
  strategy: "restore_previous" | "new_from_current_backup",
): AdminManagedContentValue {
  return {
    ...current,
    content: "",
    contentAuthoringMode: "wysiwyg",
    contentJson:
      strategy === "restore_previous"
        ? current.contentJson ?? emptyDocument
        : emptyDocument,
    contentMode: "html",
    contentSourceBackup:
      strategy === "restore_previous"
        ? current.contentSourceBackup ?? current.content
        : current.content,
  };
}

function switchWysiwygToRaw(
  current: AdminManagedContentValue,
  source: "backup" | "generated",
): AdminManagedContentValue {
  return {
    ...current,
    content:
      source === "backup"
        ? current.contentSourceBackup ?? current.content
        : current.content,
    contentAuthoringMode: "raw_html",
    contentJson: current.contentJson,
    contentMode: "html",
  };
}
```

Raw→WYSIWYG opens an accessible choice dialog: `이전 WYSIWYG 복원` preserves the first raw backup and stored JSON, while `현재 원문을 백업하고 새 문서 시작` explicitly replaces both inactive drafts. WYSIWYG→raw offers `이전 원문 복원`, `현재 생성 HTML 사용`, and `취소`. Do not collapse either direction into a boolean `window.confirm`; every destructive replacement names the draft that will be discarded.

On WYSIWYG mount, `onCreate` emits `{ document: editor.getJSON(), html: editor.getHTML() }` once with `emitUpdate` guarded, so a restored inactive JSON draft immediately rematerializes `content`. Keep the Form save buttons disabled until that first canonical pair is ready.

When `contentSourceBackup` exists, raw mode also renders a `원문 백업 복원` secondary button. After confirmation it replaces `content` with the backup and retains the private backup for later recovery. Add tests for `raw A → WYSIWYG B → raw restore === A`, `raw A → WYSIWYG B → raw generated === B`, and switching back to WYSIWYG restores B's JSON rather than reparsing either raw string.

- [ ] **Step 8: Use the same editor in both forms**

Replace the Portfolio custom radio/textarea and Blog segmented control/textarea with:

```tsx
<AdminContentEditor
  disabled={isDisabled}
  entity="portfolio"
  onBusyChange={setContentEditorBusy}
  onChange={(contentValue) =>
    onFormChange({ ...form, ...contentValue })
  }
  value={form}
/>
```

Blog uses `entity="blog"` and `onFieldChange` via one `onContentChange` prop added to `BlogFormFields`.

Both form pages include `contentEditorBusy` in their existing save/publish disabled condition and show why the action is unavailable. A route-leave guard names pending uploads and requires the user to remain until they settle; it never silently aborts them.

Add the required public-card excerpt before the content editor:

```tsx
<AdminTextareaField
  disabled={isDisabled}
  errorMessage={fieldErrors.summary}
  id="blog-summary"
  label="카드 요약"
  layout="stacked"
  onChange={(event) => onFieldChange("summary", event.currentTarget.value)}
  placeholder="목록과 공유 화면에 표시할 요약을 입력해 주세요."
  size="large"
  value={form.summary}
/>
```

The Blog model test must cover row → form → input round-trip for `summary`, and the component test must assert the field error is announced when publishing with an empty summary.

Import `@repo/content/rich-content.css` once in `apps/admin/src/main.tsx`.

- [ ] **Step 9: Add Portfolio thumbnail UI and generalized thumbnail persistence**

Reuse `AdminUploadControl` for Portfolio thumbnail with the same MIME/size behavior as Blog. Add selection state and compensating cleanup in `PortfolioFormPage` matching the existing Blog save sequence:

1. upload new thumbnail;
2. save row with new path/URL;
3. remove new upload if row save fails;
4. remove the old thumbnail only after row save succeeds.

Do not reuse content asset cleanup for thumbnails.

Rename the shared helper contract in `thumbnailStorage.ts` to `uploadThumbnail`/`removeThumbnail`, keep the existing `${slug}/${uuid}.${ext}` path for backward compatibility, and update Blog imports at the same time. Portfolio and Blog use the same helper but retain their own form-level compensating transaction. Add a fake-Storage test that covers both callers and proves that an old path is removed only after the row save succeeds.

- [ ] **Step 10: Verify Admin behavior**

```bash
pnpm --filter admin test
pnpm --filter admin check-types
pnpm --filter admin lint
pnpm --filter admin build
```

Expected: editor, model, repository, and storage tests pass; production build succeeds.

- [ ] **Step 11: Commit the Admin authoring UI**

```bash
git add apps/admin pnpm-lock.yaml
git commit -m "feat(admin): add html and wysiwyg authoring"
```

### Task 6: Build the server-only public content query layer

**Files:**
- Create: `apps/web/.env.example`
- Modify: `apps/web/.gitignore`
- Modify: `apps/web/package.json`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/lib/public-content/config.ts`
- Create: `apps/web/lib/public-content/postgrest.ts`
- Create: `apps/web/lib/public-content/postgrest-core.ts`
- Create: `apps/web/lib/public-content/types.ts`
- Create: `apps/web/lib/public-content/queries.ts`
- Create: `apps/web/lib/public-content/selectors.ts`
- Create: `apps/web/lib/public-content/public-content.test.ts`

**Interfaces:**
- Produces: `getPublishedPortfolios()`, `getPublishedPortfolio(slug)`
- Produces: `getPublishedBlogPosts()`, `getPublishedBlogPost(slug)`
- Produces: `getRelatedBlogPosts(type, slug)`, `getServicePortfolios(type)`
- Produces: deterministic featured/home/list selectors

- [ ] **Step 1: Add web test and sanitizer dependencies plus environment contract**

```bash
pnpm --filter web add '@repo/content@workspace:*' sanitize-html@2.17.4 server-only@0.0.1
pnpm --filter web add -D @types/sanitize-html@2.16.1 vitest
```

Pin `sanitize-html` to 2.17.4 while the repository engine remains Node `>=20`; 2.17.5 requires Node 22.12+ and would silently raise the deployment/runtime floor.

Add separate runners so Vitest never collects the existing `node:test` source-contract files:

```json
{
  "test": "pnpm run test:unit && pnpm run test:node",
  "test:node": "node --test app/*.test.mjs app/*/*.test.mjs components/*.test.mjs",
  "test:unit": "vitest run"
}
```

Create `apps/web/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts"],
  },
});
```

Create `apps/web/.env.example`:

```dotenv
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_STORAGE_BUCKET=zerosourcing
```

Append `!.env.example` and `!.env.e2e.example` to `apps/web/.gitignore`; real `.env*` files remain ignored.

- [ ] **Step 2: Write failing query and selector tests**

Create `apps/web/lib/public-content/public-content.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPublicRowsWithConfig } from "./postgrest-core";
import {
  selectBlogIndex,
  selectHomeBlogPosts,
  selectHomePortfolios,
  selectPortfolioIndex,
} from "./selectors";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchPublicRowsWithConfig", () => {
  it("uses the publishable key and no-store without Authorization", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ slug: "published" }]), {
        headers: { "content-type": "application/json" },
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const rows = await fetchPublicRowsWithConfig({
      config: {
        publishableKey: "publishable-test-key",
        storageBucket: "zerosourcing",
        url: "https://project.supabase.co",
      },
      query: { select: "slug", status: "eq.published" },
      table: "portfolios",
    });
    expect(rows).toEqual([{ slug: "published" }]);
    const [, init] = fetchMock.mock.calls[0];
    expect(init).toMatchObject({
      cache: "no-store",
      headers: { apikey: "publishable-test-key" },
    });
    expect(init.headers).not.toHaveProperty("Authorization");
  });
});

describe("public selectors", () => {
  it("selects feature, home, and list rows deterministically", () => {
    const rows = [
      {
        slug: "newest",
        landingPublished: false,
        bannerPublished: false,
      },
      {
        slug: "landing",
        landingPublished: true,
        bannerPublished: true,
      },
      {
        slug: "older",
        landingPublished: true,
        bannerPublished: false,
      },
    ];
    expect(selectHomePortfolios(rows).map((row) => row.slug)).toEqual([
      "landing",
      "older",
    ]);
    expect(selectHomeBlogPosts(rows).map((row) => row.slug)).toEqual([
      "landing",
      "older",
    ]);
    expect(selectPortfolioIndex(rows).featured?.slug).toBe("landing");
    expect(selectBlogIndex(rows).featured?.slug).toBe("landing");
  });
});
```

- [ ] **Step 3: Run the test and verify missing modules**

```bash
pnpm --filter web test:unit -- public-content.test.ts
```

Expected: imports for postgrest/selectors fail.

- [ ] **Step 4: Implement strict server configuration**

Create `apps/web/lib/public-content/config.ts`:

```ts
import "server-only";
import { createContentAssetBaseUrl } from "@repo/content/asset-url";
import type { PublicContentConfig } from "./postgrest-core";

export function getPublicContentConfig(): PublicContentConfig {
  const url = process.env.SUPABASE_URL?.trim() ?? "";
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
  const storageBucket =
    process.env.SUPABASE_STORAGE_BUCKET?.trim() || "zerosourcing";
  if (!url || !publishableKey || !URL.canParse(url)) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required for public content.",
    );
  }
  return { publishableKey, storageBucket, url };
}

export function contentAssetBaseUrl(
  entity: "blog" | "portfolio",
  assetScope: string,
): string {
  const config = getPublicContentConfig();
  return createContentAssetBaseUrl({
    assetScope,
    bucket: config.storageBucket,
    entity,
    supabaseUrl: config.url,
  });
}
```

- [ ] **Step 5: Implement the bounded PostgREST reader**

Create a pure/testable `postgrest-core.ts` that never imports `server-only`:

```ts
type PublicTable = "blog_posts" | "portfolios";
const PAGE_SIZE = 1_000;
const MAX_PAGES = 100;

export type PublicContentConfig = {
  readonly publishableKey: string;
  readonly storageBucket: string;
  readonly url: string;
};

export class PublicContentRequestError extends Error {
  constructor(readonly status: number) {
    super(`Public content request failed with status ${status}.`);
  }
}

export async function fetchPublicRowsWithConfig({
  config,
  query,
  table,
}: {
  readonly config: PublicContentConfig;
  readonly query: Readonly<Record<string, string>>;
  readonly table: PublicTable;
}): Promise<readonly unknown[]> {
  const endpoint = new URL(`/rest/v1/${table}`, config.url);
  endpoint.search = new URLSearchParams(query).toString();
  const response = await fetch(endpoint, {
    cache: "no-store",
    headers: { apikey: config.publishableKey },
  });
  if (!response.ok) throw new PublicContentRequestError(response.status);
  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("Public content response must be an array.");
  }
  return payload;
}

export async function fetchAllPublicRowsWithConfig({
  config,
  query,
  table,
}: {
  readonly config: PublicContentConfig;
  readonly query: Readonly<Record<string, string>>;
  readonly table: PublicTable;
}): Promise<readonly unknown[]> {
  const allRows: unknown[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const rows = await fetchPublicRowsWithConfig({
      config,
      query: {
        ...query,
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      },
      table,
    });
    allRows.push(...rows);
    if (rows.length < PAGE_SIZE) return allRows;
  }
  throw new Error("Public content exceeded the 100,000 row safety bound.");
}
```

Create the server-only adapter `postgrest.ts`:

```ts
import "server-only";
import { getPublicContentConfig } from "./config";
import {
  fetchAllPublicRowsWithConfig,
  fetchPublicRowsWithConfig,
} from "./postgrest-core";

type PublicTable = "blog_posts" | "portfolios";

export function fetchPublicRows(input: {
  readonly query: Readonly<Record<string, string>>;
  readonly table: PublicTable;
}) {
  return fetchPublicRowsWithConfig({
    ...input,
    config: getPublicContentConfig(),
  });
}

export function fetchAllPublicRows(input: {
  readonly query: Readonly<Record<string, string>>;
  readonly table: PublicTable;
}) {
  return fetchAllPublicRowsWithConfig({
    ...input,
    config: getPublicContentConfig(),
  });
}
```

Extend the unit test with 1,000-row then 1-row responses and assert that the second URL contains `offset=1000`; this prevents sitemap/list truncation at Supabase's configured `max_rows`.

- [ ] **Step 6: Define public rows and view models**

Create `apps/web/lib/public-content/types.ts`. Keep snake-case PostgREST rows private to the data layer and export serializable camel-case view models:

```ts
import type {
  ContentAuthoringMode,
  ContentOutputMode,
} from "@repo/content/types";

export type PortfolioType = "application" | "company_homepage" | "mvp";
export type BlogType =
  | "application"
  | "company_homepage"
  | "insight"
  | "mvp";

export type PortfolioCard = {
  readonly category: string;
  readonly description: string;
  readonly duration: string;
  readonly estimate: string;
  readonly features: readonly string[];
  readonly landingPublished: boolean;
  readonly scope: readonly string[];
  readonly servicePublished: boolean;
  readonly slug: string;
  readonly thumbnailAlt: string;
  readonly thumbnailUrl: string | null;
  readonly title: string;
  readonly type: PortfolioType;
  readonly updatedAt: string;
};

export type PortfolioDetail = PortfolioCard & {
  readonly assetBaseEnabled: boolean;
  readonly assetScope: string;
  readonly content: string;
  readonly contentAuthoringMode: ContentAuthoringMode;
  readonly contentMode: ContentOutputMode;
  readonly seoDescription: string;
};

export type BlogCard = {
  readonly bannerPublished: boolean;
  readonly category: string;
  readonly date: string;
  readonly landingPublished: boolean;
  readonly slug: string;
  readonly summary: string;
  readonly thumbnailAlt: string;
  readonly thumbnailUrl: string | null;
  readonly title: string;
  readonly type: BlogType;
  readonly updatedAt: string;
};

export type BlogDetail = BlogCard & {
  readonly assetBaseEnabled: boolean;
  readonly assetScope: string;
  readonly author: "제로소싱";
  readonly content: string;
  readonly contentAuthoringMode: ContentAuthoringMode;
  readonly contentMode: ContentOutputMode;
  readonly seoDescription: string;
};
```

- [ ] **Step 7: Implement cached queries**

Create `queries.ts` with exact list/detail select separation. Each function is wrapped in React `cache()`.

```ts
import "server-only";
import { cache } from "react";
import { fetchAllPublicRows, fetchPublicRows } from "./postgrest";
import type {
  BlogCard,
  BlogDetail,
  BlogType,
  PortfolioCard,
  PortfolioDetail,
  PortfolioType,
} from "./types";

const publicFilters = {
  deleted_at: "is.null",
  status: "eq.published",
};
const order = "published_at.desc,created_at.desc,slug.asc";
const publicSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const getPublishedPortfolios = cache(async (): Promise<
  readonly PortfolioCard[]
> => {
  const rows = await fetchAllPublicRows({
    table: "portfolios",
    query: {
      ...publicFilters,
      order,
      select:
        "slug,title,type,product_description,estimate_label,development_period,core_features,work_scopes,thumbnail_public_url,thumbnail_alt,landing_published,service_published,updated_at",
    },
  });
  return rows.map(mapPortfolioCard);
});

export const getPublishedPortfolio = cache(
  async (slug: string): Promise<PortfolioDetail | null> => {
    if (!publicSlugPattern.test(slug)) return null;
    const rows = await fetchPublicRows({
      table: "portfolios",
      query: {
        ...publicFilters,
        limit: "1",
        select:
          "slug,title,type,product_description,estimate_label,development_period,core_features,work_scopes,thumbnail_public_url,thumbnail_alt,landing_published,service_published,content_mode,content_authoring_mode,content,content_asset_scope,content_asset_base_enabled,seo_description,updated_at",
        slug: `eq.${slug}`,
      },
    });
    return rows[0] ? mapPortfolioDetail(rows[0]) : null;
  },
);

export const getPublishedBlogPosts = cache(async (): Promise<
  readonly BlogCard[]
> => {
  const rows = await fetchAllPublicRows({
    table: "blog_posts",
    query: {
      ...publicFilters,
      order,
      select:
        "slug,title,type,summary,published_date,thumbnail_public_url,thumbnail_alt,landing_published,banner_published,published_at,updated_at",
    },
  });
  return rows.map(mapBlogCard);
});

export const getPublishedBlogPost = cache(
  async (slug: string): Promise<BlogDetail | null> => {
    if (!publicSlugPattern.test(slug)) return null;
    const rows = await fetchPublicRows({
      table: "blog_posts",
      query: {
        ...publicFilters,
        limit: "1",
        select:
          "slug,title,type,summary,published_date,thumbnail_public_url,thumbnail_alt,landing_published,banner_published,content_mode,content_authoring_mode,content,content_asset_scope,content_asset_base_enabled,seo_description,updated_at,published_at",
        slug: `eq.${slug}`,
      },
    });
    return rows[0] ? mapBlogDetail(rows[0]) : null;
  },
);

export async function getServicePortfolios(
  type: PortfolioType,
): Promise<readonly PortfolioCard[]> {
  const rows = await getPublishedPortfolios();
  return rows
    .filter((row) => row.servicePublished && row.type === type)
    .slice(0, 3);
}

export async function getRelatedBlogPosts(
  type: BlogType,
  slug: string,
): Promise<readonly BlogCard[]> {
  const rows = await getPublishedBlogPosts();
  return rows
    .filter((row) => row.type === type && row.slug !== slug)
    .slice(0, 3);
}
```

In the same file add the exact runtime validation and mapping boundary below. The mappers are the only place that translates DB snake_case keys and type labels; invalid PostgREST payloads fail loudly instead of being coerced.

```ts
function record(value: unknown): Readonly<Record<string, unknown>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Public content row must be an object.");
  }
  return value as Readonly<Record<string, unknown>>;
}

function stringField(
  row: Readonly<Record<string, unknown>>,
  key: string,
): string {
  const value = row[key];
  if (typeof value !== "string") {
    throw new Error(`Public content field ${key} must be a string.`);
  }
  return value;
}

function nullableStringField(
  row: Readonly<Record<string, unknown>>,
  key: string,
): string | null {
  const value = row[key];
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new Error(`Public content field ${key} must be string or null.`);
  }
  return value;
}

function uuidField(
  row: Readonly<Record<string, unknown>>,
  key: string,
): string {
  const value = stringField(row, key);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`Public content field ${key} must be a UUID.`);
  }
  return value;
}

function timestampField(
  row: Readonly<Record<string, unknown>>,
  key: string,
): string {
  const value = stringField(row, key);
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Public content field ${key} must be a timestamp.`);
  }
  return value;
}

function booleanField(
  row: Readonly<Record<string, unknown>>,
  key: string,
): boolean {
  const value = row[key];
  if (typeof value !== "boolean") {
    throw new Error(`Public content field ${key} must be boolean.`);
  }
  return value;
}

function stringArrayField(
  row: Readonly<Record<string, unknown>>,
  key: string,
): readonly string[] {
  const value = row[key];
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error(`Public content field ${key} must be string[].`);
  }
  return value;
}

function enumField<const TValues extends readonly string[]>(
  row: Readonly<Record<string, unknown>>,
  key: string,
  values: TValues,
): TValues[number] {
  const value = stringField(row, key);
  const match = values.find((candidate) => candidate === value);
  if (!match) {
    throw new Error(`Public content field ${key} has an unknown value.`);
  }
  return match;
}

function portfolioCategory(type: PortfolioType): string {
  if (type === "company_homepage") return "기업 홈페이지";
  if (type === "application") return "어플리케이션";
  return "MVP";
}

function blogCategory(type: BlogType): string {
  if (type === "company_homepage") return "기업 홈페이지";
  if (type === "application") return "어플리케이션";
  if (type === "mvp") return "MVP";
  return "인사이트";
}

function displayDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) throw new Error("Public content date is invalid.");
  return `${match[1]}. ${match[2]}. ${match[3]}`;
}

const portfolioTypes = ["application", "company_homepage", "mvp"] as const;
const blogTypes = [
  "application",
  "company_homepage",
  "insight",
  "mvp",
] as const;
const authoringModes = ["raw_html", "wysiwyg"] as const;
const outputModes = ["html", "text"] as const;

function mapPortfolioCard(value: unknown): PortfolioCard {
  const row = record(value);
  const type = enumField(row, "type", portfolioTypes);
  return {
    category: portfolioCategory(type),
    description: stringField(row, "product_description"),
    duration: stringField(row, "development_period"),
    estimate: stringField(row, "estimate_label"),
    features: stringArrayField(row, "core_features"),
    landingPublished: booleanField(row, "landing_published"),
    scope: stringArrayField(row, "work_scopes"),
    servicePublished: booleanField(row, "service_published"),
    slug: stringField(row, "slug"),
    thumbnailAlt: stringField(row, "thumbnail_alt"),
    thumbnailUrl: nullableStringField(row, "thumbnail_public_url"),
    title: stringField(row, "title"),
    type,
    updatedAt: timestampField(row, "updated_at"),
  };
}

function mapPortfolioDetail(value: unknown): PortfolioDetail {
  const row = record(value);
  return {
    ...mapPortfolioCard(row),
    assetBaseEnabled: booleanField(row, "content_asset_base_enabled"),
    assetScope: uuidField(row, "content_asset_scope"),
    content: stringField(row, "content"),
    contentAuthoringMode: enumField(
      row,
      "content_authoring_mode",
      authoringModes,
    ),
    contentMode: enumField(row, "content_mode", outputModes),
    seoDescription: stringField(row, "seo_description"),
  };
}

function mapBlogCard(value: unknown): BlogCard {
  const row = record(value);
  const type = enumField(row, "type", blogTypes);
  const date =
    nullableStringField(row, "published_date") ??
    stringField(row, "published_at");
  return {
    bannerPublished: booleanField(row, "banner_published"),
    category: blogCategory(type),
    date: displayDate(date),
    landingPublished: booleanField(row, "landing_published"),
    slug: stringField(row, "slug"),
    summary: stringField(row, "summary"),
    thumbnailAlt: stringField(row, "thumbnail_alt"),
    thumbnailUrl: nullableStringField(row, "thumbnail_public_url"),
    title: stringField(row, "title"),
    type,
    updatedAt: timestampField(row, "updated_at"),
  };
}

function mapBlogDetail(value: unknown): BlogDetail {
  const row = record(value);
  return {
    ...mapBlogCard(row),
    assetBaseEnabled: booleanField(row, "content_asset_base_enabled"),
    assetScope: uuidField(row, "content_asset_scope"),
    author: "제로소싱",
    content: stringField(row, "content"),
    contentAuthoringMode: enumField(
      row,
      "content_authoring_mode",
      authoringModes,
    ),
    contentMode: enumField(row, "content_mode", outputModes),
    seoDescription: stringField(row, "seo_description"),
  };
}
```

- [ ] **Step 8: Implement selectors**

Create `selectors.ts`:

```ts
export function selectHomePortfolios<
  T extends { readonly landingPublished: boolean },
>(rows: readonly T[]): readonly T[] {
  return rows.filter((row) => row.landingPublished).slice(0, 6);
}

export function selectHomeBlogPosts<
  T extends { readonly landingPublished: boolean },
>(rows: readonly T[]): readonly T[] {
  return rows.filter((row) => row.landingPublished).slice(0, 3);
}

export function selectPortfolioIndex<
  T extends { readonly landingPublished: boolean },
>(rows: readonly T[]) {
  const featured =
    rows.find((row) => row.landingPublished) ?? rows[0] ?? null;
  return {
    featured,
    list: featured ? rows.filter((row) => row !== featured) : rows,
  };
}

export function selectBlogIndex<
  T extends { readonly bannerPublished: boolean },
>(rows: readonly T[]) {
  const featured =
    rows.find((row) => row.bannerPublished) ?? rows[0] ?? null;
  const remaining = featured
    ? rows.filter((row) => row !== featured)
    : rows;
  return {
    featured,
    list: remaining,
    top: remaining.slice(0, 3),
  };
}
```

- [ ] **Step 9: Run data-layer verification**

```bash
pnpm --filter web test:unit -- public-content.test.ts
pnpm --filter web check-types
pnpm --filter web lint
```

Expected: query/selector tests and checks pass.

- [ ] **Step 10: Commit the query layer**

```bash
git add apps/web/.env.example apps/web/package.json apps/web/lib/public-content pnpm-lock.yaml
git commit -m "feat(web): add public content queries"
```

### Task 7: Render raw and WYSIWYG content through separate secure paths

**Files:**
- Create: `apps/web/lib/public-content/sanitize-rich-content.ts`
- Modify: `apps/web/lib/public-content/public-content.test.ts`
- Create: `apps/web/components/ManagedContent.tsx`
- Create: `apps/web/components/ManagedContent.module.css`
- Modify: `apps/web/app/layout.tsx`

**Interfaces:**
- Produces: `sanitizeRichContent(html, { allowedImageBaseUrl }): string`
- Produces: `ManagedContent({ entity, record })`

- [ ] **Step 1: Add failing security tests**

Append:

```ts
import { sanitizeRichContent } from "./sanitize-rich-content";

describe("sanitizeRichContent", () => {
  it("keeps editor markup and removes executable content", () => {
    const clean = sanitizeRichContent(
      '<h2 style="text-align:center" onclick="alert(1)">제목</h2>' +
        '<a href="javascript:alert(1)">위험</a>' +
        '<img src="https://project.supabase.co/storage/v1/object/public/zerosourcing/content/blog/scope/images/a.webp" alt="설명" onerror="alert(1)">' +
        '<script>alert(1)</script>',
      {
        allowedImageBaseUrl:
          "https://project.supabase.co/storage/v1/object/public/zerosourcing/content/blog/scope/",
      },
    );
    expect(clean).toContain("<h2 style=\"text-align:center\">제목</h2>");
    expect(clean).toContain('alt="설명"');
    expect(clean).not.toMatch(/script|onclick|onerror|javascript:/);
  });
});
```

Add a second fixture containing every Tiptap output used here (H2–H4, paragraph, both lists, quote, pre/code, underline, strike, hr, scoped Storage image, text alignment, and HTTP/mailto/tel links). Assert it survives sanitization, a second sanitize pass is identical, and image `src` rejects data/mailto/tel/blob, an external HTTPS origin, and a sibling record scope while anchors still allow mailto/tel. Add malformed SVG/MathML, encoded control-character URL, CSS `url()`/`expression`, iframe, object, and form cases to the malicious fixture.

In the same suite import `buildRawHtmlSource` from `@repo/content/raw-html-frame`. Cover a normal document, comment/script text containing fake `<head>`/`<base>` strings, BOM + HTML5 doctype, no doctype, and an author-supplied `<base>`. Keep a separate source-round-trip assertion that returns the input exactly as entered with no trim/format/sanitize step. For the transient frame output, assert the runtime is inserted exactly once, the Storage base is first, and the original body/script/style text remains in order. The E2E resize case in Task 10 covers late images and `document.fonts.ready` in a real browser.

- [ ] **Step 2: Implement the allowlist sanitizer**

Create `sanitize-rich-content.ts`:

```ts
import sanitizeHtml from "sanitize-html";

function isAllowedImageSource(
  source: string | undefined,
  allowedImageBaseUrl: string,
): boolean {
  if (!source) return false;
  try {
    const candidate = new URL(source);
    const base = new URL(allowedImageBaseUrl);
    return candidate.protocol === "https:"
      && candidate.origin === base.origin
      && candidate.pathname.startsWith(base.pathname);
  } catch {
    return false;
  }
}

export function sanitizeRichContent(
  html: string,
  options: { readonly allowedImageBaseUrl: string },
): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "pre",
      "code", "strong", "em", "u", "s", "a", "br", "hr", "img",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      p: ["style"],
    },
    allowedSchemes: ["http", "https"],
    allowedSchemesByTag: {
      a: ["http", "https", "mailto", "tel"],
      img: ["http", "https"],
    },
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    allowedStyles: {
      "*": {
        "text-align": [/^left$/, /^center$/, /^right$/],
      },
    },
    disallowedTagsMode: "completelyDiscard",
    exclusiveFilter: (frame) =>
      frame.tag === "img"
      && !isAllowedImageSource(frame.attribs.src, options.allowedImageBaseUrl),
    transformTags: {
      a: (_tagName, attributes) => ({
        attribs: {
          ...attributes,
          rel: "noopener noreferrer",
          target: "_blank",
        },
        tagName: "a",
      }),
      img: (_tagName, attributes) => ({
        attribs: {
          ...attributes,
          loading: "lazy",
        },
        tagName: "img",
      }),
    },
  });
}
```

- [ ] **Step 3: Implement the public content switch**

Create `ManagedContent.tsx`:

```tsx
import "server-only";
import { RawHtmlFrame } from "@repo/content/raw-html-frame";
import type {
  ContentAuthoringMode,
  ContentOutputMode,
} from "@repo/content/types";
import { contentAssetBaseUrl } from "../lib/public-content/config";
import { sanitizeRichContent } from "../lib/public-content/sanitize-rich-content";
import styles from "./ManagedContent.module.css";

type ManagedContentProps = {
  readonly assetBaseEnabled: boolean;
  readonly assetScope: string;
  readonly authoringMode: ContentAuthoringMode;
  readonly content: string;
  readonly entity: "blog" | "portfolio";
  readonly outputMode: ContentOutputMode;
  readonly title: string;
};

export function ManagedContent(props: ManagedContentProps) {
  if (props.outputMode === "text") {
    return <p className={styles.plainText}>{props.content}</p>;
  }
  if (props.authoringMode === "raw_html") {
    return (
      <RawHtmlFrame
        assetBaseUrl={
          props.assetBaseEnabled
            ? contentAssetBaseUrl(props.entity, props.assetScope)
            : undefined
        }
        html={props.content}
        title={props.title}
      />
    );
  }
  const allowedImageBaseUrl = contentAssetBaseUrl(
    props.entity,
    props.assetScope,
  );
  return (
    <div
      className="rich-content"
      dangerouslySetInnerHTML={{
        __html: sanitizeRichContent(props.content, { allowedImageBaseUrl }),
      }}
    />
  );
}
```

Create `ManagedContent.module.css`:

```css
.plainText {
  composes: pretendard-medium-16 from global;
  margin: 0;
  color: var(--color-gray-800);
  white-space: pre-wrap;
}
```

Import `@repo/content/rich-content.css` once in `apps/web/app/layout.tsx`.

- [ ] **Step 4: Run the security and build gate**

```bash
pnpm --filter web test:unit -- public-content.test.ts
pnpm --filter @repo/content check-types
pnpm --filter web check-types
pnpm --filter web build
```

Expected: malicious markup test passes and builds succeed.

- [ ] **Step 5: Commit the renderers**

```bash
git add apps/web/components apps/web/lib/public-content/sanitize-rich-content.ts apps/web/app/layout.tsx apps/web/lib/public-content/public-content.test.ts
git commit -m "feat(web): render managed content securely"
```

### Task 8: Replace Portfolio and Blog list/detail fixtures with Admin records

**Files:**
- Create: `apps/web/app/error.tsx`
- Create: `apps/web/app/error.module.css`
- Create: `apps/web/components/ManagedThumbnail.tsx`
- Create: `apps/web/components/ManagedThumbnail.module.css`
- Create: `apps/web/app/portfolio/PortfolioListClient.tsx`
- Modify: `apps/web/app/portfolio/page.tsx`
- Modify: `apps/web/app/portfolio/page.module.css`
- Modify: `apps/web/app/portfolio/[slug]/page.tsx`
- Modify: `apps/web/app/portfolio/[slug]/portfolio-detail.module.css`
- Create: `apps/web/app/blog/BlogListClient.tsx`
- Modify: `apps/web/app/blog/page.tsx`
- Modify: `apps/web/app/blog/blog.module.css`
- Modify: `apps/web/app/blog/[slug]/page.tsx`
- Modify: `apps/web/app/blog/[slug]/blog-detail.module.css`
- Modify: `apps/web/next.config.js`
- Modify: `apps/web/app/detail-html-height.test.mjs`
- Modify: `apps/web/app/site-metadata.test.mjs`
- Modify: `apps/web/app/portfolio/portfolio-card-navigation.test.mjs`

**Interfaces:**
- Server pages fetch and select records; client list components receive serializable view models only
- Detail metadata and visible page content come from the same cached query
- Draft, deleted, and unknown slugs resolve to 404 without a fixture fallback
- Admin thumbnail URLs render through `next/image`

- [ ] **Step 1: Rewrite the source-contract tests so the fixture imports fail**

Update the three existing tests to require these contracts:

```js
assert.match(portfolioPage, /getPublishedPortfolios/);
assert.match(portfolioPage, /selectPortfolioIndex/);
assert.match(portfolioClient, /href=\{`\/portfolio\/\$\{item\.slug\}`\}/);
assert.doesNotMatch(portfolioPage, /portfolio-items/);

assert.match(blogDetail, /getPublishedBlogPost/);
assert.match(portfolioDetail, /getPublishedPortfolio/);
assert.match(blogDetail, /<ManagedContent/);
assert.match(portfolioDetail, /<ManagedContent/);
assert.doesNotMatch(blogDetail, /blog-posts/);
assert.doesNotMatch(portfolioDetail, /portfolio-items/);
```

In `detail-html-height.test.mjs`, read `packages/content/src/RawHtmlFrame.tsx` and require `sandbox="allow-scripts"`, the postMessage height bridge, and an inline height derived from component state. Remove the old `min-height: 1200px` assertions and instead assert that neither detail stylesheet contains the fixed-height placeholder.

- [ ] **Step 2: Run the focused tests and verify fixture coupling fails**

```bash
node --test apps/web/app/detail-html-height.test.mjs apps/web/app/site-metadata.test.mjs apps/web/app/portfolio/portfolio-card-navigation.test.mjs
```

Expected: fixture import and fixed-height expectations fail until the pages are rewired.

- [ ] **Step 3: Add a public failure boundary, configure Supabase Storage images, and add one thumbnail primitive**

Create `apps/web/app/error.tsx` as a Client Component using the existing public button, typography, spacing, and color tokens. It shows `콘텐츠를 불러오지 못했습니다.` and a `다시 시도` button that calls `reset()`; it must not print the thrown message, PostgREST URL, environment values, or response body. This preserves the contract that only an absent successful query calls `notFound()`: configuration, network, authorization, schema, and decoding failures throw into this boundary and are never disguised as a 404. Add the matching styles in `error.module.css` and a source-contract assertion for the safe copy plus retry callback.

Update `apps/web/next.config.js`:

```js
const storagePattern = process.env.SUPABASE_URL
  ? new URL("/storage/v1/object/public/**", process.env.SUPABASE_URL)
  : null;

if (process.env.NODE_ENV === "production" && !storagePattern) {
  throw new Error("SUPABASE_URL must be present at Web build time.");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: storagePattern ? [storagePattern] : [],
  },
};

export default nextConfig;
```

Create `ManagedThumbnail.tsx`:

```tsx
import Image from "next/image";
import styles from "./ManagedThumbnail.module.css";

type ManagedThumbnailProps = {
  readonly alt: string;
  readonly className: string;
  readonly sizes: string;
  readonly url: string | null;
};

export function ManagedThumbnail({
  alt,
  className,
  sizes,
  url,
}: ManagedThumbnailProps) {
  return (
    <div className={`${className} ${styles.frame}`}>
      {url ? (
        <Image
          alt={alt}
          className={styles.image}
          fill
          sizes={sizes}
          src={url}
        />
      ) : null}
    </div>
  );
}
```

```css
.frame {
  position: relative;
  overflow: hidden;
}

.image {
  object-fit: cover;
}
```

Use empty `alt` on linked cards because the adjacent title already labels the link; use the stored alt only where an image conveys information not repeated by text.

- [ ] **Step 4: Split Portfolio into a server loader and interactive list**

Replace `apps/web/app/portfolio/page.tsx` with the server boundary:

```tsx
import { getPublishedPortfolios } from "../../lib/public-content/queries";
import { selectPortfolioIndex } from "../../lib/public-content/selectors";
import { PortfolioListClient } from "./PortfolioListClient";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const rows = await getPublishedPortfolios();
  const { featured, list } = selectPortfolioIndex(rows);
  return <PortfolioListClient featured={featured} items={list} />;
}
```

Move the current JSX, static `metrics`, category filter state, and card helpers into `PortfolioListClient.tsx` with `"use client"`. Use this prop contract:

```ts
type PortfolioListClientProps = {
  readonly featured: PortfolioCard | null;
  readonly items: readonly PortfolioCard[];
};
```

Replace fixture field access exactly as follows:

| Existing UI field | Admin view model |
| --- | --- |
| `featuredCase.period` | `featured.duration` |
| `featuredCase.description` | `featured.description` |
| `featuredCase.features` | `featured.features` |
| `featuredCase.scope` | `featured.scope` |
| `item.duration` | `item.duration` |
| gray thumbnail div | `ManagedThumbnail(url={...thumbnailUrl})` |

The filter labels stay `전체`, `MVP`, `어플리케이션`, `기업 홈페이지` and compare against `item.category`. If `featured` is `null`, omit the featured card and render `등록된 포트폴리오가 없습니다.` inside the list section. Keep all existing classes and DOM nesting so this is a data-source change, not a redesign.

- [ ] **Step 5: Split Blog into a server loader and searchable client list**

Replace `apps/web/app/blog/page.tsx` with:

```tsx
import { getPublishedBlogPosts } from "../../lib/public-content/queries";
import { selectBlogIndex } from "../../lib/public-content/selectors";
import { BlogListClient } from "./BlogListClient";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const rows = await getPublishedBlogPosts();
  const { featured, list, top } = selectBlogIndex(rows);
  return <BlogListClient featured={featured} items={list} top={top} />;
}
```

Move the present layout/search helpers to `BlogListClient.tsx` with `"use client"` and:

```ts
type BlogListClientProps = {
  readonly featured: BlogCard | null;
  readonly items: readonly BlogCard[];
  readonly top: readonly BlogCard[];
};
```

Search `title`, `summary`, and `category`; replace `description` with `summary`; keep the visual `NEW` badge on the three `top` records. Turn the featured article into a visually identical `Link` to `/blog/${featured.slug}`. Use `ManagedThumbnail` for featured/top/list thumbnails. When no record exists, render `등록된 글이 없습니다.` and skip featured/top cards.

- [ ] **Step 6: Wire both dynamic detail pages and metadata**

Remove both `generateStaticParams` functions and set `export const dynamic = "force-dynamic"` in each detail file.

Portfolio uses:

```tsx
export async function generateMetadata({ params }: PortfolioDetailPageProps) {
  const { slug } = await params;
  const portfolio = await getPublishedPortfolio(slug);
  if (!portfolio) return {};
  return createPageMetadata({
    title: portfolio.title,
    description: portfolio.seoDescription || portfolio.description,
    path: `/portfolio/${portfolio.slug}`,
  });
}

export default async function PortfolioDetailPage({
  params,
}: PortfolioDetailPageProps) {
  const { slug } = await params;
  const portfolio = await getPublishedPortfolio(slug);
  if (!portfolio) notFound();
  // Preserve the existing hero, summary, CTA, and back-link markup.
}
```

Replace the `.htmlPreview` placeholder with:

```tsx
<div className={styles.managedContent}>
  <ManagedContent
    assetBaseEnabled={portfolio.assetBaseEnabled}
    assetScope={portfolio.assetScope}
    authoringMode={portfolio.contentAuthoringMode}
    content={portfolio.content}
    entity="portfolio"
    outputMode={portfolio.contentMode}
    title={portfolio.title}
  />
</div>
```

Blog uses the corresponding `getPublishedBlogPost` metadata query, with `post.seoDescription || post.summary`, and:

```tsx
const relatedPosts = await getRelatedBlogPosts(post.type, post.slug);

<div className={styles.articleBody}>
  <ManagedContent
    assetBaseEnabled={post.assetBaseEnabled}
    assetScope={post.assetScope}
    authoringMode={post.contentAuthoringMode}
    content={post.content}
    entity="blog"
    outputMode={post.contentMode}
    title={post.title}
  />
</div>
```

Change `Meta` and `RelatedPostCard` to accept `BlogCard | BlogDetail`, use `summary`, and use `ManagedThumbnail`. Keep `notFound()` as the only missing-record behavior.

- [ ] **Step 7: Remove placeholder height CSS without changing the detail shell**

Delete fixed `min-height` rules from `.htmlPreview`/`.articleBody`. Rename Portfolio `.htmlPreview` to `.managedContent`, preserve its width and surrounding spacing, and let `RawHtmlFrame` report its document height. Do not add a replacement `min-width`/`min-height`, global body reset, or new hard-coded color.

- [ ] **Step 8: Run list/detail verification**

```bash
node --test apps/web/app/detail-html-height.test.mjs apps/web/app/site-metadata.test.mjs apps/web/app/portfolio/portfolio-card-navigation.test.mjs
pnpm --filter web test
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
```

Expected: list/detail tests pass; production build resolves the Server/Client boundaries and dynamic metadata.

- [ ] **Step 9: Commit the list/detail cutover**

```bash
git add apps/web/app/blog apps/web/app/portfolio apps/web/app/error.tsx apps/web/app/error.module.css apps/web/components/ManagedThumbnail.tsx apps/web/components/ManagedThumbnail.module.css apps/web/next.config.js apps/web/app/detail-html-height.test.mjs apps/web/app/site-metadata.test.mjs
git commit -m "feat(web): source detail pages from admin content"
```

### Task 9: Connect home, service cards, and sitemap; then delete fixtures

**Files:**
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/page.module.css`
- Modify: `apps/web/app/content.ts`
- Modify: `apps/web/components/ServicePortfolioSection.tsx`
- Modify: `apps/web/components/ServicePortfolioSection.module.css`
- Modify: `apps/web/app/service/mvp/page.tsx`
- Modify: `apps/web/app/service/app/page.tsx`
- Modify: `apps/web/app/service/company-homepage/page.tsx`
- Modify: `apps/web/app/sitemap.ts`
- Modify: `apps/web/app/home-card-navigation.test.mjs`
- Modify: `apps/web/components/service-portfolio-navigation.test.mjs`
- Modify: `apps/web/app/site-metadata.test.mjs`
- Delete: `apps/web/app/portfolio/portfolio-items.ts`
- Delete: `apps/web/app/blog/blog-posts.ts`

**Interfaces:**
- Home cards respect `landing_published`
- Service cards respect `service_published` plus exact Portfolio type
- Sitemap contains every currently published slug and no draft/deleted slug
- No public runtime imports local Portfolio/Blog content fixtures

- [ ] **Step 1: Rewrite navigation and sitemap tests against query contracts**

Replace fixture-count assertions with:

```js
assert.match(homePage, /getPublishedPortfolios/);
assert.match(homePage, /getPublishedBlogPosts/);
assert.match(homePage, /selectHomePortfolios/);
assert.match(homePage, /selectHomeBlogPosts/);
assert.doesNotMatch(homeContent, /export const homePortfolios/);
assert.doesNotMatch(homeContent, /export const homeInsights/);

assert.match(serviceSection, /getServicePortfolios/);
assert.match(serviceSection, /href=\{`\/portfolio\/\$\{portfolio\.slug\}`\}/);
assert.doesNotMatch(serviceSection, /const portfolios = \[/);

assert.match(sitemap, /getPublishedBlogPosts/);
assert.match(sitemap, /getPublishedPortfolios/);
assert.doesNotMatch(sitemap, /blog-posts|portfolio-items/);
```

- [ ] **Step 2: Verify the old implementation fails the new contracts**

```bash
node --test apps/web/app/home-card-navigation.test.mjs apps/web/components/service-portfolio-navigation.test.mjs apps/web/app/site-metadata.test.mjs
```

Expected: all three fail on fixture/static-array coupling.

- [ ] **Step 3: Load home cards from Admin data**

Make the existing Home component async and dynamic:

```tsx
export const dynamic = "force-dynamic";

export default async function Home() {
  const [portfolioRows, blogRows] = await Promise.all([
    getPublishedPortfolios(),
    getPublishedBlogPosts(),
  ]);
  const homePortfolios = selectHomePortfolios(portfolioRows);
  const homeInsights = selectHomeBlogPosts(blogRows);
  const homeLeftPortfolios = homePortfolios.filter((_, index) => index % 2 === 0);
  const homeRightPortfolios = homePortfolios.filter((_, index) => index % 2 === 1);
  // Existing page markup follows unchanged.
}
```

Remove only `homePortfolios` and `homeInsights` from `content.ts`; keep the unrelated static marketing copy. Use `ManagedThumbnail`, Portfolio `description`/`duration`, and Blog `summary`/`date`. Render `등록된 포트폴리오가 없습니다.` or `등록된 인사이트가 없습니다.` in the existing section when an enabled set is empty.

- [ ] **Step 4: Filter every service page through its Admin type**

Extend the component prop contract:

```ts
type ServicePortfolioSectionProps = {
  readonly contentNodeId: string;
  readonly description?: ReactNode;
  readonly label: string;
  readonly order: string;
  readonly portfolioType: PortfolioType;
  readonly title: ReactNode;
};
```

Make `ServicePortfolioSection` async, call `getServicePortfolios(portfolioType)`, and map cards to `/portfolio/${portfolio.slug}` using `description`, `duration`, and `ManagedThumbnail`. Render an in-section empty state if none are service-enabled.

Pass the exact values:

| Service route | `portfolioType` |
| --- | --- |
| `/service/mvp` | `"mvp"` |
| `/service/app` | `"application"` |
| `/service/company-homepage` | `"company_homepage"` |

- [ ] **Step 5: Generate dynamic sitemap entries from the same published query**

Replace `sitemap.ts` with the same static path list plus:

```ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogs, portfolios] = await Promise.all([
    getPublishedBlogPosts(),
    getPublishedPortfolios(),
  ]);
  const staticEntries = staticPaths.map((path) => ({
    url: new URL(path, `${SITE_URL}/`).toString(),
  }));
  const dynamicEntries = [
    ...blogs.map((post) => ({
      lastModified: post.updatedAt,
      path: `/blog/${post.slug}`,
    })),
    ...portfolios.map((portfolio) => ({
      lastModified: portfolio.updatedAt,
      path: `/portfolio/${portfolio.slug}`,
    })),
  ].map(({ lastModified, path }) => ({
    lastModified,
    url: new URL(path, `${SITE_URL}/`).toString(),
  }));
  return [...staticEntries, ...dynamicEntries];
}
```

Add `export const dynamic = "force-dynamic"` so the metadata route follows the same immediate-publication policy as the pages.

Do not independently query the Admin API and do not add draft URLs from `generateStaticParams`.

- [ ] **Step 6: Prove fixture removal before deleting files**

```bash
rg -n "portfolio-items|blog-posts|homePortfolios|homeInsights" apps/web --glob '!*.test.*'
```

Expected: no runtime import or identifier remains. Then delete `portfolio-items.ts` and `blog-posts.ts`.

- [ ] **Step 7: Run the complete public-web gate**

```bash
node --test apps/web/app/*.test.mjs apps/web/app/portfolio/*.test.mjs apps/web/components/*.test.mjs
pnpm --filter web test
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
```

Expected: navigation, metadata, sitemap, query, sanitizer, types, lint, and build all pass with the fixture files absent.

- [ ] **Step 8: Commit the full public cutover**

```bash
git add apps/web
git commit -m "feat(web): publish admin content across public surfaces"
```

### Task 10: Stage the migration, populate through Admin, and prove the real workflow

**Files:**
- Create after the content preflight passes: `supabase/migrations/20260715000000_validate_admin_managed_public_content.sql`
- Modify: `apps/web/package.json`
- Create: `apps/web/.env.e2e.example`
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/tests/e2e/global-setup.ts`
- Create: `apps/web/tests/e2e/global-teardown.ts`
- Create: `apps/web/tests/e2e/admin-managed-content.spec.ts`
- Create: `scripts/public-content-cutover-manifest.json`
- Create: `scripts/verify-public-content-cutover.mjs`
- Modify: `apps/admin/src/visual-test.tsx`
- Use as QA input only: `/Users/sangkun/Desktop/zerosourcing_portfolio_meetitplus_feature_images.html`

**Interfaces:**
- One Admin-created raw Portfolio and one Admin-created WYSIWYG Blog traverse database, RLS, list, detail, metadata, home/service, and sitemap
- Draft/unpublished/soft-deleted states disappear everywhere
- Public raw output equals Admin preview because both use `RawHtmlFrame`

- [ ] **Step 1: Add deterministic Admin visual states**

Add `?visualTest=content-editor-raw` and `?visualTest=content-editor-wysiwyg` branches to the existing visual-test harness. Use fixed form values and asset scopes, render both desktop and 375px states, and ensure the harness never writes to Supabase.

- [ ] **Step 2: Create a local-only Playwright and Admin-auth foundation**

Install the runner and Node-only Supabase client:

```bash
pnpm --filter web add -D @playwright/test @supabase/supabase-js@2.109.0
pnpm --filter web exec playwright install chromium
```

As in Task 3, pin the exact resolved Vitest and Playwright versions in the package manifest and lockfile before committing; never retain a `latest` tag.

Create `.env.e2e.example` with names only:

```dotenv
E2E_SUPABASE_URL=http://127.0.0.1:54321
E2E_SUPABASE_ANON_KEY=
E2E_SUPABASE_SERVICE_ROLE_KEY=
```

`playwright.config.ts` must reject any `E2E_SUPABASE_URL` other than exactly `http://127.0.0.1:54321`, start Admin on `http://127.0.0.1:3002` with only `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, start Web on `http://127.0.0.1:3000` with only `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY`, use Chromium, and run with one worker. Never pass the service-role key through either `webServer.env` block.

`global-setup.ts` runs only in Node, creates/confirms `e2e-admin@local.test` through `auth.admin.createUser`, and upserts its UUID/email into `public.admin_users`. `global-teardown.ts` removes that local Auth user. Both call `assertLocalSupabaseUrl` before constructing the service-role client. The browser logs in through the real Admin form; do not inject service-role storage state.

- [ ] **Step 3: Add the end-to-end publication spec**

In `admin-managed-content.spec.ts`, use dedicated `e2e-*` slugs and the local Admin created by global setup. Cover:

1. Create a raw HTML Portfolio as draft; verify public detail is 404 and it is absent from list/search/sitemap.
2. Reopen it, enable landing/service, publish, and verify list, detail, metadata title/description, home, matching service page, and sitemap.
3. Assert a harmless inline script runs inside the raw frame, the frame has only `allow-scripts`, its height grows to content, and it cannot navigate `window.top` or read the parent DOM.
4. Create a WYSIWYG Blog with H2, bold text, link, list, and uploaded WEBP; publish and verify the generated DOM, image URL, Blog list, home, related content, metadata, and sitemap.
5. Inject an event handler/script through the stored WYSIWYG HTML using the test database fixture setup; verify the public sanitizer removes it.
6. Change both records back to draft, then soft-delete them, verifying every public surface and sitemap removes them after each request.
7. Clean up only the `e2e-*` rows and their scoped Storage objects in `afterAll`.

Run the spec serially so publication state transitions are deterministic.

- [ ] **Step 4: Run local database and application checks**

```bash
supabase db reset
supabase test db supabase/tests/admin_managed_public_content.sql
pnpm --filter admin test
pnpm --filter admin check-types
pnpm --filter admin lint
pnpm --filter admin build
pnpm --filter web test
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
pnpm --filter web exec playwright test tests/e2e/admin-managed-content.spec.ts
```

Expected: every gate passes against a clean local schema.

- [ ] **Step 5: Run visual QA at required breakpoints**

Capture and compare:

| Surface | Widths |
| --- | --- |
| Admin raw editor + preview | 1920, 1080, 640, 390 |
| Admin WYSIWYG editor | 1920, 1080, 640, 390 |
| Portfolio list/detail | 1920, 1080, 640, 390 |
| Blog list/detail | 1920, 1080, 640, 390 |
| Home/service cards | 1920, 1080, 640, 390 |

Check typography tokens, toolbar focus/disabled states, long Korean wrapping, image aspect ratios, iframe resize, mobile horizontal overflow, and that Admin preview/public detail show the same raw document.

- [ ] **Step 6: Apply and deploy in a no-empty-site order**

Use this order in staging, then repeat in production:

Before step 1, export only `id/slug/status/deleted_at` and have the content owner confirm every existing `published` row is already intended for public read. The additive migration opens anon API access to those published rows even while the old Web UI still uses fixtures; if that confirmation cannot be made, split the anon grants/policies into a later enablement migration and do not proceed.

1. Apply the additive migration and verify the 34 SQL assertions. The two published-content constraints remain `NOT VALID`, so existing rows are not silently changed.
2. Deploy Admin only; public web still reads fixtures at this point.
3. Create `scripts/public-content-cutover-manifest.json` from the current fixtures before deleting them. It must include all 9 Portfolio slugs and all 6 Blog slugs, plus expected `landingPublished`, `servicePublished`, and `bannerPublished` values. Preserve the six current home Portfolio flags, the three current home Blog flags, and the `hybrid-vs-native-app` banner flag; classify `meetit-plus` as MVP for service filtering.
4. Create `verify-public-content-cutover.mjs` to fetch both public PostgREST tables with the publishable key, compare slug sets and exposure flags against the manifest, print only missing/extra slug names, and exit non-zero on any mismatch. Never print keys or raw content.
5. Run the preflight queries below. Register/fix the inventory through Admin until both return zero rows and the manifest verifier passes.

```sql
select id, slug from public.portfolios
where status = 'published' and length(btrim(content)) = 0;

select id, slug from public.blog_posts
where status = 'published'
  and (length(btrim(content)) = 0 or length(btrim(summary)) = 0);
```

6. Create `20260715000000_validate_admin_managed_public_content.sql` with:

```sql
alter table public.portfolios
  validate constraint portfolios_published_content_check;
alter table public.blog_posts
  validate constraint blog_posts_published_content_check;
```

7. Apply that validation migration, rerun the SQL contract test, rerun the manifest verifier, and spot-check that drafts are invisible.
8. Deploy the public-web cutover.
9. Confirm list/detail/home/service/metadata/sitemap from the deployed origin.
10. Only after those checks, remove temporary QA records or disable their landing/service/banner flags.

Never deploy Task 8/9 before step 7 completes; there is deliberately no runtime fixture fallback.

Rollback rule: if the manifest differs, any list/detail returns 5xx, a published detail returns 404, or sitemap omits a manifest slug, immediately roll the Web project back to the previous fixture-based deployment. Keep the additive DB/Admin migration in place, fix forward, rerun the verifier, and redeploy; do not attempt a destructive schema rollback.

- [ ] **Step 7: Import the supplied Meetit Plus HTML for design QA**

Create/edit the `meetit-plus` Portfolio in Admin, choose `HTML 원문`, and use `HTML 파일 불러오기` for the supplied file (paste remains a fallback). Confirm the textarea value is accepted without formatter or sanitizer. Its current relative references require these six files under the same asset scope:

```text
images/meetit-feature-01.png
images/meetit-feature-02.png
images/meetit-feature-03.png
images/meetit-feature-04.png
images/meetit-feature-05.png
images/meetit-feature-06.png
```

Upload them through the raw asset panel so the stored paths match exactly and confirm `Storage 상대경로 기준`, which persists `content_asset_base_enabled = true`. Those images were not present beside the supplied HTML during planning; until they are provided, gray fallback frames in that HTML are expected and cannot be treated as a renderer defect.

- [ ] **Step 8: Commit E2E coverage and record evidence**

```bash
git add apps/admin/src/visual-test.tsx apps/web/package.json apps/web/playwright.config.ts apps/web/tests/e2e apps/web/.env.e2e.example scripts/public-content-cutover-manifest.json scripts/verify-public-content-cutover.mjs pnpm-lock.yaml
git commit -m "test(content): cover admin publishing workflow"
```

Record the migration result, test command outputs, deployed URLs, and before/after screenshots in the PR description. Do not include production keys, authenticated cookies, or service-role credentials.

## Completion Criteria

- [ ] Admin can create, edit, draft, publish, unpublish, and soft-delete both content types.
- [ ] Raw HTML input string round-trips without trim/format/sanitize and runs only inside the constrained iframe.
- [ ] Legacy/absolute raw documents keep their original URL base; only explicitly enabled relative-asset records receive the Storage base in both Admin and public rendering.
- [ ] Tiptap JSON reopens without structural loss; its materialized HTML is sanitized publicly.
- [ ] Admin preview and public detail share the same raw renderer and WYSIWYG stylesheet.
- [ ] Lists, details, home, service pages, metadata, related posts, and sitemap all derive from the same RLS-protected rows.
- [ ] No Portfolio/Blog fixture import or fallback remains.
- [ ] Draft/deleted/source-backup/editor-JSON data is unavailable to anon.
- [ ] Desktop/tablet/mobile screenshots pass design QA.
- [ ] Supplied Meetit Plus HTML renders with all six referenced images once those assets are supplied.
