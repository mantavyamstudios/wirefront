// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ShellUser = z
  .object({ name: z.string(), email: z.email(), avatarUrl: z.url().optional() })
  .meta({ id: "ShellUser" });
export type ShellUser = z.infer<typeof ShellUser>;

export const ShellWorkspace = z.object({ id: z.string(), name: z.string() }).meta({ id: "ShellWorkspace" });
export type ShellWorkspace = z.infer<typeof ShellWorkspace>;

export const ShellContext = z
  .object({
    user: ShellUser,
    workspace: ShellWorkspace,
    /** Unread notifications, for the bell. */
    unread: z.int().min(0),
  })
  .meta({ id: "ShellContext" });
export type ShellContext = z.infer<typeof ShellContext>;

/** The backend operations this screen calls. Navigation itself is your app's config. */
export const api = defineApi({
  getShellContext: { method: "GET", path: "/me/shell", summary: "Who is signed in, which workspace, and unread count", response: ShellContext },
});
