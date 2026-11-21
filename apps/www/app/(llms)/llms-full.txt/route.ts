import { getLLMText } from "@/lib/docs/get-llm-text";
import { source } from "@/lib/docs/source";
import { screensSource } from "@/lib/screens/source";

/** Static export (Cloudflare Pages): render once at build time. */
export const dynamic = "force-static";

async function getLLMsContent() {
  const pages = [...source.getPages(), ...screensSource.getPages()];
  const scanned = await Promise.all(pages.map(getLLMText));
  return await Promise.resolve(scanned.join("\n\n"));
}

export async function GET() {
  const content = await getLLMsContent();

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
