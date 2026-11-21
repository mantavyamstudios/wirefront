// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { Passkey, RecoveryCodes, SecurityOverview } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-09-20T12:00:00.000Z";
export const product = "Ridgeline";
export const accountEmail = "ada@ridgeline.app";

/** What the mocks return for `getSecurity`. */
export const getSecurity: SecurityOverview = {
  passwordChangedAt: "2026-05-18T10:00:00.000Z",
  twoFactor: { enabled: true, enabledAt: "2026-01-12T10:00:00.000Z", recoveryCodesLeft: 8, recoveryCodesTotal: 10, recoveryCodesSaved: false },
  passkeys: [
    { id: "pk1", name: "MacBook Air", kind: "laptop", createdAt: "2026-03-04T10:00:00.000Z", lastUsedAt: "2026-09-20T10:00:00.000Z" },
    { id: "pk2", name: "Pixel 9", kind: "phone", createdAt: "2026-06-18T10:00:00.000Z", lastUsedAt: "2026-09-19T10:00:00.000Z" },
    { id: "pk3", name: "YubiKey 5C", kind: "key", createdAt: "2026-08-30T10:00:00.000Z", lastUsedAt: "2026-08-30T12:00:00.000Z" },
  ],
  sessions: [
    { id: "s1", browser: "Chrome", os: "macOS", kind: "laptop", location: "Lisbon, PT", lastActiveAt: "2026-09-20T12:00:00.000Z", current: true },
    { id: "s2", browser: "Ridgeline", os: "Android", kind: "phone", location: "Lisbon, PT", lastActiveAt: "2026-09-20T11:42:00.000Z", current: false },
    { id: "s3", browser: "Safari", os: "iPadOS", kind: "tablet", location: "Porto, PT", lastActiveAt: "2026-09-18T12:00:00.000Z", current: false },
    { id: "s4", browser: "Firefox", os: "Windows", kind: "desktop", location: "Rotterdam, NL", lastActiveAt: "2026-09-11T12:00:00.000Z", current: false },
  ],
};

/** What the mocks return for `getRecoveryCodes`. */
export const getRecoveryCodes: RecoveryCodes = [
  "hq7m-2kvd", "x4tn-9pwa", "c8rf-3mzk", "b2vh-7ytq", "n6pe-4wcs", "k9ga-5rxm", "t3wd-8nkf", "p5zc-6hve", "m7qy-2bdt", "r4kx-9fgu",
].map((code, i) => ({ code, used: i < 2 }));

/** What the mocks return for `regenerateRecoveryCodes`. */
export const regenerateRecoveryCodes: RecoveryCodes = [
  "f3kd-8mwq", "v7nt-2pxc", "a9re-5kzh", "w2yb-6tmf", "d8cq-3nvg", "j4hu-7rwe", "s6mf-9kdy", "e3xp-4bct", "g5wk-8zqn", "u7da-2hrs",
].map((code) => ({ code, used: false }));

/** What the mocks return for `addPasskey`. */
export const addPasskey: Passkey = { id: "pk_new", name: "MacBook Pro", kind: "laptop", createdAt: now, lastUsedAt: null };
