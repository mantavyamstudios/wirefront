// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const RunToolKind = z.enum(["db", "search", "code", "doc", "send", "task"]);
export type RunToolKind = z.infer<typeof RunToolKind>;

export const RunToolCall = z
  .object({ name: z.string(), kind: RunToolKind, args: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])), /** Expected or actual duration. */ ms: z.number(), tokens: z.number() })
  .meta({ id: "RunToolCall" });
export type RunToolCall = z.infer<typeof RunToolCall>;

export const RunStepStatus = z.enum(["pending", "running", "done", "waiting", "skipped", "failed"]);
export type RunStepStatus = z.infer<typeof RunStepStatus>;

export const RunPlanStep = z.object({ title: z.string(), status: RunStepStatus, /** The step pauses for a person to approve it. */ approval: z.boolean().optional() }).meta({ id: "RunPlanStep" });
export type RunPlanStep = z.infer<typeof RunPlanStep>;

/** One line in the activity log. Times are milliseconds from the start of the run. */
export const RunLogEntry = z
  .discriminatedUnion("kind", [
    z.object({ kind: z.literal("tool"), id: z.string(), step: z.number().int(), call: RunToolCall, status: z.enum(["running", "done", "denied", "failed"]), result: z.string().optional(), retry: z.boolean().optional(), at: z.number(), end: z.number().optional() }),
    z.object({ kind: z.literal("thought"), id: z.string(), step: z.number().int(), text: z.string(), at: z.number() }),
    z.object({ kind: z.literal("approval"), id: z.string(), step: z.number().int(), status: z.enum(["waiting", "approved", "denied"]), count: z.number().int(), at: z.number() }),
  ])
  .meta({ id: "RunLogEntry" });
export type RunLogEntry = z.infer<typeof RunLogEntry>;

export const RunAccount = z.object({ company: z.string(), contact: z.string(), email: z.string(), score: z.number().min(0).max(1), arr: z.string() }).meta({ id: "RunAccount" });
export type RunAccount = z.infer<typeof RunAccount>;

export const AgentRun = z
  .object({
    id: z.string(),
    agentName: z.string(),
    task: z.string(),
    model: z.string(),
    status: z.enum(["running", "paused", "waiting", "failed", "completed", "cancelled"]),
    elapsedMs: z.number(),
    /** Where the trace is now, and the expected length of the whole run. */
    headMs: z.number(),
    totalMs: z.number(),
    tokens: z.number(),
    /** In US dollars. */
    cost: z.number(),
    steps: z.array(RunPlanStep),
    log: z.array(RunLogEntry),
    /** Set while the run waits for a person; the recipients are the accounts in the output. */
    approval: z.object({ step: z.number().int(), title: z.string(), description: z.string() }).optional(),
    /** Set when a step failed and the run stopped. */
    failure: z.object({ step: z.number().int(), toolName: z.string().optional(), message: z.string() }).optional(),
  })
  .meta({ id: "AgentRun" });
export type AgentRun = z.infer<typeof AgentRun>;

export const RunOutput = z
  .object({
    title: z.string(),
    /** Accounts found so far; empty shows placeholders. */
    accounts: z.array(RunAccount),
    /** The email drafted so far; absent shows placeholders. */
    email: z.object({ to: z.string(), subject: z.string(), highlights: z.array(z.string()), body: z.string() }).optional(),
    state: z.enum(["drafting", "ready", "sent", "held"]),
  })
  .meta({ id: "RunOutput" });
export type RunOutput = z.infer<typeof RunOutput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getRun: { method: "GET", path: "/runs/{id}", summary: "A run's plan, log and status", params: z.object({ id: z.string() }), response: AgentRun },
  getRunOutput: { method: "GET", path: "/runs/{id}/output", summary: "What the run has produced so far", params: z.object({ id: z.string() }), response: RunOutput },
  setRunPaused: { method: "POST", path: "/runs/{id}/pause", summary: "Pause or resume a run", params: z.object({ id: z.string() }), body: z.object({ paused: z.boolean() }) },
  cancelRun: { method: "POST", path: "/runs/{id}/cancel", summary: "Stop a run", params: z.object({ id: z.string() }) },
  retryRunStep: { method: "POST", path: "/runs/{id}/retry", summary: "Retry the failed step", params: z.object({ id: z.string() }) },
  decideRunApproval: { method: "POST", path: "/runs/{id}/approval", summary: "Approve or deny the paused step", params: z.object({ id: z.string() }), body: z.object({ approve: z.boolean(), recipients: z.array(z.string()) }) },
  rerun: { method: "POST", path: "/runs/{id}/rerun", summary: "Start the same task again", params: z.object({ id: z.string() }) },
});
