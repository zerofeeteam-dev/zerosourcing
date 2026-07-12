create extension if not exists "pgcrypto" with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_users_email_not_blank check (length(btrim(email)) > 0)
);

create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'draft',
  type text not null,
  slug text not null,
  title text not null,
  company_name text not null,
  product_description text not null default '',
  estimate_label text not null default '',
  development_period text not null default '',
  core_features text[] not null default '{}',
  work_scopes text[] not null default '{}',
  content_mode text not null default 'html',
  content text not null default '',
  seo_description text not null default '',
  landing_published boolean not null default false,
  service_published boolean not null default false,
  landing_sections jsonb not null default '[]'::jsonb,
  service_sections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint portfolios_slug_unique unique (slug),
  constraint portfolios_status_check check (status in ('draft', 'published')),
  constraint portfolios_type_check check (type in ('application', 'company_homepage', 'mvp')),
  constraint portfolios_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint portfolios_title_not_blank check (length(btrim(title)) > 0),
  constraint portfolios_company_name_not_blank check (length(btrim(company_name)) > 0),
  constraint portfolios_content_mode_check check (content_mode in ('html', 'text')),
  constraint portfolios_landing_sections_json_check check (jsonb_typeof(landing_sections) in ('array', 'object')),
  constraint portfolios_service_sections_json_check check (jsonb_typeof(service_sections) in ('array', 'object'))
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'draft',
  type text not null,
  slug text not null,
  title text not null,
  published_date date,
  thumbnail_path text,
  thumbnail_public_url text,
  thumbnail_alt text not null default '',
  content_mode text not null default 'html',
  content text not null default '',
  seo_description text not null default '',
  landing_published boolean not null default false,
  banner_published boolean not null default false,
  landing_sections jsonb not null default '[]'::jsonb,
  banner_sections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint blog_posts_slug_unique unique (slug),
  constraint blog_posts_status_check check (status in ('draft', 'published')),
  constraint blog_posts_type_check check (type in ('insight', 'mvp', 'application', 'company_homepage')),
  constraint blog_posts_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint blog_posts_title_not_blank check (length(btrim(title)) > 0),
  constraint blog_posts_content_mode_check check (content_mode in ('html', 'text')),
  constraint blog_posts_landing_sections_json_check check (jsonb_typeof(landing_sections) in ('array', 'object')),
  constraint blog_posts_banner_sections_json_check check (jsonb_typeof(banner_sections) in ('array', 'object'))
);

create index if not exists admin_users_email_idx
  on public.admin_users (email);

create index if not exists portfolios_active_list_idx
  on public.portfolios (status, type, updated_at desc)
  where deleted_at is null;

create index if not exists portfolios_deleted_at_idx
  on public.portfolios (deleted_at);

create index if not exists blog_posts_active_list_idx
  on public.blog_posts (status, type, updated_at desc)
  where deleted_at is null;

create index if not exists blog_posts_published_date_idx
  on public.blog_posts (published_date desc)
  where deleted_at is null;

create index if not exists blog_posts_deleted_at_idx
  on public.blog_posts (deleted_at);

drop trigger if exists set_admin_users_updated_at on public.admin_users;
create trigger set_admin_users_updated_at
  before update on public.admin_users
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_portfolios_updated_at on public.portfolios;
create trigger set_portfolios_updated_at
  before update on public.portfolios
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_blog_posts_updated_at on public.blog_posts;
create trigger set_blog_posts_updated_at
  before update on public.blog_posts
  for each row
  execute function public.set_updated_at();

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where admin_users.id = auth.uid()
  );
$$;

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.portfolios enable row level security;
alter table public.blog_posts enable row level security;

drop policy if exists "admin users can read own membership" on public.admin_users;
create policy "admin users can read own membership"
  on public.admin_users
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "admins can manage admin users" on public.admin_users;
create policy "admins can manage admin users"
  on public.admin_users
  for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "admins can read portfolios" on public.portfolios;
create policy "admins can read portfolios"
  on public.portfolios
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "admins can insert portfolios" on public.portfolios;
create policy "admins can insert portfolios"
  on public.portfolios
  for insert
  to authenticated
  with check (public.current_user_is_admin());

drop policy if exists "admins can update portfolios" on public.portfolios;
create policy "admins can update portfolios"
  on public.portfolios
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "admins can delete portfolios" on public.portfolios;
create policy "admins can delete portfolios"
  on public.portfolios
  for delete
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "admins can read blog posts" on public.blog_posts;
create policy "admins can read blog posts"
  on public.blog_posts
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "admins can insert blog posts" on public.blog_posts;
create policy "admins can insert blog posts"
  on public.blog_posts
  for insert
  to authenticated
  with check (public.current_user_is_admin());

drop policy if exists "admins can update blog posts" on public.blog_posts;
create policy "admins can update blog posts"
  on public.blog_posts
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "admins can delete blog posts" on public.blog_posts;
create policy "admins can delete blog posts"
  on public.blog_posts
  for delete
  to authenticated
  using (public.current_user_is_admin());

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'zerosourcing',
  'zerosourcing',
  true,
  52428800,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public can read blog thumbnails" on storage.objects;
create policy "public can read blog thumbnails"
  on storage.objects
  for select
  to public
  using (bucket_id = 'zerosourcing');

drop policy if exists "admins can upload blog thumbnails" on storage.objects;
create policy "admins can upload blog thumbnails"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'zerosourcing'
    and public.current_user_is_admin()
  );

drop policy if exists "admins can update blog thumbnails" on storage.objects;
create policy "admins can update blog thumbnails"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'zerosourcing'
    and public.current_user_is_admin()
  )
  with check (
    bucket_id = 'zerosourcing'
    and public.current_user_is_admin()
  );

drop policy if exists "admins can delete blog thumbnails" on storage.objects;
create policy "admins can delete blog thumbnails"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'zerosourcing'
    and public.current_user_is_admin()
  );
