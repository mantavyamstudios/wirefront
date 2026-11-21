import { NextResponse } from "next/server";

import { getCachedStaticPageDocuments } from "@/lib/docs/search-index";

/** Static export (Cloudflare Pages): render once at build time. */
export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const results = await getCachedStaticPageDocuments();
  return NextResponse.json(results);
}
