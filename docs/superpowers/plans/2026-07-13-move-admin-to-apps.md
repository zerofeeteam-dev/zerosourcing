# Move Admin Workspace to `apps/admin` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Vite admin workspace from `app/admin` to `apps/admin` without changing its runtime behavior or disturbing unrelated worktree changes.

**Architecture:** Keep the admin package and every tracked file byte-for-byte unchanged while relocating the package beside the other monorepo applications. Remove the now-unused singular `app/*` workspace pattern, rename the corresponding pnpm lockfile importer, and update repository documentation that names the old location.

**Tech Stack:** pnpm 9 workspaces, Turborepo, Vite 6, React 19, TypeScript 5.9, ESLint 9

## Global Constraints

- Read and follow `design.md` before touching admin files.
- Do not change admin UI, behavior, dependencies, package name, scripts, routes, assets, or environment-variable names.
- Preserve all unrelated modifications and deletions already present in the worktree, especially the current `apps/docs` and `apps/web` changes.
- Move ignored local directories such as `node_modules`, `dist`, and `.turbo` only as a consequence of relocating the containing directory; never stage them.
- Keep `apps/*` and `packages/*` as the only workspace globs after the move.
- Use the Conventional Commit message `refactor(admin): move app into apps workspace`.

---

## File Structure

- Move: `app/admin/` → `apps/admin/` — relocate the complete tracked Vite admin package without editing its contents.
- Modify: `pnpm-workspace.yaml` — remove the obsolete `app/*` workspace glob.
- Modify: `pnpm-lock.yaml` — rename the importer key from `app/admin` to `apps/admin`; dependency versions and link targets stay unchanged because both paths have the same directory depth.
- Modify: `docs/admin-implementation-plan.md` — point the admin implementation plan at `apps/admin`.
- Modify: `docs/superpowers/plans/2026-07-13-organization-json-ld.md` — point its admin exclusion constraint at `apps/admin`.
- Preserve: every file inside the moved admin package — no content changes are part of this migration.

### Task 1: Relocate and verify the admin workspace

**Files:**

- Move: `app/admin/` → `apps/admin/`
- Modify: `pnpm-workspace.yaml`
- Modify: `pnpm-lock.yaml`
- Modify: `docs/admin-implementation-plan.md`
- Modify: `docs/superpowers/plans/2026-07-13-organization-json-ld.md`
- Verify: `apps/admin/package.json`
- Verify: `apps/admin/tsconfig.json`
- Verify: `apps/admin/vite.config.ts`
- Verify: `apps/admin/src/**`
- Verify: `apps/admin/public/**`
- Verify: `apps/admin/tests/typescript-loader.mjs`

**Interfaces:**

- Consumes: pnpm workspace discovery through `pnpm-workspace.yaml`, the `admin` package name from `app/admin/package.json`, and shared packages reached through `../../packages/*`.
- Produces: the same package named `admin`, now discovered at `apps/admin`, with unchanged scripts, relative imports, build output, routes, assets, and environment contract.

- [ ] **Step 1: Confirm the worktree and baseline admin package**

Run:

```bash
git status --short
pnpm --filter admin exec pwd
pnpm --filter admin check-types
pnpm --filter admin lint
pnpm --filter admin test:blog-form
pnpm --filter admin build
```

Expected:

- `git status --short` shows the existing unrelated changes; record them and do not stage or rewrite them.
- `pnpm --filter admin exec pwd` prints `/Users/sangkun/nocoders/zerosourcing-v2/app/admin`.
- Type checking, linting, the three `test:blog-form` subtests, and the Vite production build all pass.
- If a pre-existing change overlaps one of the five migration paths listed above, inspect it before proceeding and preserve its intent.

- [ ] **Step 2: Run the target-layout assertion before the move**

Run:

```bash
test -d apps/admin && test ! -e app/admin
```

Expected: exit status `1`, because `apps/admin` does not exist yet and `app/admin` still does.

- [ ] **Step 3: Move the complete admin directory**

Run:

```bash
git mv app/admin apps/admin
```

Expected: `apps/admin/package.json`, `apps/admin/src`, `apps/admin/public`, and `apps/admin/tests` exist, while `app/admin` no longer exists. Git detects the tracked files as renames; ignored `node_modules`, `dist`, and `.turbo` remain ignored at the new path.

- [ ] **Step 4: Update workspace discovery and the lockfile importer**

Apply these exact edits:

```diff
diff --git a/pnpm-workspace.yaml b/pnpm-workspace.yaml
@@
 packages:
-  - "app/*"
   - "apps/*"
   - "packages/*"
diff --git a/pnpm-lock.yaml b/pnpm-lock.yaml
@@
-  app/admin:
+  apps/admin:
```

Do not regenerate dependency versions or other importers. Both the old and new admin directories are two levels below the repository root, so existing lockfile links such as `link:../../packages/eslint-config` stay correct.

- [ ] **Step 5: Update repository documentation**

Apply these exact text replacements:

```diff
diff --git a/docs/admin-implementation-plan.md b/docs/admin-implementation-plan.md
@@
-Build the `app/admin` product admin from the provided Figma admin frames. The current admin app is only a single dashboard mock, so the first real boundary is not a dashboard: it is authentication plus content management for Portfolio and Blog.
+Build the `apps/admin` product admin from the provided Figma admin frames. The current admin app is only a single dashboard mock, so the first real boundary is not a dashboard: it is authentication plus content management for Portfolio and Blog.
diff --git a/docs/superpowers/plans/2026-07-13-organization-json-ld.md b/docs/superpowers/plans/2026-07-13-organization-json-ld.md
@@
-- 대상은 공개 사이트 `apps/web`이며 Vite 관리자 앱 `app/admin`에는 추가하지 않는다.
+- 대상은 공개 사이트 `apps/web`이며 Vite 관리자 앱 `apps/admin`에는 추가하지 않는다.
```

Keep the remainder of both paragraphs unchanged.

- [ ] **Step 6: Verify layout, references, and pnpm metadata**

Run:

```bash
test -d apps/admin && test ! -e app/admin
rg -n 'app/admin|"app/\*"' pnpm-workspace.yaml pnpm-lock.yaml docs/admin-implementation-plan.md docs/superpowers/plans/2026-07-13-organization-json-ld.md
pnpm install --lockfile-only --offline --frozen-lockfile
pnpm --filter admin exec pwd
```

Expected:

- The target-layout assertion exits `0`.
- `rg` exits `1` with no matches, proving the scoped old-path references are gone.
- The frozen offline install reports that the lockfile is current and does not alter `pnpm-lock.yaml`.
- `pnpm --filter admin exec pwd` prints `/Users/sangkun/nocoders/zerosourcing-v2/apps/admin`.

- [ ] **Step 7: Run the relocated admin verification suite**

Run:

```bash
pnpm --filter admin check-types
pnpm --filter admin lint
pnpm --filter admin test:blog-form
pnpm --filter admin build
git diff --check
```

Expected: type checking, linting, all three blog-form subtests, and the Vite production build pass from `apps/admin`; `git diff --check` prints nothing and exits `0`.

- [ ] **Step 8: Review and commit only the migration**

Run:

```bash
git diff --summary -- app/admin apps/admin
git diff -- pnpm-workspace.yaml pnpm-lock.yaml docs/admin-implementation-plan.md docs/superpowers/plans/2026-07-13-organization-json-ld.md
git add -A app/admin apps/admin pnpm-workspace.yaml pnpm-lock.yaml docs/admin-implementation-plan.md docs/superpowers/plans/2026-07-13-organization-json-ld.md docs/superpowers/plans/2026-07-13-move-admin-to-apps.md
git diff --cached --name-status
git commit -m "refactor(admin): move app into apps workspace"
```

Expected:

- The summary shows admin files moving from `app/admin` to `apps/admin` with no source-content edits.
- The focused diff contains only the workspace-glob removal, lockfile importer rename, and two documentation path updates.
- The staged name-status contains only the admin relocation and the explicitly listed configuration/documentation files; it excludes all unrelated `apps/docs` and `apps/web` changes.
- The commit succeeds with the Conventional Commit message shown above.
