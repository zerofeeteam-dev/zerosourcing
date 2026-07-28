import { revalidatePath, revalidateTag } from "next/cache";

import { getPublicContentConfig } from "../../../lib/public-content/config";
import {
  publicContentCacheTag,
  type PublicTable,
} from "../../../lib/public-content/postgrest-core";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
  "Access-Control-Allow-Origin": "*",
} as const;
const portfolioServicePaths = [
  "/service/app",
  "/service/company-homepage",
  "/service/mvp",
] as const;

type PublicContentEntity = "blog" | "portfolio";

type RevalidationRequest = {
  readonly entity: PublicContentEntity;
  readonly previousSlug?: string;
  readonly slug?: string;
};

function responseHeaders(): HeadersInit {
  return {
    ...corsHeaders,
    "Cache-Control": "no-store",
  };
}

function jsonResponse(body: unknown, status: number): Response {
  return Response.json(body, {
    headers: responseHeaders(),
    status,
  });
}

function validSlug(value: unknown): value is string {
  return typeof value === "string" && slugPattern.test(value);
}

function parseRevalidationRequest(value: unknown): RevalidationRequest | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.entity !== "blog" && candidate.entity !== "portfolio") {
    return null;
  }

  if (
    candidate.slug !== undefined &&
    candidate.slug !== null &&
    !validSlug(candidate.slug)
  ) {
    return null;
  }

  if (
    candidate.previousSlug !== undefined &&
    candidate.previousSlug !== null &&
    !validSlug(candidate.previousSlug)
  ) {
    return null;
  }

  return {
    entity: candidate.entity,
    ...(validSlug(candidate.slug) ? { slug: candidate.slug } : {}),
    ...(validSlug(candidate.previousSlug)
      ? { previousSlug: candidate.previousSlug }
      : {}),
  };
}

async function requestIsFromAdmin(request: Request): Promise<boolean> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return false;
  }

  const config = getPublicContentConfig();
  const endpoint = new URL("/rest/v1/rpc/current_user_is_admin", config.url);
  const response = await fetch(endpoint, {
    cache: "no-store",
    headers: {
      apikey: config.publishableKey,
      authorization,
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    return false;
  }

  return (await response.json()) === true;
}

function cacheConfiguration(entity: PublicContentEntity): {
  readonly indexPath: string;
  readonly table: PublicTable;
} {
  return entity === "blog"
    ? { indexPath: "/blog", table: "blog_posts" }
    : { indexPath: "/portfolio", table: "portfolios" };
}

export function OPTIONS(): Response {
  return new Response(null, {
    headers: responseHeaders(),
    status: 204,
  });
}

export async function POST(request: Request): Promise<Response> {
  let isAdmin: boolean;
  try {
    isAdmin = await requestIsFromAdmin(request);
  } catch {
    return jsonResponse({ revalidated: false }, 503);
  }

  if (!isAdmin) {
    return jsonResponse({ revalidated: false }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ revalidated: false }, 400);
  }

  const input = parseRevalidationRequest(body);
  if (!input) {
    return jsonResponse({ revalidated: false }, 400);
  }

  const { indexPath, table } = cacheConfiguration(input.entity);
  revalidateTag(publicContentCacheTag(table), { expire: 0 });
  revalidatePath("/");
  revalidatePath(indexPath);

  if (input.entity === "portfolio") {
    for (const servicePath of portfolioServicePaths) {
      revalidatePath(servicePath);
    }
  }

  for (const slug of new Set([input.slug, input.previousSlug])) {
    if (slug) {
      revalidatePath(`${indexPath}/${slug}`);
    }
  }

  return jsonResponse({ revalidated: true }, 200);
}
