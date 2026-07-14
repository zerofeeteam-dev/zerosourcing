begin;

select plan(8);

insert into auth.users (id, email)
values (
  '10000000-0000-4000-8000-000000000001',
  'pgtap-content-storage-admin@example.test'
);

insert into public.admin_users (id, email)
values (
  '10000000-0000-4000-8000-000000000001',
  'pgtap-content-storage-admin@example.test'
);

insert into storage.objects (id, bucket_id, name, metadata)
values
  (
    '20000000-0000-4000-8000-000000000001',
    'zerosourcing',
    'content/blog/30000000-0000-4000-8000-000000000001/images/blog.webp',
    '{"test":"original"}'::jsonb
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'zerosourcing',
    'content/portfolio/30000000-0000-4000-8000-000000000001/images/portfolio.webp',
    '{"test":"original"}'::jsonb
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'zerosourcing',
    'blog/pgtap-thumbnail.webp',
    '{"test":"original"}'::jsonb
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    'zerosourcing',
    'content/30000000-0000-4000-8000-000000000002.webp',
    '{"test":"original"}'::jsonb
  );

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
set local storage.allow_delete_query = 'true';

update storage.objects
set metadata = '{"test":"changed"}'::jsonb
where bucket_id = 'zerosourcing'
  and name = 'content/blog/30000000-0000-4000-8000-000000000001/images/blog.webp';

select is(
  (
    select metadata ->> 'test'
    from storage.objects
    where bucket_id = 'zerosourcing'
      and name = 'content/blog/30000000-0000-4000-8000-000000000001/images/blog.webp'
  ),
  'original'::text,
  'an admin cannot update an immutable blog content object'::text
);

update storage.objects
set metadata = '{"test":"changed"}'::jsonb
where bucket_id = 'zerosourcing'
  and name = 'content/portfolio/30000000-0000-4000-8000-000000000001/images/portfolio.webp';

select is(
  (
    select metadata ->> 'test'
    from storage.objects
    where bucket_id = 'zerosourcing'
      and name = 'content/portfolio/30000000-0000-4000-8000-000000000001/images/portfolio.webp'
  ),
  'original'::text,
  'an admin cannot update an immutable portfolio content object'::text
);

update storage.objects
set metadata = '{"test":"changed"}'::jsonb
where bucket_id = 'zerosourcing'
  and name = 'blog/pgtap-thumbnail.webp';

select is(
  (
    select metadata ->> 'test'
    from storage.objects
    where bucket_id = 'zerosourcing'
      and name = 'blog/pgtap-thumbnail.webp'
  ),
  'changed'::text,
  'an admin can still update a normal thumbnail object'::text
);

update storage.objects
set metadata = '{"test":"changed"}'::jsonb
where bucket_id = 'zerosourcing'
  and name = 'content/30000000-0000-4000-8000-000000000002.webp';

select is(
  (
    select metadata ->> 'test'
    from storage.objects
    where bucket_id = 'zerosourcing'
      and name = 'content/30000000-0000-4000-8000-000000000002.webp'
  ),
  'changed'::text,
  'an admin can still update a legacy content-prefixed thumbnail object'::text
);

select throws_ok(
  $$
    update storage.objects
    set name = 'content/blog/30000000-0000-4000-8000-000000000001/images/renamed.webp'
    where bucket_id = 'zerosourcing'
      and name = 'blog/pgtap-thumbnail.webp'
  $$,
  '42501',
  'new row violates row-level security policy for table "objects"',
  'an admin cannot rename a mutable thumbnail into the blog content namespace'
);

select throws_ok(
  $$
    update storage.objects
    set name = 'content/portfolio/30000000-0000-4000-8000-000000000001/images/renamed.webp'
    where bucket_id = 'zerosourcing'
      and name = 'content/30000000-0000-4000-8000-000000000002.webp'
  $$,
  '42501',
  'new row violates row-level security policy for table "objects"',
  'an admin cannot rename a legacy thumbnail into the portfolio content namespace'
);

delete from storage.objects
where bucket_id = 'zerosourcing'
  and name = 'content/blog/30000000-0000-4000-8000-000000000001/images/blog.webp';

select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'zerosourcing'
      and name = 'content/blog/30000000-0000-4000-8000-000000000001/images/blog.webp'
  ),
  0::integer,
  'an admin can delete the exact blog content object for cleanup'::text
);

delete from storage.objects
where bucket_id = 'zerosourcing'
  and name = 'content/portfolio/30000000-0000-4000-8000-000000000001/images/portfolio.webp';

select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'zerosourcing'
      and name = 'content/portfolio/30000000-0000-4000-8000-000000000001/images/portfolio.webp'
  ),
  0::integer,
  'an admin can delete the exact portfolio content object for cleanup'::text
);

reset role;
select finish();
rollback;
