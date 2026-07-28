import { createServiceMarkdown } from "../../../lib/seo/llms-content";
import { createLlmsResponse } from "../../../lib/seo/llms-response";

export const dynamic = "force-static";

export function GET() {
  return createLlmsResponse(createServiceMarkdown("companyHomepage"), {
    canonicalPath: "/service/company-homepage",
    format: "markdown",
  });
}
