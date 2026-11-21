// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import {
  GitBranchIcon,
  LifeBuoyIcon,
  MailIcon,
  MessagesSquareIcon,
  NotebookPenIcon,
  PenToolIcon,
  SparklesIcon,
  TableIcon,
  TelescopeIcon,
} from "lucide-react";
import type { Agent } from "./schema";
import type { AgentTemplate, FirstRunTool } from "./view";

/** Demo data for the showcase, the generated mocks and tests. */
export const product = "Hearth";
export const domain = "hearth.app";
export const defaultWorkspaceName = "Northwind Labs";
export const takenSlugs = ["northwind", "acme", "hearth", "admin"];
export const workspaceHref = "/";

export const useCases = ["Support", "Engineering", "Sales", "Research", "Operations", "Marketing"];

export const tools: FirstRunTool[] = [
  { id: "relay", name: "Relay", blurb: "Team chat", icon: MessagesSquareIcon, tone: "info" },
  { id: "forge", name: "Forge", blurb: "Code & reviews", icon: GitBranchIcon, tone: "violet" },
  { id: "postbox", name: "Postbox", blurb: "Shared inbox", icon: MailIcon, tone: "orange" },
  { id: "gridline", name: "Gridline", blurb: "Spreadsheets", icon: TableIcon, tone: "success" },
  { id: "harbor", name: "Harbor Desk", blurb: "Support tickets", icon: LifeBuoyIcon, tone: "teal" },
  { id: "inkwell", name: "Inkwell", blurb: "Design files", icon: PenToolIcon, tone: "rose" },
];

export const templates: AgentTemplate[] = [
  {
    id: "triage",
    name: "Support triage",
    description: "Tags and drafts first replies",
    icon: LifeBuoyIcon,
    tone: "teal",
    instructions:
      "Read every new ticket. Tag it by product area and urgency, draft a friendly first reply, and escalate anything about billing to a human.",
  },
  {
    id: "research",
    name: "Research analyst",
    description: "Digs up sources, cites them",
    icon: TelescopeIcon,
    tone: "info",
    instructions:
      "When asked a question, search our docs and the web, compare at least three sources and answer with a short summary plus citations.",
  },
  {
    id: "standup",
    name: "Standup writer",
    description: "Daily digest from your tools",
    icon: NotebookPenIcon,
    tone: "orange",
    instructions:
      "Every weekday at 9:00, collect yesterday’s merged work and open blockers, then post a three-bullet standup per person in #team.",
  },
  { id: "blank", name: "Start blank", description: "Write your own brief", icon: SparklesIcon, tone: "amber", instructions: "" },
];

export const inviteSuggestions = ["maya@northwind.io", "theo@northwind.io", "ines@northwind.io"];

/** Walkthrough slots the backend offers, as ISO date-times. */
export const walkthroughSlots = ["2026-10-28T10:00:00Z", "2026-10-28T14:30:00Z", "2026-10-29T09:30:00Z", "2026-10-30T16:00:00Z"];

/** What the mocks return for `checkSlug`. */
export const checkSlug = { available: true };

/** What the mocks return for `createAgent`. */
export const createAgent: Agent = { id: "agt_1", name: "Support triage" };
