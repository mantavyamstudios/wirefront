// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const AssistantTone = z.enum([
  "orange",
  "teal",
  "violet",
  "amber",
  "info",
  "success",
  "warning",
]);
export type AssistantTone = z.infer<typeof AssistantTone>;

export const AssistantChat = z
  .object({
    id: z.string(),
    title: z.string(),
    /** ISO timestamp of the last message. */ updatedAt: z.string(),
    projectId: z.string().optional(),
  })
  .meta({ id: "AssistantChat" });
export type AssistantChat = z.infer<typeof AssistantChat>;

export const AssistantProject = z
  .object({ id: z.string(), name: z.string(), tone: AssistantTone })
  .meta({ id: "AssistantProject" });
export type AssistantProject = z.infer<typeof AssistantProject>;

export const AssistantApp = z
  .object({
    id: z.string(),
    name: z.string(),
    /** e.g. "1,204 threads". */ detail: z.string(),
    tone: AssistantTone,
    connected: z.boolean(),
  })
  .meta({ id: "AssistantApp" });
export type AssistantApp = z.infer<typeof AssistantApp>;

export const AssistantSuggestion = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    /** Typed into the box when picked. */ prompt: z.string(),
    tone: AssistantTone,
  })
  .meta({ id: "AssistantSuggestion" });
export type AssistantSuggestion = z.infer<typeof AssistantSuggestion>;

export const AssistantMessage = z
  .object({
    id: z.string(),
    role: z.enum(["user", "assistant"]),
    /** The reply so far; paragraphs are separated by a blank line. */
    text: z.string(),
    /** What the assistant did, e.g. "Read Postbox · 1,204 threads". */
    steps: z.array(z.string()).optional(),
    streaming: z.boolean().optional(),
    /** Set when the user stopped it early. */
    stopped: z.boolean().optional(),
  })
  .meta({ id: "AssistantMessage" });
export type AssistantMessage = z.infer<typeof AssistantMessage>;

export const AssistantRequest = z
  .object({
    text: z.string().min(1),
    tools: z.array(z.string()),
    apps: z.array(z.string()),
    files: z.array(z.string()),
    model: z.string(),
  })
  .meta({ id: "AssistantRequest" });
export type AssistantRequest = z.infer<typeof AssistantRequest>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listChats: {
    method: "GET",
    path: "/assistant/chats",
    summary: "Recent chats",
    response: z.array(AssistantChat),
  },
  listProjects: {
    method: "GET",
    path: "/assistant/projects",
    summary: "Projects that group chats",
    response: z.array(AssistantProject),
  },
  listApps: {
    method: "GET",
    path: "/assistant/apps",
    summary: "Apps the assistant can read",
    response: z.array(AssistantApp),
  },
  connectApp: {
    method: "POST",
    path: "/assistant/apps/{id}/connect",
    summary: "Connect an app",
    params: z.object({ id: z.string() }),
  },
  sendAssistantMessage: {
    method: "POST",
    path: "/assistant/chats/{id}/messages",
    summary: "Ask the assistant; the reply streams back",
    params: z.object({ id: z.string() }),
    body: AssistantRequest,
  },
  stopAssistant: {
    method: "POST",
    path: "/assistant/chats/{id}/stop",
    summary: "Stop the reply being written",
    params: z.object({ id: z.string() }),
  },
  rateReply: {
    method: "PUT",
    path: "/assistant/messages/{id}/rating",
    summary: "Mark a reply as good or clear it",
    params: z.object({ id: z.string() }),
    body: z.object({ good: z.boolean() }),
  },
});
