begin;

select plan(13);

-- Any additional ACL row for these roles, including MAINTAIN on PostgreSQL 17,
-- fails this exact allowlist.
select results_eq(
  $$
    select
      case
        when acl.grantee = 0 then 'PUBLIC'
        else pg_get_userbyid(acl.grantee)
      end::text collate "C" as grantee,
      acl.privilege_type::text collate "C" as privilege_type
    from pg_class relation
    cross join lateral aclexplode(
      coalesce(relation.relacl, acldefault('r', relation.relowner))
    ) acl
    where relation.oid = 'public.admin_users'::regclass
      and (
        acl.grantee = 0
        or pg_get_userbyid(acl.grantee) = any (
          array['anon', 'authenticated', 'service_role']
        )
      )
    order by grantee, privilege_type
  $$::text,
  $$
    values
      ('authenticated'::text collate "C", 'SELECT'::text collate "C"),
      ('service_role'::text collate "C", 'INSERT'::text collate "C"),
      ('service_role'::text collate "C", 'SELECT'::text collate "C"),
      ('service_role'::text collate "C", 'UPDATE'::text collate "C")
  $$::text,
  'admin_users ACL exactly matches the role privilege allowlist'::text
);

select ok(
  has_table_privilege('service_role', 'public.admin_users', 'select'),
  'service_role can read admin memberships for bootstrap upserts'::text
);
select ok(
  has_table_privilege('service_role', 'public.admin_users', 'insert'),
  'service_role can insert an admin membership during bootstrap'::text
);
select ok(
  has_table_privilege('service_role', 'public.admin_users', 'update'),
  'service_role can update an existing admin membership during bootstrap'::text
);

select ok(
  not has_table_privilege('service_role', 'public.admin_users', 'delete'),
  'service_role cannot delete admin memberships'::text
);
select ok(
  not has_table_privilege('service_role', 'public.admin_users', 'truncate'),
  'service_role cannot truncate admin memberships'::text
);
select ok(
  not has_table_privilege('service_role', 'public.admin_users', 'references'),
  'service_role cannot create references to admin memberships'::text
);
select ok(
  not has_table_privilege('service_role', 'public.admin_users', 'trigger'),
  'service_role cannot manage admin membership triggers'::text
);
select ok(
  has_table_privilege('authenticated', 'public.admin_users', 'select'),
  'authenticated can read memberships through row-level security'::text
);
select ok(
  not has_table_privilege('authenticated', 'public.admin_users', 'insert')
    and not has_table_privilege('authenticated', 'public.admin_users', 'update'),
  'authenticated cannot write admin memberships'::text
);

insert into auth.users (id, email)
values
  (
    '10000000-0000-4000-8000-000000000002',
    'pgtap-service-bootstrap@example.test'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'pgtap-service-non-admin@example.test'
  );

set local role service_role;

insert into public.admin_users as admin_users (id, email)
values (
  '10000000-0000-4000-8000-000000000002',
  'pgtap-service-bootstrap@example.test'
)
on conflict (id) do update
set
  id = excluded.id,
  email = excluded.email;

insert into public.admin_users as admin_users (id, email)
values (
  '10000000-0000-4000-8000-000000000002',
  'pgtap-service-bootstrap-updated@example.test'
)
on conflict (id) do update
set
  id = excluded.id,
  email = excluded.email;

select is(
  (
    select email
    from public.admin_users
    where id = '10000000-0000-4000-8000-000000000002'
  ),
  'pgtap-service-bootstrap-updated@example.test'::text,
  'service_role can insert and conflict-update the E2E admin membership'::text
);

reset role;

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000002';

select is(
  (
    select count(*)::integer
    from public.admin_users
    where id = '10000000-0000-4000-8000-000000000002'
  ),
  1::integer,
  'an authenticated admin can read their own membership'::text
);

set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000003';

select is(
  (
    select count(*)::integer
    from public.admin_users
    where id = '10000000-0000-4000-8000-000000000002'
  ),
  0::integer,
  'an authenticated non-admin cannot read another user membership'::text
);

reset role;

select finish();
rollback;
