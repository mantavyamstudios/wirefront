import type { InferPageType } from "fumadocs-core/source";

import type { source } from "@/lib/docs/source";
import type { screensSource } from "@/lib/screens/source";

type LLMPage =
  | InferPageType<typeof source>
  | InferPageType<typeof screensSource>;

const FRONTMATTER_RE = /^---[\s\S]*?---\s*/u;
const TITLE_RE = /^title:\s*["']?(?<title>[^"'\n]+)["']?/mu;

export const getLLMText = async (page: LLMPage) => {
  let processed = "";
  let raw = "";

  try {
    processed = await page.data.getText("processed");
  } catch {
    raw = await page.data.getText("raw");
    processed = raw.replace(FRONTMATTER_RE, "");
  }

  const title =
    page.data.title ||
    (raw ? raw.match(TITLE_RE)?.groups?.title : undefined) ||
    "Document";
  return `# ${title} (${page.url})

${processed}`;
};
