import { buildLlmsIndex } from "@/lib/docs/llms-index";
import { source } from "@/lib/docs/source";
import { screensSource } from "@/lib/screens/source";

/** Static export (Cloudflare Pages): render once at build time. */
export const dynamic = "force-static";

const getLlmsIndexContent = async () =>
  await Promise.resolve(
    buildLlmsIndex(source.getPages(), screensSource.getPages())
  );

export const GET = async () => {
  const content = await getLlmsIndexContent();

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
