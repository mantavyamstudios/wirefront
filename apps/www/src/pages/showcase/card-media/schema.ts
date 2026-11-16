// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ArticleTeaser = z
  .object({
    id: z.string(),
    category: z.string(),
    title: z.string(),
    excerpt: z.string(),
    author: z.object({ name: z.string(), avatarUrl: z.url().optional() }),
    readMinutes: z.int().min(1),
    coverUrl: z.url().optional(),
    href: z.string(),
    saved: z.boolean(),
  })
  .meta({ id: "ArticleTeaser" });
export type ArticleTeaser = z.infer<typeof ArticleTeaser>;

export const SaveArticleInput = z.object({ articleId: z.string(), saved: z.boolean() }).meta({ id: "SaveArticleInput" });
export type SaveArticleInput = z.infer<typeof SaveArticleInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listLatestArticles: { method: "GET", path: "/articles/latest", summary: "The latest articles", response: z.array(ArticleTeaser) },
  saveArticle: { method: "PUT", path: "/me/saved-articles/{articleId}", summary: "Save or unsave an article for later", params: z.object({ articleId: z.string() }), body: SaveArticleInput.pick({ saved: true }) },
});
