// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** What "Generate key" sends. */
export const NewApiKeyInput = z
  .object({
    name: z.string().trim().min(1, "Name the key after where it’s used.").max(80),
    scopes: z.array(z.string()).min(1, "Pick at least one scope."),
    /** Days until the key stops working; null for a key that never expires. */
    expiresInDays: z.number().int().positive().nullable(),
  })
  .meta({ id: "NewApiKeyInput" });
export type NewApiKeyInput = z.infer<typeof NewApiKeyInput>;

/** The created key, with its secret: the only time the secret leaves the server. */
export const NewApiKey = z.object({ id: z.string(), secret: z.string() }).meta({ id: "NewApiKey" });
export type NewApiKey = z.infer<typeof NewApiKey>;

/** The backend operations this screen calls. */
export const api = defineApi({
  createApiKey: {
    method: "POST",
    path: "/api-keys",
    summary: "Create a key; the response holds its secret once",
    body: NewApiKeyInput,
    response: NewApiKey,
  },
});
