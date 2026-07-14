revoke all privileges
  on table public.admin_users
  from public, anon, authenticated, service_role;

grant select
  on table public.admin_users
  to authenticated;

grant select, insert, update
  on table public.admin_users
  to service_role;
