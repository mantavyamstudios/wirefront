import { SITE_URL } from "@/lib/site";

/** Static export (Cloudflare Pages): render once at build time. */
export const dynamic = "force-static";

const DISALLOWED_PATHS = ["/api/", "/runtime/", "/static.json"];

const getRobotsContent = async () => {
  const lines = [
    "User-Agent: *",
    "Allow: /",
    ...DISALLOWED_PATHS.map((path) => `Disallow: ${path}`),
    // Content Signals (https://contentsignals.org): machine-readable
    // crawler-use preferences, layered on top of Allow/Disallow. This site
    // ships llms.txt/llms-full.txt so AI agents can read it.
    "Content-Signal: search=yes, ai-input=yes, ai-train=yes",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
  ];

  return await Promise.resolve(lines.join("\n"));
};

export const GET = async () => {
  const content = await getRobotsContent();

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
