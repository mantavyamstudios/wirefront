// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const CallHue = z.enum(["rose", "amber", "emerald", "sky", "violet", "orange", "teal", "indigo"]);
export type CallHue = z.infer<typeof CallHue>;

export const CallPerson = z
  .object({ id: z.string(), name: z.string(), title: z.string().optional(), hue: CallHue, muted: z.boolean().optional(), cameraOff: z.boolean().optional(), host: z.boolean().optional(), hand: z.boolean().optional() })
  .meta({ id: "CallPerson" });
export type CallPerson = z.infer<typeof CallPerson>;

export const CallMessage = z.object({ id: z.string(), authorId: z.string(), text: z.string(), /** ISO timestamp. */ sentAt: z.string() }).meta({ id: "CallMessage" });
export type CallMessage = z.infer<typeof CallMessage>;

export const CallReaction = z.object({ id: z.string(), emoji: z.string(), /** Who reacted, as shown under the emoji. */ name: z.string() }).meta({ id: "CallReaction" });
export type CallReaction = z.infer<typeof CallReaction>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getCall: { method: "GET", path: "/calls/{code}", summary: "The call and who is in it", params: z.object({ code: z.string() }), response: z.object({ title: z.string(), startedAt: z.string(), participants: z.array(CallPerson), messages: z.array(CallMessage) }) },
  sendCallMessage: { method: "POST", path: "/calls/{code}/messages", summary: "Message everyone in the call", params: z.object({ code: z.string() }), body: z.object({ text: z.string().min(1) }) },
  muteParticipant: { method: "POST", path: "/calls/{code}/participants/{id}/mute", summary: "Mute someone (host only)", params: z.object({ code: z.string(), id: z.string() }) },
  removeParticipant: { method: "DELETE", path: "/calls/{code}/participants/{id}", summary: "Remove someone from the call (host only)", params: z.object({ code: z.string(), id: z.string() }) },
  rateCall: { method: "POST", path: "/calls/{code}/rating", summary: "Rate audio and video quality", params: z.object({ code: z.string() }), body: z.object({ good: z.boolean() }) },
});
