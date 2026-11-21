"use client";

import GithubIcon from "@workspace/ui/components/icons/github-icon";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@workspace/ui/components/ui/navigation-menu";
import { cn } from "@workspace/ui/lib/utils";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { Navbar } from "fumadocs-ui/layouts/docs-client";
import { useSidebar } from "fumadocs-ui/provider";
import { ArrowUpRight, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { CommandPaletteTrigger } from "@/components/command-palette/command-palette-trigger";
import {
  allowMobileSidebarOpen,
  isMobileSidebarCloseLocked,
  markMobileSidebarClosed,
  useSyncMobileSidebarPathname,
} from "@/components/docs-sidebar/sidebar-close-lock";
import { NavHeaderToc } from "@/components/docs/docs-header-toc";
import { usePageTransition } from "@/components/page-transition/page-transition-provider";
import Link from "@/components/site-link";
import { SiteLogo } from "@/components/site-logo";
import { ThemeSwitcher } from "@/components/theme-switcher";
import manifest from "@/lib/screens/screens.manifest.json";
import { GITHUB_REPO_URL } from "@/lib/site";
import {
  Highlight,
  HighlightItem,
  useHighlight,
} from "@/registry/primitives/effects/highlight";

const DOCS_GUIDE_URL = "/docs";

interface NavItem {
  title: string;
  url: string;
}

const BASE_NAV_ITEMS: NavItem[] = [{ title: "Docs", url: DOCS_GUIDE_URL }];

const RESOURCE_NAV_ITEMS: NavItem[] = [{ title: "Pricing", url: "/pricing" }];

interface LibraryNavItem extends NavItem {
  /** Renders the item dimmed, non-interactive, with a "Soon" badge. */
  comingSoon?: boolean;
  description: string;
}

const LIBRARY_NAV_ITEMS: LibraryNavItem[] = [
  {
    title: "All Screens",
    url: "/screens",
    description: "Every screen in the catalogue.",
  },
  ...manifest.groups.map((group) => ({
    title: group.title,
    url: `/${group.slug}`,
    description: `${group.kinds.reduce((n, kind) => n + kind.screens.length, 0)} screens · ${group.meaning}`,
  })),
];

/** Every other page: guides, support and legal. */
const RESOURCE_MENU_ITEMS: LibraryNavItem[] = [
  {
    title: "Contact & support",
    url: "/docs/contact",
    description: "Questions, bugs and requests.",
  },
  {
    title: "License",
    url: "/docs/license",
    description: "What you can do with the code.",
  },
  {
    title: "Privacy Policy",
    url: "/legal/privacy",
    description: "What the site collects, and why.",
  },
  {
    title: "Terms of Service",
    url: "/legal/terms",
    description: "The rules for using the site.",
  },
];

interface MenuFeature {
  description: string;
  title: string;
  url: string;
}

const LIBRARY_FEATURE: MenuFeature = {
  title: "Wirefront",
  url: "/screens",
  description: "Ready-to-wire UI screens with full source.",
};

const RESOURCES_FEATURE: MenuFeature = {
  title: "Documentation",
  url: DOCS_GUIDE_URL,
  description: "How Wirefront works and how to install a screen.",
};

const NAV_LINK_CLASS = cn(
  "h-8 justify-center rounded-md bg-transparent px-3 py-0 text-sm font-normal whitespace-nowrap text-neutral-700 transition-colors duration-150 ease-out hover:bg-transparent hover:text-black focus:bg-transparent focus:text-black dark:text-neutral-200 dark:hover:text-white dark:focus:text-white",
  "data-[active=true]:bg-transparent data-[active=true]:text-black data-[active=true]:hover:bg-transparent data-[active=true]:focus:bg-transparent dark:data-[active=true]:text-white"
);

const LibraryMenuContent = ({
  feature,
  libraryItems,
}: {
  feature: MenuFeature;
  libraryItems: LibraryNavItem[];
}) => (
  <Highlight
    className="bg-accent pointer-events-none rounded-sm"
    containerClassName="flex w-120 gap-2"
    mode="parent"
    trigger="hover"
  >
    <HighlightItem asChild value="home">
      <NavigationMenuLink
        asChild
        className="bg-muted/60 hover:bg-muted/60 focus:bg-muted data-[active=true]:bg-muted/60 data-[active=true]:hover:bg-muted/60 relative z-10 w-45 shrink-0 p-3"
      >
        <Link href={feature.url}>
          <span className="bg-background flex size-9 items-center justify-center rounded-md border">
            <SiteLogo className="rounded-sm" size="sm" />
          </span>
          <span className="mt-8 text-sm font-medium">{feature.title}</span>
          <span className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {feature.description}
          </span>
        </Link>
      </NavigationMenuLink>
    </HighlightItem>
    <div className="grid flex-1 grid-cols-2 content-start gap-1">
      {libraryItems.map((item) => {
        if (item.comingSoon) {
          return (
            <div
              aria-disabled="true"
              className="relative z-10 flex cursor-default flex-col gap-1 p-3 opacity-50"
              key={item.title}
            >
              <span className="flex items-center justify-between text-sm font-medium">
                {item.title}
                <span className="text-muted-foreground rounded-full border px-1.5 py-0.5 text-[10px] leading-none font-normal">
                  Soon
                </span>
              </span>
              <span className="text-muted-foreground text-xs leading-relaxed">
                {item.description}
              </span>
            </div>
          );
        }
        return (
          <HighlightItem asChild key={item.title} value={item.title}>
            <NavigationMenuLink
              asChild
              className="relative z-10 gap-1 p-3 hover:bg-transparent data-[active=true]:bg-transparent data-[active=true]:hover:bg-transparent"
            >
              <Link href={item.url}>
                <span className="flex items-center justify-between text-sm font-medium">
                  {item.title}
                  <ArrowUpRight className="text-muted-foreground size-3.5" />
                </span>
                <span className="text-muted-foreground text-xs leading-relaxed">
                  {item.description}
                </span>
              </Link>
            </NavigationMenuLink>
          </HighlightItem>
        );
      })}
    </div>
  </Highlight>
);

const NavMenuDropdown = ({
  feature,
  items,
  label,
}: {
  feature: MenuFeature;
  items: LibraryNavItem[];
  label: string;
}) => (
  <NavigationMenuItem>
    <HighlightItem asChild value={label}>
      <NavigationMenuTrigger
        className={cn(
          NAV_LINK_CLASS,
          "data-[state=open]:bg-transparent data-[state=open]:text-black data-[state=open]:hover:bg-transparent data-[state=open]:focus:bg-transparent dark:data-[state=open]:text-white"
        )}
      >
        {label}
      </NavigationMenuTrigger>
    </HighlightItem>
    <NavigationMenuContent>
      <LibraryMenuContent feature={feature} libraryItems={items} />
    </NavigationMenuContent>
  </NavigationMenuItem>
);

const NavMenuItems = ({ libraryItems }: { libraryItems: LibraryNavItem[] }) => {
  const pathname = usePathname();
  const { setActiveValue, clearBounds } = useHighlight();
  // Reset highlight bounds on route change
  useEffect(() => {
    if (pathname !== undefined) {
      setActiveValue(null);
      clearBounds();
    }
  }, [pathname, setActiveValue, clearBounds]);

  return (
    <>
      {BASE_NAV_ITEMS.map((item) => (
        <NavigationMenuItem key={item.title}>
          <HighlightItem asChild value={item.title}>
            <NavigationMenuLink asChild className={NAV_LINK_CLASS}>
              <Link href={item.url}>{item.title}</Link>
            </NavigationMenuLink>
          </HighlightItem>
        </NavigationMenuItem>
      ))}
      <NavMenuDropdown
        feature={LIBRARY_FEATURE}
        items={libraryItems}
        label="Library"
      />
      {RESOURCE_NAV_ITEMS.map((item) => (
        <NavigationMenuItem key={item.title}>
          <HighlightItem asChild value={item.title}>
            <NavigationMenuLink asChild className={NAV_LINK_CLASS}>
              <Link href={item.url}>{item.title}</Link>
            </NavigationMenuLink>
          </HighlightItem>
        </NavigationMenuItem>
      ))}
      <NavMenuDropdown
        feature={RESOURCES_FEATURE}
        items={RESOURCE_MENU_ITEMS}
        label="Resources"
      />
    </>
  );
};

export const Nav = () => {
  useSyncMobileSidebarPathname();
  const { setOpen } = useSidebar();
  const { transitionTo } = usePageTransition();
  const libraryItems = LIBRARY_NAV_ITEMS;

  return (
    <Navbar className="border-border/40 bg-background/80 z-30 h-14 border-b px-(--fd-layout-offset) backdrop-blur-md transition-colors md:h-17">
      <div className="relative z-10 mx-auto flex h-full w-full max-w-(--fd-layout-width) items-center gap-3 px-3 md:px-5">
        <Link
          className={buttonVariants({
            color: "ghost",
            size: "icon-sm",
            className:
              "size-8! p-0! transition-colors duration-200 ease-in-out [&_svg]:size-7!",
          })}
          href="/"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
              return;
            }
            e.preventDefault();
            transitionTo("/");
          }}
        >
          <SiteLogo size="sm" />
        </Link>
        <div className="flex flex-1 items-center justify-end gap-2 md:justify-between">
          <div className="hidden items-center gap-1 md:flex">
            <NavigationMenu viewport={false}>
              <Highlight
                className="bg-accent pointer-events-none rounded-md"
                containerClassName="relative"
                mode="parent"
                trigger="hover"
              >
                <NavigationMenuList className="relative z-10 gap-0 bg-transparent">
                  <NavMenuItems libraryItems={libraryItems} />
                </NavigationMenuList>
              </Highlight>
            </NavigationMenu>
          </div>

          <div className="relative z-10 flex shrink-0 items-center">
            <CommandPaletteTrigger />

            <a
              aria-label="GitHub repository"
              className="text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground ms-2 hidden size-6 shrink-0 items-center justify-center rounded-md transition-colors md:ms-3 md:inline-flex [&_svg]:size-6"
              href={GITHUB_REPO_URL}
              rel="noreferrer noopener"
              target="_blank"
            >
              <GithubIcon className="size-6" />
            </a>

            <NavHeaderToc />

            <ThemeSwitcher className="max-md:hidden md:ms-3" />

            <button
              aria-label="Open menu"
              className={cn(
                buttonVariants({
                  color: "ghost",
                  size: "icon-sm",
                  className:
                    "relative z-10 ms-2 size-6! shrink-0 p-0! text-fd-muted-foreground md:hidden [&_svg]:size-6!",
                })
              )}
              data-sidebar-menu-toggle="true"
              onClick={() => {
                setOpen((prev) => {
                  if (prev) {
                    markMobileSidebarClosed();
                    return false;
                  }
                  if (isMobileSidebarCloseLocked()) {
                    return false;
                  }
                  allowMobileSidebarOpen();
                  return true;
                });
              }}
              onPointerDown={(event) => {
                if (isMobileSidebarCloseLocked()) {
                  event.preventDefault();
                }
              }}
              type="button"
            >
              <Menu />
            </button>
          </div>
        </div>
      </div>
    </Navbar>
  );
};
