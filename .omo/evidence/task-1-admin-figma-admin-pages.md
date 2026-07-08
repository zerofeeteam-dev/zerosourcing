# Task 1 Evidence - Supabase schema, RLS, storage, env, and dependency contract

## Baseline / failing-first proof

Timestamp: 2026-07-08 Asia/Seoul.

Required references read before implementation:
- `.omo/plans/admin-figma-admin-pages.md`
- `.omo/drafts/admin-figma-admin-pages.md`
- `app/admin/package.json`
- `package.json`
- `pnpm-workspace.yaml`
- `docs/admin-implementation-plan.md` lines 54-60 and 195-217

Baseline commands and observations:
- `git status --short`: worktree was already dirty before this task. Unrelated modified paths included `apps/web/**`, `packages/ui/src/radio.tsx`, `pnpm-workspace.yaml`, `turbo.json`; `pnpm-lock.yaml`, `.omo/`, `app/`, and `docs/` were already dirty/untracked. This task must not revert them.
- `find supabase -maxdepth 3 -type f -print`: failed with `find: supabase: No such file or directory`, so no Supabase migrations or setup notes existed.
- `test -f app/admin/.env.example && sed -n '1,120p' app/admin/.env.example`: exited 1 with no output, so the admin env sample did not exist.
- `rg -n "@supabase/supabase-js|VITE_SUPABASE|supabase|service[_-]?role|figma\\.com/api|figma.com/api/mcp" app/admin/package.json pnpm-lock.yaml app/admin .omo supabase`: exited 2 because `supabase` did not exist; matches were only plan/draft references, not implementation files. No Supabase client dependency or env contract was present.
- `app/admin/package.json` dependencies were only `react` and `react-dom`; no `@supabase/supabase-js`.
- `docs/admin-implementation-plan.md` lines 54-60 and 195-217 still describe the older localStorage/API-handoff plan, and are superseded by `.omo/plans/admin-figma-admin-pages.md`.

Baseline conclusion: Todo 1 acceptance could not pass because the dependency, env sample, migration SQL, RLS/storage policies, and setup notes were absent.

## Pre-change thought experiments

- Direct RLS policy subqueries against `admin_users` can fail if `admin_users` RLS hides the membership row from the same user. Use a small `security definer` predicate that checks `public.admin_users` and grant only execute to authenticated users.
- Soft delete needs `deleted_at` on the three domain tables, but RLS should still gate all rows. Lists can later filter `deleted_at is null`; the schema should index non-deleted rows without requiring hard deletes.
- Public-read storage must not imply public table reads. Use storage-only public select for `blog-thumbnails`; keep `portfolios`, `blog_posts`, and `link_payments` authenticated-admin only.
- Link Pay is manual record storage only. The schema can allow a nullable `payment_url`, but must not add payment SDKs, checkout tables, API routes, or service-role keys.
- A lockfile update can look successful while preserving stale workspace state. Verify `@supabase/supabase-js` appears in both `app/admin/package.json` and `pnpm-lock.yaml`, then run `pnpm --filter admin check-types`.

