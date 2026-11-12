// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { Session } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const product = "Ridgeline";
export const defaultEmail = "ada@ridgeline.app";

/** What the mocks return for a successful sign-in (operation `signIn`). */
export const signIn: Session = { userId: "usr_01", redirectTo: "/dashboard" };

/** What the mocks return for a successful passkey sign-in (operation `signInWithPasskey`). */
export const signInWithPasskey: Session = { userId: "usr_01", redirectTo: "/dashboard" };
