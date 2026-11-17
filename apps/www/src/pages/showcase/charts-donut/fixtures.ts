// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { RevenueMix } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const getRevenueMix: RevenueMix = {
  slices: [
    { id: "subscriptions", name: "Subscriptions", amount: 1184960 },
    { id: "addons", name: "Add-ons", amount: 334880 },
    { id: "services", name: "Services", amount: 180320 },
    { id: "marketplace", name: "Marketplace", amount: 84640 },
    { id: "other", name: "Other", amount: 55200 },
  ],
  previousTotal: 1611208,
};
