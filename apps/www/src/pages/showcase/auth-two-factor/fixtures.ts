// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Session } from "./schema";

/** What the mocks return for a correct code (operation `verifyTwoFactor`). */
export const verifyTwoFactor: Session = { userId: "usr_01", redirectTo: "/dashboard" };

/** How long the demo remembers a device. */
export const rememberDays = 30;
