import type { BlogPostCreateInput, BlogPostStatus, BlogPostType, ContentMode } from "../../lib/adminRepositoryTypes";
import type { AdminThumbnailFile } from "../../lib/adminTypes";
import type { AdminRoute } from "../../lib/router";

export type BlogAdminPageProps = {
  readonly onNavigate: (path: string) => void;
  readonly route: AdminRoute;
};

export type BlogFormRoute = Extract<AdminRoute, { readonly id: "blogDetail" | "blogNew" }>;
export type LoadState = "idle" | "loading" | "ready";
export type StatusFilter = BlogPostStatus | "all";
export type TypeFilter = BlogPostType | "all";

export type BlogFormState = {
  readonly bannerPublished: boolean;
  readonly bannerSections: string;
  readonly content: string;
  readonly contentMode: ContentMode;
  readonly landingPublished: boolean;
  readonly landingSections: string;
  readonly publishedDate: string;
  readonly seoDescription: string;
  readonly slug: string;
  readonly status: BlogPostStatus;
  readonly thumbnailAlt: string;
  readonly title: string;
  readonly type: BlogPostType | "";
};

export type BlogFieldErrors = Partial<Record<keyof BlogFormState | "thumbnail", string>>;
export type BlogFieldChange = <Key extends keyof BlogFormState>(key: Key, value: BlogFormState[Key]) => void;

export type BlogParsedInput = Omit<BlogPostCreateInput, "thumbnailPath" | "thumbnailPublicUrl">;

export type BlogValidationResult =
  | { readonly ok: true; readonly value: BlogParsedInput }
  | { readonly fields: BlogFieldErrors; readonly message: string; readonly ok: false };

export type BlogThumbnailSelection = {
  readonly previewUrl?: string;
  readonly removed: boolean;
  readonly selected?: AdminThumbnailFile;
};
