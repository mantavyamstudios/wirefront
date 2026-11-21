// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to a simulated backend and the previewed state.
// Not shipped by the registry; builders wire ResetPassword to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { ResetPassword } from "./view";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function demoReset() {
  await wait(800);
}

export function AuthResetPasswordShowcasePage() {
  const state = useShowcaseState();
  return (
    <ResetPassword
      forgotPasswordHref="#forgot-password"
      linkError={state === "error" ? "Reset links work once and expire after 30 minutes. Ask for a new one and use it straight away." : undefined}
      onReset={demoReset}
      signInHref="#sign-in"
      token={fixtures.token}
    />
  );
}
