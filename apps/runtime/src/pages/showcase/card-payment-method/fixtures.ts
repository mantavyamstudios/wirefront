// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { SavedCard } from "./schema";

/** What the mocks return for `listCards`. Demo data for the showcase and tests (test card numbers only). */
export const listCards: SavedCard[] = [
  {
    id: "pm_1",
    brand: "visa",
    last4: "4242",
    expMonth: 8,
    expYear: 2027,
    holder: "Ada Lovelace",
    primary: true,
  },
  {
    id: "pm_2",
    brand: "mastercard",
    last4: "8211",
    expMonth: 11,
    expYear: 2026,
    holder: "Ada Lovelace",
    primary: false,
  },
];
