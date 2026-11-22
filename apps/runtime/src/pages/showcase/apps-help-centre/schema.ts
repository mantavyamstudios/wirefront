// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const HelpTone = z.enum([
  "sky",
  "emerald",
  "amber",
  "violet",
  "rose",
  "teal",
]);
export type HelpTone = z.infer<typeof HelpTone>;
export const HelpIcon = z.enum([
  "rocket",
  "payments",
  "invoices",
  "billing",
  "security",
  "integrations",
]);
export type HelpIcon = z.infer<typeof HelpIcon>;

export const HelpCategory = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    icon: HelpIcon,
    tone: HelpTone,
  })
  .meta({ id: "HelpCategory" });
export type HelpCategory = z.infer<typeof HelpCategory>;

export const HelpBlock = z
  .discriminatedUnion("type", [
    z.object({ type: z.literal("p"), text: z.string() }),
    z.object({ type: z.literal("h2"), text: z.string() }),
    z.object({ type: z.literal("steps"), items: z.array(z.string()) }),
    z.object({ type: z.literal("list"), items: z.array(z.string()) }),
    z.object({
      type: z.literal("callout"),
      tone: z.enum(["info", "warning"]),
      text: z.string(),
    }),
  ])
  .meta({ id: "HelpBlock" });
export type HelpBlock = z.infer<typeof HelpBlock>;

export const HelpArticle = z
  .object({
    id: z.string(),
    title: z.string(),
    categoryId: z.string(),
    summary: z.string(),
    /** ISO date. */ updatedAt: z.string(),
    minutes: z.number().int(),
    popular: z.boolean().optional(),
    body: z.array(HelpBlock),
  })
  .meta({ id: "HelpArticle" });
export type HelpArticle = z.infer<typeof HelpArticle>;

export const ArticleFeedback = z
  .object({
    articleId: z.string(),
    helpful: z.boolean(),
    reason: z.string().optional(),
    note: z.string().optional(),
  })
  .meta({ id: "ArticleFeedback" });
export type ArticleFeedback = z.infer<typeof ArticleFeedback>;

export const SupportRequest = z
  .object({ topic: z.string(), message: z.string().min(10), email: z.email() })
  .meta({ id: "SupportRequest" });
export type SupportRequest = z.infer<typeof SupportRequest>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listCategories: {
    method: "GET",
    path: "/help/categories",
    summary: "Help topics",
    response: z.array(HelpCategory),
  },
  listArticles: {
    method: "GET",
    path: "/help/articles",
    summary: "Every published article",
    response: z.array(HelpArticle),
  },
  sendArticleFeedback: {
    method: "POST",
    path: "/help/articles/{articleId}/feedback",
    summary: "Record whether an article helped",
    params: z.object({ articleId: z.string() }),
    body: ArticleFeedback,
  },
  contactSupport: {
    method: "POST",
    path: "/help/tickets",
    summary: "Open a support ticket",
    body: SupportRequest,
    response: z.object({ ticket: z.string() }),
  },
});
