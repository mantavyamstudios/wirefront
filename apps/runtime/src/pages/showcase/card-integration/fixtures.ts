// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ConnectedService } from "./schema";

/** The demo's clock. */
export const now = "2026-04-25T12:00:00Z";

/** What the mocks return for `listConnectedServices`. Demo data for the showcase and tests. */
export const listConnectedServices: ConnectedService[] = [
  {
    id: "chat",
    name: "Relay",
    blurb: "Post task updates to channels.",
    enabled: true,
    health: "ok",
    scopes: ["#eng-platform", "#design-crit", "+3 channels"],
    lastSyncAt: "2026-04-25T11:58:00Z",
  },
  {
    id: "code",
    name: "Forge",
    blurb: "Link pull requests to issues automatically.",
    enabled: true,
    health: "warn",
    scopes: ["org/scratchpad", "org/wirefront"],
    lastSyncAt: "2026-04-25T11:20:00Z",
    note: "rate-limited · retrying",
  },
  { id: "tracker", name: "Tracklane", blurb: "Two-way sync with your issue tracker.", enabled: false, health: "ok", scopes: [], lastSyncAt: null },
];
