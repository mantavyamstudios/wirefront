"use client";

import {
  Sidebar001,
  Sidebar001Content,
  Sidebar001Footer,
  Sidebar001Group,
  Sidebar001Header,
  Sidebar001Item,
  Sidebar001Section,
} from "@workspace/ui/components/sidebar-001";
import { cn } from "@workspace/ui/lib/utils";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { BaseLinkItem } from "fumadocs-ui/layouts/links";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { getLinks } from "fumadocs-ui/layouts/shared";
import { useSidebar } from "fumadocs-ui/provider";
import { X } from "lucide-react";

import { DocsMobileDrawer } from "@/components/docs-sidebar/mobile-drawer";
import { DocsReleaseDatesProvider } from "@/components/docs-sidebar/release-dates-context";
import { closeMobileSidebar } from "@/components/docs-sidebar/sidebar-close-lock";
import { useDismissMobileSidebarOnOutside } from "@/components/docs-sidebar/use-dismiss-mobile-sidebar";
import { usePageTransition } from "@/components/page-transition/page-transition-provider";
import Link from "@/components/site-link";
import { SiteLogo } from "@/components/site-logo";
import { SiteSidebarNav } from "@/components/site-sidebar-nav";
import { ThemeSwitcher } from "@/components/theme-switcher";

export interface AccountSidebarProps extends BaseLayoutProps {
  releaseDatesByUrl?: Record<string, string>;
}

const ACCOUNT_SIDEBAR_DEFAULT_LINKS: NonNullable<AccountSidebarProps["links"]> =
  [];

const ACCOUNT_SIDEBAR_DEFAULT_RELEASE_DATES_BY_URL: Record<string, string> = {};

export const AccountSidebar = ({
  links = ACCOUNT_SIDEBAR_DEFAULT_LINKS,
  githubUrl,
  releaseDatesByUrl = ACCOUNT_SIDEBAR_DEFAULT_RELEASE_DATES_BY_URL,
}: AccountSidebarProps) => {
  const { setOpen } = useSidebar();
  const { transitionTo } = usePageTransition();
  const resolvedLinks = getLinks(links, githubUrl);
  const iconLinks = resolvedLinks.filter((link) => link.type === "icon");

  useDismissMobileSidebarOnOutside();

  const closeMobile = () => {
    closeMobileSidebar(setOpen);
  };

  return (
    <DocsReleaseDatesProvider releaseDatesByUrl={releaseDatesByUrl}>
      <DocsMobileDrawer label="Account Navigation">
        <Sidebar001
          className="min-h-0 w-full max-md:max-w-full"
          defaultWidth={380}
          maxWidth={380}
          minWidth={180}
        >
          <Sidebar001Header className="flex items-center justify-between border-b px-4 py-3 md:hidden">
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
          </Sidebar001Header>

          <Sidebar001Content className="min-h-0 px-3 max-md:pt-2 md:pb-4">
            <SiteSidebarNav
              components={{
                Group: Sidebar001Group,
                Item: Sidebar001Item,
                Section: Sidebar001Section,
              }}
              onNavigate={closeMobile}
            />
          </Sidebar001Content>

          <Sidebar001Footer>
            <div className="flex items-center justify-end gap-1">
              {iconLinks.map((link) => (
                <BaseLinkItem
                  aria-label={link.label}
                  className={cn(
                    buttonVariants({ size: "icon", color: "ghost" }),
                    "text-fd-muted-foreground size-8 p-0 [&_svg]:size-4.5"
                  )}
                  item={link}
                  key={link.url}
                >
                  {link.icon}
                </BaseLinkItem>
              ))}
              <ThemeSwitcher className="ms-2" />
            </div>
          </Sidebar001Footer>
        </Sidebar001>
      </DocsMobileDrawer>
    </DocsReleaseDatesProvider>
  );
};
