// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** What the first step submits. */
export const CreateWorkspaceInput = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Give the workspace a name.")
      .max(64, "Keep it under 64 characters."),
  })
  .meta({ id: "CreateWorkspaceInput" });
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceInput>;

/** One address in the invite step. */
export const InviteEmail = z.email("Enter a valid email address.");

/** What the invite step sends. */
export const InviteTeammatesInput = z
  .object({ emails: z.array(InviteEmail).min(1) })
  .meta({ id: "InviteTeammatesInput" });
export type InviteTeammatesInput = z.infer<typeof InviteTeammatesInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  createWorkspace: {
    method: "POST",
    path: "/workspaces",
    summary: "Create the user's first workspace",
    body: CreateWorkspaceInput,
    errors: { 409: "That name is taken" },
  },
  inviteTeammates: {
    method: "POST",
    path: "/workspaces/current/invites",
    summary: "Invite people to the new workspace",
    body: InviteTeammatesInput,
    errors: { 429: "Too many invites; try again later" },
  },
});
