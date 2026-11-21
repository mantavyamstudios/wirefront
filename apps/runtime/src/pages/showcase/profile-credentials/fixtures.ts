// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Credentials } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-26T12:00:00Z";

export const getCredentials: Credentials = {
  twoFactor: true,
  recoveryRotatedAt: "2026-04-12T12:00:00Z",
  sessions: [
    { id: "s1", device: "MacBook Pro", kind: "laptop", client: "Arc 1.42", location: "Brooklyn, NY · this network", ip: "203.0.113.18", lastActiveAt: "2026-04-26T12:00:00Z", current: true, trusted: true },
    { id: "s2", device: "iPhone 16 Pro", kind: "phone", client: "Acme app · iOS 18.4", location: "Brooklyn, NY", ip: "203.0.113.18", lastActiveAt: "2026-04-26T11:48:00Z", trusted: true },
    { id: "s3", device: "iPad Air", kind: "tablet", client: "Safari 18", location: "Brooklyn, NY", ip: "203.0.113.18", lastActiveAt: "2026-04-25T12:00:00Z", trusted: true },
    { id: "s4", device: "Chromebook", kind: "laptop", client: "Chrome 142", location: "Toronto, CA", ip: "198.51.100.7", lastActiveAt: "2026-04-23T12:00:00Z" },
    { id: "s5", device: "Pixel 8", kind: "phone", client: "Acme app · Android 15", location: "Berlin, DE", ip: "192.0.2.41", lastActiveAt: "2026-04-18T12:00:00Z", trusted: false },
  ],
  keys: [
    { id: "k1", label: "YubiKey 5C NFC", addedAt: "2024-04-02", lastUsedAt: "2026-04-26T09:00:00Z" },
    { id: "k2", label: "MacBook · Touch ID", addedAt: "2024-08-14", lastUsedAt: "2026-04-26T08:00:00Z" },
  ],
};
