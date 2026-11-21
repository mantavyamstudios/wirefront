import { Toaster } from "@workspace/ui/components/ui/sonner";
import { cn } from "@workspace/ui/lib/utils";
import { RootProvider } from "fumadocs-ui/provider";
import { MotionConfig } from "motion/react";

import "./globals.css";
import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";

import { CommandPaletteGroupsProvider } from "@/components/command-palette/command-palette-groups-provider";
import { CommandPaletteSearchDialog } from "@/components/command-palette/command-palette-search-dialog";
import { FlowsAnchorLinks } from "@/components/flows/flows-anchor-links";
import { GlobalCursorToggle } from "@/components/global-cursor-toggle";
import { PageTransitionProvider } from "@/components/page-transition/page-transition-provider";
import { getCommandPaletteGroups } from "@/lib/command-palette/get-command-palette-items";
import { fontInter } from "@/lib/fonts";
import { jsonLd } from "@/lib/json-ld";
import {
  getOgMetadataImages,
  getTwitterMetadataImages,
} from "@/lib/og/og-paths";
import {
  getMetadataBaseUrl,
  getPageAlternates,
  GITHUB_PROFILE_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

const defaultOgImages = getOgMetadataImages([], SITE_NAME);
const defaultTwitterImages = getTwitterMetadataImages([]);

export const metadata: Metadata = {
  metadataBase: new URL(getMetadataBaseUrl()),
  title: {
    template: `%s - ${SITE_NAME}`,
    default: `${SITE_NAME} – Live Flutter user flows`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    SITE_NAME,
    "Flutter",
    "Flutter UI",
    "Flutter web",
    "Dart",
    "User flows",
    "Mobile UI patterns",
    "UI templates",
  ],
  // The owner's GitHub avatar, refreshed on every build (scripts/fetch-avatar.mts).
  icons: {
    icon: [
      { url: "/brand/avatar-32.jpg", sizes: "32x32", type: "image/jpeg" },
      { url: "/brand/avatar-192.jpg", sizes: "192x192", type: "image/jpeg" },
      { url: "/brand/avatar-512.jpg", sizes: "512x512", type: "image/jpeg" },
    ],
    apple: [{ url: "/brand/avatar-180.jpg", sizes: "180x180" }],
  },
  authors: [
    {
      name: "Devesh Mishra",
      url: GITHUB_PROFILE_URL,
    },
  ],
  publisher: SITE_NAME,
  alternates: getPageAlternates("/"),
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: defaultOgImages,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@devzsh",
    creator: "@devzsh",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: defaultTwitterImages,
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  const commandGroups = getCommandPaletteGroups();

  const app = (
    <RootProvider
      search={{ SearchDialog: CommandPaletteSearchDialog }}
      theme={{
        disableTransitionOnChange: false,
      }}
    >
      {children}
    </RootProvider>
  );

  return (
    <html
      className={cn(fontInter.variable, "font-sans")}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script
          // oxlint-disable-next-line react/no-danger -- JSON-LD requires raw script injection
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          type="application/ld+json"
        />
      </head>

      <body
        className={cn(
          "dialkit-root flex min-h-screen flex-col"
          // Allows to make more attractive video recordings
          // 'screenshot-mode',
        )}
      >
        <MotionConfig reducedMotion="user">
          <GlobalCursorToggle />
          <CommandPaletteGroupsProvider groups={commandGroups}>
            <NuqsAdapter>
              <PageTransitionProvider>
                {app}
                <FlowsAnchorLinks />
                <Toaster />
              </PageTransitionProvider>
            </NuqsAdapter>
          </CommandPaletteGroupsProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
