import type {
  AdminSelectOption,
  AdminStatusTone,
} from "../../components/admin";
import type {
  AdminJson,
  PortfolioRow,
  PortfolioStatus,
  PortfolioType,
} from "../../lib/adminRepositoryTypes";
import {
  parseAdminSlug,
  parseRequiredAdminString,
} from "../../lib/adminValidation";
import type {
  PortfolioFieldKey,
  PortfolioFilterValue,
  PortfolioFormState,
  PortfolioInputBuildResult,
  PortfolioJsonParseResult,
} from "./portfolioTypes";

const emptyJsonText = "{}";

export const portfolioStatusOptions = [
  { label: "임시 저장", value: "draft" },
  { label: "게시", value: "published" },
] as const satisfies readonly AdminSelectOption[];

export const portfolioTypeOptions = [
  { label: "Application", value: "application" },
  { label: "Company Homepage", value: "company_homepage" },
  { label: "MVP", value: "mvp" },
] as const satisfies readonly AdminSelectOption[];

export const statusFilterOptions = [
  { label: "전체 상태", value: "all" },
  ...portfolioStatusOptions,
] as const satisfies readonly AdminSelectOption[];

export const typeFilterOptions = [
  { label: "전체 유형", value: "all" },
  ...portfolioTypeOptions,
] as const satisfies readonly AdminSelectOption[];

export const emptyPortfolioFormState: PortfolioFormState = {
  companyName: "",
  content: "",
  contentMode: "html",
  coreFeatures: [""],
  developmentPeriod: "",
  estimateLabel: "",
  landingPublished: false,
  landingSections: emptyJsonText,
  productDescription: "",
  seoDescription: "",
  servicePublished: false,
  serviceSections: emptyJsonText,
  slug: "",
  status: "draft",
  title: "",
  type: "",
  workScopes: [""],
};

export function portfolioStatusLabel(status: PortfolioStatus): string {
  switch (status) {
    case "draft":
      return "임시 저장";
    case "published":
      return "게시";
  }
}

export function portfolioStatusTone(status: PortfolioStatus): AdminStatusTone {
  switch (status) {
    case "draft":
      return "warning";
    case "published":
      return "success";
  }
}

export function portfolioTypeLabel(type: PortfolioType): string {
  switch (type) {
    case "application":
      return "Application";
    case "company_homepage":
      return "Company Homepage";
    case "mvp":
      return "MVP";
  }
}

export function parsePortfolioStatus(value: string): PortfolioStatus {
  if (value === "published") return "published";
  return "draft";
}

export function parsePortfolioType(value: string): PortfolioType {
  if (value === "company_homepage") return "company_homepage";
  if (value === "mvp") return "mvp";
  return "application";
}

export function parsePortfolioFormType(value: string): PortfolioType | "" {
  if (value === "") return "";
  return parsePortfolioType(value);
}

function jsonText(value: AdminJson): string {
  return JSON.stringify(value ?? {}, null, 2);
}

export function portfolioFormFromRow(row: PortfolioRow): PortfolioFormState {
  return {
    companyName: row.company_name,
    content: row.content,
    contentMode: row.content_mode,
    coreFeatures: row.core_features.length > 0 ? row.core_features : [""],
    developmentPeriod: row.development_period,
    estimateLabel: row.estimate_label,
    landingPublished: row.landing_published,
    landingSections: jsonText(row.landing_sections),
    productDescription: row.product_description,
    seoDescription: row.seo_description,
    servicePublished: row.service_published,
    serviceSections: jsonText(row.service_sections),
    slug: row.slug,
    status: row.status,
    title: row.title,
    type: row.type,
    workScopes: row.work_scopes.length > 0 ? row.work_scopes : [""],
  };
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
  if (typeof value === "object") return Object.values(value).every(isAdminJson);
  return false;
}

function parseJsonField(
  value: string,
  field: PortfolioFieldKey,
): PortfolioJsonParseResult {
  const trimmed = value.trim();
  if (trimmed.length === 0) return { ok: true, value: {} };

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (isAdminJson(parsed)) return { ok: true, value: parsed };
    return {
      field,
      error:
        "JSON 값은 문자열, 숫자, boolean, 배열, 객체, null만 사용할 수 있습니다.",
      ok: false,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { field, error: "올바른 JSON 형식으로 입력해 주세요.", ok: false };
    }
    throw error;
  }
}

function compactItems(items: readonly string[]): readonly string[] {
  return items.map((item) => item.trim()).filter((item) => item.length > 0);
}

export function buildPortfolioInput(
  form: PortfolioFormState,
): PortfolioInputBuildResult {
  const errors: PortfolioInputBuildResult["errors"] = {};
  const slug = parseAdminSlug(form.slug, "slug");
  const title = parseRequiredAdminString(
    form.title || form.companyName,
    "title",
  );
  const companyName = parseRequiredAdminString(form.companyName, "companyName");
  const landingSections = parseJsonField(
    form.landingSections,
    "landingSections",
  );
  const serviceSections = parseJsonField(
    form.serviceSections,
    "serviceSections",
  );

  if (!slug.ok) errors.slug = slug.error.message;
  if (!title.ok) errors.title = title.error.message;
  if (!companyName.ok) errors.companyName = companyName.error.message;
  if (!form.type) errors.type = "포트폴리오 유형을 선택해 주세요.";
  if (!landingSections.ok) errors.landingSections = landingSections.error;
  if (!serviceSections.ok) errors.serviceSections = serviceSections.error;

  if (
    !slug.ok ||
    !title.ok ||
    !companyName.ok ||
    !form.type ||
    !landingSections.ok ||
    !serviceSections.ok
  ) {
    return { errors };
  }

  return {
    errors,
    input: {
      companyName: companyName.value.value,
      content: form.content,
      contentMode: form.contentMode,
      coreFeatures: compactItems(form.coreFeatures),
      developmentPeriod: form.developmentPeriod.trim(),
      estimateLabel: form.estimateLabel.trim(),
      landingPublished: form.landingPublished,
      landingSections: landingSections.value,
      productDescription: form.productDescription.trim(),
      seoDescription: form.seoDescription.trim(),
      servicePublished: form.servicePublished,
      serviceSections: serviceSections.value,
      slug: slug.value,
      status: form.status,
      title: title.value.value,
      type: form.type,
      workScopes: compactItems(form.workScopes),
    },
  };
}

function textIncludes(value: string, query: string): boolean {
  return value.toLowerCase().includes(query);
}

export function filterPortfolioRows(
  rows: readonly PortfolioRow[],
  search: string,
  status: PortfolioFilterValue<PortfolioStatus>,
  type: PortfolioFilterValue<PortfolioType>,
): readonly PortfolioRow[] {
  const query = search.trim().toLowerCase();

  return rows.filter((row) => {
    const matchesStatus = status === "all" || row.status === status;
    const matchesType = type === "all" || row.type === type;
    const matchesSearch =
      query.length === 0 ||
      textIncludes(row.title, query) ||
      textIncludes(row.company_name, query) ||
      textIncludes(row.slug, query);

    return matchesStatus && matchesType && matchesSearch;
  });
}

export function formatPortfolioDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}
