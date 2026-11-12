// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: wires the view to a simulated backend inside devl.dev's frame.
// Not shipped by the registry; builders wire SignUp to their own backend.
import { fail, ok } from "@wirefront/ui/wirefront/types";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import type { SignUpInput } from "./schema";
import { SignUp } from "./view";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Simulated backend: the fixture's taken address is already registered. */
async function demoSignUp({ email }: SignUpInput) {
  await wait(900);
  if (email.toLowerCase() === fixtures.takenEmail) {
    return fail(undefined, { email: "An account with this email already exists. Sign in instead." });
  }
  return ok(fixtures.signUp);
}

export function AuthSignUpShowcasePage() {
  return (
    <DevlFrame>
      <SignUp onSignUp={demoSignUp} privacyHref="#privacy" product={fixtures.product} signInHref="#sign-in" termsHref="#terms" />
    </DevlFrame>
  );
}
