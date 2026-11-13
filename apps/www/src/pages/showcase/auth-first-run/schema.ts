// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const FirstRunTone = z
  .enum(["orange", "teal", "violet", "amber", "rose", "info", "success", "destructive"])
  .meta({ id: "FirstRunTone" });
export type FirstRunTone = z.infer<typeof FirstRunTone>;

/** The colours a workspace can pick. */
export const WorkspaceColor = z.enum(["orange", "teal", "violet", "amber", "info", "rose"]).meta({ id: "WorkspaceColor" });
export type WorkspaceColor = z.infer<typeof WorkspaceColor>;

/** The URL slug for a workspace name. Use the same function on the server. */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

/** Step 1: what "Continue" saves. */
export const WorkspaceStepInput = z
  .object({
    name: z.string().trim().min(1, "Give your workspace a name to continue.").max(60),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes."),
    color: WorkspaceColor,
    useCases: z.array(z.string()),
  })
  .meta({ id: "WorkspaceStepInput" });
export type WorkspaceStepInput = z.infer<typeof WorkspaceStepInput>;

export const InviteRole = z.enum(["admin", "member", "viewer"]).meta({ id: "FirstRunInviteRole" });
export type InviteRole = z.infer<typeof InviteRole>;

/** Step 3: what "Invite" sends. */
export const InviteStepInput = z
  .object({ invitations: z.array(z.object({ email: z.email(), role: InviteRole })).min(1) })
  .meta({ id: "InviteStepInput" });
export type InviteStepInput = z.infer<typeof InviteStepInput>;

/** Step 4: what "Create agent" sends. */
export const AgentInput = z
  .object({
    templateId: z.string(),
    name: z.string().trim().min(1, "Your agent needs a name.").max(80),
    instructions: z.string().max(4000),
  })
  .meta({ id: "AgentInput" });
export type AgentInput = z.infer<typeof AgentInput>;

export const Agent = z.object({ id: z.string(), name: z.string() }).meta({ id: "Agent" });
export type Agent = z.infer<typeof Agent>;

/** Booking a walkthrough: one of the offered slots, as an ISO date-time. */
export const BookWalkthroughInput = z.object({ startsAt: z.iso.datetime() }).meta({ id: "BookWalkthroughInput" });

const ToolParams = z.object({ toolId: z.string() });

/** The backend operations this screen calls. */
export const api = defineApi({
  checkSlug: {
    method: "GET",
    path: "/workspaces/slug-availability",
    summary: "Whether a workspace URL is free",
    query: z.object({ slug: z.string() }),
    response: z.object({ available: z.boolean() }),
  },
  saveWorkspace: {
    method: "PUT",
    path: "/workspace",
    summary: "Save the workspace's name, URL, colour and use cases",
    body: WorkspaceStepInput,
    errors: { 409: "That URL is taken" },
  },
  connectTool: {
    method: "POST",
    path: "/integrations/{toolId}/connect",
    summary: "Connect a tool (after the builder's OAuth flow)",
    params: ToolParams,
  },
  disconnectTool: { method: "DELETE", path: "/integrations/{toolId}", summary: "Disconnect a tool", params: ToolParams },
  sendInvites: { method: "POST", path: "/members/invitations/bulk", summary: "Email an invitation to each address", body: InviteStepInput },
  cancelInvite: {
    method: "DELETE",
    path: "/members/invitations/{email}",
    summary: "Cancel a pending invitation",
    params: z.object({ email: z.string() }),
  },
  createAgent: { method: "POST", path: "/agents", summary: "Create the first agent", body: AgentInput, response: Agent },
  bookWalkthrough: { method: "POST", path: "/walkthroughs", summary: "Book an onboarding call", body: BookWalkthroughInput },
});
