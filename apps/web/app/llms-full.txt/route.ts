import { createLlmsFullMarkdown } from "../../lib/seo/llms-content";
import { loadLlmsPublicContent } from "../../lib/seo/llms-public-content";
import { createLlmsResponse } from "../../lib/seo/llms-response";

export const revalidate = 3600;

export async function GET() {
  const content = await loadLlmsPublicContent();
  return createLlmsResponse(createLlmsFullMarkdown(content), {
    format: "text",
    partial: (content.unavailableSources?.length ?? 0) > 0,
  });
}
