// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const DealStage = z.enum(["lead", "qualified", "proposal", "negotiation", "won"]).meta({ id: "DealStage" });
export type DealStage = z.infer<typeof DealStage>;

export const Engagement = z.enum(["hot", "warm", "cooling", "cold"]).meta({ id: "Engagement" });
export type Engagement = z.infer<typeof Engagement>;

export const FocusKind = z.enum(["quiet", "opened", "champion", "overdue", "replied"]).meta({ id: "FocusKind" });
export type FocusKind = z.infer<typeof FocusKind>;

export const FocusAction = z.enum(["email", "call", "snooze"]).meta({ id: "FocusAction" });
export type FocusAction = z.infer<typeof FocusAction>;

export const PipelineStage = z
  .object({
    id: DealStage,
    label: z.string(),
    /** Chance a deal here closes, 0–1; weights the forecast. */
    probability: z.number().min(0).max(1),
  })
  .meta({ id: "PipelineStage" });
export type PipelineStage = z.infer<typeof PipelineStage>;

export const DealOwner = z.object({ id: z.string(), name: z.string(), role: z.string().optional() }).meta({ id: "DealOwner" });
export type DealOwner = z.infer<typeof DealOwner>;

export const DealContact = z
  .object({
    name: z.string(),
    role: z.string(),
    /** A short tag: "good" marks the champion, "bad" someone who left. */
    tag: z.object({ label: z.string(), tone: z.enum(["good", "bad", "neutral"]) }).optional(),
  })
  .meta({ id: "DealContact" });
export type DealContact = z.infer<typeof DealContact>;

/** `when` is already written for people, e.g. "Oct 2" or "Yesterday". */
export const DealActivity = z.object({ label: z.string(), when: z.string() }).meta({ id: "DealActivity" });
export type DealActivity = z.infer<typeof DealActivity>;

export const Deal = z
  .object({
    id: z.string(),
    company: z.string(),
    domain: z.string(),
    stage: DealStage,
    /** In the provider's currency. */
    value: z.number().nonnegative(),
    ownerId: z.string(),
    daysInStage: z.number().int().nonnegative(),
    engagement: Engagement,
    /** Already written for people, e.g. "Emailed 2d ago". */
    lastTouch: z.string(),
    /** Already written for people, e.g. "Closes Nov 14" or "Oct 2". */
    closeLabel: z.string(),
    nextStep: z.string(),
    contacts: z.array(DealContact),
    /** Newest first. */
    activity: z.array(DealActivity),
    note: z.string().optional(),
  })
  .meta({ id: "Deal" });
export type Deal = z.infer<typeof Deal>;

/** Something about a deal worth acting on today. */
export const FocusSignal = z
  .object({
    id: z.string(),
    dealId: z.string(),
    kind: FocusKind,
    /** Follows the company's name, e.g. "opened the proposal twice today". */
    headline: z.string(),
    detail: z.string(),
    /** Who to contact. */
    contact: z.string(),
    /** Shown on the deal card while the signal is open, e.g. "Opened twice". */
    tag: z.string(),
  })
  .meta({ id: "FocusSignal" });
export type FocusSignal = z.infer<typeof FocusSignal>;

export const PipelineData = z
  .object({
    /** In pipeline order; the last stage is the won stage. */
    stages: z.array(PipelineStage),
    owners: z.array(DealOwner),
    /** In board order within each stage. */
    deals: z.array(Deal),
    signals: z.array(FocusSignal),
  })
  .meta({ id: "PipelineData" });
export type PipelineData = z.infer<typeof PipelineData>;

export const MoveDealInput = z.object({ dealId: z.string(), stage: DealStage, index: z.number().int().nonnegative() }).meta({ id: "MoveDealInput" });
export type MoveDealInput = z.infer<typeof MoveDealInput>;

export const SignalActionInput = z.object({ signalId: z.string(), action: FocusAction }).meta({ id: "SignalActionInput" });
export type SignalActionInput = z.infer<typeof SignalActionInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getPipeline: {
    method: "GET",
    path: "/pipeline/today",
    summary: "Stages, owners, deals and today's focus signals",
    response: PipelineData,
  },
  moveDeal: {
    method: "POST",
    path: "/deals/{dealId}/move",
    summary: "Move a deal to a stage and position",
    params: z.object({ dealId: z.string() }),
    body: MoveDealInput.pick({ stage: true, index: true }),
  },
  actOnSignal: {
    method: "POST",
    path: "/signals/{signalId}/actions",
    summary: "Email, log a call for, or snooze a focus signal",
    params: z.object({ signalId: z.string() }),
    body: SignalActionInput.pick({ action: true }),
  },
});
