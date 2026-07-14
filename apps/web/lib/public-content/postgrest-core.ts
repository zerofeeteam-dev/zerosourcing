export const PUBLIC_CONTENT_PAGE_SIZE = 1_000;
export const PUBLIC_CONTENT_MAX_PAGES = 100;
export const PUBLIC_CONTENT_MAX_ROWS =
  PUBLIC_CONTENT_PAGE_SIZE * PUBLIC_CONTENT_MAX_PAGES;

export type PublicTable = "blog_posts" | "portfolios";

export type PublicContentConfig = {
  readonly publishableKey: string;
  readonly url: string;
};

export type PublicContentReadInput = {
  readonly query: Readonly<Record<string, string>>;
  readonly table: PublicTable;
};

export class PublicContentNetworkError extends Error {
  readonly name = "PublicContentNetworkError";

  constructor(
    readonly table: PublicTable,
    cause: unknown,
  ) {
    super(`Public content request for ${table} could not be completed.`, {
      cause,
    });
  }
}

export class PublicContentRequestError extends Error {
  readonly name = "PublicContentRequestError";

  constructor(
    readonly status: number,
    readonly table: PublicTable,
  ) {
    super(`Public content request failed with status ${status}.`);
  }
}

export type PublicContentResponseFailure = "invalid-json" | "non-array";

export class PublicContentResponseError extends Error {
  readonly name = "PublicContentResponseError";

  constructor(
    readonly failure: PublicContentResponseFailure,
    readonly table: PublicTable,
    cause?: unknown,
  ) {
    super(
      failure === "non-array"
        ? "Public content response must be an array."
        : "Public content response must be valid JSON.",
      cause === undefined ? undefined : { cause },
    );
  }
}

export class PublicContentPageSizeError extends Error {
  readonly name = "PublicContentPageSizeError";

  constructor(readonly receivedRows: number) {
    super(
      `Public content page exceeded the ${PUBLIC_CONTENT_PAGE_SIZE} row page size.`,
    );
  }
}

export class PublicContentRowLimitError extends Error {
  readonly name = "PublicContentRowLimitError";

  constructor(readonly maximumRows = PUBLIC_CONTENT_MAX_ROWS) {
    super(`Public content exceeded the ${maximumRows} row safety bound.`);
  }
}

type PublicContentReadWithConfigInput = PublicContentReadInput & {
  readonly config: PublicContentConfig;
};

export async function fetchPublicRowsWithConfig({
  config,
  query,
  table,
}: PublicContentReadWithConfigInput): Promise<readonly unknown[]> {
  const endpoint = new URL(`/rest/v1/${table}`, config.url);
  endpoint.search = new URLSearchParams(query).toString();

  let response: Response;
  try {
    response = await fetch(endpoint, {
      cache: "no-store",
      headers: { apikey: config.publishableKey },
    });
  } catch (cause) {
    throw new PublicContentNetworkError(table, cause);
  }

  if (!response.ok) {
    throw new PublicContentRequestError(response.status, table);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (cause) {
    throw new PublicContentResponseError("invalid-json", table, cause);
  }

  if (!Array.isArray(payload)) {
    throw new PublicContentResponseError("non-array", table);
  }

  return payload;
}

export async function fetchAllPublicRowsWithConfig({
  config,
  query,
  table,
}: PublicContentReadWithConfigInput): Promise<readonly unknown[]> {
  const allRows: unknown[] = [];

  for (let page = 0; page < PUBLIC_CONTENT_MAX_PAGES; page += 1) {
    const rows = await fetchPublicRowsWithConfig({
      config,
      query: {
        ...query,
        limit: String(PUBLIC_CONTENT_PAGE_SIZE),
        offset: String(page * PUBLIC_CONTENT_PAGE_SIZE),
      },
      table,
    });

    if (rows.length > PUBLIC_CONTENT_PAGE_SIZE) {
      throw new PublicContentPageSizeError(rows.length);
    }

    allRows.push(...rows);
    if (rows.length < PUBLIC_CONTENT_PAGE_SIZE) {
      return allRows;
    }
  }

  throw new PublicContentRowLimitError();
}
