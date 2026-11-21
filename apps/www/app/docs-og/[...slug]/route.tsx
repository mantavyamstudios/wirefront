import { notFound } from "next/navigation";

import { source } from "@/lib/docs/source";
import { flowsSource } from "@/lib/flows/source";
import { getCachedOgImageBuffer } from "@/lib/og/og-docs";

/** Static export (Cloudflare Pages): render once at build time. */
export const dynamic = "force-static";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const pageSlug = slug.slice(0, -1);
  const buffer = await getCachedOgImageBuffer(pageSlug);

  if (!buffer) {
    notFound();
  }

  return new Response(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export function generateStaticParams(): {
  slug: string[];
}[] {
  return [
    { slug: ["image.png"] },
    { slug: ["flows", "image.png"] },
    ...source
      .generateParams()
      .map((page) => ({ slug: [...page.slug, "image.png"] })),
    ...flowsSource
      .generateParams()
      .map((page) => ({ slug: ["flows", ...page.slug, "image.png"] })),
  ];
}
