// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '@/pages/landing'
import { SITE_URL } from '@/lib/site'

export const Route = createFileRoute('/')({
  // Each page sets its own canonical URL (the root used to add "/" to every page).
  head: () => ({ links: [{ rel: 'canonical', href: `${SITE_URL}/` }] }),
  component: LandingPage,
})
