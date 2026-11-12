// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to a simulated backend.
// Not shipped by the registry; builders wire TwoFactor to their own backend.
import { fail, ok } from "@wirefront/ui/wirefront/types";
import * as fixtures from "./fixtures";
import type { TwoFactorInput } from "./schema";
import { TwoFactor } from "./view";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Simulated backend: an app code of one repeated digit (e.g. 000000) is wrong. */
async function demoVerify(input: TwoFactorInput) {
  await wait(800);
  if (input.method === "totp" && /^(\d)\1+$/.test(input.code)) return fail("That code didn’t work. Codes change every 30 seconds; try the current one.");
  return ok(fixtures.verifyTwoFactor);
}

export function AuthTwoFactorShowcasePage() {
  return <TwoFactor onVerify={demoVerify} rememberDays={fixtures.rememberDays} supportHref="#support" />;
}
