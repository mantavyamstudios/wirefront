// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const KeyEnvironment = z.enum(["live", "test"]).meta({ id: "KeyEnvironment" });
export type KeyEnvironment = z.infer<typeof KeyEnvironment>;

/**
 * A key as listed. Never includes the secret: store only a hash of it, and
 * show the secret once, when the key is created or rotated.
 */
export const ApiKey = z
  .object({
    id: z.string(),
    name: z.string(),
    env: KeyEnvironment,
    /** The start of the key, e.g. "wf_live_8f4a". */
    prefix: z.string(),
    /** Its last four characters. */
    last4: z.string().length(4),
    scopes: z.array(z.string()),
    createdAt: z.iso.datetime(),
    lastUsedAt: z.iso.datetime().nullable(),
    expiresAt: z.iso.datetime().nullable(),
  })
  .meta({ id: "ApiKey" });
export type ApiKey = z.infer<typeof ApiKey>;

/** What the "New key" dialog's form checks. */
export const NewKeyForm = z.object({ name: z.string().trim().min(1, "Name the key after where it's used.").max(80) });

export const CreateKeyInput = NewKeyForm.extend({
  env: KeyEnvironment,
  scopes: z.array(z.string()).min(1, "Pick at least one scope."),
}).meta({ id: "CreateKeyInput" });
export type CreateKeyInput = z.infer<typeof CreateKeyInput>;

/** A new or rotated key, with its secret: the only time the secret leaves the server. */
export const CreatedKey = z.object({ key: ApiKey, secret: z.string() }).meta({ id: "CreatedKey" });
export type CreatedKey = z.infer<typeof CreatedKey>;

const KeyParams = z.object({ id: z.string() });

/** The backend operations this screen calls. */
export const api = defineApi({
  listKeys: { method: "GET", path: "/api-keys", summary: "List API keys (never their secrets)", response: z.array(ApiKey) },
  createKey: { method: "POST", path: "/api-keys", summary: "Create a key; the response holds its secret once", body: CreateKeyInput, response: CreatedKey },
  rotateKey: {
    method: "POST",
    path: "/api-keys/{id}/rotate",
    summary: "Replace a key's secret; the old secret stops working",
    params: KeyParams,
    response: CreatedKey,
  },
  revokeKey: { method: "DELETE", path: "/api-keys/{id}", summary: "Revoke a key", params: KeyParams },
});
