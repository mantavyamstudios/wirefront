import type { InferPageType } from "fumadocs-core/source";

import type { source } from "@/lib/docs/source";
import type { flowsSource } from "@/lib/flows/source";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

type LlmsIndexPage =
  | InferPageType<typeof source>
  | InferPageType<typeof flowsSource>;

function formatPageLine(page: LlmsIndexPage): string {
  const description = page.data.description?.trim();
  const suffix = description ? `: ${description}` : "";
  const title = page.data.title || page.slugs.at(-1) || "Documentation";
  return `- [${title}](${SITE_URL}${page.url})${suffix}`;
}

/** Build `llms.txt`: docs and every flow, plus the markdown exports. */
export function buildLlmsIndex(
  docsPages: InferPageType<typeof source>[],
  flowPages: InferPageType<typeof flowsSource>[]
): string {
  return [
    `# ${SITE_NAME}`,
    `> ${SITE_DESCRIPTION}`,
    "",
    "## Documentation",
    ...docsPages.map(formatPageLine),
    "",
    "## Flows",
    ...flowPages.map(formatPageLine),
    "",
    "## LLM exports",
    `- [llms-full.txt](${SITE_URL}/llms-full.txt): every docs and flow page as markdown`,
    `- Markdown of any page: \`${SITE_URL}/llms.mdx/<docs-page>\` for docs (e.g. \`${SITE_URL}/llms.mdx/installation\`) and \`${SITE_URL}/llms-flows.mdx/<category>/<flow>\` for flows`,
  ].join("\n");
}
