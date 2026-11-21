import type { InferPageType } from "fumadocs-core/source";

import type { source } from "@/lib/docs/source";
import type { screensSource } from "@/lib/screens/source";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

type LlmsIndexPage =
  | InferPageType<typeof source>
  | InferPageType<typeof screensSource>;

const formatPageLine = (page: LlmsIndexPage): string => {
  const description = page.data.description?.trim();
  const suffix = description ? `: ${description}` : "";
  const title = page.data.title || page.slugs.at(-1) || "Documentation";
  return `- [${title}](${SITE_URL}${page.url})${suffix}`;
};

/** Build `llms.txt`: docs and every screen, plus the markdown exports. */
export const buildLlmsIndex = (
  docsPages: InferPageType<typeof source>[],
  screenPages: InferPageType<typeof screensSource>[]
): string =>
  [
    `# ${SITE_NAME}`,
    `> ${SITE_DESCRIPTION}`,
    "",
    "## Documentation",
    ...docsPages.map(formatPageLine),
    "",
    "## Screens",
    ...screenPages.map(formatPageLine),
    "",
    "## LLM exports",
    `- [llms-full.txt](${SITE_URL}/llms-full.txt): every docs and screen page as markdown`,
    `- Markdown of any page: \`${SITE_URL}/llms.mdx/<docs-page>\` for docs (e.g. \`${SITE_URL}/llms.mdx/installation\`) and \`${SITE_URL}/llms-screens.mdx/<group>/<kind>/<screen>\` for screens`,
  ].join("\n");
