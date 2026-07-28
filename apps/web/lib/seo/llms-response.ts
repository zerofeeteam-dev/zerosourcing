import { SITE_URL } from "../../app/site-metadata";

type LlmsResponseOptions = {
  readonly canonicalPath?: string;
  readonly format: "markdown" | "text";
  readonly partial?: boolean;
};

export function createLlmsResponse(
  content: string,
  { canonicalPath, format, partial = false }: LlmsResponseOptions,
): Response {
  const headers = new Headers({
    "Cache-Control": partial
      ? "no-store"
      : "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    "Content-Language": "ko",
    "Content-Type":
      format === "markdown"
        ? "text/markdown; charset=utf-8"
        : "text/plain; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });

  if (canonicalPath) {
    headers.set(
      "Link",
      `<${new URL(canonicalPath, `${SITE_URL}/`).toString()}>; rel="canonical"`,
    );
    headers.set("X-Robots-Tag", "noindex, follow");
  }
  if (partial) headers.set("X-Llms-Content-Status", "partial");

  return new Response(content, { headers });
}
