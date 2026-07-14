import {
  SUPPORTED_CONTENT_SCHEMA_VERSION,
  type TiptapDocument,
} from "@repo/content/types";
import type {
  AdminSelectOption,
  AdminStatusTone,
} from "../../components/admin";
import { adminFailureMessage, type AdminFailure } from "../../lib/adminErrors";
import type {
  AdminJson,
  BlogPostRow,
  BlogPostStatus,
  BlogPostType,
} from "../../lib/adminRepositoryTypes";
import {
  managedContentFormFromRow,
  managedContentInputFromForm,
  managedContentIsEmpty,
} from "../../lib/managedContent";
import {
  parseAdminSlug,
  parseRequiredAdminString,
} from "../../lib/adminValidation";
import type {
  BlogFieldErrors,
  BlogFormState,
  BlogParsedInput,
  BlogValidationResult,
  StatusFilter,
  TypeFilter,
} from "./blogTypes";

const emptyDocument = {
  type: "doc",
  content: [{ type: "paragraph" }],
} as const satisfies TiptapDocument;

export function createEmptyBlogFormState(): BlogFormState {
  return {
    bannerPublished: false,
    bannerSections: "[]",
    content: "",
    contentAssetBaseEnabled: false,
    contentAssetScope: crypto.randomUUID(),
    contentAuthoringMode: "wysiwyg",
    contentJson: emptyDocument,
    contentMode: "html",
    contentSchemaVersion: SUPPORTED_CONTENT_SCHEMA_VERSION,
    contentSourceBackup: null,
    landingPublished: false,
    landingSections: "[]",
    publishedDate: "",
    seoDescription: "",
    slug: "",
    status: "draft",
    summary: "",
    thumbnailAlt: "",
    title: "",
    type: "",
  };
}

export const blogStatusOptions = [
  { label: "임시 저장", value: "draft" },
  { label: "게시", value: "published" },
] as const satisfies readonly AdminSelectOption[];

export const blogTypeOptions = [
  { label: "인사이트", value: "insight" },
  { label: "MVP", value: "mvp" },
  { label: "어플리케이션", value: "application" },
  { label: "기업 홈페이지", value: "company_homepage" },
] as const satisfies readonly AdminSelectOption[];

export const blogStatusFilterOptions = [
  { label: "전체", value: "all" },
  { label: "임시저장", value: "draft" },
  { label: "게시됨", value: "published" },
] as const;
export const blogTypeFilterOptions = [
  { label: "전체", value: "all" },
  ...blogTypeOptions,
] as const;

export function blogStatusLabel(status: BlogPostStatus): string {
  return status === "published" ? "게시됨" : "임시저장";
}

export function blogStatusTone(status: BlogPostStatus): AdminStatusTone {
  return status === "published" ? "success" : "warning";
}

export function blogTypeLabel(type: BlogPostType): string {
  const option = blogTypeOptions.find((item) => item.value === type);
  return option?.label ?? type;
}

export function blogStatusFromValue(value: string): BlogPostStatus {
  return value === "published" ? "published" : "draft";
}

export function blogTypeFromValue(value: string): BlogPostType {
  if (
    value === "mvp" ||
    value === "application" ||
    value === "company_homepage"
  )
    return value;
  return "insight";
}

export function blogFormTypeFromValue(value: string): BlogFormState["type"] {
  if (
    value === "insight" ||
    value === "mvp" ||
    value === "application" ||
    value === "company_homepage"
  ) {
    return value;
  }
  return "";
}

export function blogFormWithStatus(
  form: BlogFormState,
  status: BlogPostStatus,
): BlogFormState {
  return { ...form, status };
}

export function blogSectionCount(value: string): number {
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.length;
    if (parsed && typeof parsed === "object") return Object.keys(parsed).length;
  } catch {
    return 0;
  }
  return 0;
}

export function blogDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

export function formatBlogListDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}. ${month}. ${day}`;
}

function jsonText(value: AdminJson): string {
  return JSON.stringify(value, null, 2);
}

function isAdminJson(value: unknown): value is AdminJson {
  if (value === null) return true;
  if (
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  )
    return true;
  if (Array.isArray(value)) return value.every(isAdminJson);
  if (typeof value !== "object") return false;
  return Object.values(value).every(isAdminJson);
}

function parseJsonField(
  value: string,
  field: keyof BlogFormState,
  label: string,
) {
  try {
    const parsed: unknown = JSON.parse(value);
    if (isAdminJson(parsed)) return { ok: true, value: parsed } as const;
    return {
      field,
      message: `${label}은 JSON 값만 입력할 수 있습니다.`,
      ok: false,
    } as const;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        field,
        message: `${label} JSON 형식을 확인해 주세요.`,
        ok: false,
      } as const;
    }
    throw error;
  }
}

function errorFieldFromName(field: string): keyof BlogFieldErrors | undefined {
  switch (field) {
    case "bannerSections":
    case "content":
    case "contentAssetBaseEnabled":
    case "contentAssetScope":
    case "contentAuthoringMode":
    case "contentJson":
    case "contentMode":
    case "contentSchemaVersion":
    case "contentSourceBackup":
    case "landingSections":
    case "publishedDate":
    case "seoDescription":
    case "slug":
    case "status":
    case "summary":
    case "thumbnail":
    case "thumbnailAlt":
    case "title":
    case "type":
      return field;
    default:
      return undefined;
  }
}

export function blogFormFromRow(row: BlogPostRow): BlogFormState {
  const managedContent = managedContentFormFromRow(row);

  return {
    ...managedContent,
    bannerPublished: row.banner_published,
    bannerSections: jsonText(row.banner_sections),
    landingPublished: row.landing_published,
    landingSections: jsonText(row.landing_sections),
    publishedDate: blogDateInputValue(row.published_date),
    seoDescription: row.seo_description,
    slug: row.slug,
    status: row.status,
    summary: row.summary,
    thumbnailAlt: row.thumbnail_alt,
    title: row.title,
    type: row.type,
  };
}

export function filterBlogPosts(
  posts: readonly BlogPostRow[],
  query: string,
  status: StatusFilter,
  type: TypeFilter,
): readonly BlogPostRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  return posts.filter((post) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      post.title.toLowerCase().includes(normalizedQuery) ||
      post.slug.toLowerCase().includes(normalizedQuery);
    const matchesStatus = status === "all" || post.status === status;
    const matchesType = type === "all" || post.type === type;
    return matchesSearch && matchesStatus && matchesType;
  });
}

export function blogFailureToErrors(failure: AdminFailure): {
  readonly fields: BlogFieldErrors;
  readonly message: string;
} {
  if (failure.kind === "duplicate_slug") {
    return { fields: { slug: failure.message }, message: failure.message };
  }

  if (failure.kind === "validation_failure") {
    const fields: BlogFieldErrors = {};
    for (const issue of failure.issues) {
      const field = errorFieldFromName(issue.field);
      if (field) fields[field] = issue.message;
    }
    return { fields, message: failure.message };
  }

  return { fields: {}, message: adminFailureMessage(failure) };
}

export function validateBlogForm(form: BlogFormState): BlogValidationResult {
  const fields: BlogFieldErrors = {};
  const titleResult = parseRequiredAdminString(form.title, "title");
  const slugResult = parseAdminSlug(form.slug, "slug");
  const type = form.type;
  const landingSectionsResult = parseJsonField(
    form.landingSections,
    "landingSections",
    "Landing sections",
  );
  const bannerSectionsResult = parseJsonField(
    form.bannerSections,
    "bannerSections",
    "Banner sections",
  );
  const managedContent = managedContentInputFromForm(form);

  if (!titleResult.ok) fields.title = titleResult.error.message;
  if (!slugResult.ok) fields.slug = slugResult.error.message;
  if (type === "") fields.type = "블로그 유형을 선택해주세요.";
  if (!landingSectionsResult.ok)
    fields.landingSections = landingSectionsResult.message;
  if (!bannerSectionsResult.ok)
    fields.bannerSections = bannerSectionsResult.message;
  if (!managedContent) fields.content = "본문 형식을 확인해 주세요.";
  if (form.status === "published" && managedContentIsEmpty(form)) {
    fields.content = "게시하려면 본문을 입력해 주세요.";
  }
  if (form.status === "published" && form.summary.trim().length === 0) {
    fields.summary = "게시하려면 카드 요약을 입력해 주세요.";
  }

  if (
    !titleResult.ok ||
    !slugResult.ok ||
    type === "" ||
    !landingSectionsResult.ok ||
    !bannerSectionsResult.ok ||
    !managedContent ||
    fields.content !== undefined ||
    fields.summary !== undefined
  ) {
    return { fields, message: "입력값을 확인해 주세요.", ok: false };
  }

  const value: BlogParsedInput = {
    ...managedContent,
    bannerPublished: form.bannerPublished,
    bannerSections: bannerSectionsResult.value,
    landingPublished: form.landingPublished,
    landingSections: landingSectionsResult.value,
    publishedDate: form.publishedDate || null,
    seoDescription: form.seoDescription,
    slug: slugResult.value,
    status: form.status,
    summary: form.summary.trim(),
    thumbnailAlt: form.thumbnailAlt.trim(),
    title: titleResult.value.value,
    type,
  };

  return { ok: true, value };
}
