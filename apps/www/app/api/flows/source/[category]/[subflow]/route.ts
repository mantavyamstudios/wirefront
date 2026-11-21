import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

import { getFlowDetails } from "@/lib/flows/data";
import { getFlowSourceFiles } from "@/lib/flows/source-files";

/** Static export (Cloudflare Pages): render once at build time. */
export const dynamic = "force-static";

interface RouteContext {
  params: Promise<{ category: string; subflow: string }>;
}

async function getFiles(category: string, subflow: string) {
  return await getFlowSourceFiles(category, subflow);
}

/** Highlighted Dart source of one subflow, prerendered at build time. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { category, subflow } = await params;
  const files = await getFiles(category, subflow);
  if (!files) {
    notFound();
  }
  return NextResponse.json({ files });
}

export function generateStaticParams() {
  return getFlowDetails().map((detail) => ({
    category: detail.categorySlug,
    subflow: detail.subflowSlug,
  }));
}
