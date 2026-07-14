import {
  createContentAssetBaseUrl,
  parseAllowedAssetHttpUrl,
  type ContentEntity,
} from "@repo/content/asset-url";
import type { PublicContentConfig } from "./postgrest-core";

const configurationErrorMessage =
  "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required for public content.";

export class PublicContentConfigError extends Error {
  readonly name = "PublicContentConfigError";

  constructor() {
    super(configurationErrorMessage);
  }
}

export function parsePublicContentConfig(
  environment: Readonly<Record<string, string | undefined>>,
): PublicContentConfig {
  const rawUrl = environment.SUPABASE_URL?.trim() ?? "";
  const publishableKey = environment.SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
  const url = parseAllowedAssetHttpUrl(rawUrl);

  if (!publishableKey || url === null) {
    throw new PublicContentConfigError();
  }

  return {
    publishableKey,
    url: url.origin,
  };
}

export function contentAssetBaseUrlWithConfig(
  config: PublicContentConfig,
  entity: ContentEntity,
  assetScope: string,
): string {
  const validatedConfig = parsePublicContentConfig({
    SUPABASE_PUBLISHABLE_KEY: config.publishableKey,
    SUPABASE_URL: config.url,
  });
  return createContentAssetBaseUrl({
    assetScope,
    entity,
    supabaseUrl: validatedConfig.url,
  });
}
