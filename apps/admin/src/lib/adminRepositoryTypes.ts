import {
  SUPPORTED_CONTENT_SCHEMA_VERSION,
  contentOutputModes,
  type ContentAuthoringMode,
  type ContentOutputMode,
  type TiptapDocument,
} from "@repo/content/types";
import type { AdminResult, AdminSlug } from "./adminTypes";
import type { AdminFailure } from "./adminErrors";

export type AdminRepositoryResult<TValue> = AdminResult<TValue, AdminFailure>;

export type AdminRepositoryOptions = {
  readonly signal?: AbortSignal;
};

export type AdminJson =
  | null
  | boolean
  | number
  | string
  | readonly AdminJson[]
  | { readonly [key: string]: AdminJson };

export const portfolioStatuses = ["draft", "published"] as const;
export type PortfolioStatus = (typeof portfolioStatuses)[number];

export const portfolioTypes = [
  "application",
  "company_homepage",
  "mvp",
  "web_service",
] as const;
export type PortfolioType = (typeof portfolioTypes)[number];

export const contentModes = contentOutputModes;
export type ContentMode = ContentOutputMode;

export type ManagedContentRow = {
  readonly content: string;
  readonly content_asset_base_enabled: boolean;
  readonly content_asset_scope: string;
  readonly content_authoring_mode: ContentAuthoringMode;
  readonly content_json: TiptapDocument | null;
  readonly content_mode: ContentMode;
  readonly content_schema_version: number;
  readonly content_source_backup: string | null;
  readonly published_at: string | null;
};

type ManagedContentInputBase = {
  readonly content: string;
  readonly contentAssetBaseEnabled: boolean;
  readonly contentAssetScope: string;
  readonly contentSchemaVersion: typeof SUPPORTED_CONTENT_SCHEMA_VERSION;
  readonly contentSourceBackup: string | null;
};

export type ManagedContentInput = ManagedContentInputBase &
  (
    | {
        readonly contentAuthoringMode: "raw_html";
        readonly contentJson: TiptapDocument | null;
        readonly contentMode: ContentMode;
      }
    | {
        readonly contentAuthoringMode: "wysiwyg";
        readonly contentJson: TiptapDocument;
        readonly contentMode: "html";
      }
  );

export type PortfolioRow = ManagedContentRow & {
  readonly banner_alt: string;
  readonly banner_path: string | null;
  readonly banner_public_url: string | null;
  readonly id: string;
  readonly status: PortfolioStatus;
  readonly type: PortfolioType;
  readonly slug: string;
  readonly title: string;
  readonly company_name: string;
  readonly product_description: string;
  readonly estimate_label: string;
  readonly development_period: string;
  readonly core_features: readonly string[];
  readonly work_scopes: readonly string[];
  readonly seo_description: string;
  readonly thumbnail_alt: string;
  readonly thumbnail_path: string | null;
  readonly thumbnail_public_url: string | null;
  readonly landing_published: boolean;
  readonly service_published: boolean;
  readonly landing_sections: AdminJson;
  readonly service_sections: AdminJson;
  readonly created_at: string;
  readonly updated_at: string;
  readonly deleted_at: string | null;
};

export type PortfolioCreateInput = ManagedContentInput & {
  readonly bannerAlt: string;
  readonly bannerPath: string | null;
  readonly bannerPublicUrl: string | null;
  readonly status: PortfolioStatus;
  readonly type: PortfolioType;
  readonly slug: AdminSlug;
  readonly title: string;
  readonly companyName: string;
  readonly productDescription: string;
  readonly estimateLabel: string;
  readonly developmentPeriod: string;
  readonly coreFeatures: readonly string[];
  readonly workScopes: readonly string[];
  readonly seoDescription: string;
  readonly thumbnailAlt: string;
  readonly thumbnailPath: string | null;
  readonly thumbnailPublicUrl: string | null;
  readonly landingPublished: boolean;
  readonly servicePublished: boolean;
  readonly landingSections: AdminJson;
  readonly serviceSections: AdminJson;
};

export type PortfolioUpdateInput = Partial<PortfolioCreateInput>;

export const blogPostStatuses = ["draft", "published"] as const;
export type BlogPostStatus = (typeof blogPostStatuses)[number];

export const blogPostTypes = [
  "insight",
  "mvp",
  "application",
  "company_homepage",
] as const;
export type BlogPostType = (typeof blogPostTypes)[number];

export type BlogPostRow = ManagedContentRow & {
  readonly banner_alt: string;
  readonly banner_path: string | null;
  readonly id: string;
  readonly status: BlogPostStatus;
  readonly type: BlogPostType;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly published_date: string | null;
  readonly thumbnail_path: string | null;
  readonly thumbnail_public_url: string | null;
  readonly thumbnail_alt: string;
  readonly seo_description: string;
  readonly landing_published: boolean;
  readonly banner_published: boolean;
  readonly banner_public_url: string | null;
  readonly landing_sections: AdminJson;
  readonly banner_sections: AdminJson;
  readonly created_at: string;
  readonly updated_at: string;
  readonly deleted_at: string | null;
};

export type BlogPostCreateInput = ManagedContentInput & {
  readonly bannerAlt: string;
  readonly bannerPath: string | null;
  readonly status: BlogPostStatus;
  readonly type: BlogPostType;
  readonly slug: AdminSlug;
  readonly title: string;
  readonly summary: string;
  readonly publishedDate: string | null;
  readonly thumbnailPath: string | null;
  readonly thumbnailPublicUrl: string | null;
  readonly thumbnailAlt: string;
  readonly seoDescription: string;
  readonly landingPublished: boolean;
  readonly bannerPublished: boolean;
  readonly bannerPublicUrl: string | null;
  readonly landingSections: AdminJson;
  readonly bannerSections: AdminJson;
};

export type BlogPostUpdateInput = Partial<BlogPostCreateInput>;
