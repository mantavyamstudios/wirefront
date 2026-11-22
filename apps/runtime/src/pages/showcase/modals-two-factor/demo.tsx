// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to a simulated backend, with the dialog open.
// Not shipped by the registry; builders wire TwoFactorSetup to their own backend.
import { fail } from "@wirefront/ui/wirefront/types";
import * as fixtures from "./fixtures";
import type { VerifyTotpInput } from "./schema";
import { TwoFactorSetup } from "./view";

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

async function demoVerify({ code }: VerifyTotpInput) {
  await wait(700);
  // Any code but 000000 works in the demo.
  if (code === "000000")
    return fail(
      "That code didn’t match. Check your app’s clock and try again."
    );
}

export function ModalsTwoFactorShowcasePage() {
  return (
    <TwoFactorSetup
      account={fixtures.account}
      defaultOpen
      enrollment={fixtures.startTotpEnrollment}
      onVerify={demoVerify}
      step={{ current: 2, total: 3 }}
    />
  );
}
