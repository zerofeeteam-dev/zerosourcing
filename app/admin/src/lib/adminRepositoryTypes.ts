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

export const portfolioTypes = ["application", "company_homepage", "mvp"] as const;
export type PortfolioType = (typeof portfolioTypes)[number];

export const contentModes = ["html", "text"] as const;
export type ContentMode = (typeof contentModes)[number];

export type PortfolioRow = {
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
  readonly content_mode: ContentMode;
  readonly content: string;
  readonly seo_description: string;
  readonly landing_published: boolean;
  readonly service_published: boolean;
  readonly landing_sections: AdminJson;
  readonly service_sections: AdminJson;
  readonly created_at: string;
  readonly updated_at: string;
  readonly deleted_at: string | null;
};

export type PortfolioCreateInput = {
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
  readonly contentMode: ContentMode;
  readonly content: string;
  readonly seoDescription: string;
  readonly landingPublished: boolean;
  readonly servicePublished: boolean;
  readonly landingSections: AdminJson;
  readonly serviceSections: AdminJson;
};

export type PortfolioUpdateInput = Partial<PortfolioCreateInput>;

export const blogPostStatuses = ["draft", "published"] as const;
export type BlogPostStatus = (typeof blogPostStatuses)[number];

export const blogPostTypes = ["insight", "mvp", "application", "company_homepage"] as const;
export type BlogPostType = (typeof blogPostTypes)[number];

export type BlogPostRow = {
  readonly id: string;
  readonly status: BlogPostStatus;
  readonly type: BlogPostType;
  readonly slug: string;
  readonly title: string;
  readonly published_date: string | null;
  readonly thumbnail_path: string | null;
  readonly thumbnail_public_url: string | null;
  readonly thumbnail_alt: string;
  readonly content_mode: ContentMode;
  readonly content: string;
  readonly seo_description: string;
  readonly landing_published: boolean;
  readonly banner_published: boolean;
  readonly landing_sections: AdminJson;
  readonly banner_sections: AdminJson;
  readonly created_at: string;
  readonly updated_at: string;
  readonly deleted_at: string | null;
};

export type BlogPostCreateInput = {
  readonly status: BlogPostStatus;
  readonly type: BlogPostType;
  readonly slug: AdminSlug;
  readonly title: string;
  readonly publishedDate: string | null;
  readonly thumbnailPath: string | null;
  readonly thumbnailPublicUrl: string | null;
  readonly thumbnailAlt: string;
  readonly contentMode: ContentMode;
  readonly content: string;
  readonly seoDescription: string;
  readonly landingPublished: boolean;
  readonly bannerPublished: boolean;
  readonly landingSections: AdminJson;
  readonly bannerSections: AdminJson;
};

export type BlogPostUpdateInput = Partial<BlogPostCreateInput>;
