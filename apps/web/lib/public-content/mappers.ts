import { parseContentAssetScope } from "@repo/content/asset-url";
import { isPublicSlug } from "./public-slug";
import type {
  BlogCard,
  BlogDetail,
  BlogType,
  PortfolioCard,
  PortfolioDetail,
  PortfolioType,
} from "./types";

const portfolioTypes = ["application", "company_homepage", "mvp"] as const;
const blogTypes = [
  "application",
  "company_homepage",
  "insight",
  "mvp",
] as const;
const authoringModes = ["raw_html", "wysiwyg"] as const;
const outputModes = ["html", "text"] as const;

export class PublicContentMappingError extends Error {
  readonly name = "PublicContentMappingError";

  constructor(
    readonly field: string | null,
    message: string,
    cause?: unknown,
  ) {
    super(message, cause === undefined ? undefined : { cause });
  }
}

function mappingError(field: string, requirement: string): never {
  throw new PublicContentMappingError(
    field,
    `Public content field ${field} must be ${requirement}.`,
  );
}

function record(value: unknown): Readonly<Record<string, unknown>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PublicContentMappingError(
      null,
      "Public content row must be an object.",
    );
  }

  return value as Readonly<Record<string, unknown>>;
}

function stringField(
  row: Readonly<Record<string, unknown>>,
  key: string,
): string {
  const value = row[key];
  if (typeof value !== "string") {
    mappingError(key, "a string");
  }
  return value;
}

function nullableStringField(
  row: Readonly<Record<string, unknown>>,
  key: string,
): string | null {
  const value = row[key];
  if (value === null) return null;
  if (typeof value !== "string") {
    mappingError(key, "a string or null");
  }
  return value;
}

function booleanField(
  row: Readonly<Record<string, unknown>>,
  key: string,
): boolean {
  const value = row[key];
  if (typeof value !== "boolean") {
    mappingError(key, "a boolean");
  }
  return value;
}

function stringArrayField(
  row: Readonly<Record<string, unknown>>,
  key: string,
): readonly string[] {
  const value = row[key];
  if (!Array.isArray(value)) {
    mappingError(key, "a string array");
  }

  for (const item of value) {
    if (typeof item !== "string") {
      mappingError(key, "a string array");
    }
  }

  return [...value] as string[];
}

function enumField<const TValues extends readonly string[]>(
  row: Readonly<Record<string, unknown>>,
  key: string,
  values: TValues,
): TValues[number] {
  const value = stringField(row, key);
  if (!values.some((candidate) => candidate === value)) {
    throw new PublicContentMappingError(
      key,
      `Public content field ${key} has an unknown value.`,
    );
  }
  return value as TValues[number];
}

function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return day <= (daysInMonth[month - 1] ?? 0);
}

function dateField(
  row: Readonly<Record<string, unknown>>,
  key: string,
): string {
  const value = stringField(row, key);
  if (!isCalendarDate(value)) {
    mappingError(key, "an ISO calendar date");
  }
  return value;
}

function nullableDateField(
  row: Readonly<Record<string, unknown>>,
  key: string,
): string | null {
  const value = nullableStringField(row, key);
  if (value !== null && !isCalendarDate(value)) {
    mappingError(key, "an ISO calendar date or null");
  }
  return value;
}

function timestampField(
  row: Readonly<Record<string, unknown>>,
  key: string,
): string {
  const value = stringField(row, key);
  const match =
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.exec(
      value,
    );
  const validTime =
    match !== null &&
    isCalendarDate(match[1] ?? "") &&
    Number(match[2]) <= 23 &&
    Number(match[3]) <= 59 &&
    Number(match[4]) <= 59 &&
    Number.isFinite(Date.parse(value));
  if (!validTime) {
    mappingError(key, "an ISO timestamp with a timezone");
  }
  return value;
}

function assetScopeField(
  row: Readonly<Record<string, unknown>>,
  key: string,
): string {
  const value = row[key];
  try {
    return parseContentAssetScope(value);
  } catch (cause) {
    throw new PublicContentMappingError(
      key,
      `Public content field ${key} must be a content asset scope UUID.`,
      cause,
    );
  }
}

function slugField(
  row: Readonly<Record<string, unknown>>,
  key: string,
): string {
  const value = row[key];
  if (!isPublicSlug(value)) {
    mappingError(key, "a public slug");
  }
  return value;
}

function portfolioCategory(type: PortfolioType): string {
  if (type === "company_homepage") return "기업 홈페이지";
  if (type === "application") return "어플리케이션";
  return "MVP";
}

function blogCategory(type: BlogType): string {
  if (type === "company_homepage") return "기업 홈페이지";
  if (type === "application") return "어플리케이션";
  if (type === "mvp") return "MVP";
  return "인사이트";
}

function displayDate(value: string): string {
  const validDate = dateField({ value }, "value");
  return `${validDate.slice(0, 4)}. ${validDate.slice(5, 7)}. ${validDate.slice(8, 10)}`;
}

export function mapPortfolioCard(value: unknown): PortfolioCard {
  const row = record(value);
  const type = enumField(row, "type", portfolioTypes);
  return {
    category: portfolioCategory(type),
    description: stringField(row, "product_description"),
    duration: stringField(row, "development_period"),
    estimate: stringField(row, "estimate_label"),
    features: stringArrayField(row, "core_features"),
    landingPublished: booleanField(row, "landing_published"),
    scope: stringArrayField(row, "work_scopes"),
    servicePublished: booleanField(row, "service_published"),
    slug: slugField(row, "slug"),
    thumbnailAlt: stringField(row, "thumbnail_alt"),
    thumbnailUrl: nullableStringField(row, "thumbnail_public_url"),
    title: stringField(row, "title"),
    type,
    updatedAt: timestampField(row, "updated_at"),
  };
}

export function mapPortfolioDetail(value: unknown): PortfolioDetail {
  const row = record(value);
  return {
    ...mapPortfolioCard(row),
    assetBaseEnabled: booleanField(row, "content_asset_base_enabled"),
    assetScope: assetScopeField(row, "content_asset_scope"),
    content: stringField(row, "content"),
    contentAuthoringMode: enumField(
      row,
      "content_authoring_mode",
      authoringModes,
    ),
    contentMode: enumField(row, "content_mode", outputModes),
    seoDescription: stringField(row, "seo_description"),
  };
}

export function mapBlogCard(value: unknown): BlogCard {
  const row = record(value);
  const type = enumField(row, "type", blogTypes);
  const publishedAt = timestampField(row, "published_at");
  const date =
    nullableDateField(row, "published_date") ?? publishedAt.slice(0, 10);
  return {
    bannerPublished: booleanField(row, "banner_published"),
    category: blogCategory(type),
    date: displayDate(date),
    landingPublished: booleanField(row, "landing_published"),
    slug: slugField(row, "slug"),
    summary: stringField(row, "summary"),
    thumbnailAlt: stringField(row, "thumbnail_alt"),
    thumbnailUrl: nullableStringField(row, "thumbnail_public_url"),
    title: stringField(row, "title"),
    type,
    updatedAt: timestampField(row, "updated_at"),
  };
}

export function mapBlogDetail(value: unknown): BlogDetail {
  const row = record(value);
  return {
    ...mapBlogCard(row),
    assetBaseEnabled: booleanField(row, "content_asset_base_enabled"),
    assetScope: assetScopeField(row, "content_asset_scope"),
    author: "제로소싱",
    content: stringField(row, "content"),
    contentAuthoringMode: enumField(
      row,
      "content_authoring_mode",
      authoringModes,
    ),
    contentMode: enumField(row, "content_mode", outputModes),
    seoDescription: stringField(row, "seo_description"),
  };
}
