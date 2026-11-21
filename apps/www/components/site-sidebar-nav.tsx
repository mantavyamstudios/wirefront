"use client";

import { isActive } from "fumadocs-ui/utils/is-active";
import { SquareMenu } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";

import { baseOptions } from "@/app/layout.config";
import { useDocsPageNew } from "@/components/docs-sidebar/release-dates-context";
import { Separator } from "@/lib/docs/attach-separator";
import manifest from "@/lib/flows/flows.manifest.json";

/**
 * The one site navigation shown in both sidebars: the docs sidebar and the
 * mobile drawer on the flows pages. Each passes in its own primitives, which
 * share these props.
 */
export interface SiteSidebarPrimitives {
  Group: ComponentType<{
    children: ReactNode;
    defaultOpen?: boolean;
    label: ReactNode;
  }>;
  Item: ComponentType<{
    external?: boolean;
    href: string;
    isActive: boolean;
    isNew?: boolean;
    itemKey?: string;
    label: ReactNode;
    onClick?: () => void;
  }>;
  Section: ComponentType<{
    children: ReactNode;
    className?: string;
    label?: ReactNode;
  }>;
}

interface GuideLink {
  external?: boolean;
  text: string;
  url: string;
}

interface GuideSeparator {
  icon?: ReactNode;
  name: string;
  type: "separator";
}

const guideLinks = (baseOptions.links ?? []) as (GuideLink | GuideSeparator)[];
const guideSeparator = guideLinks.find(
  (link): link is GuideSeparator => "type" in link && link.type === "separator"
);
/** Guide pages come from `baseOptions.links`, which also drives the pager. */
const GUIDE_ITEMS = guideLinks.filter(
  (link): link is GuideLink => "url" in link
);

/** Pages outside the guide, listed under "Menu" after the flows. */
const MENU_PAGES = [
  { title: "Contact", url: "/docs/contact" },
  { title: "Pricing", url: "/pricing" },
  { title: "Privacy Policy", url: "/legal/privacy" },
  { title: "Terms of Service", url: "/legal/terms" },
];

function GuideItem({
  item,
  Item,
  onNavigate,
}: {
  item: GuideLink;
  Item: SiteSidebarPrimitives["Item"];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isNew = useDocsPageNew(item.external ? undefined : item.url);
  return (
    <Item
      external={item.external}
      href={item.url}
      isActive={!item.external && isActive(item.url, pathname, false)}
      isNew={isNew}
      label={item.text}
      onClick={item.external ? undefined : onNavigate}
    />
  );
}

export function SiteSidebarNav({
  components: { Group, Item, Section },
  onNavigate,
}: {
  components: SiteSidebarPrimitives;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <Section>
        <Item
          href="/"
          isActive={pathname === "/"}
          itemKey="nav-home"
          label="Home"
          onClick={onNavigate}
        />
      </Section>

      <Section
        className="mt-4"
        label={
          <Separator
            icon={guideSeparator?.icon}
            name={guideSeparator?.name ?? "Guide"}
          />
        }
      >
        {GUIDE_ITEMS.map((item) => (
          <GuideItem
            item={item}
            Item={Item}
            key={item.url}
            onNavigate={onNavigate}
          />
        ))}
      </Section>

      <Section
        className="mt-4"
        label={<Separator icon={<SquareMenu strokeWidth={2} />} name="Menu" />}
      >
        <Group defaultOpen label="Flows">
          <Item
            href="/flows"
            isActive={pathname === "/flows"}
            itemKey="nav-flows"
            label="All Flows"
            onClick={onNavigate}
          />
          {manifest.categories.map((category) => (
            <Item
              href={`/flows#${category.slug}`}
              isActive={false}
              itemKey={`nav-flows-${category.slug}`}
              key={category.slug}
              label={category.title}
              onClick={onNavigate}
            />
          ))}
        </Group>
        {MENU_PAGES.map((page) => (
          <Item
            href={page.url}
            isActive={pathname === page.url}
            itemKey={`nav-${page.url}`}
            key={page.url}
            label={page.title}
            onClick={onNavigate}
          />
        ))}
      </Section>
    </>
  );
}
