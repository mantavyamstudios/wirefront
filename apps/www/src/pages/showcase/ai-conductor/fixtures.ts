// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { BriefField, Helper } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const fields: BriefField[] = [
  { key: "project", label: "Project", kind: "text", placeholder: "Untitled launch" },
  { key: "date", label: "Launch date", kind: "text", placeholder: "Empty" },
  { key: "audience", label: "Audience", kind: "chips" },
  { key: "budget", label: "Budget", kind: "text", placeholder: "Empty" },
  { key: "goal", label: "Goal", kind: "textarea", placeholder: "One sentence on why this matters" },
  { key: "metric", label: "Target", kind: "text", placeholder: "Empty" },
  { key: "tone", label: "Voice", kind: "text", placeholder: "Empty" },
  { key: "channels", label: "Channels", kind: "chips", placeholder: "Waiting on your pick" },
];

/** Each helper's steps, played in order while it works. */
export const helpers: (Omit<Helper, "status" | "progress" | "activity"> & { steps: string[] })[] = [
  { id: "scout", name: "Scout", role: "Research", tone: "teal", steps: ["Reading 12 agency launch posts", "Comparing 4 calendar tools", "Summarising what worked"], result: "3 launch patterns from 12 posts" },
  { id: "ledger", name: "Ledger", role: "Budget", tone: "violet", steps: ["Splitting $40k across channels", "Checking cost-per-trial benchmarks", "Drafting the budget table"], result: "Budget table, $18 per trial" },
  { id: "quill", name: "Quill", role: "Copy", tone: "orange", steps: ["Drafting six taglines", "Writing launch email v1", "Needs channels to finish"], result: "6 taglines and launch email v1" },
  { id: "iris", name: "Iris", role: "Design", tone: "info", steps: ["Sizing assets per channel", "Pulling a warm palette", "Exporting the moodboard"], result: "14 assets sized for 2 channels" },
];

export type Cue =
  | { wait: number; user: string }
  | { wait: number; agent: string; spawned?: string[]; updated?: number; choices?: { prompt: string; options: string[] } }
  | { wait: number; fill: Record<string, string | string[]> }
  | { wait: number; start: string[] };

/** The conversation the demo plays, up to the agent's question. */
export const script: Cue[] = [
  { wait: 500, user: "We’re launching Orbit Calendar on Nov 18. Need a launch plan aimed at small agencies, budget around $40k." },
  { wait: 900, agent: "On it. I’ve opened a brief and filled in what you gave me. Scout is reading how similar tools launched, and Ledger is sketching a budget split.", spawned: ["scout", "ledger"], updated: 4 },
  { wait: 200, fill: { project: "Orbit Calendar launch", date: "Nov 18, 2026", audience: ["Small agencies", "Freelance studios"], budget: "$40,000" } },
  { wait: 300, start: ["scout", "ledger"] },
  { wait: 4200, user: "Main goal is 2,000 trial signups in the first month. Keep it warm, not salesy." },
  { wait: 900, agent: "Got it. Goal, metric and voice are in. Quill is drafting taglines in that tone.", spawned: ["quill"], updated: 3 },
  { wait: 200, fill: { goal: "Get small agencies to try Orbit Calendar as the one planner the whole team shares.", metric: "2,000 trial signups in 30 days", tone: "Warm and plain-spoken, no hype" } },
  { wait: 300, start: ["quill"] },
  { wait: 4800, agent: "Scout found that agency tools do best through partner referrals and a short newsletter run. Which channels should we commit to?", choices: { prompt: "Pick the channels to commit to", options: ["Newsletter", "Product Hunt", "LinkedIn", "Partner agencies", "Podcasts"] } },
];

/** What the demo plays after the channels are picked. */
export const finish: Cue[] = [
  { wait: 700, agent: "Perfect. Channels are set, Iris is sizing assets for each, and Quill can finish the copy. The brief is complete whenever you are.", spawned: ["iris"], updated: 1 },
  { wait: 200, start: ["iris"] },
];

export const acknowledgement = "Noted. I’ll pass that to the helpers so they pick it up on their next pass.";
export const handOffTarget = "#launch-orbit";

/** A fresh session: no messages yet and every helper queued. */
export const getConductorSession = {
  messages: [],
  helpers: helpers.map(({ steps: _steps, ...h }) => ({ ...h, status: "queued" as const, progress: 0 })),
  fields,
  values: {},
};
