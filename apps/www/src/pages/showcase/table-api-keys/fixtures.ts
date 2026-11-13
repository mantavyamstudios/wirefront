// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ApiKey, CreatedKey } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-20T12:00:00.000Z";
export const scopes = ["read", "write", "events.write", "admin"];

/** What the mocks return for `listKeys`. */
export const listKeys: ApiKey[] = [
  { id: "key_prod", name: "Production server", env: "live", prefix: "wf_live_8f4a", last4: "91c2", scopes: ["read", "write"], createdAt: "2026-01-12T09:00:00.000Z", lastUsedAt: "2026-04-20T11:58:00.000Z", expiresAt: null },
  { id: "key_hooks", name: "Webhook receiver", env: "live", prefix: "wf_live_220b", last4: "77fd", scopes: ["events.write"], createdAt: "2026-03-03T09:00:00.000Z", lastUsedAt: "2026-04-19T22:00:00.000Z", expiresAt: "2026-07-03T00:00:00.000Z" },
  { id: "key_ci", name: "CI / Vercel", env: "live", prefix: "wf_live_e1d1", last4: "3a04", scopes: ["read"], createdAt: "2026-03-28T09:00:00.000Z", lastUsedAt: "2026-04-17T12:00:00.000Z", expiresAt: null },
  { id: "key_local", name: "Local dev", env: "test", prefix: "wf_test_aabc", last4: "1d44", scopes: ["read", "write", "admin"], createdAt: "2026-04-18T09:00:00.000Z", lastUsedAt: "2026-04-20T12:00:00.000Z", expiresAt: null },
  { id: "key_mobile", name: "Mobile staging", env: "test", prefix: "wf_test_4491", last4: "f2bc", scopes: ["read"], createdAt: "2026-04-02T09:00:00.000Z", lastUsedAt: null, expiresAt: null },
];

const first = listKeys[0] as ApiKey;

/** What the mocks return for `createKey`. */
export const createKey: CreatedKey = {
  key: { ...first, id: "key_new", name: "New key", createdAt: now, lastUsedAt: null, last4: "c0de" },
  secret: "wf_live_9b1e7f3a52d84c6e0a1b2c3d4e5fc0de",
};

/** What the mocks return for `rotateKey`. */
export const rotateKey: CreatedKey = { key: { ...first, last4: "4f1a" }, secret: "wf_live_8f4a00d1e2f3a4b5c6d7e8f9a0b14f1a" };
