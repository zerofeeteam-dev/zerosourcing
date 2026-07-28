import { createAboutMarkdown } from "../../lib/seo/llms-content";
import { createLlmsResponse } from "../../lib/seo/llms-response";

export const dynamic = "force-static";

export function GET() {
  return createLlmsResponse(createAboutMarkdown(), {
    canonicalPath: "/about",
    format: "markdown",
  });
}
