import "server-only";

import { type ContentEntity } from "@repo/content/asset-url";
import {
  contentAssetBaseUrlWithConfig,
  parsePublicContentConfig,
} from "./config-core";
import type { PublicContentConfig } from "./postgrest-core";

export function getPublicContentConfig(): PublicContentConfig {
  return parsePublicContentConfig(process.env);
}

export function contentAssetBaseUrl(
  entity: ContentEntity,
  assetScope: string,
): string {
  return contentAssetBaseUrlWithConfig(
    getPublicContentConfig(),
    entity,
    assetScope,
  );
}
