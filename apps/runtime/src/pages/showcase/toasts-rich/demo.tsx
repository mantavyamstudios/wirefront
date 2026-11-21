// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: three notifications on load, with a fixed clock; Replay shows them again.
// Not shipped by the registry; builders call notifyActivity from their realtime feed.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useEffect } from "react";
import { ToastBackdrop } from "../_toast-backdrop";
import * as fixtures from "./fixtures";
import { ActivityToaster, createActivityToasts, notifyActivity } from "./view";

const toasts = createActivityToasts();
const demoNow = () => new Date(fixtures.now);
const seed = () => {
  for (const a of fixtures.activity) notifyActivity(toasts, a);
};

export function ToastsRichShowcasePage() {
  useEffect(() => seed(), []);
  return (
    <WirefrontProvider locale="en-US" now={demoNow}>
      <ActivityToaster toastManager={toasts}>
        <div className="relative min-h-svh bg-background text-foreground">
          <ToastBackdrop action="Replay notifications" onAction={seed} />
        </div>
      </ActivityToaster>
    </WirefrontProvider>
  );
}
