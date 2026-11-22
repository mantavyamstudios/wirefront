// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: sending fails, and Retry succeeds after a moment.
// Not shipped by the registry; builders pass their own retry action.
import { useEffect } from "react";
import { ToastBackdrop } from "../_toast-backdrop";
import * as fixtures from "./fixtures";
import { createErrorToasts, ErrorToaster, notifyError } from "./view";

const toasts = createErrorToasts();
const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
const show = () =>
  notifyError(toasts, { ...fixtures.inviteFailed, retry: () => wait(1200) });

export function ToastsErrorRetryShowcasePage() {
  useEffect(() => {
    show();
  }, []);
  return (
    <ErrorToaster toastManager={toasts}>
      <div className="relative min-h-svh bg-background text-foreground">
        <ToastBackdrop
          action="Send invite"
          onAction={show}
          topPadding="pt-48"
        />
      </div>
    </ErrorToaster>
  );
}
