// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const BenchCase = z.object({ id: z.string(), name: z.string(), input: z.string(), expected: z.string() }).meta({ id: "BenchCase" });
export type BenchCase = z.infer<typeof BenchCase>;

export const PromptVersion = z
  .object({
    id: z.string(),
    author: z.string(),
    /** ISO date the version was saved. */
    createdAt: z.string(),
    note: z.string(),
    prompt: z.string(),
    latencyMs: z.number(),
    /** US dollars per 1,000 runs. */
    costPer1k: z.number(),
    /** Share of cases that passed on the last full run, 0 to 1. */
    passRate: z.number().min(0).max(1),
  })
  .meta({ id: "PromptVersion" });
export type PromptVersion = z.infer<typeof PromptVersion>;

export const BenchPrompt = z
  .object({ name: z.string(), project: z.string(), /** The version serving in production. */ productionId: z.string().optional(), versions: z.array(PromptVersion), cases: z.array(BenchCase) })
  .meta({ id: "BenchPrompt" });
export type BenchPrompt = z.infer<typeof BenchPrompt>;

export const PromptSummary = z.object({ name: z.string(), project: z.string(), /** The latest version's pass rate. */ passRate: z.number().min(0).max(1) }).meta({ id: "PromptSummary" });
export type PromptSummary = z.infer<typeof PromptSummary>;

export const CaseResult = z
  .object({ status: z.enum(["queued", "running", "pass", "fail"]), score: z.number().min(0).max(1).nullable(), output: z.string().optional(), /** What the judge flagged. */ judgeNote: z.string().optional() })
  .meta({ id: "CaseResult" });
export type CaseResult = z.infer<typeof CaseResult>;

export const VersionReview = z.object({ kind: z.enum(["approved", "changes"]), comment: z.string(), by: z.string(), at: z.string() }).meta({ id: "VersionReview" });
export type VersionReview = z.infer<typeof VersionReview>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listPrompts: { method: "GET", path: "/evals/prompts", summary: "Prompts with their latest pass rate", response: z.array(PromptSummary) },
  getPrompt: { method: "GET", path: "/evals/prompts/{name}", summary: "A prompt's versions and test cases", params: z.object({ name: z.string() }), response: BenchPrompt },
  getCaseResults: { method: "GET", path: "/evals/prompts/{name}/versions/{version}/results", summary: "Each case's latest result for a version", params: z.object({ name: z.string(), version: z.string() }), response: z.record(z.string(), CaseResult) },
  runCases: { method: "POST", path: "/evals/prompts/{name}/versions/{version}/runs", summary: "Re-run cases against a version", params: z.object({ name: z.string(), version: z.string() }), body: z.object({ caseIds: z.array(z.string()).min(1) }) },
  reviewVersion: { method: "PUT", path: "/evals/prompts/{name}/versions/{version}/review", summary: "Approve a version or request changes", params: z.object({ name: z.string(), version: z.string() }), body: z.object({ kind: z.enum(["approved", "changes"]), comment: z.string() }) },
  withdrawReview: { method: "DELETE", path: "/evals/prompts/{name}/versions/{version}/review", summary: "Withdraw your review", params: z.object({ name: z.string(), version: z.string() }) },
});
