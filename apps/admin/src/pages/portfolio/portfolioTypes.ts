import type {
  AdminJson,
  ContentMode,
  PortfolioCreateInput,
  PortfolioStatus,
  PortfolioType,
} from "../../lib/adminRepositoryTypes";
import type { AdminRoute } from "../../lib/router";

export type PortfolioAdminPageProps = {
  readonly onNavigate: (path: string) => void;
  readonly route: AdminRoute;
};

export type PortfolioFormRoute = Extract<
  AdminRoute,
  { readonly id: "portfolioDetail" | "portfolioNew" }
>;

export type PortfolioFieldKey =
  | "companyName"
  | "landingSections"
  | "serviceSections"
  | "slug"
  | "title"
  | "type";
export type PortfolioFormErrors = Partial<Record<PortfolioFieldKey, string>>;

export type PortfolioFormState = {
  readonly companyName: string;
  readonly content: string;
  readonly contentMode: ContentMode;
  readonly coreFeatures: readonly string[];
  readonly developmentPeriod: string;
  readonly estimateLabel: string;
  readonly landingPublished: boolean;
  readonly landingSections: string;
  readonly productDescription: string;
  readonly seoDescription: string;
  readonly servicePublished: boolean;
  readonly serviceSections: string;
  readonly slug: string;
  readonly status: PortfolioStatus;
  readonly title: string;
  readonly type: PortfolioType | "";
  readonly workScopes: readonly string[];
};

export type PortfolioFilterValue<TValue extends string> = TValue | "all";

export type PortfolioInputBuildResult = {
  readonly errors: PortfolioFormErrors;
  readonly input?: PortfolioCreateInput;
};

export type PortfolioJsonParseResult =
  | { readonly ok: true; readonly value: AdminJson }
  | {
      readonly error: string;
      readonly field: PortfolioFieldKey;
      readonly ok: false;
    };
