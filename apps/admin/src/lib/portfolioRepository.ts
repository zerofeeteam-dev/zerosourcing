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
  "id,status,type,slug,title,company_name,product_description,estimate_label,development_period,core_features,work_scopes,content_mode,content_authoring_mode,content_json,content_schema_version,content_source_backup,content_asset_scope,content_asset_base_enabled,content,seo_description,thumbnail_path,thumbnail_public_url,thumbnail_alt,landing_published,service_published,landing_sections,service_sections,published_at,created_at,updated_at,deleted_at";

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
  readonly content: string;
  readonly content_asset_base_enabled: boolean;
  readonly content_asset_scope: string;
  readonly content_authoring_mode: PortfolioCreateInput["contentAuthoringMode"];
  readonly content_json: PortfolioCreateInput["contentJson"];
  readonly content_mode: PortfolioCreateInput["contentMode"];
  readonly content_schema_version: PortfolioCreateInput["contentSchemaVersion"];
  readonly content_source_backup: string | null;
  readonly seo_description: string;
  readonly thumbnail_alt: string;
  readonly thumbnail_path: string | null;
  readonly thumbnail_public_url: string | null;
  readonly landing_published: boolean;
  readonly service_published: boolean;
  readonly landing_sections: PortfolioCreateInput["landingSections"];
  readonly service_sections: PortfolioCreateInput["serviceSections"];
};

type PortfolioUpdate = Partial<PortfolioInsert>;

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
  content?: string;
  content_asset_base_enabled?: boolean;
  content_asset_scope?: string;
  content_authoring_mode?: PortfolioInsert["content_authoring_mode"];
  content_json?: PortfolioInsert["content_json"];
  content_mode?: PortfolioInsert["content_mode"];
  content_schema_version?: PortfolioInsert["content_schema_version"];
  content_source_backup?: string | null;
  seo_description?: string;
  thumbnail_alt?: string;
  thumbnail_path?: string | null;
  thumbnail_public_url?: string | null;
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
    content: input.content,
    content_asset_base_enabled: input.contentAssetBaseEnabled,
    content_asset_scope: input.contentAssetScope,
    content_authoring_mode: input.contentAuthoringMode,
    content_json: input.contentJson,
    content_mode: input.contentMode,
    content_schema_version: input.contentSchemaVersion,
    content_source_backup: input.contentSourceBackup,
    seo_description: input.seoDescription,
    thumbnail_alt: input.thumbnailAlt,
    thumbnail_path: input.thumbnailPath,
    thumbnail_public_url: input.thumbnailPublicUrl,
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
  if (input.content !== undefined) update.content = input.content;
  if (input.contentAssetBaseEnabled !== undefined)
    update.content_asset_base_enabled = input.contentAssetBaseEnabled;
  if (input.contentAssetScope !== undefined)
    update.content_asset_scope = input.contentAssetScope;
  if (input.contentAuthoringMode !== undefined)
    update.content_authoring_mode = input.contentAuthoringMode;
  if (input.contentJson !== undefined) update.content_json = input.contentJson;
  if (input.contentMode !== undefined) update.content_mode = input.contentMode;
  if (input.contentSchemaVersion !== undefined)
    update.content_schema_version = input.contentSchemaVersion;
  if (input.contentSourceBackup !== undefined)
    update.content_source_backup = input.contentSourceBackup;
  if (input.seoDescription !== undefined) update.seo_description = input.seoDescription;
  if (input.thumbnailAlt !== undefined) update.thumbnail_alt = input.thumbnailAlt;
  if (input.thumbnailPath !== undefined) update.thumbnail_path = input.thumbnailPath;
  if (input.thumbnailPublicUrl !== undefined)
    update.thumbnail_public_url = input.thumbnailPublicUrl;
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

  let query = config.client
    .from("portfolios")
    .delete()
    .eq("id", id)
    .is("deleted_at", null)
    .select(portfolioColumns);

  if (options.signal !== undefined) query = query.abortSignal(options.signal);

  const { data, error } = await query.single().overrideTypes<PortfolioRow | null, { merge: false }>();
  if (error) return adminErr(mapPortfolioError(error));

  return data === null ? adminErr(saveFailure()) : adminOk(data);
}
