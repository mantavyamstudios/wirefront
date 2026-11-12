// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Session } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const email = "you@example.com";

/** What the mocks return for a correct code (operation `verifyOtp`). */
export const verifyOtp: Session = { userId: "usr_01", redirectTo: "/dashboard" };
