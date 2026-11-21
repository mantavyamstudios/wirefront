import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { BookOpen } from "lucide-react";

import { COMMUNITY_ISSUES_URL } from "@/lib/site";

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Marketing Layout: app/(marketing)/layout.tsx
 * Docs Layout: app/(doc)/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  links: [
    {
      type: "separator",
      name: "Guide",
      icon: <BookOpen fill="currentColor" strokeWidth={2.5} />,
      // oxlint-disable-next-line @typescript-eslint/no-explicit-any -- custom separator layout item
    } as any,
    {
      text: "Introduction",
      url: "/docs",
      secondary: false,
    },
    {
      text: "Installing a Screen",
      url: "/docs/installation",
      secondary: false,
    },
    {
      text: "License",
      url: "/docs/license",
      secondary: false,
    },
    {
      text: "Report an Issue",
      url: COMMUNITY_ISSUES_URL,
      external: true,
      secondary: false,
    },
  ],
};
