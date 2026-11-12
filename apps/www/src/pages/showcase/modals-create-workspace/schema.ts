// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const NAME_MAX_LENGTH = 50;

export const Visibility = z.enum(["private", "team", "public"]).meta({ id: "Visibility" });
export type Visibility = z.infer<typeof Visibility>;

/** The URL slug for a workspace name: lowercase words joined by hyphens. Use the same function on the server. */
export function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** What the dialog's form checks. */
export const CreateWorkspaceForm = z
  .object({
    name: z.string().trim().min(1, "Give the workspace a name.").max(NAME_MAX_LENGTH, `Keep it under ${NAME_MAX_LENGTH} characters.`),
    visibility: Visibility,
  })
  .meta({ id: "CreateWorkspaceForm" });

/** What the backend receives. */
export const CreateWorkspaceInput = CreateWorkspaceForm.extend({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
}).meta({ id: "CreateWorkspaceInput" });
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceInput>;

export const Workspace = z
  .object({ id: z.string(), name: z.string(), slug: z.string(), visibility: Visibility })
  .meta({ id: "Workspace" });
export type Workspace = z.infer<typeof Workspace>;

export const SlugAvailability = z.object({ available: z.boolean() }).meta({ id: "SlugAvailability" });

/** The backend operations this screen calls. */
export const api = defineApi({
  checkSlug: {
    method: "GET",
    path: "/workspaces/slug-availability",
    summary: "Whether a workspace URL is free",
    query: z.object({ slug: z.string() }),
    response: SlugAvailability,
  },
  createWorkspace: {
    method: "POST",
    path: "/workspaces",
    summary: "Create a workspace",
    body: CreateWorkspaceInput,
    response: Workspace,
    errors: { 409: "That URL is taken" },
  },
});
