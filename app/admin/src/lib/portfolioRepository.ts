import { PostgrestError } from "@supabase/supabase-js";
import { duplicateSlugFailure, permissionDeniedFailure, saveFailure, supabaseDisabledFailure } from "./adminErrors";
import type {
  AdminRepositoryOptions,
  AdminRepositoryResult,
  PortfolioCreateInput,
  PortfolioRow,
  PortfolioUpdateInput,
} from "./adminRepositoryTypes";
import { adminErr, adminOk } from "./adminTypes";
import type { SupabaseConfig } from "./supabase";

const portfolioColumns =
  "id,status,type,slug,title,company_name,product_description,estimate_label,development_period,core_features,work_scopes,content_mode,content,seo_description,landing_published,service_published,landing_sections,service_sections,created_at,updated_at,deleted_at";

type PortfolioInsert = {
  readonly status: PortfolioCreateInput["status"];
  readonly type: PortfolioCreateInput["type"];
  readonly slug: string;
  readonly title: string;
  readonly company_name: string;
  readonly product_description: string;
  readonly estimate_label: string;
  readonly development_period: string;
  readonly core_features: readonly string[];
  readonly work_scopes: readonly string[];
  readonly content_mode: PortfolioCreateInput["contentMode"];
  readonly content: string;
  readonly seo_description: string;
  readonly landing_published: boolean;
  readonly service_published: boolean;
  readonly landing_sections: PortfolioCreateInput["landingSections"];
  readonly service_sections: PortfolioCreateInput["serviceSections"];
};

type PortfolioUpdate = Partial<PortfolioInsert> & {
  readonly deleted_at?: string;
};

type PortfolioUpdateDraft = {
  status?: PortfolioInsert["status"];
  type?: PortfolioInsert["type"];
  slug?: string;
  title?: string;
  company_name?: string;
  product_description?: string;
  estimate_label?: string;
  development_period?: string;
  core_features?: readonly string[];
  work_scopes?: readonly string[];
  content_mode?: PortfolioInsert["content_mode"];
  content?: string;
  seo_description?: string;
  landing_published?: boolean;
  service_published?: boolean;
  landing_sections?: PortfolioInsert["landing_sections"];
  service_sections?: PortfolioInsert["service_sections"];
};

function portfolioInsertFromInput(input: PortfolioCreateInput): PortfolioInsert {
  return {
    status: input.status,
    type: input.type,
    slug: input.slug.value,
    title: input.title,
    company_name: input.companyName,
    product_description: input.productDescription,
    estimate_label: input.estimateLabel,
    development_period: input.developmentPeriod,
    core_features: input.coreFeatures,
    work_scopes: input.workScopes,
    content_mode: input.contentMode,
    content: input.content,
    seo_description: input.seoDescription,
    landing_published: input.landingPublished,
    service_published: input.servicePublished,
    landing_sections: input.landingSections,
    service_sections: input.serviceSections,
  };
}

function portfolioUpdateFromInput(input: PortfolioUpdateInput): PortfolioUpdate {
  const update: PortfolioUpdateDraft = {};

  if (input.status !== undefined) update.status = input.status;
  if (input.type !== undefined) update.type = input.type;
  if (input.slug !== undefined) update.slug = input.slug.value;
  if (input.title !== undefined) update.title = input.title;
  if (input.companyName !== undefined) update.company_name = input.companyName;
  if (input.productDescription !== undefined) update.product_description = input.productDescription;
  if (input.estimateLabel !== undefined) update.estimate_label = input.estimateLabel;
  if (input.developmentPeriod !== undefined) update.development_period = input.developmentPeriod;
  if (input.coreFeatures !== undefined) update.core_features = input.coreFeatures;
  if (input.workScopes !== undefined) update.work_scopes = input.workScopes;
  if (input.contentMode !== undefined) update.content_mode = input.contentMode;
  if (input.content !== undefined) update.content = input.content;
  if (input.seoDescription !== undefined) update.seo_description = input.seoDescription;
  if (input.landingPublished !== undefined) update.landing_published = input.landingPublished;
  if (input.servicePublished !== undefined) update.service_published = input.servicePublished;
  if (input.landingSections !== undefined) update.landing_sections = input.landingSections;
  if (input.serviceSections !== undefined) update.service_sections = input.serviceSections;

  return update;
}

function mapPortfolioError(error: PostgrestError, input?: PortfolioCreateInput | PortfolioUpdateInput) {
  if (error.code === "23505" && input?.slug !== undefined) {
    return duplicateSlugFailure(input.slug);
  }

  if (error.code === "42501" || error.code === "PGRST301" || error.code === "PGRST302") {
    return permissionDeniedFailure();
  }

  return saveFailure();
}

export async function listPortfolios(
  config: SupabaseConfig,
  options: AdminRepositoryOptions = {},
): Promise<AdminRepositoryResult<readonly PortfolioRow[]>> {
  if (config.kind === "disabled") return adminErr(supabaseDisabledFailure(config));

  let query = config.client
    .from("portfolios")
    .select(portfolioColumns)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (options.signal !== undefined) query = query.abortSignal(options.signal);

  const { data, error } = await query.overrideTypes<PortfolioRow[], { merge: false }>();
  if (error) return adminErr(mapPortfolioError(error));

  return adminOk(data);
}

export async function getPortfolioBySlug(
  config: SupabaseConfig,
  slug: string,
  options: AdminRepositoryOptions = {},
): Promise<AdminRepositoryResult<PortfolioRow | null>> {
  if (config.kind === "disabled") return adminErr(supabaseDisabledFailure(config));

  let query = config.client
    .from("portfolios")
    .select(portfolioColumns)
    .eq("slug", slug)
    .is("deleted_at", null);

  if (options.signal !== undefined) query = query.abortSignal(options.signal);

  const { data, error } = await query.maybeSingle().overrideTypes<PortfolioRow | null, { merge: false }>();
  if (error) return adminErr(mapPortfolioError(error));

  return adminOk(data);
}

export async function createPortfolio(
  config: SupabaseConfig,
  input: PortfolioCreateInput,
  options: AdminRepositoryOptions = {},
): Promise<AdminRepositoryResult<PortfolioRow>> {
  if (config.kind === "disabled") return adminErr(supabaseDisabledFailure(config));

  let query = config.client
    .from("portfolios")
    .insert(portfolioInsertFromInput(input))
    .select(portfolioColumns);

  if (options.signal !== undefined) query = query.abortSignal(options.signal);

  const { data, error } = await query.single().overrideTypes<PortfolioRow | null, { merge: false }>();
  if (error) return adminErr(mapPortfolioError(error, input));

  return data === null ? adminErr(saveFailure()) : adminOk(data);
}

export async function updatePortfolio(
  config: SupabaseConfig,
  id: string,
  input: PortfolioUpdateInput,
  options: AdminRepositoryOptions = {},
): Promise<AdminRepositoryResult<PortfolioRow>> {
  if (config.kind === "disabled") return adminErr(supabaseDisabledFailure(config));

  let query = config.client
    .from("portfolios")
    .update(portfolioUpdateFromInput(input))
    .eq("id", id)
    .is("deleted_at", null)
    .select(portfolioColumns);

  if (options.signal !== undefined) query = query.abortSignal(options.signal);

  const { data, error } = await query.single().overrideTypes<PortfolioRow | null, { merge: false }>();
  if (error) return adminErr(mapPortfolioError(error, input));

  return data === null ? adminErr(saveFailure()) : adminOk(data);
}

export async function deletePortfolio(
  config: SupabaseConfig,
  id: string,
  options: AdminRepositoryOptions = {},
): Promise<AdminRepositoryResult<PortfolioRow>> {
  if (config.kind === "disabled") return adminErr(supabaseDisabledFailure(config));

  const update: PortfolioUpdate = { deleted_at: new Date().toISOString() };
  let query = config.client
    .from("portfolios")
    .update(update)
    .eq("id", id)
    .is("deleted_at", null)
    .select(portfolioColumns);

  if (options.signal !== undefined) query = query.abortSignal(options.signal);

  const { data, error } = await query.single().overrideTypes<PortfolioRow | null, { merge: false }>();
  if (error) return adminErr(mapPortfolioError(error));

  return data === null ? adminErr(saveFailure()) : adminOk(data);
}
