// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { createFileRoute } from "@tanstack/react-router";
import { DemoApp } from "@/pages/demo/app";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/demo")({
  head: () => ({ links: [{ rel: "canonical", href: `${SITE_URL}/demo` }] }),
  component: DemoApp,
});
