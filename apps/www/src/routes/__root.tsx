/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router'
import appCss from '@wirefront/ui/styles.css?url'
import {
  ORBIT_THEME_STORAGE_KEY,
  ThemeProvider,
} from '@wirefront/ui/theme-provider'
import {
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from '@/lib/site'

const ORBIT_THEME_HEAD_SCRIPT = `!function(){try{var k=${JSON.stringify(ORBIT_THEME_STORAGE_KEY)};var p=localStorage.getItem(k);if(p!=="light"&&p!=="dark"&&p!=="system")p="system";var dark=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);}catch(e){}}();`

const OG_IMAGE = `${SITE_URL}/og.png`
const ICON_VERSION = '2'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      { name: 'color-scheme', content: 'light dark' },
      { name: 'theme-color', content: '#0a0a0a' },
      { title: SITE_TITLE },
      { name: 'description', content: SITE_DESCRIPTION },
      { name: 'author', content: SITE_AUTHOR },

      // Open Graph
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:title', content: SITE_TITLE },
      { property: 'og:description', content: SITE_DESCRIPTION },
      { property: 'og:url', content: `${SITE_URL}/` },
      { property: 'og:image', content: OG_IMAGE },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: SITE_DESCRIPTION },

      // Twitter
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: SITE_TITLE },
      { name: 'twitter:description', content: SITE_DESCRIPTION },
      { name: 'twitter:image', content: OG_IMAGE },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      // ?v= busts browser favicon caches; bump it when the icons change.
      { rel: 'icon', href: `/favicon.ico?v=${ICON_VERSION}`, sizes: '32x32' },
      { rel: 'icon', type: 'image/svg+xml', href: `/favicon.svg?v=${ICON_VERSION}` },
      { rel: 'apple-touch-icon', href: `/apple-touch-icon.png?v=${ICON_VERSION}` },
      { rel: 'manifest', href: `/site.webmanifest?v=${ICON_VERSION}` },
      { rel: 'canonical', href: `${SITE_URL}/` },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: ORBIT_THEME_HEAD_SCRIPT }}
        />
        <HeadContent />
      </head>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider>{children}</ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
