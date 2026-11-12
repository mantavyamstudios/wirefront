// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NotFoundPage } from "@/pages/not-found";

export const Route = createFileRoute("/c/$category")({
  component: () => <Outlet />,
  notFoundComponent: NotFoundPage,
});
