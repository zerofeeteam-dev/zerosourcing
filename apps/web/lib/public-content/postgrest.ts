import "server-only";

import { getPublicContentConfig } from "./config";
import {
  fetchAllPublicRowsWithConfig,
  fetchPublicRowsWithConfig,
  type PublicContentReadInput,
} from "./postgrest-core";

export function fetchPublicRows(
  input: PublicContentReadInput,
): Promise<readonly unknown[]> {
  return fetchPublicRowsWithConfig({
    ...input,
    config: getPublicContentConfig(),
  });
}

export function fetchAllPublicRows(
  input: PublicContentReadInput,
): Promise<readonly unknown[]> {
  return fetchAllPublicRowsWithConfig({
    ...input,
    config: getPublicContentConfig(),
  });
}
