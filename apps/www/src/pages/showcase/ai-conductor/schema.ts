// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const HelperTone = z.enum(["orange", "teal", "violet", "info", "rose"]);
export type HelperTone = z.infer<typeof HelperTone>;

export const Helper = z
  .object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    tone: HelperTone,
    status: z.enum(["queued", "working", "waiting", "done"]),
    /** 0 to 100. */
    progress: z.number().min(0).max(100),
    /** What it is doing right now. */
    activity: z.string().optional(),
    /** What it produced, shown once done. */
    result: z.string().optional(),
  })
  .meta({ id: "Helper" });
export type Helper = z.infer<typeof Helper>;

export const BriefField = z
  .object({ key: z.string(), label: z.string(), kind: z.enum(["text", "textarea", "chips"]), placeholder: z.string().optional() })
  .meta({ id: "BriefField" });
export type BriefField = z.infer<typeof BriefField>;

export const BriefValue = z
  .object({ value: z.union([z.string(), z.array(z.string())]), /** Who wrote it last. */ by: z.enum(["agent", "you"]).optional() })
  .meta({ id: "BriefValue" });
export type BriefValue = z.infer<typeof BriefValue>;

export const ConductorMessage = z
  .object({
    id: z.string(),
    role: z.enum(["user", "agent"]),
    text: z.string(),
    /** True while the agent is still writing it. */
    streaming: z.boolean().optional(),
    /** Helper ids this message handed work to. */
    spawned: z.array(z.string()).optional(),
    /** How many brief fields this message filled. */
    updated: z.number().int().optional(),
    /** A question with options; the latest unanswered one shows a picker. */
    choices: z.object({ prompt: z.string(), options: z.array(z.string()) }).optional(),
  })
  .meta({ id: "ConductorMessage" });
export type ConductorMessage = z.infer<typeof ConductorMessage>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getConductorSession: { method: "GET", path: "/sessions/{id}", summary: "Messages, helpers and the brief", params: z.object({ id: z.string() }), response: z.object({ messages: z.array(ConductorMessage), helpers: z.array(Helper), fields: z.array(BriefField), values: z.record(z.string(), BriefValue) }) },
  sendConductorMessage: { method: "POST", path: "/sessions/{id}/messages", summary: "Send a message to the agent", params: z.object({ id: z.string() }), body: z.object({ text: z.string().min(1) }) },
  answerConductor: { method: "POST", path: "/sessions/{id}/messages/{messageId}/answer", summary: "Answer the agent's question", params: z.object({ id: z.string(), messageId: z.string() }), body: z.object({ picks: z.array(z.string()).min(1) }) },
  updateBriefField: { method: "PUT", path: "/sessions/{id}/brief/{key}", summary: "Edit a brief field", params: z.object({ id: z.string(), key: z.string() }), body: z.object({ value: z.union([z.string(), z.array(z.string())]) }) },
  handOffBrief: { method: "POST", path: "/sessions/{id}/hand-off", summary: "Send the finished brief on", params: z.object({ id: z.string() }) },
});
