// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: a placeholder app whose Save shows the toast (one is shown on load).
// Not shipped by the registry; builders call notifySuccess after their own save.
import { useEffect } from "react";
import { ToastBackdrop } from "../_toast-backdrop";
import * as fixtures from "./fixtures";
import { createSuccessToasts, notifySuccess, SuccessToaster } from "./view";

const toasts = createSuccessToasts();

export function ToastsSuccessShowcasePage() {
  useEffect(() => {
    notifySuccess(toasts, { ...fixtures.saved, timeout: 0 });
  }, []);
  return (
    <SuccessToaster toastManager={toasts}>
      <div className="relative min-h-svh bg-background text-foreground">
        <ToastBackdrop action="Save settings" onAction={() => notifySuccess(toasts, fixtures.saved)} />
      </div>
    </SuccessToaster>
  );
}
