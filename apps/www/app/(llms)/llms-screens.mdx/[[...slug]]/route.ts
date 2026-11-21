import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getLLMText } from "@/lib/docs/get-llm-text";
import manifestJson from "@/lib/screens/screens.manifest.json";
import { getScreenDoc, screenReferenceMarkdown } from "@/lib/screens/docs";
import { screensSource } from "@/lib/screens/source";
import { SITE_URL } from "@/lib/site";

type Manifest = {
  groups: { slug: string; kinds: { slug: string; screens: { slug: string; registry: string; states: string[] }[] }[] }[];
};

/** The screen at group/kind/screen, from the screens manifest. */
function screenAt(slugs: string[]) {
  const [group, kind, screen] = slugs;
  return (manifestJson as Manifest).groups
    .find((g) => g.slug === group)
    ?.kinds.find((k) => k.slug === kind)
    ?.screens.find((s) => s.slug === screen);
}

/** Static export (Cloudflare Pages): render once at build time. */
export const dynamic = "force-static";

async function getLLMContentForSlug(slug?: string[]) {
  let normalizedSlug = slug;
  if (normalizedSlug && normalizedSlug.at(-1) === "index") {
    const trimmed = normalizedSlug.slice(0, -1);
    normalizedSlug = trimmed.length > 0 ? trimmed : undefined;
  }
  const page = screensSource.getPage(normalizedSlug);
  if (!page) {
    return null;
  }
  const text = await getLLMText(page);
  const screen = screenAt(page.slugs);
  if (!screen) {
    return text;
  }
  const reference = screenReferenceMarkdown(
    getScreenDoc(screen.registry),
    screen.states,
    `${SITE_URL}/r/${screen.registry}.json`
  );
  return `${text.trimEnd()}

${reference}`;
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
  return screensSource.getPages().map((page) => ({ slug: page.slugs }));
}
