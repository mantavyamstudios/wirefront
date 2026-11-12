// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { Account } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const product = "Ridgeline";

/** What the mocks return for a successful sign-up (operation `signUp`). */
export const signUp: Account = { userId: "usr_02", redirectTo: "/verify-email" };

/** An address the demo backend treats as already registered. */
export const takenEmail = "ada@ridgeline.app";
