// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const DocsLang = z.enum(["node", "python", "go", "curl"]);
export type DocsLang = z.infer<typeof DocsLang>;

/** One block of page content. Text may mark `code` with backticks. */
export const DocsBlock = z
  .discriminatedUnion("type", [
    z.object({ type: z.literal("p"), text: z.string() }),
    z.object({ type: z.literal("list"), items: z.array(z.string()) }),
    z.object({ type: z.literal("steps"), items: z.array(z.string()) }),
    z.object({ type: z.literal("callout"), tone: z.enum(["info", "warning"]), title: z.string(), text: z.string() }),
    z.object({ type: z.literal("code"), samples: z.partialRecord(DocsLang, z.string()), title: z.string().optional() }),
    z.object({ type: z.literal("table"), head: z.array(z.string()), rows: z.array(z.array(z.string())) }),
  ])
  .meta({ id: "DocsBlock" });
export type DocsBlock = z.infer<typeof DocsBlock>;

export const DocsSection = z.object({ id: z.string(), title: z.string(), blocks: z.array(DocsBlock) }).meta({ id: "DocsSection" });
export type DocsSection = z.infer<typeof DocsSection>;

export const DocsPage = z
  .object({ id: z.string(), title: z.string(), group: z.string(), lead: z.string(), /** ISO date. */ updatedAt: z.string(), minutes: z.number().int(), /** A short tag in the sidebar, e.g. "New". */ badge: z.string().optional(), sections: z.array(DocsSection) })
  .meta({ id: "DocsPage" });
export type DocsPage = z.infer<typeof DocsPage>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listDocsPages: { method: "GET", path: "/docs/pages", summary: "Every page, in sidebar order", response: z.array(DocsPage) },
  sendDocsFeedback: { method: "POST", path: "/docs/pages/{id}/feedback", summary: "Record whether a page helped", params: z.object({ id: z.string() }), body: z.object({ helpful: z.boolean() }) },
});
