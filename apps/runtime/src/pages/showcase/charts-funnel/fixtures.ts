// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Funnel } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const getFunnel: Funnel = {
  stages: [
    { id: "visit", name: "Visited landing", short: "Visit", kind: "Page view", count: 48214 },
    { id: "signup", name: "Started signup", short: "Signup", kind: "Click", count: 12480 },
    { id: "verify", name: "Verified email", short: "Verify", kind: "Confirmation", count: 9842 },
    { id: "onboard", name: "Completed onboarding", short: "Onboard", kind: "Step 4", count: 7321 },
    { id: "activate", name: "Activated workspace", short: "Activate", kind: "First action", count: 4209 },
    { id: "invite", name: "Invited a teammate", short: "Invite", kind: "Conversion", count: 1864 },
  ],
  highlights: [
    { from: "visit", to: "signup", target: 0.25 },
    { from: "signup", to: "activate", target: 0.4 },
    { from: "activate", to: "invite", target: 0.4 },
  ],
};
