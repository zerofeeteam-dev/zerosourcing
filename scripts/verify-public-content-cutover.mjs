import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const manifestUrl = new URL(
  "./public-content-cutover-manifest.json",
  import.meta.url,
);

const portfolioColumns = [
  "slug",
  "type",
  "featured_published",
  "landing_published",
  "service_published",
];
const blogColumns = ["slug", "landing_published", "banner_published"];
const portfolioTypes = new Set([
  "application",
  "company_homepage",
  "mvp",
  "web_service",
]);
const publicSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const absoluteHttpUrlPattern =
  /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)([^?#]*)(?:\?[^#]*)?(?:#.*)?$/iu;
const hiddenUrlCodePoints = /[\p{Cf}\p{Z}]/u;
const encodedUnsafeUrlCodePoints = /%(?:0[0-9a-f]|1[0-9a-f]|7f)/iu;
const pageSize = 1_000;
const maximumPages = 100;

export class CutoverConfigError extends Error {
  name = "CutoverConfigError";

  constructor() {
    super("Cutover verification configuration is invalid.");
  }
}

export class CutoverManifestError extends Error {
  name = "CutoverManifestError";

  constructor(options) {
    super("Cutover verification manifest is invalid.", options);
  }
}

export class CutoverNetworkError extends Error {
  name = "CutoverNetworkError";

  constructor(options) {
    super("Cutover verification request failed.", options);
  }
}

export class CutoverShapeError extends Error {
  name = "CutoverShapeError";

  constructor(options) {
    super("Cutover verification response shape is invalid.", options);
  }
}

function containsUnsafeUrlCodePoint(value) {
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

function hasDotSegmentAlias(pathname) {
  return pathname.split("/").some((segment) => {
    const decodedDots = segment.replace(/%2e/giu, ".");
    return decodedDots === "." || decodedDots === "..";
  });
}

function isCanonicalIpv4Loopback(hostname) {
  const octets = hostname.split(".");
  return (
    octets.length === 4 &&
    octets[0] === "127" &&
    octets.every(
      (octet) => /^(?:0|[1-9][0-9]{0,2})$/u.test(octet) && Number(octet) <= 255,
    )
  );
}

/**
 * The verifier is plain Node ESM, so it keeps the same canonical-origin
 * boundary as the TypeScript public client without requiring a TS loader.
 */
export function parseSupabaseOrigin(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    containsUnsafeUrlCodePoint(value) ||
    encodedUnsafeUrlCodePoints.test(value)
  ) {
    return null;
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const rawParts = absoluteHttpUrlPattern.exec(value);
  if (
    !rawParts ||
    `${rawParts[1]?.toLowerCase()}:` !== url.protocol ||
    rawParts[2] !== url.host ||
    hasDotSegmentAlias(rawParts[3] ?? "") ||
    url.hostname.length === 0 ||
    url.hostname.endsWith(".") ||
    url.username.length > 0 ||
    url.password.length > 0
  ) {
    return null;
  }

  if (url.protocol === "https:") return url.origin;
  if (url.protocol !== "http:") return null;

  if (
    url.hostname !== "localhost" &&
    url.hostname !== "[::1]" &&
    !isCanonicalIpv4Loopback(url.hostname)
  ) {
    return null;
  }

  return url.origin;
}

export function parseVerificationConfig(environment) {
  const url = parseSupabaseOrigin(environment?.SUPABASE_URL);
  const publishableKey = environment?.SUPABASE_PUBLISHABLE_KEY;
  const validKey =
    typeof publishableKey === "string" &&
    publishableKey.length > 0 &&
    !containsUnsafeUrlCodePoint(publishableKey);

  if (url === null || !validKey) {
    throw new CutoverConfigError();
  }

  return { publishableKey, url };
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value, keys) {
  if (!isRecord(value)) return false;
  const actualKeys = Object.keys(value).sort();
  const expectedKeys = [...keys].sort();
  return (
    actualKeys.length === expectedKeys.length &&
    actualKeys.every((key, index) => key === expectedKeys[index])
  );
}

function isSafePublicSlug(value) {
  return (
    typeof value === "string" &&
    value.length <= 80 &&
    publicSlugPattern.test(value)
  );
}

function assertUniqueSlugs(rows, ErrorType) {
  const slugs = new Set();
  for (const row of rows) {
    if (slugs.has(row.slug)) throw new ErrorType();
    slugs.add(row.slug);
  }
}

function parseManifestPortfolio(value) {
  if (
    !hasExactKeys(value, [
      "featuredPublished",
      "landingPublished",
      "servicePublished",
      "slug",
      "type",
    ]) ||
    !isSafePublicSlug(value.slug) ||
    !portfolioTypes.has(value.type) ||
    typeof value.featuredPublished !== "boolean" ||
    typeof value.landingPublished !== "boolean" ||
    typeof value.servicePublished !== "boolean"
  ) {
    throw new CutoverManifestError();
  }

  return { ...value };
}

function parseManifestBlogPost(value) {
  if (
    !hasExactKeys(value, ["bannerPublished", "landingPublished", "slug"]) ||
    !isSafePublicSlug(value.slug) ||
    typeof value.bannerPublished !== "boolean" ||
    typeof value.landingPublished !== "boolean"
  ) {
    throw new CutoverManifestError();
  }

  return { ...value };
}

export function validateCutoverManifest(value) {
  if (
    !hasExactKeys(value, ["blogPosts", "portfolios"]) ||
    !Array.isArray(value.portfolios) ||
    !Array.isArray(value.blogPosts)
  ) {
    throw new CutoverManifestError();
  }

  const portfolios = value.portfolios.map(parseManifestPortfolio);
  const blogPosts = value.blogPosts.map(parseManifestBlogPost);
  assertUniqueSlugs(portfolios, CutoverManifestError);
  assertUniqueSlugs(blogPosts, CutoverManifestError);

  const meetitPlus = portfolios.find((row) => row.slug === "meetit-plus");
  const hybridVsNative = blogPosts.find(
    (row) => row.slug === "hybrid-vs-native-app",
  );
  const preservesFixtureExposure =
    portfolios.length === 9 &&
    portfolios.filter((row) => row.featuredPublished).length === 1 &&
    portfolios.filter((row) => row.landingPublished).length === 6 &&
    portfolios.filter((row) => row.servicePublished).length === 3 &&
    blogPosts.length === 6 &&
    blogPosts.filter((row) => row.landingPublished).length === 3 &&
    blogPosts.filter((row) => row.bannerPublished).length === 1 &&
    meetitPlus?.type === "mvp" &&
    hybridVsNative?.bannerPublished === true;

  if (!preservesFixtureExposure) {
    throw new CutoverManifestError();
  }

  return { blogPosts, portfolios };
}

function parsePortfolioResponse(value) {
  if (!Array.isArray(value)) throw new CutoverShapeError();

  const rows = value.map((row) => {
    if (
      !hasExactKeys(row, portfolioColumns) ||
      !isSafePublicSlug(row.slug) ||
      !portfolioTypes.has(row.type) ||
      typeof row.featured_published !== "boolean" ||
      typeof row.landing_published !== "boolean" ||
      typeof row.service_published !== "boolean"
    ) {
      throw new CutoverShapeError();
    }

    return {
      featuredPublished: row.featured_published,
      landingPublished: row.landing_published,
      servicePublished: row.service_published,
      slug: row.slug,
      type: row.type,
    };
  });

  assertUniqueSlugs(rows, CutoverShapeError);
  return rows;
}

function parseBlogResponse(value) {
  if (!Array.isArray(value)) throw new CutoverShapeError();

  const rows = value.map((row) => {
    if (
      !hasExactKeys(row, blogColumns) ||
      !isSafePublicSlug(row.slug) ||
      typeof row.landing_published !== "boolean" ||
      typeof row.banner_published !== "boolean"
    ) {
      throw new CutoverShapeError();
    }

    return {
      bannerPublished: row.banner_published,
      landingPublished: row.landing_published,
      slug: row.slug,
    };
  });

  assertUniqueSlugs(rows, CutoverShapeError);
  return rows;
}

function compareRows(section, expectedRows, actualRows, comparedFields) {
  const expectedBySlug = new Map(expectedRows.map((row) => [row.slug, row]));
  const actualBySlug = new Map(actualRows.map((row) => [row.slug, row]));
  const issues = [];

  for (const expected of expectedRows) {
    const actual = actualBySlug.get(expected.slug);
    if (actual === undefined) {
      issues.push({ kind: "missing", section, slug: expected.slug });
      continue;
    }

    if (comparedFields.some((field) => actual[field] !== expected[field])) {
      issues.push({ kind: "mismatched", section, slug: expected.slug });
    }
  }

  for (const actual of actualRows) {
    if (!expectedBySlug.has(actual.slug)) {
      issues.push({ kind: "extra", section, slug: actual.slug });
    }
  }

  return issues;
}

export function compareCutoverInventory(manifest, responses) {
  const expected = validateCutoverManifest(manifest);
  if (!hasExactKeys(responses, ["blogPosts", "portfolios"])) {
    throw new CutoverShapeError();
  }

  const actualPortfolios = parsePortfolioResponse(responses.portfolios);
  const actualBlogPosts = parseBlogResponse(responses.blogPosts);
  const issues = [
    ...compareRows("portfolio", expected.portfolios, actualPortfolios, [
      "featuredPublished",
      "landingPublished",
      "servicePublished",
      "type",
    ]),
    ...compareRows("blog", expected.blogPosts, actualBlogPosts, [
      "bannerPublished",
      "landingPublished",
    ]),
  ];

  const kindOrder = new Map([
    ["missing", 0],
    ["extra", 1],
    ["mismatched", 2],
  ]);
  return issues.sort(
    (left, right) =>
      left.section.localeCompare(right.section) ||
      kindOrder.get(left.kind) - kindOrder.get(right.kind) ||
      left.slug.localeCompare(right.slug),
  );
}

export function formatCutoverIssues(issues) {
  return issues
    .map((issue) => `${issue.section} ${issue.kind}: ${issue.slug}`)
    .join("\n");
}

function publishedTableUrl(baseUrl, table, columns, page) {
  const url = new URL(`/rest/v1/${table}`, baseUrl);
  url.search = new URLSearchParams({
    deleted_at: "is.null",
    limit: String(pageSize),
    offset: String(page * pageSize),
    order: "slug.asc",
    select: columns.join(","),
    status: "eq.published",
  }).toString();
  return url;
}

async function fetchPublishedTable(
  config,
  table,
  columns,
  fetchImplementation,
) {
  const rows = [];

  for (let page = 0; page < maximumPages; page += 1) {
    let response;
    try {
      response = await fetchImplementation(
        publishedTableUrl(config.url, table, columns, page),
        {
          cache: "no-store",
          headers: { apikey: config.publishableKey },
          redirect: "error",
        },
      );
    } catch (cause) {
      throw new CutoverNetworkError({ cause });
    }

    if (!response?.ok) throw new CutoverNetworkError();

    let payload;
    try {
      payload = await response.json();
    } catch (cause) {
      throw new CutoverShapeError({ cause });
    }

    if (!Array.isArray(payload) || payload.length > pageSize) {
      throw new CutoverShapeError();
    }

    rows.push(...payload);
    if (payload.length < pageSize) return rows;
  }

  throw new CutoverShapeError();
}

export async function fetchPublishedInventory(
  config,
  fetchImplementation = globalThis.fetch,
) {
  if (typeof fetchImplementation !== "function") {
    throw new CutoverNetworkError();
  }

  const validatedConfig = parseVerificationConfig({
    SUPABASE_PUBLISHABLE_KEY: config?.publishableKey,
    SUPABASE_URL: config?.url,
  });

  const [portfolios, blogPosts] = await Promise.all([
    fetchPublishedTable(
      validatedConfig,
      "portfolios",
      portfolioColumns,
      fetchImplementation,
    ),
    fetchPublishedTable(
      validatedConfig,
      "blog_posts",
      blogColumns,
      fetchImplementation,
    ),
  ]);

  return { blogPosts, portfolios };
}

export async function loadCutoverManifest(readFileImplementation = readFile) {
  let source;
  try {
    source = await readFileImplementation(manifestUrl, "utf8");
  } catch (cause) {
    throw new CutoverManifestError({ cause });
  }

  let value;
  try {
    value = JSON.parse(source);
  } catch (cause) {
    throw new CutoverManifestError({ cause });
  }

  return validateCutoverManifest(value);
}

export async function verifyPublicContentCutover({
  environment = process.env,
  fetchImplementation = globalThis.fetch,
  manifest,
} = {}) {
  const config = parseVerificationConfig(environment);
  const expected = manifest ?? (await loadCutoverManifest());
  const responses = await fetchPublishedInventory(config, fetchImplementation);
  return compareCutoverInventory(expected, responses);
}

export function safeFatalMessage(error) {
  if (error instanceof CutoverConfigError) return "configuration error";
  if (error instanceof CutoverManifestError) return "manifest error";
  if (error instanceof CutoverNetworkError) return "network error";
  if (error instanceof CutoverShapeError) return "response shape error";
  return "verification error";
}

export async function runCli({
  environment = process.env,
  fetchImplementation = globalThis.fetch,
  writeFailure = (message) => process.stderr.write(`${message}\n`),
} = {}) {
  try {
    const issues = await verifyPublicContentCutover({
      environment,
      fetchImplementation,
    });
    if (issues.length === 0) return 0;

    writeFailure(formatCutoverIssues(issues));
    return 1;
  } catch (error) {
    writeFailure(safeFatalMessage(error));
    return 1;
  }
}

const isDirectExecution =
  typeof process.argv[1] === "string" &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
  process.exitCode = await runCli();
}
