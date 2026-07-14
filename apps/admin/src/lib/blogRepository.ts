import { PostgrestError } from "@supabase/supabase-js";
import { duplicateSlugFailure, permissionDeniedFailure, saveFailure, supabaseDisabledFailure } from "./adminErrors";
import type {
  AdminRepositoryOptions,
  AdminRepositoryResult,
  BlogPostCreateInput,
  BlogPostRow,
  BlogPostUpdateInput,
} from "./adminRepositoryTypes";
import { adminErr, adminOk } from "./adminTypes";
import type { SupabaseConfig } from "./supabase";

const blogPostColumns =
  "id,status,type,slug,title,summary,published_date,thumbnail_path,thumbnail_public_url,thumbnail_alt,content_mode,content_authoring_mode,content_json,content_schema_version,content_source_backup,content_asset_scope,content_asset_base_enabled,content,seo_description,landing_published,banner_published,landing_sections,banner_sections,published_at,created_at,updated_at,deleted_at";

type BlogPostInsert = {
  readonly status: BlogPostCreateInput["status"];
  readonly type: BlogPostCreateInput["type"];
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly published_date: string | null;
  readonly thumbnail_path: string | null;
  readonly thumbnail_public_url: string | null;
  readonly thumbnail_alt: string;
  readonly content: string;
  readonly content_asset_base_enabled: boolean;
  readonly content_asset_scope: string;
  readonly content_authoring_mode: BlogPostCreateInput["contentAuthoringMode"];
  readonly content_json: BlogPostCreateInput["contentJson"];
  readonly content_mode: BlogPostCreateInput["contentMode"];
  readonly content_schema_version: BlogPostCreateInput["contentSchemaVersion"];
  readonly content_source_backup: string | null;
  readonly seo_description: string;
  readonly landing_published: boolean;
  readonly banner_published: boolean;
  readonly landing_sections: BlogPostCreateInput["landingSections"];
  readonly banner_sections: BlogPostCreateInput["bannerSections"];
};

type BlogPostUpdate = Partial<BlogPostInsert> & {
  readonly deleted_at?: string;
};

type BlogPostUpdateDraft = {
  status?: BlogPostInsert["status"];
  type?: BlogPostInsert["type"];
  slug?: string;
  title?: string;
  summary?: string;
  published_date?: string | null;
  thumbnail_path?: string | null;
  thumbnail_public_url?: string | null;
  thumbnail_alt?: string;
  content?: string;
  content_asset_base_enabled?: boolean;
  content_asset_scope?: string;
  content_authoring_mode?: BlogPostInsert["content_authoring_mode"];
  content_json?: BlogPostInsert["content_json"];
  content_mode?: BlogPostInsert["content_mode"];
  content_schema_version?: BlogPostInsert["content_schema_version"];
  content_source_backup?: string | null;
  seo_description?: string;
  landing_published?: boolean;
  banner_published?: boolean;
  landing_sections?: BlogPostInsert["landing_sections"];
  banner_sections?: BlogPostInsert["banner_sections"];
};

function blogPostInsertFromInput(input: BlogPostCreateInput): BlogPostInsert {
  return {
    status: input.status,
    type: input.type,
    slug: input.slug.value,
    title: input.title,
    summary: input.summary,
    published_date: input.publishedDate,
    thumbnail_path: input.thumbnailPath,
    thumbnail_public_url: input.thumbnailPublicUrl,
    thumbnail_alt: input.thumbnailAlt,
    content: input.content,
    content_asset_base_enabled: input.contentAssetBaseEnabled,
    content_asset_scope: input.contentAssetScope,
    content_authoring_mode: input.contentAuthoringMode,
    content_json: input.contentJson,
    content_mode: input.contentMode,
    content_schema_version: input.contentSchemaVersion,
    content_source_backup: input.contentSourceBackup,
    seo_description: input.seoDescription,
    landing_published: input.landingPublished,
    banner_published: input.bannerPublished,
    landing_sections: input.landingSections,
    banner_sections: input.bannerSections,
  };
}

function blogPostUpdateFromInput(input: BlogPostUpdateInput): BlogPostUpdate {
  const update: BlogPostUpdateDraft = {};

  if (input.status !== undefined) update.status = input.status;
  if (input.type !== undefined) update.type = input.type;
  if (input.slug !== undefined) update.slug = input.slug.value;
  if (input.title !== undefined) update.title = input.title;
  if (input.summary !== undefined) update.summary = input.summary;
  if (input.publishedDate !== undefined) update.published_date = input.publishedDate;
  if (input.thumbnailPath !== undefined) update.thumbnail_path = input.thumbnailPath;
  if (input.thumbnailPublicUrl !== undefined) update.thumbnail_public_url = input.thumbnailPublicUrl;
  if (input.thumbnailAlt !== undefined) update.thumbnail_alt = input.thumbnailAlt;
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
  if (input.landingPublished !== undefined) update.landing_published = input.landingPublished;
  if (input.bannerPublished !== undefined) update.banner_published = input.bannerPublished;
  if (input.landingSections !== undefined) update.landing_sections = input.landingSections;
  if (input.bannerSections !== undefined) update.banner_sections = input.bannerSections;

  return update;
}

function mapBlogPostError(error: PostgrestError, input?: BlogPostCreateInput | BlogPostUpdateInput) {
  if (error.code === "23505" && input?.slug !== undefined) {
    return duplicateSlugFailure(input.slug);
  }

  if (error.code === "42501" || error.code === "PGRST301" || error.code === "PGRST302") {
    return permissionDeniedFailure();
  }

  return saveFailure();
}

export async function listBlogPosts(
  config: SupabaseConfig,
  options: AdminRepositoryOptions = {},
): Promise<AdminRepositoryResult<readonly BlogPostRow[]>> {
  if (config.kind === "disabled") return adminErr(supabaseDisabledFailure(config));

  let query = config.client
    .from("blog_posts")
    .select(blogPostColumns)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (options.signal !== undefined) query = query.abortSignal(options.signal);

  const { data, error } = await query.overrideTypes<BlogPostRow[], { merge: false }>();
  if (error) return adminErr(mapBlogPostError(error));

  return adminOk(data);
}

export async function getBlogPostBySlug(
  config: SupabaseConfig,
  slug: string,
  options: AdminRepositoryOptions = {},
): Promise<AdminRepositoryResult<BlogPostRow | null>> {
  if (config.kind === "disabled") return adminErr(supabaseDisabledFailure(config));

  let query = config.client
    .from("blog_posts")
    .select(blogPostColumns)
    .eq("slug", slug)
    .is("deleted_at", null);

  if (options.signal !== undefined) query = query.abortSignal(options.signal);

  const { data, error } = await query.maybeSingle().overrideTypes<BlogPostRow | null, { merge: false }>();
  if (error) return adminErr(mapBlogPostError(error));

  return adminOk(data);
}

export async function createBlogPost(
  config: SupabaseConfig,
  input: BlogPostCreateInput,
  options: AdminRepositoryOptions = {},
): Promise<AdminRepositoryResult<BlogPostRow>> {
  if (config.kind === "disabled") return adminErr(supabaseDisabledFailure(config));

  let query = config.client
    .from("blog_posts")
    .insert(blogPostInsertFromInput(input))
    .select(blogPostColumns);

  if (options.signal !== undefined) query = query.abortSignal(options.signal);

  const { data, error } = await query.single().overrideTypes<BlogPostRow | null, { merge: false }>();
  if (error) return adminErr(mapBlogPostError(error, input));

  return data === null ? adminErr(saveFailure()) : adminOk(data);
}

export async function updateBlogPost(
  config: SupabaseConfig,
  id: string,
  input: BlogPostUpdateInput,
  options: AdminRepositoryOptions = {},
): Promise<AdminRepositoryResult<BlogPostRow>> {
  if (config.kind === "disabled") return adminErr(supabaseDisabledFailure(config));

  let query = config.client
    .from("blog_posts")
    .update(blogPostUpdateFromInput(input))
    .eq("id", id)
    .is("deleted_at", null)
    .select(blogPostColumns);

  if (options.signal !== undefined) query = query.abortSignal(options.signal);

  const { data, error } = await query.single().overrideTypes<BlogPostRow | null, { merge: false }>();
  if (error) return adminErr(mapBlogPostError(error, input));

  return data === null ? adminErr(saveFailure()) : adminOk(data);
}

export async function deleteBlogPost(
  config: SupabaseConfig,
  id: string,
  options: AdminRepositoryOptions = {},
): Promise<AdminRepositoryResult<BlogPostRow>> {
  if (config.kind === "disabled") return adminErr(supabaseDisabledFailure(config));

  const update: BlogPostUpdate = { deleted_at: new Date().toISOString() };
  let query = config.client
    .from("blog_posts")
    .update(update)
    .eq("id", id)
    .is("deleted_at", null)
    .select(blogPostColumns);

  if (options.signal !== undefined) query = query.abortSignal(options.signal);

  const { data, error } = await query.single().overrideTypes<BlogPostRow | null, { merge: false }>();
  if (error) return adminErr(mapBlogPostError(error));

  return data === null ? adminErr(saveFailure()) : adminOk(data);
}
