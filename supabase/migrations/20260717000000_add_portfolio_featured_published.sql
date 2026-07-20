alter table public.portfolios
  add column featured_published boolean not null default false;

grant select (featured_published) on public.portfolios to anon;
