import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getLLMText } from "@/lib/docs/get-llm-text";
import { flowsSource } from "@/lib/flows/source";

/** Static export (Cloudflare Pages): render once at build time. */
export const dynamic = "force-static";

async function getLLMContentForSlug(slug?: string[]) {
  let normalizedSlug = slug;
  if (normalizedSlug && normalizedSlug.at(-1) === "index") {
    const trimmed = normalizedSlug.slice(0, -1);
    normalizedSlug = trimmed.length > 0 ? trimmed : undefined;
  }
  const page = flowsSource.getPage(normalizedSlug);
  if (!page) {
    return null;
  }
  return await getLLMText(page);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;
  const content = await getLLMContentForSlug(slug);
  if (!content) {
    notFound();
  }

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}

export function generateStaticParams() {
  return flowsSource.getPages().map((page) => ({ slug: page.slugs }));
}
