"use client";

import { cn } from "@workspace/ui/lib/utils";
import type { PageTree } from "fumadocs-core/server";
import type { SidebarComponents } from "fumadocs-ui/components/layout/sidebar";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import type { DocsLayoutProps } from "fumadocs-ui/layouts/docs";
import { BaseLinkItem } from "fumadocs-ui/layouts/links";
import { getLinks } from "fumadocs-ui/layouts/shared";
import { useSidebar, useTreeContext, useTreePath } from "fumadocs-ui/provider";
import { isActive } from "fumadocs-ui/utils/is-active";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";

import { usePageTransition } from "@/components/page-transition/page-transition-provider";
import Link from "@/components/site-link";
import { SiteLogo } from "@/components/site-logo";
import { SiteSidebarNav } from "@/components/site-sidebar-nav";
import { ThemeSwitcher } from "@/components/theme-switcher";

import { DocsMobileDrawer } from "./mobile-drawer";
import {
  DocsReleaseDatesProvider,
  useCheckDocsPageNew,
} from "./release-dates-context";
import {
  DocsShell,
  DocsShellContent,
  DocsShellFooter,
  DocsShellHeader,
} from "./shell/layout";
import { DocsShellNavGroup } from "./shell/nav-group";
import { DocsShellNavItem } from "./shell/nav-item";
import { DocsShellSection } from "./shell/nav-section";
import { closeMobileSidebar } from "./sidebar-close-lock";
import { useDismissMobileSidebarOnOutside } from "./use-dismiss-mobile-sidebar";

const getIsActive = (pathname: string, href: string) =>
  href !== undefined && isActive(href, pathname, false);
interface NavItemFlags {
  isNew?: boolean;
  new?: boolean;
}

const getNavItemLabel = (item: PageTree.Item): string =>
  typeof item.name === "string" ? item.name : String(item.name ?? "");

const getNavItemIsNew = (
  item: PageTree.Item,
  isPageNewByUrl: (url?: string) => boolean
): boolean => {
  const href =
    (item as { index?: { url: string } }).index?.url ??
    (item as { url?: string }).url;
  return (
    Boolean(href && isPageNewByUrl(href)) ||
    Boolean((item as NavItemFlags).isNew ?? (item as NavItemFlags).new)
  );
};

const pageTreeNodeKey = (
  item: PageTree.Node,
  index: number,
  parentKey: string
): string => {
  if (item.type === "separator") {
    return `${parentKey}/sep/${encodeURIComponent(String(item.name))}/${index}`;
  }
  if (item.type === "folder") {
    return `${parentKey}/folder/${encodeURIComponent(String(item.name))}/${index}`;
  }
  const { url } = item as { url?: string };
  if (url) {
    return url;
  }
  return `${parentKey}/item/${index}`;
};

const DEFAULT_OPEN_LEVEL = 0;

const isRootFolder = (
  item: PageTree.Node
): item is PageTree.Folder & { root: true } =>
  item.type === "folder" && Boolean((item as PageTree.Folder).root);

/**
 * Section trees (Motion, Icons, UI) only appear after opening that section.
 * Guide pages keep the layout `links` above Menu and must not duplicate Guide links below Menu.
 */
const getPageTreeSidebarItems = (
  root: PageTree.Root,
  treePath: PageTree.Node[],
  pathname?: string
): PageTree.Node[] | null => {
  if (pathname && (pathname === "/docs" || pathname.startsWith("/docs/"))) {
    return null;
  }

  const sectionRoot = treePath.findLast(isRootFolder);
  if (sectionRoot) {
    return sectionRoot.children;
  }

  if (isRootFolder(root as PageTree.Node)) {
    return (root as PageTree.Folder).children;
  }

  if (root.children.some(isRootFolder)) {
    return null;
  }

  return root.children;
};

export const SidebarPageTree = (props: {
  components?: Partial<SidebarComponents>;
  onNavigate?: () => void;
}) => {
  const { root } = useTreeContext();
  const pathname = usePathname();
  const treePath = useTreePath();
  const { onNavigate } = props;
  const checkPageNew = useCheckDocsPageNew();

  return useMemo(() => {
    const { Separator, Item, Folder } = props.components ?? {};
    const sidebarItems = getPageTreeSidebarItems(root, treePath, pathname);
    if (!sidebarItems) {
      return null;
    }

    const renderSeparator = (
      item: PageTree.Separator,
      key: string,
      i: number,
      _level: number
    ) => {
      if (Separator) {
        return <Separator item={item} key={key} />;
      }
      return (
        <DocsShellSection
          className={cn(i === 0 ? "mt-1" : "mt-4")}
          key={key}
          label={
            <span className="inline-flex items-center gap-2">
              {item.icon}
              {item.name}
            </span>
          }
        >
          {null}
        </DocsShellSection>
      );
    };

    const renderFolder = (
      item: PageTree.Folder,
      key: string,
      level: number,
      parentKey: string
    ) => {
      const indexUrl = item.index?.url;
      const folderChildren = indexUrl
        ? item.children.filter(
            (child) => child.type !== "page" || child.url !== indexUrl
          )
        : item.children;
      const children = renderSidebarList(
        folderChildren,
        level + 1,
        `${parentKey}/${key}`
      );
      if (Folder) {
        return (
          <Folder item={item} key={key} level={level}>
            {children}
          </Folder>
        );
      }
      const defaultOpen =
        (item.defaultOpen ?? DEFAULT_OPEN_LEVEL >= level) ||
        treePath.includes(item);
      const folderIndex = item.index;
      const showIndexLink =
        folderIndex !== undefined &&
        !item.children.some(
          (child) => child.type === "page" && child.url === folderIndex.url
        );
      return (
        <DocsShellNavGroup
          defaultOpen={defaultOpen}
          icon={item.icon}
          key={key}
          label={item.name}
        >
          {showIndexLink ? (
            <DocsShellNavItem
              href={folderIndex.url}
              isActive={getIsActive(pathname, folderIndex.url)}
              label={folderIndex.name ?? item.name}
              onClick={onNavigate}
              showConnector={false}
            />
          ) : null}
          {children}
        </DocsShellNavGroup>
      );
    };

    const renderPage = (item: PageTree.Item, key: string, level: number) => {
      if (Item) {
        return <Item item={item} key={key} />;
      }

      const url =
        (item as { index?: { url: string } }).index?.url ??
        (item as { url: string }).url;

      return (
        <DocsShellNavItem
          href={url}
          isActive={getIsActive(pathname, url)}
          isNew={getNavItemIsNew(item, checkPageNew)}
          key={key}
          label={getNavItemLabel(item)}
          onClick={onNavigate}
          showConnector={level === 1}
        />
      );
    };

    const renderSidebarList = (
      items: PageTree.Node[],
      level: number,
      parentKey: string
    ): ReactNode[] =>
      items.flatMap((item, i) => {
        const key = pageTreeNodeKey(item, i, parentKey);
        if (item.type === "separator") {
          return renderSeparator(item, key, i, level);
        }
        if (item.type === "folder") {
          return renderFolder(item, key, level, parentKey);
        }
        return renderPage(item, key, level);
      });

    return (
      <div className="mt-4">
        {renderSidebarList(sidebarItems, 1, String(root.$id ?? "tree"))}
      </div>
    );
  }, [props.components, root, pathname, treePath, onNavigate, checkPageNew]);
};

export const DocsSidebar = (
  all: DocsLayoutProps & {
    releaseDatesByUrl?: Record<string, string>;
  }
) => {
  const {
    footer: sidebarFooter,
    components: sidebarComponents,
    ...sidebarProps
  } = all.sidebar ?? {};
  const links = getLinks(all.links ?? [], all.githubUrl);
  const { setOpen } = useSidebar();
  const { transitionTo } = usePageTransition();
  useDismissMobileSidebarOnOutside();

  const closeMobile = () => {
    closeMobileSidebar(setOpen);
  };

  const releaseDatesByUrl = all.releaseDatesByUrl ?? {};

  const content = (
    <DocsShell className="h-full min-h-0 max-md:w-full max-md:max-w-full md:w-(--fd-sidebar-width,260px) md:max-w-(--fd-sidebar-width,260px)">
      <DocsShellHeader className="flex items-center justify-between border-b px-4 py-3 md:hidden">
        <Link
          aria-label="Wirefront home"
          className="focus-visible:ring-ring flex items-center gap-2 rounded-md transition-opacity outline-none hover:opacity-80 focus-visible:ring-2"
          href="/"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
              return;
            }
            e.preventDefault();
            closeMobile();
            transitionTo("/");
          }}
        >
          <SiteLogo size="sm" />
          <span className="text-sm font-semibold">Wirefront</span>
        </Link>
        <button
          aria-label="Close menu"
          className={cn(
            buttonVariants({
              color: "ghost",
              size: "icon-sm",
              className: "size-8! [&_svg]:size-5! text-fd-muted-foreground",
            })
          )}
          onClick={closeMobile}
          type="button"
        >
          <X />
        </button>
      </DocsShellHeader>

      <DocsShellContent
        className={cn(
          "min-h-0",
          "**:data-radix-scroll-area-viewport:pb-4 max-md:pt-2 md:**:data-radix-scroll-area-viewport:pb-14"
        )}
      >
        <SiteSidebarNav
          components={{
            Group: DocsShellNavGroup,
            Item: DocsShellNavItem,
            Section: DocsShellSection,
          }}
          onNavigate={closeMobile}
        />

        <SidebarPageTree
          components={sidebarComponents}
          onNavigate={closeMobile}
        />
      </DocsShellContent>

      <DocsShellFooter>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="ms-auto flex items-center justify-end gap-1 md:hidden">
            {links
              .filter((link) => link.type === "icon")
              .map((link) => (
                <BaseLinkItem
                  aria-label={link.label}
                  className={cn(
                    buttonVariants({ size: "icon", color: "ghost" }),
                    "text-fd-muted-foreground size-8 p-0 [&_svg]:size-4.5",
                    link.url ===
                      links.findLast((l) => l.type === "icon")?.url && "me-auto"
                  )}
                  item={link}
                  key={link.url}
                >
                  {link.icon}
                </BaseLinkItem>
              ))}
            <ThemeSwitcher className="ms-2" />
          </div>
        </div>
        {sidebarFooter ? <div className="mt-2">{sidebarFooter}</div> : null}
      </DocsShellFooter>
    </DocsShell>
  );

  return (
    <DocsReleaseDatesProvider releaseDatesByUrl={releaseDatesByUrl}>
      <DocsMobileDrawer
        className={sidebarProps.className}
        desktopStyle={
          {
            ...sidebarProps.style,
            "--fd-sidebar-margin": "0px",
            "--fd-sidebar-top":
              "calc(var(--fd-banner-height) + var(--fd-nav-height) + var(--fd-sidebar-margin, 0px))",
          } as CSSProperties
        }
        label="Docs Navigation"
        layout="responsive"
      >
        {content}
      </DocsMobileDrawer>
    </DocsReleaseDatesProvider>
  );
};
