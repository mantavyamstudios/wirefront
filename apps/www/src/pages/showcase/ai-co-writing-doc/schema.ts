// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const CollaboratorTone = z.enum(["info", "success", "violet", "warning"]);
export type CollaboratorTone = z.infer<typeof CollaboratorTone>;

export const Collaborator = z.object({ id: z.string(), name: z.string(), initials: z.string(), tone: CollaboratorTone, /** An AI agent rather than a person. */ agent: z.boolean().optional() }).meta({ id: "Collaborator" });
export type Collaborator = z.infer<typeof Collaborator>;

export const DocBlock = z
  .object({
    id: z.string(),
    type: z.enum(["h1", "h2", "p", "li"]),
    text: z.string(),
    /** A highlighted phrase, e.g. what a comment is about; `by` is a collaborator id. */
    mark: z.object({ phrase: z.string(), by: z.string() }).optional(),
  })
  .meta({ id: "DocBlock" });
export type DocBlock = z.infer<typeof DocBlock>;

export const SharedDoc = z
  .object({
    id: z.string(),
    title: z.string(),
    /** Breadcrumb folders above the doc. */
    path: z.array(z.string()),
    status: z.string(),
    /** ISO timestamp of the last edit. */
    editedAt: z.string(),
    /** Collaborator ids credited under the title. */
    authors: z.array(z.string()),
    blocks: z.array(DocBlock),
  })
  .meta({ id: "SharedDoc" });
export type SharedDoc = z.infer<typeof SharedDoc>;

export const DocComment = z
  .object({ id: z.string(), /** The block it is anchored to. */ block: z.string(), author: z.string(), text: z.string(), createdAt: z.string(), reply: z.object({ author: z.string(), text: z.string() }).optional() })
  .meta({ id: "DocComment" });
export type DocComment = z.infer<typeof DocComment>;

export const DocSuggestion = z
  .object({ id: z.string(), /** The block the text is appended to. */ block: z.string(), /** The agent suggesting it. */ author: z.string(), text: z.string(), note: z.string() })
  .meta({ id: "DocSuggestion" });
export type DocSuggestion = z.infer<typeof DocSuggestion>;

export const DocCursor = z
  .object({ person: z.string(), block: z.string(), /** The caret sits after the first occurrence of this text in the block. */ after: z.string(), /** e.g. "reading", shown beside the name. */ activity: z.string().optional(), idle: z.boolean().optional() })
  .meta({ id: "DocCursor" });
export type DocCursor = z.infer<typeof DocCursor>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getSharedDoc: { method: "GET", path: "/docs/{id}", summary: "The doc and its blocks", params: z.object({ id: z.string() }), response: SharedDoc },
  listCollaborators: { method: "GET", path: "/docs/{id}/collaborators", summary: "People and agents on the doc", params: z.object({ id: z.string() }), response: z.array(Collaborator) },
  listDocComments: { method: "GET", path: "/docs/{id}/comments", summary: "Open comments", params: z.object({ id: z.string() }), response: z.array(DocComment) },
  getPendingSuggestion: { method: "GET", path: "/docs/{id}/suggestions/next", summary: "The next agent suggestion to review", params: z.object({ id: z.string() }), response: DocSuggestion },
  acceptSuggestion: { method: "POST", path: "/suggestions/{id}/accept", summary: "Apply a suggestion to the doc", params: z.object({ id: z.string() }) },
  rejectSuggestion: { method: "POST", path: "/suggestions/{id}/reject", summary: "Discard a suggestion", params: z.object({ id: z.string() }) },
  resolveDocComment: { method: "POST", path: "/comments/{id}/resolve", summary: "Resolve a comment", params: z.object({ id: z.string() }) },
  replyToDocComment: { method: "POST", path: "/comments/{id}/reply", summary: "Reply to a comment", params: z.object({ id: z.string() }), body: z.object({ text: z.string().min(1) }) },
});
