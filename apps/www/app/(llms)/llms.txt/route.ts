import { buildLlmsIndex } from "@/lib/docs/llms-index";
import { source } from "@/lib/docs/source";
import { flowsSource } from "@/lib/flows/source";

/** Static export (Cloudflare Pages): render once at build time. */
export const dynamic = "force-static";

async function getLlmsIndexContent() {
  return await Promise.resolve(
    buildLlmsIndex(source.getPages(), flowsSource.getPages())
  );
}

export async function GET() {
  const content = await getLlmsIndexContent();

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
