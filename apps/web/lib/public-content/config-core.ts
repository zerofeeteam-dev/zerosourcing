import {
  createContentAssetBaseUrl,
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

function isIpv4Loopback(hostname: string): boolean {
  const octets = hostname.split(".");
  return (
    octets.length === 4 &&
    octets[0] === "127" &&
    octets.every((octet) => /^\d{1,3}$/u.test(octet) && Number(octet) <= 255)
  );
}

function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "::1" ||
    normalized === "[::1]" ||
    isIpv4Loopback(normalized)
  );
}

function isAllowedSupabaseUrl(url: URL): boolean {
  return (
    url.hostname.length > 0 &&
    (url.protocol === "https:" ||
      (url.protocol === "http:" && isLoopbackHostname(url.hostname)))
  );
}

export function parsePublicContentConfig(
  environment: Readonly<Record<string, string | undefined>>,
): PublicContentConfig {
  const rawUrl = environment.SUPABASE_URL?.trim() ?? "";
  const publishableKey = environment.SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new PublicContentConfigError();
  }

  if (!publishableKey || !isAllowedSupabaseUrl(url)) {
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
