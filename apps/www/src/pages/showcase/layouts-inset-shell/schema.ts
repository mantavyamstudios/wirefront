// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ShellUser = z.object({ name: z.string(), email: z.email(), avatarUrl: z.url().optional() }).meta({ id: "InsetShellUser" });
export type ShellUser = z.infer<typeof ShellUser>;

export const ShellWorkspace = z.object({ id: z.string(), name: z.string(), plan: z.string().optional() }).meta({ id: "InsetShellWorkspace" });
export type ShellWorkspace = z.infer<typeof ShellWorkspace>;

export const InsetShellContext = z
  .object({
    user: ShellUser,
    workspace: ShellWorkspace,
    /** Every workspace the user belongs to, for the switcher. */
    workspaces: z.array(ShellWorkspace),
    /** Unread notifications, for the bell. */
    unread: z.int().min(0),
  })
  .meta({ id: "InsetShellContext" });
export type InsetShellContext = z.infer<typeof InsetShellContext>;

/** The backend operations this screen calls. Navigation itself is your app's config. */
export const api = defineApi({
  getShellContext: {
    method: "GET",
    path: "/me/shell",
    summary: "Who is signed in, their workspaces and the unread count",
    response: InsetShellContext,
  },
  switchWorkspace: {
    method: "POST",
    path: "/me/workspace",
    summary: "Make another workspace the current one",
    body: z.object({ workspaceId: z.string() }),
  },
  signOut: { method: "POST", path: "/auth/sign-out", summary: "End the session" },
});
