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

alter table public.portfolios disable trigger set_portfolios_updated_at;
alter table public.blog_posts disable trigger set_blog_posts_updated_at;

update public.portfolios
set published_at = coalesce(published_at, updated_at, created_at)
where status = 'published'
  and published_at is null;

update public.blog_posts
set
  summary = case
    when length(btrim(summary)) = 0
      then coalesce(nullif(btrim(seo_description), ''), title)
    else summary
  end,
  published_at = case
    when status = 'published' then coalesce(published_at, updated_at, created_at)
    else published_at
  end
where length(btrim(summary)) = 0
  or (status = 'published' and published_at is null);

alter table public.portfolios enable trigger set_portfolios_updated_at;
alter table public.blog_posts enable trigger set_blog_posts_updated_at;

alter table public.portfolios
  drop constraint if exists portfolios_content_authoring_mode_check,
  drop constraint if exists portfolios_content_document_check,
  drop constraint if exists portfolios_published_content_check,
  drop constraint if exists portfolios_content_schema_version_check,
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
  drop constraint if exists blog_posts_content_schema_version_check,
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
