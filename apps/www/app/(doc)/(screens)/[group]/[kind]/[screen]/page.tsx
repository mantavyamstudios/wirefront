import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ComponentPageDocs } from "@/components/blocks/blocks-docs";
import { ScreenReference } from "@/components/screens/screen-reference";
import { screenSocialMetadata } from "@/lib/og/screen-social-metadata";
import { getScreenDetails, getScreenPage } from "@/lib/screens/data";
import { getScreenDoc } from "@/lib/screens/docs";
import { getPageAlternates } from "@/lib/site";
import { getMDXComponents } from "@/mdx-components";

interface PageProps {
  params: Promise<{ group: string; kind: string; screen: string }>;
}

export const dynamicParams = false;

const detailFor = (group: string, kind: string, screen: string) =>
  getScreenDetails().find((d) => d.groupSlug === group && d.kindSlug === kind && d.screenSlug === screen);

/**
 * Docs column only. The header, sidebar and live screen preview come from
 * the persistent screens layout (`ScreensDetailFrame`).
 */
export default async function ScreenPage(props: PageProps) {
  const { group, kind, screen } = await props.params;
  const page = getScreenPage(group, kind, screen);
  const detail = detailFor(group, kind, screen);
  if (!(page && detail)) {
    notFound();
  }

  const MDXContent = page.data.body;

  return (
    <ComponentPageDocs>
      <MDXContent components={getMDXComponents()} />
      <ScreenReference detail={detail} doc={getScreenDoc(detail.registry)} />
    </ComponentPageDocs>
  );
}

export function generateStaticParams() {
  return getScreenDetails().map((d) => ({ group: d.groupSlug, kind: d.kindSlug, screen: d.screenSlug }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { group, kind, screen } = await props.params;
  const detail = detailFor(group, kind, screen);
  if (!detail) {
    return {};
  }
  return {
    title: `${detail.header.title} · ${detail.header.collection}`,
    description: detail.header.description,
    alternates: getPageAlternates(detail.href),
    ...screenSocialMetadata(["screens", group, kind, screen], detail.header.title, detail.header.description, detail.href),
  };
}
