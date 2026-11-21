import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ComponentPageDocs } from "@/components/blocks/blocks-docs";
import { FlowFacts } from "@/components/flows/flow-facts";
import { getFlowDetails, getFlowPage } from "@/lib/flows/data";
import { flowSocialMetadata } from "@/lib/og/flow-social-metadata";
import { getPageAlternates } from "@/lib/site";
import { getMDXComponents } from "@/mdx-components";

interface PageProps {
  params: Promise<{ category: string; subflow: string }>;
}

/**
 * Docs column only. The header, sidebar and live Flutter preview come from
 * the persistent `/flows` layout (`FlowsDetailFrame`).
 */
export default async function FlowPage(props: PageProps) {
  const { category, subflow } = await props.params;
  const page = getFlowPage(category, subflow);
  const detail = getFlowDetails().find(
    (item) => item.categorySlug === category && item.subflowSlug === subflow
  );
  if (!(page && detail)) {
    notFound();
  }

  const MDXContent = page.data.body;

  return (
    <ComponentPageDocs>
      <MDXContent components={getMDXComponents()} />
      <FlowFacts detail={detail} />
    </ComponentPageDocs>
  );
}

export function generateStaticParams() {
  return getFlowDetails().map((detail) => ({
    category: detail.categorySlug,
    subflow: detail.subflowSlug,
  }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { category, subflow } = await props.params;
  const detail = getFlowDetails().find(
    (item) => item.categorySlug === category && item.subflowSlug === subflow
  );
  if (!detail) {
    return {};
  }
  return {
    title: `${detail.header.title} · ${detail.header.collection}`,
    description: detail.header.description,
    alternates: getPageAlternates(detail.href),
    ...flowSocialMetadata(
      ["flows", category, subflow],
      detail.header.title,
      detail.header.description,
      detail.href
    ),
  };
}
