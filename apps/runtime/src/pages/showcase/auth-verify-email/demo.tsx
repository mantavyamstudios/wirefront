// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: wires the view to a simulated backend inside devl.dev's frame.
// Not shipped by the registry; builders wire VerifyEmail to their own backend.
import { fail } from "@wirefront/ui/wirefront/types";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import type { VerifyEmailInput } from "./schema";
import { VerifyEmail } from "./view";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Simulated backend: a code of one repeated digit (e.g. 111111) is wrong. */
async function demoVerify({ code }: VerifyEmailInput) {
  await wait(800);
  if (/^(\d)\1+$/.test(code)) return fail("That code didn’t work. Check the email and try again.");
}

async function demoResend() {
  await wait(600);
}

export function AuthVerifyEmailShowcasePage() {
  return (
    <DevlFrame>
      <VerifyEmail changeEmailHref="#sign-up" continueHref="#continue" email={fixtures.email} onResend={demoResend} onVerify={demoVerify} />
    </DevlFrame>
  );
}
