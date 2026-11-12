// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { createFileRoute } from "@tanstack/react-router";
import { DemoApp } from "@/pages/demo/app";

export const Route = createFileRoute("/demo")({
  component: DemoApp,
});
