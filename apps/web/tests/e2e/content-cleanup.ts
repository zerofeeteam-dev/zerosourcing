import type { SupabaseClient } from "@supabase/supabase-js";

import { BLOG_SLUGS, PORTFOLIO_SLUGS } from "./content-fixtures";

const storageBucket = "zerosourcing";
const maximumStorageEntries = 10_000;
const storagePageSize = 100;
const thumbnailFileNamePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/u;
const contentScopePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

type ContentEntity = "blog" | "portfolio";
type ContentTable = "blog_posts" | "portfolios";
type E2EManagedRow = {
  readonly content_asset_scope: string;
  readonly slug: string;
  readonly thumbnail_path: string | null;
};

function tableForEntity(entity: ContentEntity): ContentTable {
  return entity === "blog" ? "blog_posts" : "portfolios";
}

function slugsForEntity(entity: ContentEntity): readonly string[] {
  return entity === "blog" ? BLOG_SLUGS : PORTFOLIO_SLUGS;
}

function assertScopedStoragePrefix(prefix: string): void {
  if (
    !/^content\/(?:blog|portfolio)\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(
      prefix,
    )
  ) {
    throw new Error(`Refusing to clean an unsafe Storage prefix: ${prefix}`);
  }
}

export function isCanonicalE2EThumbnailPath(
  slug: string,
  path: string,
): boolean {
  const segments = path.split("/");
  return (
    /^e2e-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug) &&
    segments.length === 2 &&
    segments[0] === slug &&
    thumbnailFileNamePattern.test(segments[1] ?? "")
  );
}

async function listScopedObjects(
  client: SupabaseClient,
  prefix: string,
  paths: string[],
): Promise<void> {
  assertScopedStoragePrefix(prefix.split("/").slice(0, 3).join("/"));
  const bucket = client.storage.from(storageBucket);

  for (
    let offset = 0;
    offset < maximumStorageEntries;
    offset += storagePageSize
  ) {
    const { data, error } = await bucket.list(prefix, {
      limit: storagePageSize,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;

    for (const entry of data) {
      const path = `${prefix}/${entry.name}`;
      if (entry.id === null) {
        await listScopedObjects(client, path, paths);
      } else {
        paths.push(path);
      }
    }

    if (data.length < storagePageSize) return;
  }

  throw new Error(`Storage listing exceeded its safety bound for ${prefix}.`);
}

async function removeStoragePaths(
  client: SupabaseClient,
  paths: readonly string[],
): Promise<void> {
  const bucket = client.storage.from(storageBucket);
  for (let index = 0; index < paths.length; index += storagePageSize) {
    const batch = paths.slice(index, index + storagePageSize);
    if (batch.length === 0) continue;
    const { error } = await bucket.remove(batch);
    if (error) throw error;
  }
}

async function managedRows(
  client: SupabaseClient,
  entity: ContentEntity,
): Promise<readonly E2EManagedRow[]> {
  const { data, error } = await client
    .from(tableForEntity(entity))
    .select("slug,content_asset_scope,thumbnail_path")
    .in("slug", [...slugsForEntity(entity)]);
  if (error) throw error;
  return data as readonly E2EManagedRow[];
}

async function cleanupEntity(
  client: SupabaseClient,
  entity: ContentEntity,
): Promise<void> {
  const rows = await managedRows(client, entity);
  const paths = new Set<string>();
  const scopedPrefixes = new Set<string>();

  for (const row of rows) {
    const scope = row.content_asset_scope;
    if (!contentScopePattern.test(scope)) {
      throw new Error(`Refusing to clean an invalid content scope: ${scope}`);
    }
    const prefix = `content/${entity}/${scope}`;
    scopedPrefixes.add(prefix);
    const scopedPaths: string[] = [];
    await listScopedObjects(client, prefix, scopedPaths);
    for (const path of scopedPaths) paths.add(path);

    if (row.thumbnail_path !== null) {
      if (!isCanonicalE2EThumbnailPath(row.slug, row.thumbnail_path)) {
        throw new Error(
          `Refusing to clean a thumbnail outside ${row.slug}: ${row.thumbnail_path}`,
        );
      }
      paths.add(row.thumbnail_path);
    }
  }

  await removeStoragePaths(client, [...paths]);
  for (const prefix of scopedPrefixes) {
    const remainingPaths: string[] = [];
    await listScopedObjects(client, prefix, remainingPaths);
    if (remainingPaths.length > 0) {
      throw new Error(`Storage cleanup left objects in ${prefix}.`);
    }
  }

  const { error } = await client
    .from(tableForEntity(entity))
    .delete()
    .in("slug", [...slugsForEntity(entity)]);
  if (error) throw error;
}

export async function cleanupE2EContent(client: SupabaseClient): Promise<void> {
  await cleanupEntity(client, "blog");
  await cleanupEntity(client, "portfolio");
}
