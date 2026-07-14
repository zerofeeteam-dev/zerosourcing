import type { BlogPostCreateInput, BlogPostStatus, BlogPostType } from "../../lib/adminRepositoryTypes";
import type { ManagedContentFormValue } from "../../lib/managedContent";
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

export type BlogFormState = ManagedContentFormValue & {
  readonly bannerPublished: boolean;
  readonly bannerSections: string;
  readonly landingPublished: boolean;
  readonly landingSections: string;
  readonly publishedDate: string;
  readonly seoDescription: string;
  readonly slug: string;
  readonly status: BlogPostStatus;
  readonly summary: string;
  readonly thumbnailAlt: string;
  readonly title: string;
  readonly type: BlogPostType | "";
};

export type BlogFieldErrors = Partial<Record<keyof BlogFormState | "thumbnail", string>>;
export type BlogFieldChange = <Key extends keyof BlogFormState>(key: Key, value: BlogFormState[Key]) => void;

type DistributiveOmit<TValue, TKey extends PropertyKey> = TValue extends unknown
  ? Omit<TValue, TKey>
  : never;

export type BlogParsedInput = DistributiveOmit<
  BlogPostCreateInput,
  "thumbnailPath" | "thumbnailPublicUrl"
>;

export type BlogValidationResult =
  | { readonly ok: true; readonly value: BlogParsedInput }
  | { readonly fields: BlogFieldErrors; readonly message: string; readonly ok: false };

export type BlogThumbnailSelection = {
  readonly previewUrl?: string;
  readonly removed: boolean;
  readonly selected?: AdminThumbnailFile;
};
