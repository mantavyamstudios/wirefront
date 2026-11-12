// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: wires the view to simulated actions and the previewed state.
// Not shipped by the registry; builders wire SignIn to their own backend.
import { fail, ok } from "@wirefront/ui/wirefront/types";
import { DevlFrame } from "../_devl-frame";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import type { SignInInput } from "./schema";
import { SignIn } from "./view";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Simulated backend: any password under 8 characters, or containing "wrong", is rejected. */
async function demoSignIn({ password }: SignInInput) {
  await wait(900);
  if (password.length < 8 || password.toLowerCase().includes("wrong")) {
    return fail(undefined, { password: "That password doesn’t match this account." });
  }
  return ok(fixtures.signIn);
}

async function demoPasskey() {
  await wait(1200);
  return ok(fixtures.signInWithPasskey);
}

export function AuthSignInShowcasePage() {
  const state = useShowcaseState();
  return (
    <DevlFrame>
      <SignIn
        defaultEmail={fixtures.defaultEmail}
        error={state === "error" ? "Your session expired. Sign in again to continue." : undefined}
        forgotPasswordHref="#forgot-password"
        onPasskey={demoPasskey}
        onSignIn={demoSignIn}
        product={fixtures.product}
        signUpHref="#sign-up"
        ssoHref="#sso"
      />
    </DevlFrame>
  );
}
