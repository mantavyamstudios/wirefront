// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Integration = z
  .object({
    id: z.string(),
    name: z.string(),
    /** Used for the category filter, e.g. "Source" or "Observability". */
    category: z.string(),
    description: z.string(),
    connected: z.boolean(),
    /** A short tag such as "New" or "Beta". */
    badge: z.string().optional(),
    /** A square logo; initials are shown without one. */
    logoUrl: z.string().optional(),
    /** Where its documentation lives. */
    docsUrl: z.string().optional(),
    /** Where to configure it once connected. */
    configureHref: z.string().optional(),
  })
  .meta({ id: "Integration" });
export type Integration = z.infer<typeof Integration>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listIntegrations: { method: "GET", path: "/integrations", summary: "Every integration and whether it's connected", response: z.array(Integration) },
  connectIntegration: {
    method: "POST",
    path: "/integrations/{id}/connect",
    summary: "Start connecting an integration; usually returns an OAuth URL to redirect to",
    params: z.object({ id: z.string() }),
    response: z.object({ redirectUrl: z.string().optional() }),
  },
});
