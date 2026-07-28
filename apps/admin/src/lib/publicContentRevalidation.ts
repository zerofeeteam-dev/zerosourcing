import { parseAllowedAssetHttpUrl } from "@repo/content/asset-url";

import type { SupabaseConfig } from "./supabase";

const productionPublicSiteUrl = "https://www.zerosourcing.kr";
const localPublicSiteUrl = "http://localhost:3000";

export type PublicContentRevalidationInput = {
  readonly entity: "blog" | "portfolio";
  readonly previousSlug?: string;
  readonly slug?: string;
};

export type PublicContentRevalidationResult =
  | { readonly ok: true }
  | { readonly message: string; readonly ok: false };

type PublicContentRevalidationOptions = {
  readonly fetch?: typeof fetch;
  readonly publicSiteUrl?: string;
};

function configuredPublicSiteUrl(override?: string): URL | null {
  const configured =
    override ?? import.meta.env.VITE_PUBLIC_SITE_URL?.trim() ?? "";
  if (configured) {
    return parseAllowedAssetHttpUrl(configured);
  }

  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    return parseAllowedAssetHttpUrl(localPublicSiteUrl);
  }

  return parseAllowedAssetHttpUrl(productionPublicSiteUrl);
}

function failure(message: string): PublicContentRevalidationResult {
  return { message, ok: false };
}

export async function revalidatePublicContent(
  config: SupabaseConfig,
  input: PublicContentRevalidationInput,
  options: PublicContentRevalidationOptions = {},
): Promise<PublicContentRevalidationResult> {
  if (config.kind === "disabled") {
    return failure(config.message);
  }

  const sessionResult = await config.client.auth.getSession();
  if (sessionResult.error || !sessionResult.data.session?.access_token) {
    return failure(
      "관리자 세션을 확인하지 못해 공개 캐시를 갱신하지 못했습니다.",
    );
  }

  const publicSiteUrl = configuredPublicSiteUrl(options.publicSiteUrl);
  if (!publicSiteUrl) {
    return failure(
      "공개 사이트 주소가 올바르지 않아 캐시를 갱신하지 못했습니다.",
    );
  }
  const endpoint = new URL("/api/revalidate-public-content", publicSiteUrl);

  try {
    const response = await (options.fetch ?? fetch)(endpoint, {
      body: JSON.stringify(input),
      headers: {
        authorization: `Bearer ${sessionResult.data.session.access_token}`,
        "content-type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      return failure("공개 사이트 캐시를 즉시 갱신하지 못했습니다.");
    }
  } catch {
    return failure("네트워크 문제로 공개 사이트 캐시를 갱신하지 못했습니다.");
  }

  return { ok: true };
}
