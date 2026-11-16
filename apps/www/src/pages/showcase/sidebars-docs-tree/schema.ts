// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** A page, or a folder of pages when it has children. */
export type DocNode = { id: string; title: string; href?: string; children?: DocNode[] };

export const DocNode: z.ZodType<DocNode> = z
  .lazy(() =>
    z.object({
      id: z.string(),
      title: z.string(),
      /** Where the page lives. Folders without an href only open and close. */
      href: z.string().optional(),
      children: z.array(DocNode).optional(),
    }),
  )
  .meta({ id: "DocNode" });

/** The backend operations this screen calls. */
export const api = defineApi({
  getDocsTree: { method: "GET", path: "/docs/tree", summary: "The documentation's table of contents", response: z.array(DocNode) },
});
