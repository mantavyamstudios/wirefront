// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type {
  AssistantApp,
  AssistantChat,
  AssistantProject,
  AssistantSuggestion,
} from "./schema";

/** The demo clock; chat times are relative to it. */
export const now = "2026-10-02T15:00:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const user = {
  name: "Mara Okafor",
  initials: "MO",
  workspace: "Northlight Studio",
};

export const listProjects: AssistantProject[] = [
  { id: "launch", name: "Aurora launch", tone: "orange" },
  { id: "renewals", name: "Q3 renewals", tone: "teal" },
  { id: "hiring", name: "Design hiring", tone: "info" },
];

export const listChats: AssistantChat[] = [
  {
    id: "c1",
    title: "Summarise the pricing page feedback",
    updatedAt: "2026-10-02T14:58:00Z",
    projectId: "launch",
  },
  {
    id: "c2",
    title: "Which renewals slip past October?",
    updatedAt: "2026-10-02T14:00:00Z",
    projectId: "renewals",
  },
  {
    id: "c3",
    title: "Draft the Aurora press note",
    updatedAt: "2026-10-02T12:00:00Z",
    projectId: "launch",
  },
  {
    id: "c4",
    title: "Portfolio review rubric for juniors",
    updatedAt: "2026-10-01T11:00:00Z",
    projectId: "hiring",
  },
  {
    id: "c5",
    title: "Rewrite onboarding email in a warmer tone",
    updatedAt: "2026-09-29T10:00:00Z",
  },
  {
    id: "c6",
    title: "Compare churn by plan tier",
    updatedAt: "2026-09-28T09:00:00Z",
    projectId: "renewals",
  },
];

export const listApps: AssistantApp[] = [
  {
    id: "mail",
    name: "Postbox",
    detail: "1,204 threads",
    tone: "info",
    connected: true,
  },
  {
    id: "cal",
    name: "Daybook",
    detail: "This week",
    tone: "orange",
    connected: true,
  },
  {
    id: "drive",
    name: "Vault",
    detail: "382 files",
    tone: "teal",
    connected: true,
  },
  {
    id: "tracker",
    name: "Linewise",
    detail: "64 open issues",
    tone: "amber",
    connected: true,
  },
  {
    id: "ledger",
    name: "Tally",
    detail: "Not connected",
    tone: "success",
    connected: false,
  },
];

export const suggestions: AssistantSuggestion[] = [
  {
    id: "s1",
    title: "Catch me up on this week",
    description: "Threads, meetings and decisions you missed",
    prompt:
      "Catch me up on everything that happened this week across mail and calendar, grouped by project.",
    tone: "orange",
  },
  {
    id: "s2",
    title: "Find renewals at risk",
    description: "Cross-check the tracker with recent emails",
    prompt:
      "Which Q3 renewals look at risk? Cross-check open issues in Linewise with the latest customer emails.",
    tone: "teal",
  },
  {
    id: "s3",
    title: "Brief from a spreadsheet",
    description: "Upload a CSV and get a one-page summary",
    prompt:
      "Turn the attached spreadsheet into a one-page brief with the three numbers leadership should care about.",
    tone: "info",
  },
  {
    id: "s4",
    title: "Prototype a landing hero",
    description: "Open a canvas with copy and layout ideas",
    prompt:
      "Sketch three hero sections for the Aurora launch page, each with a headline, subline and CTA.",
    tone: "amber",
  },
];

export const tools = [
  { id: "web", label: "Search" },
  { id: "research", label: "Deep research" },
  { id: "code", label: "Code" },
  { id: "canvas", label: "Canvas" },
];

export const models = [
  { value: "wren-pro", label: "Wren 3 Pro" },
  { value: "wren-flash", label: "Wren 3 Flash" },
  { value: "wren-reason", label: "Wren 3 Reason" },
];

export const placeholders = [
  "Ask anything, or @mention an app…",
  "Plan my Thursday around the launch review",
  "What did customers say about the new pricing?",
  "Draft a reply to the Halcyon contract thread",
];

/** The reply the demo streams back. */
export const reply = [
  "Here’s a first pass{from}.",
  "Three things stand out. The Halcyon and Brightwater threads both mention the October price change, so I’d treat those as one conversation. The launch review moved to Thursday, which leaves a single day to land the press note. And two open Linewise issues are blocking the same customer, which is worth a direct reply rather than a ticket update.",
  "Want me to draft the replies, block time on Thursday, or turn this into a checklist for the team?",
].join("\n\n");
