/**
 * Static markdown twin of a docs or flow page, served by the `(llms)` routes:
 * `/docs` → `/llms.mdx/index`, `/docs/installation` → `/llms.mdx/installation`,
 * `/flows/social/calling` → `/llms-flows.mdx/social/calling`.
 */
export function getMarkdownUrl(pageUrl: string): string {
  if (pageUrl.startsWith("/flows/")) {
    return `/llms-flows.mdx${pageUrl.slice("/flows".length)}`;
  }
  const docsPath = pageUrl.replace(/^\/docs/, "");
  return `/llms.mdx${docsPath || "/index"}`;
}
