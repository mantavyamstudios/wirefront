// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { AgentRun, RunAccount, RunOutput, RunToolCall } from "./schema";

/** A step in the demo's script: the tools it calls and what it reveals. */
export interface ScriptStep {
  title: string;
  tools?: (RunToolCall & {
    result: string /** Fails the first time with this message, then retries. */;
    failsOnce?: string;
  })[];
  thought?: string;
  reveal?: "accounts" | "email";
  approval?: {
    title: string;
    description: string;
    tool: RunToolCall & { result: string };
  };
}

/** Demo data for the showcase, the generated mocks and tests. */
export const run = {
  id: "run_8f3k21",
  agentName: "Renewal Scout",
  task: "Find Q3 renewals at risk and draft outreach for each account owner.",
  model: "relay-2-large",
};

export const accounts: RunAccount[] = [
  {
    company: "Halcyon Freight",
    contact: "Ines Duarte",
    email: "ines@halcyon.example",
    score: 0.86,
    arr: "$84k",
  },
  {
    company: "Brightwater Labs",
    contact: "Theo Marsh",
    email: "theo@brightwater.example",
    score: 0.81,
    arr: "$62k",
  },
  {
    company: "Copperline",
    contact: "Ana Petrov",
    email: "ana@copperline.example",
    score: 0.77,
    arr: "$45k",
  },
  {
    company: "Northgate Health",
    contact: "Sam Okoro",
    email: "sam@northgate.example",
    score: 0.72,
    arr: "$120k",
  },
  {
    company: "Juniper & Vale",
    contact: "Lena Fischer",
    email: "lena@junipervale.example",
    score: 0.69,
    arr: "$38k",
  },
  {
    company: "Orbit Supply",
    contact: "Kai Tanaka",
    email: "kai@orbitsupply.example",
    score: 0.67,
    arr: "$29k",
  },
  {
    company: "Mosswood",
    contact: "Priya Nair",
    email: "priya@mosswood.example",
    score: 0.65,
    arr: "$51k",
  },
  {
    company: "Tidewell",
    contact: "Owen Price",
    email: "owen@tidewell.example",
    score: 0.64,
    arr: "$33k",
  },
  {
    company: "Larkspur Media",
    contact: "Rosa Lind",
    email: "rosa@larkspur.example",
    score: 0.63,
    arr: "$26k",
  },
  {
    company: "Fieldnote",
    contact: "Ben Adler",
    email: "ben@fieldnote.example",
    score: 0.62,
    arr: "$41k",
  },
  {
    company: "Cinder Robotics",
    contact: "Mei Chen",
    email: "mei@cinder.example",
    score: 0.61,
    arr: "$97k",
  },
  {
    company: "Paloma Travel",
    contact: "Luis Ortega",
    email: "luis@paloma.example",
    score: 0.6,
    arr: "$22k",
  },
];

export const steps: ScriptStep[] = [
  {
    title: "Pull renewals due in 90 days",
    tools: [
      {
        name: "crm.search_accounts",
        kind: "db",
        args: { renews_within: "90d", segment: "mid-market" },
        result: "41 accounts",
        ms: 1100,
        tokens: 820,
      },
    ],
    thought:
      "41 is too many to personalise well. Narrowing with support signals first.",
  },
  {
    title: "Read recent support threads",
    tools: [
      {
        name: "helpdesk.list_threads",
        kind: "search",
        args: { accounts: 41, since: "30d" },
        result: "128 threads",
        ms: 1300,
        tokens: 2400,
      },
      {
        name: "helpdesk.sentiment",
        kind: "search",
        args: { threads: 128 },
        result: "19 accounts trending negative",
        ms: 1100,
        tokens: 1900,
        failsOnce: "429 Too Many Requests · retrying in 2s",
      },
    ],
  },
  {
    title: "Score churn risk",
    tools: [
      {
        name: "python.run",
        kind: "code",
        args: { script: "score_churn.py", accounts: 19 },
        result: "12 accounts ≥ 0.60",
        ms: 1500,
        tokens: 1300,
      },
    ],
    reveal: "accounts",
    thought:
      "Halcyon and Brightwater both raised the September double charge. Leading with the billing fix.",
  },
  {
    title: "Draft personalised outreach",
    tools: [
      {
        name: "docs.create_draft",
        kind: "doc",
        args: { template: "renewal-check-in", accounts: 12 },
        result: "12 drafts",
        ms: 900,
        tokens: 3100,
      },
    ],
    reveal: "email",
  },
  {
    title: "Send emails via Postbox",
    approval: {
      title: "Send renewal emails?",
      description:
        "Renewal Scout wants to send from maya@relay.example. Untick anyone you’d rather call.",
      tool: {
        name: "postbox.send_batch",
        kind: "send",
        args: { from: "maya@relay.example", template: "renewal-check-in" },
        result: "{n} sent · 0 bounced",
        ms: 1400,
        tokens: 400,
      },
    },
  },
  {
    title: "Log follow-ups in CRM",
    tools: [
      {
        name: "crm.create_tasks",
        kind: "task",
        args: { owner: "maya", due: "+3d" },
        result: "Follow-ups due Friday",
        ms: 900,
        tokens: 600,
      },
    ],
  },
];

export const email = {
  to: "Ines Duarte <ines@halcyon.example>",
  subject: "Your September invoice, and your renewal",
  highlights: ["Sep double charge", "Renews Nov 14", "Route planning ask"],
  body: "Hi Ines,\n\nThanks for flagging the double charge on your September invoice. You were right, and the fix ships with the October billing run. I’ve credited the difference to your account, so there’s nothing more to do on your side.\n\nBefore your renewal on November 14, I’d love 20 minutes to walk through the new route-planning limits your dispatch team asked about. Would Tuesday or Thursday afternoon work?\n\nBest,\nMaya",
};

/** A run that has just started. */
export const getRun: AgentRun = {
  ...run,
  status: "running",
  elapsedMs: 0,
  headMs: 0,
  totalMs: 24_000,
  tokens: 0,
  cost: 0,
  steps: steps.map((s) => ({
    title: s.title,
    status: "pending",
    approval: Boolean(s.approval),
  })),
  log: [],
};
export const getRunOutput: RunOutput = {
  title: "Q3 renewal outreach",
  accounts: [],
  state: "drafting",
};
