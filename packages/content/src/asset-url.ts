export type ContentEntity = "blog" | "portfolio";

export const CONTENT_STORAGE_BUCKET = "zerosourcing" as const;

const contentAssetScopePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ContentAssetScopeError extends Error {
  readonly name = "ContentAssetScopeError";

  constructor(readonly assetScope: unknown) {
    super("A valid content asset scope UUID is required.");
  }
}

export class ContentStorageBucketError extends Error {
  readonly name = "ContentStorageBucketError";

  constructor(readonly bucket: unknown) {
    super("Content assets must use the zerosourcing Storage bucket.");
  }
}

export function isContentAssetScope(value: unknown): value is string {
  return typeof value === "string" && contentAssetScopePattern.test(value);
}

export function parseContentAssetScope(assetScope: unknown): string {
  if (!isContentAssetScope(assetScope)) {
    throw new ContentAssetScopeError(assetScope);
  }

  return assetScope.toLowerCase();
}

function assertFixedContentStorageBucket(bucket: unknown): void {
  if (bucket !== undefined && bucket !== CONTENT_STORAGE_BUCKET) {
    throw new ContentStorageBucketError(bucket);
  }
}

export function contentAssetObjectPrefix(
  entity: ContentEntity,
  assetScope: string,
): string {
  return `content/${entity}/${parseContentAssetScope(assetScope)}/`;
}

export function createContentAssetBaseUrl(input: {
  readonly assetScope: string;
  /** @deprecated Content assets always use CONTENT_STORAGE_BUCKET. */
  readonly bucket?: string;
  readonly entity: ContentEntity;
  readonly supabaseUrl: string;
}): string {
  assertFixedContentStorageBucket(input.bucket);
  const objectPrefix = contentAssetObjectPrefix(input.entity, input.assetScope);
  let supabaseUrl: URL;
  try {
    supabaseUrl = new URL(input.supabaseUrl);
  } catch {
    throw new Error("A valid Supabase URL is required.");
  }

  const isHttp =
    supabaseUrl.protocol === "http:" || supabaseUrl.protocol === "https:";
  if (!isHttp || !supabaseUrl.hostname) {
    throw new Error("A valid Supabase URL is required.");
  }

  const path = [
    "storage",
    "v1",
    "object",
    "public",
    CONTENT_STORAGE_BUCKET,
    ...objectPrefix.slice(0, -1).split("/"),
  ]
    .map(encodeURIComponent)
    .join("/");
  supabaseUrl.pathname = `/${path}/`;
  supabaseUrl.search = "";
  supabaseUrl.hash = "";
  return supabaseUrl.toString();
}
