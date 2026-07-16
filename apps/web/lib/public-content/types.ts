import type {
  ContentAuthoringMode,
  ContentOutputMode,
} from "@repo/content/types";

export type PortfolioType = "application" | "company_homepage" | "mvp";

export type BlogType = "application" | "company_homepage" | "insight" | "mvp";

export type PortfolioCard = {
  readonly category: string;
  readonly description: string;
  readonly duration: string;
  readonly estimate: string;
  readonly features: readonly string[];
  readonly landingPublished: boolean;
  readonly scope: readonly string[];
  readonly servicePublished: boolean;
  readonly slug: string;
  readonly thumbnailAlt: string;
  readonly thumbnailUrl: string | null;
  readonly title: string;
  readonly type: PortfolioType;
  readonly updatedAt: string;
};

export type PortfolioDetail = PortfolioCard & {
  readonly assetBaseEnabled: boolean;
  readonly assetScope: string;
  readonly bannerAlt: string;
  readonly bannerUrl: string | null;
  readonly content: string;
  readonly contentAuthoringMode: ContentAuthoringMode;
  readonly contentMode: ContentOutputMode;
  readonly seoDescription: string;
};

export type BlogCard = {
  readonly bannerAlt: string;
  readonly bannerPublished: boolean;
  readonly bannerUrl: string | null;
  readonly category: string;
  readonly date: string;
  readonly landingPublished: boolean;
  readonly slug: string;
  readonly summary: string;
  readonly thumbnailAlt: string;
  readonly thumbnailUrl: string | null;
  readonly title: string;
  readonly type: BlogType;
  readonly updatedAt: string;
};

export type BlogDetail = BlogCard & {
  readonly assetBaseEnabled: boolean;
  readonly assetScope: string;
  readonly author: "제로소싱";
  readonly content: string;
  readonly contentAuthoringMode: ContentAuthoringMode;
  readonly contentMode: ContentOutputMode;
  readonly seoDescription: string;
};
