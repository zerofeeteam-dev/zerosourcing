begin;

select plan(69);

select has_column(
  'public'::name, 'portfolios'::name, 'content_authoring_mode'::name,
  'portfolios has content_authoring_mode'::text
);
select has_column(
  'public'::name, 'portfolios'::name, 'content_json'::name,
  'portfolios has content_json'::text
);
select has_column(
  'public'::name, 'portfolios'::name, 'content_schema_version'::name,
  'portfolios has content_schema_version'::text
);
select has_column(
  'public'::name, 'portfolios'::name, 'content_source_backup'::name,
  'portfolios has content_source_backup'::text
);
select has_column(
  'public'::name, 'portfolios'::name, 'content_asset_scope'::name,
  'portfolios has content_asset_scope'::text
);
select has_column(
  'public'::name, 'portfolios'::name, 'content_asset_base_enabled'::name,
  'portfolios has content_asset_base_enabled'::text
);
select has_column(
  'public'::name, 'portfolios'::name, 'published_at'::name,
  'portfolios has published_at'::text
);
select has_column(
  'public'::name, 'portfolios'::name, 'thumbnail_path'::name,
  'portfolios has thumbnail_path'::text
);
select has_column(
  'public'::name, 'portfolios'::name, 'thumbnail_public_url'::name,
  'portfolios has thumbnail_public_url'::text
);
select has_column(
  'public'::name, 'portfolios'::name, 'thumbnail_alt'::name,
  'portfolios has thumbnail_alt'::text
);

select has_column(
  'public'::name, 'blog_posts'::name, 'summary'::name,
  'blog_posts has summary'::text
);
select has_column(
  'public'::name, 'blog_posts'::name, 'content_authoring_mode'::name,
  'blog_posts has content_authoring_mode'::text
);
select has_column(
  'public'::name, 'blog_posts'::name, 'content_json'::name,
  'blog_posts has content_json'::text
);
select has_column(
  'public'::name, 'blog_posts'::name, 'content_schema_version'::name,
  'blog_posts has content_schema_version'::text
);
select has_column(
  'public'::name, 'blog_posts'::name, 'content_source_backup'::name,
  'blog_posts has content_source_backup'::text
);
select has_column(
  'public'::name, 'blog_posts'::name, 'content_asset_scope'::name,
  'blog_posts has content_asset_scope'::text
);
select has_column(
  'public'::name, 'blog_posts'::name, 'content_asset_base_enabled'::name,
  'blog_posts has content_asset_base_enabled'::text
);
select has_column(
  'public'::name, 'blog_posts'::name, 'published_at'::name,
  'blog_posts has published_at'::text
);

select col_is_unique(
  'public'::name, 'portfolios'::name, 'slug'::name,
  'portfolio slugs remain unique'::text
);
select col_is_unique(
  'public'::name, 'blog_posts'::name, 'slug'::name,
  'blog post slugs remain unique'::text
);

select results_eq(
  $$
    select
      a.attname::text collate "C",
      format_type(a.atttypid, a.atttypmod)::text collate "C"
    from pg_attribute a
    where a.attrelid = 'public.portfolios'::regclass
      and a.attnum > 0
      and not a.attisdropped
      and a.attname = any (array[
        'content_authoring_mode', 'content_json', 'content_schema_version',
        'content_source_backup', 'content_asset_scope', 'content_asset_base_enabled',
        'published_at', 'thumbnail_path', 'thumbnail_public_url', 'thumbnail_alt'
      ])
    order by a.attname
  $$::text,
  $$
    select column_name collate "C", data_type collate "C"
    from (values
      ('content_asset_base_enabled'::text, 'boolean'::text),
      ('content_asset_scope', 'uuid'),
      ('content_authoring_mode', 'text'),
      ('content_json', 'jsonb'),
      ('content_schema_version', 'integer'),
      ('content_source_backup', 'text'),
      ('published_at', 'timestamp with time zone'),
      ('thumbnail_alt', 'text'),
      ('thumbnail_path', 'text'),
      ('thumbnail_public_url', 'text')
    ) as expected(column_name, data_type)
    order by column_name
  $$::text,
  'portfolio managed columns use the expected types'::text
);
select results_eq(
  $$
    select
      a.attname::text collate "C",
      format_type(a.atttypid, a.atttypmod)::text collate "C"
    from pg_attribute a
    where a.attrelid = 'public.blog_posts'::regclass
      and a.attnum > 0
      and not a.attisdropped
      and a.attname = any (array[
        'summary', 'content_authoring_mode', 'content_json', 'content_schema_version',
        'content_source_backup', 'content_asset_scope', 'content_asset_base_enabled',
        'published_at'
      ])
    order by a.attname
  $$::text,
  $$
    select column_name collate "C", data_type collate "C"
    from (values
      ('content_asset_base_enabled'::text, 'boolean'::text),
      ('content_asset_scope', 'uuid'),
      ('content_authoring_mode', 'text'),
      ('content_json', 'jsonb'),
      ('content_schema_version', 'integer'),
      ('content_source_backup', 'text'),
      ('published_at', 'timestamp with time zone'),
      ('summary', 'text')
    ) as expected(column_name, data_type)
    order by column_name
  $$::text,
  'blog managed columns use the expected types'::text
);

select results_eq(
  $$
    select
      a.attname::text collate "C",
      pg_get_expr(d.adbin, d.adrelid)::text collate "C"
    from pg_attribute a
    join pg_attrdef d
      on d.adrelid = a.attrelid
     and d.adnum = a.attnum
    where a.attrelid = 'public.portfolios'::regclass
      and a.attname = any (array[
        'content_authoring_mode', 'content_schema_version', 'content_asset_scope',
        'content_asset_base_enabled', 'thumbnail_alt'
      ])
    order by a.attname
  $$::text,
  $$
    select column_name collate "C", column_default collate "C"
    from (values
      ('content_asset_base_enabled'::text, 'false'::text),
      ('content_asset_scope', 'gen_random_uuid()'),
      ('content_authoring_mode', '''raw_html''::text'),
      ('content_schema_version', '1'),
      ('thumbnail_alt', '''''::text')
    ) as expected(column_name, column_default)
    order by column_name
  $$::text,
  'portfolio managed columns keep the expected defaults'::text
);
select results_eq(
  $$
    select
      a.attname::text collate "C",
      pg_get_expr(d.adbin, d.adrelid)::text collate "C"
    from pg_attribute a
    join pg_attrdef d
      on d.adrelid = a.attrelid
     and d.adnum = a.attnum
    where a.attrelid = 'public.blog_posts'::regclass
      and a.attname = any (array[
        'summary', 'content_authoring_mode', 'content_schema_version',
        'content_asset_scope', 'content_asset_base_enabled'
      ])
    order by a.attname
  $$::text,
  $$
    select column_name collate "C", column_default collate "C"
    from (values
      ('content_asset_base_enabled'::text, 'false'::text),
      ('content_asset_scope', 'gen_random_uuid()'),
      ('content_authoring_mode', '''raw_html''::text'),
      ('content_schema_version', '1'),
      ('summary', '''''::text')
    ) as expected(column_name, column_default)
    order by column_name
  $$::text,
  'blog managed columns keep the expected defaults'::text
);

select results_eq(
  $$
    select a.attname::text collate "C", a.attnotnull
    from pg_attribute a
    where a.attrelid = 'public.portfolios'::regclass
      and a.attnum > 0
      and not a.attisdropped
      and a.attname = any (array[
        'content_authoring_mode', 'content_json', 'content_schema_version',
        'content_source_backup', 'content_asset_scope', 'content_asset_base_enabled',
        'published_at', 'thumbnail_path', 'thumbnail_public_url', 'thumbnail_alt'
      ])
    order by a.attname
  $$::text,
  $$
    select column_name collate "C", is_not_null
    from (values
      ('content_asset_base_enabled'::text, true),
      ('content_asset_scope', true),
      ('content_authoring_mode', true),
      ('content_json', false),
      ('content_schema_version', true),
      ('content_source_backup', false),
      ('published_at', false),
      ('thumbnail_alt', true),
      ('thumbnail_path', false),
      ('thumbnail_public_url', false)
    ) as expected(column_name, is_not_null)
    order by column_name
  $$::text,
  'portfolio managed columns keep the expected nullability'::text
);
select results_eq(
  $$
    select a.attname::text collate "C", a.attnotnull
    from pg_attribute a
    where a.attrelid = 'public.blog_posts'::regclass
      and a.attnum > 0
      and not a.attisdropped
      and a.attname = any (array[
        'summary', 'content_authoring_mode', 'content_json', 'content_schema_version',
        'content_source_backup', 'content_asset_scope', 'content_asset_base_enabled',
        'published_at'
      ])
    order by a.attname
  $$::text,
  $$
    select column_name collate "C", is_not_null
    from (values
      ('content_asset_base_enabled'::text, true),
      ('content_asset_scope', true),
      ('content_authoring_mode', true),
      ('content_json', false),
      ('content_schema_version', true),
      ('content_source_backup', false),
      ('published_at', false),
      ('summary', true)
    ) as expected(column_name, is_not_null)
    order by column_name
  $$::text,
  'blog managed columns keep the expected nullability'::text
);

select is(
  (
    select convalidated
    from pg_constraint
    where conrelid = 'public.portfolios'::regclass
      and conname = 'portfolios_published_content_check'
  ),
  false,
  'legacy portfolio content check remains NOT VALID'::text
);
select is(
  (
    select convalidated
    from pg_constraint
    where conrelid = 'public.blog_posts'::regclass
      and conname = 'blog_posts_published_content_check'
  ),
  false,
  'legacy blog content check remains NOT VALID'::text
);

insert into public.portfolios (
  status, type, slug, title, company_name, content, deleted_at
) values
  ('draft', 'mvp', 'pgtap-portfolio-visibility-draft', 'draft', 'test', '', null),
  ('published', 'mvp', 'pgtap-portfolio-visibility-published', 'published', 'test', '<p>published</p>', null),
  ('published', 'mvp', 'pgtap-portfolio-visibility-deleted', 'deleted', 'test', '<p>deleted</p>', now()),
  ('draft', 'mvp', 'pgtap-portfolio-lifecycle', 'lifecycle', 'test', '<p>lifecycle</p>', null);

insert into public.blog_posts (
  status, type, slug, title, summary, content, deleted_at
) values
  ('draft', 'insight', 'pgtap-blog-visibility-draft', 'draft', '', '', null),
  ('published', 'insight', 'pgtap-blog-visibility-published', 'published', 'summary', '<p>published</p>', null),
  ('published', 'insight', 'pgtap-blog-visibility-deleted', 'deleted', 'summary', '<p>deleted</p>', now()),
  ('draft', 'insight', 'pgtap-blog-lifecycle', 'lifecycle', 'summary', '<p>lifecycle</p>', null);

create temp table pgtap_asset_scopes (
  table_name text primary key,
  scope uuid not null
) on commit drop;

insert into pgtap_asset_scopes (table_name, scope)
values
  (
    'portfolios',
    (select content_asset_scope from public.portfolios where slug = 'pgtap-portfolio-lifecycle')
  ),
  (
    'blog_posts',
    (select content_asset_scope from public.blog_posts where slug = 'pgtap-blog-lifecycle')
  );

select ok(
  (
    select bool_and(content_asset_scope is not null)
    from public.portfolios
    where slug like 'pgtap-portfolio-%'
  ),
  'portfolio asset scopes default to non-null UUIDs'::text
);
select ok(
  (
    select bool_and(content_asset_scope is not null)
    from public.blog_posts
    where slug like 'pgtap-blog-%'
  ),
  'blog asset scopes default to non-null UUIDs'::text
);
select ok(
  (
    select count(distinct content_asset_scope) = count(*)
    from public.portfolios
    where slug like 'pgtap-portfolio-%'
  ),
  'portfolio asset scope defaults are row-specific'::text
);
select ok(
  (
    select count(distinct content_asset_scope) = count(*)
    from public.blog_posts
    where slug like 'pgtap-blog-%'
  ),
  'blog asset scope defaults are row-specific'::text
);

select ok(
  (
    select published_at is not null
    from public.portfolios
    where slug = 'pgtap-portfolio-visibility-published'
  ),
  'published portfolio inserts record published_at'::text
);
select ok(
  (
    select published_at is not null
    from public.blog_posts
    where slug = 'pgtap-blog-visibility-published'
  ),
  'published blog inserts record published_at'::text
);
select ok(
  (
    select published_at is null
    from public.portfolios
    where slug = 'pgtap-portfolio-lifecycle'
  ),
  'draft portfolio starts without published_at'::text
);
select ok(
  (
    select published_at is null
    from public.blog_posts
    where slug = 'pgtap-blog-lifecycle'
  ),
  'draft blog starts without published_at'::text
);

update public.portfolios
set status = 'published'
where slug = 'pgtap-portfolio-lifecycle';

update public.blog_posts
set status = 'published'
where slug = 'pgtap-blog-lifecycle';

select ok(
  (
    select published_at is not null
    from public.portfolios
    where slug = 'pgtap-portfolio-lifecycle'
  ),
  'first portfolio publish records published_at'::text
);
select ok(
  (
    select published_at is not null
    from public.blog_posts
    where slug = 'pgtap-blog-lifecycle'
  ),
  'first blog publish records published_at'::text
);

-- Historical markers make accidental trigger overwrites observable even though now() is
-- transaction-stable during this pgTAP test.
update public.portfolios
set published_at = '2001-01-01 00:00:00+00'::timestamptz
where slug = 'pgtap-portfolio-lifecycle';

update public.blog_posts
set published_at = '2002-01-01 00:00:00+00'::timestamptz
where slug = 'pgtap-blog-lifecycle';

update public.portfolios
set title = 'ordinary edit'
where slug = 'pgtap-portfolio-lifecycle';

update public.blog_posts
set title = 'ordinary edit'
where slug = 'pgtap-blog-lifecycle';

select is(
  (
    select published_at
    from public.portfolios
    where slug = 'pgtap-portfolio-lifecycle'
  ),
  '2001-01-01 00:00:00+00'::timestamptz,
  'ordinary portfolio edits preserve the first publication timestamp'::text
);
select is(
  (
    select published_at
    from public.blog_posts
    where slug = 'pgtap-blog-lifecycle'
  ),
  '2002-01-01 00:00:00+00'::timestamptz,
  'ordinary blog edits preserve the first publication timestamp'::text
);

update public.portfolios
set status = 'draft'
where slug = 'pgtap-portfolio-lifecycle';
update public.portfolios
set status = 'published'
where slug = 'pgtap-portfolio-lifecycle';

update public.blog_posts
set status = 'draft'
where slug = 'pgtap-blog-lifecycle';
update public.blog_posts
set status = 'published'
where slug = 'pgtap-blog-lifecycle';

select is(
  (
    select published_at
    from public.portfolios
    where slug = 'pgtap-portfolio-lifecycle'
  ),
  '2001-01-01 00:00:00+00'::timestamptz,
  'republishing a portfolio preserves the first publication timestamp'::text
);
select is(
  (
    select published_at
    from public.blog_posts
    where slug = 'pgtap-blog-lifecycle'
  ),
  '2002-01-01 00:00:00+00'::timestamptz,
  'republishing a blog preserves the first publication timestamp'::text
);
select is(
  (
    select content_asset_scope
    from public.portfolios
    where slug = 'pgtap-portfolio-lifecycle'
  ),
  (select scope from pgtap_asset_scopes where table_name = 'portfolios'),
  'portfolio asset scope remains stable across edits and publication transitions'::text
);
select is(
  (
    select content_asset_scope
    from public.blog_posts
    where slug = 'pgtap-blog-lifecycle'
  ),
  (select scope from pgtap_asset_scopes where table_name = 'blog_posts'),
  'blog asset scope remains stable across edits and publication transitions'::text
);

select ok(
  not has_column_privilege('anon', 'public.portfolios', 'content_json', 'select'),
  'anon cannot select portfolio editor JSON'::text
);
select ok(
  not has_column_privilege('anon', 'public.portfolios', 'content_source_backup', 'select'),
  'anon cannot select portfolio source backup'::text
);
select ok(
  not has_column_privilege('anon', 'public.blog_posts', 'content_json', 'select'),
  'anon cannot select blog editor JSON'::text
);
select ok(
  not has_column_privilege('anon', 'public.blog_posts', 'content_source_backup', 'select'),
  'anon cannot select blog source backup'::text
);

select throws_ok(
  $$insert into public.portfolios (
    status, type, slug, title, company_name, content_authoring_mode, content_json, content
  ) values (
    'draft', 'mvp', 'pgtap-invalid-wysiwyg-portfolio', 'invalid', 'test', 'wysiwyg', null, '<p>x</p>'
  )$$,
  '23514',
  null::text,
  'WYSIWYG portfolio requires a document JSON object'::text
);
select throws_ok(
  $$insert into public.blog_posts (
    status, type, slug, title, summary, content_authoring_mode, content_json, content
  ) values (
    'draft', 'insight', 'pgtap-invalid-wysiwyg-blog', 'invalid', 'summary', 'wysiwyg', '{}'::jsonb, '<p>x</p>'
  )$$,
  '23514',
  null::text,
  'WYSIWYG blog requires a doc root'::text
);
select throws_ok(
  $$insert into public.portfolios (
    status, type, slug, title, company_name, content
  ) values (
    'published', 'mvp', 'pgtap-empty-published-portfolio', 'invalid', 'test', ''
  )$$,
  '23514',
  null::text,
  'new published portfolios require non-blank content'::text
);
select throws_ok(
  $$insert into public.blog_posts (
    status, type, slug, title, summary, content
  ) values (
    'published', 'insight', 'pgtap-empty-published-blog-content', 'invalid', 'summary', ''
  )$$,
  '23514',
  null::text,
  'new published blogs require non-blank content'::text
);
select throws_ok(
  $$insert into public.blog_posts (
    status, type, slug, title, summary, content
  ) values (
    'published', 'insight', 'pgtap-empty-published-blog-summary', 'invalid', '', '<p>x</p>'
  )$$,
  '23514',
  null::text,
  'new published blogs require non-blank summaries'::text
);

select results_eq(
  $$
    select a.attname::text collate "C"
    from pg_attribute a
    where a.attrelid = 'public.portfolios'::regclass
      and a.attnum > 0
      and not a.attisdropped
      and has_column_privilege('anon', a.attrelid, a.attnum, 'select')
    order by a.attname
  $$::text,
  $$
    select column_name collate "C"
    from (values
      ('company_name'::text),
      ('content'),
      ('content_asset_base_enabled'),
      ('content_asset_scope'),
      ('content_authoring_mode'),
      ('content_mode'),
      ('core_features'),
      ('created_at'),
      ('deleted_at'),
      ('development_period'),
      ('estimate_label'),
      ('landing_published'),
      ('product_description'),
      ('published_at'),
      ('seo_description'),
      ('service_published'),
      ('slug'),
      ('status'),
      ('thumbnail_alt'),
      ('thumbnail_public_url'),
      ('title'),
      ('type'),
      ('updated_at'),
      ('work_scopes')
    ) as expected(column_name)
    order by column_name
  $$::text,
  'anon portfolio SELECT privileges match the public projection exactly'::text
);
select results_eq(
  $$
    select a.attname::text collate "C"
    from pg_attribute a
    where a.attrelid = 'public.blog_posts'::regclass
      and a.attnum > 0
      and not a.attisdropped
      and has_column_privilege('anon', a.attrelid, a.attnum, 'select')
    order by a.attname
  $$::text,
  $$
    select column_name collate "C"
    from (values
      ('banner_published'::text),
      ('content'),
      ('content_asset_base_enabled'),
      ('content_asset_scope'),
      ('content_authoring_mode'),
      ('content_mode'),
      ('created_at'),
      ('deleted_at'),
      ('landing_published'),
      ('published_at'),
      ('published_date'),
      ('seo_description'),
      ('slug'),
      ('status'),
      ('summary'),
      ('thumbnail_alt'),
      ('thumbnail_public_url'),
      ('title'),
      ('type'),
      ('updated_at')
    ) as expected(column_name)
    order by column_name
  $$::text,
  'anon blog SELECT privileges match the public projection exactly'::text
);

set local role anon;

select results_eq(
  $$
    select slug::text
    from public.portfolios
    where slug like 'pgtap-portfolio-visibility-%'
    order by slug
  $$::text,
  $$values ('pgtap-portfolio-visibility-published'::text)$$::text,
  'anon reads exactly the published non-deleted portfolio'::text
);
select results_eq(
  $$
    select slug::text
    from public.blog_posts
    where slug like 'pgtap-blog-visibility-%'
    order by slug
  $$::text,
  $$values ('pgtap-blog-visibility-published'::text)$$::text,
  'anon reads exactly the published non-deleted blog post'::text
);
select lives_ok(
  $$select slug from public.portfolios
    where status = 'published' and deleted_at is null
    order by published_at desc, created_at desc$$,
  'anon can run the real portfolio filter and order query'::text
);
select lives_ok(
  $$select slug from public.blog_posts
    where status = 'published' and deleted_at is null
    order by published_at desc, created_at desc$$,
  'anon can run the real blog filter and order query'::text
);
select throws_ok(
  $$insert into public.portfolios (type, slug, title, company_name)
    values ('mvp', 'anon-write-portfolio', 'blocked', 'blocked')$$,
  '42501',
  null::text,
  'anon cannot insert portfolios'::text
);
select throws_ok(
  $$update public.portfolios set title = 'blocked'
    where slug = 'pgtap-portfolio-visibility-published'$$,
  '42501',
  null::text,
  'anon cannot update portfolios'::text
);
select throws_ok(
  $$delete from public.portfolios
    where slug = 'pgtap-portfolio-visibility-published'$$,
  '42501',
  null::text,
  'anon cannot delete portfolios'::text
);
select throws_ok(
  $$insert into public.blog_posts (type, slug, title)
    values ('insight', 'anon-write-blog', 'blocked')$$,
  '42501',
  null::text,
  'anon cannot insert blog posts'::text
);
select throws_ok(
  $$update public.blog_posts set title = 'blocked'
    where slug = 'pgtap-blog-visibility-published'$$,
  '42501',
  null::text,
  'anon cannot update blog posts'::text
);
select throws_ok(
  $$delete from public.blog_posts
    where slug = 'pgtap-blog-visibility-published'$$,
  '42501',
  null::text,
  'anon cannot delete blog posts'::text
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

select has_index(
  'public'::name, 'portfolios'::name, 'portfolios_public_publish_idx'::name,
  'portfolios has the public publish index'::text
);
select has_index(
  'public'::name, 'blog_posts'::name, 'blog_posts_public_publish_idx'::name,
  'blog_posts has the public publish index'::text
);

select finish();
rollback;
