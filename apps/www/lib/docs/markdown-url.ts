/**
 * Static markdown twin of a docs or screen page, served by the `(llms)` routes:
 * `/docs` → `/llms.mdx/index`, `/docs/installation` → `/llms.mdx/installation`,
 * `/accounts/pricing/three-tier` → `/llms-screens.mdx/accounts/pricing/three-tier`.
 */
export const getMarkdownUrl = (pageUrl: string): string => {
  if (!(pageUrl === "/docs" || pageUrl.startsWith("/docs/"))) {
    return `/llms-screens.mdx${pageUrl}`;
  }
  const docsPath = pageUrl.replace(/^\/docs/u, "");
  return `/llms.mdx${docsPath || "/index"}`;
};
