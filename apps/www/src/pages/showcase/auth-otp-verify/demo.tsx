// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to a simulated backend.
// Not shipped by the registry; builders wire OtpVerify to their own backend.
import { fail, ok } from "@wirefront/ui/wirefront/types";
import * as fixtures from "./fixtures";
import type { OtpInput } from "./schema";
import { OtpVerify } from "./view";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Simulated backend: a code of one repeated digit (e.g. 000000) is wrong. */
async function demoVerify({ code }: OtpInput) {
  await wait(1000);
  if (/^(\d)\1+$/.test(code)) return fail("That code didn’t work. Check the email and try again.");
  return ok(fixtures.verifyOtp);
}

async function demoResend() {
  await wait(600);
}

export function AuthOtpVerifyShowcasePage() {
  return (
    <OtpVerify cancelHref="#cancel" email={fixtures.email} onResend={demoResend} onVerify={demoVerify} otherMethodHref="#other-method" />
  );
}
