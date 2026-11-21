import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

import { getScreenDetails } from "@/lib/screens/data";
import { getScreenSourceFiles } from "@/lib/screens/source-files";

/** Static export (Cloudflare Workers static assets): render once at build time. */
export const dynamic = "force-static";

interface RouteContext {
  params: Promise<{ kind: string; screen: string }>;
}

/** Highlighted source of one screen (the files the registry installs), prerendered at build time. */
export const GET = async (_request: Request, { params }: RouteContext) => {
  const { kind, screen } = await params;
  const files = await getScreenSourceFiles(kind, screen);
  if (!files) {
    notFound();
  }
  return NextResponse.json({ files });
};

export const generateStaticParams = () =>
  getScreenDetails().map((d) => ({
    kind: d.kindSlug,
    screen: d.screenSlug,
  }));
