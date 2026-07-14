export type ContentEntity = "blog" | "portfolio";

export const CONTENT_STORAGE_BUCKET = "zerosourcing" as const;

const hiddenUrlCodePoints = /[\p{Cf}\p{Z}]/u;
const encodedUnsafeUrlCodePoints = /%(?:0[0-9a-f]|1[0-9a-f]|7f)/iu;

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

const absoluteHttpUrlPattern =
  /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)([^?#]*)(?:\?[^#]*)?(?:#.*)?$/iu;

function hasDotSegmentAlias(pathname: string): boolean {
  return pathname.split("/").some((segment) => {
    const decodedDots = segment.replace(/%2e/giu, ".");
    return decodedDots === "." || decodedDots === "..";
  });
}

function isCanonicalIpv4Loopback(hostname: string): boolean {
  const octets = hostname.split(".");
  return (
    octets.length === 4 &&
    octets[0] === "127" &&
    octets.every(
      (octet) => /^(?:0|[1-9][0-9]{0,2})$/u.test(octet) && Number(octet) <= 255,
    )
  );
}

function containsUnsafeUrlCodePoint(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (
      codeUnit <= 0x1f ||
      (codeUnit >= 0x7f && codeUnit <= 0x9f) ||
      codeUnit === 0x5c
    ) {
      return true;
    }
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const nextCodeUnit = value.charCodeAt(index + 1);
      if (nextCodeUnit < 0xdc00 || nextCodeUnit > 0xdfff) return true;
      if (hiddenUrlCodePoints.test(value.slice(index, index + 2))) return true;
      index += 1;
      continue;
    }
    if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) return true;
    if (hiddenUrlCodePoints.test(value[index] ?? "")) return true;
  }
  return false;
}

/**
 * Parses public asset URLs without accepting browser URL-parser aliases.
 * Production assets require HTTPS. Plain HTTP is limited to canonical literal
 * loopback hosts for local Supabase development.
 */
export function parseAllowedAssetHttpUrl(value: unknown): URL | null {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    containsUnsafeUrlCodePoint(value) ||
    encodedUnsafeUrlCodePoints.test(value)
  ) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (
    url.hostname.length === 0 ||
    url.hostname.endsWith(".") ||
    url.username.length > 0 ||
    url.password.length > 0
  ) {
    return null;
  }

  const rawParts = absoluteHttpUrlPattern.exec(value);
  if (
    !rawParts ||
    `${rawParts[1]?.toLowerCase()}:` !== url.protocol ||
    rawParts[2] !== url.host ||
    hasDotSegmentAlias(rawParts[3] ?? "")
  ) {
    return null;
  }
  if (url.protocol === "https:") return url;
  if (url.protocol !== "http:") return null;

  if (
    url.hostname !== "localhost" &&
    url.hostname !== "[::1]" &&
    !isCanonicalIpv4Loopback(url.hostname)
  ) {
    return null;
  }
  return url;
}

function canonicalPublicStorageObjectUrl(
  supabaseUrl: URL,
  objectPath: string,
): URL | null {
  const segments = objectPath.split("/");
  if (
    objectPath.length === 0 ||
    objectPath.startsWith("/") ||
    segments.some(
      (segment) => segment.length === 0 || segment === "." || segment === "..",
    )
  ) {
    return null;
  }

  const url = new URL(supabaseUrl.href);
  url.pathname = `/${[
    "storage",
    "v1",
    "object",
    "public",
    CONTENT_STORAGE_BUCKET,
    ...segments,
  ]
    .map(encodeURIComponent)
    .join("/")}`;
  url.search = "";
  url.hash = "";
  return url;
}

/** Matches one canonical object URL in the fixed public content bucket. */
export function isExactPublicStorageObjectUrl(
  value: unknown,
  input: {
    readonly objectPath: string;
    readonly supabaseUrl: string;
  },
): value is string {
  const candidate = parseAllowedAssetHttpUrl(value);
  const project = parseAllowedAssetHttpUrl(input.supabaseUrl);
  if (!candidate || !project) return false;

  const expected = canonicalPublicStorageObjectUrl(project, input.objectPath);
  return (
    expected !== null &&
    typeof value === "string" &&
    value === expected.href &&
    candidate.href === expected.href
  );
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
  const supabaseUrl = parseAllowedAssetHttpUrl(input.supabaseUrl);
  if (!supabaseUrl) {
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
