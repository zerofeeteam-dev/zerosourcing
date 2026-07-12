# Supabase admin foundation

This project uses Supabase directly from the Vite admin app:

- Supabase Auth email/password for sign-in.
- `public.admin_users` as the admin authorization gate.
- `public.portfolios` and `public.blog_posts` for admin data.
- Supabase Storage bucket `zerosourcing` for public thumbnail reads and admin writes.

The frontend must use only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_SUPABASE_STORAGE_BUCKET`.

## Local setup

1. Start Supabase:

   ```bash
   supabase start
   ```

2. Apply migrations:

   ```bash
   supabase db reset
   ```

3. Create an Auth user in Supabase Studio:

   - Open the Studio URL printed by `supabase start`.
   - Go to Authentication > Users.
   - Add an email/password user.
   - Copy the new user's `auth.users.id`.

4. Mark that user as an admin:

   ```sql
   insert into public.admin_users (id, email)
   values ('00000000-0000-0000-0000-000000000000', 'admin@example.com')
   on conflict (id) do update
   set email = excluded.email;
   ```

   Replace the UUID and email with the Auth user values.

## SQL self-checks

Run these in Supabase SQL editor after migrations:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('admin_users', 'portfolios', 'blog_posts')
order by tablename;
```

```sql
select schemaname, tablename, policyname, cmd
from pg_policies
where (schemaname = 'public' and tablename in ('admin_users', 'portfolios', 'blog_posts'))
  or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;
```

```sql
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'zerosourcing';
```

Use these transaction checks to verify the happy and denied paths. Replace UUIDs with real Auth user IDs.

```sql
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';

insert into public.portfolios (type, slug, title, company_name)
values ('application', 'admin-visible-portfolio', 'Admin visible portfolio', 'Zero Sourcing');

select slug from public.portfolios where slug = 'admin-visible-portfolio';
rollback;
```

```sql
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';

select slug from public.portfolios;
insert into public.portfolios (type, slug, title, company_name)
values ('application', 'non-admin-denied', 'Non-admin denied', 'Zero Sourcing');
rollback;
```

The first transaction should be run with a UUID present in `public.admin_users` and should read/write successfully. The second should be run with an authenticated UUID that is absent from `public.admin_users`; select returns no rows and insert is denied by RLS.
