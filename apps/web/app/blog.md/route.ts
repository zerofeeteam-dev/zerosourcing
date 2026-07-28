import { createBlogMarkdown } from "../../lib/seo/llms-content";
import { loadLlmsPublicContent } from "../../lib/seo/llms-public-content";
import { createLlmsResponse } from "../../lib/seo/llms-response";

export const revalidate = 3600;

export async function GET() {
  const content = await loadLlmsPublicContent();
  return createLlmsResponse(createBlogMarkdown(content), {
    canonicalPath: "/blog",
    format: "markdown",
    partial: content.unavailableSources?.includes("blog") ?? false,
  });
}
