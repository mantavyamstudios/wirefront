// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Toast } from "@base-ui/react/toast";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useMessages } from "@wirefront/ui/wirefront/provider";
import { CheckIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("successToaster.<key>"). */
export const SUCCESS_TOASTER_MESSAGES = {
  dismiss: "Dismiss",
};

export type SuccessToastManager = ReturnType<typeof Toast.createToastManager>;

/** Create one manager per app (e.g. in a module) and pass it to SuccessToaster and notifySuccess. */
export const createSuccessToasts = (): SuccessToastManager =>
  Toast.createToastManager();

/** Show a success toast. Reusing an id refreshes that toast instead of stacking another. timeout 0 keeps it until dismissed. */
export function notifySuccess(
  manager: SuccessToastManager,
  toast: { id?: string; title: string; description?: string; timeout?: number }
) {
  return manager.add({ ...toast, type: "success" });
}

export interface SuccessToasterProps {
  toastManager: SuccessToastManager;
  /** Your app; toasts render above it. */
  children?: ReactNode;
  className?: string;
}

// Phones: full-width under the top safe area. sm+: a 20rem column top-right.
// Toasts announce politely (role="status"), pause on hover/focus and can be swiped away.
function Viewport({ className }: { className?: string }) {
  const t = useMessages("successToaster", SUCCESS_TOASTER_MESSAGES);
  const { toasts } = Toast.useToastManager();
  return (
    <Toast.Portal>
      <Toast.Viewport
        className={cn(
          "fixed inset-x-0 top-0 z-50 flex flex-col gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))] outline-none sm:inset-x-auto sm:inset-e-6 sm:top-6 sm:w-80 sm:px-0 sm:pt-0",
          className
        )}
      >
        {toasts.map((toast) => (
          <Toast.Root
            className="flex translate-x-(--toast-swipe-movement-x) translate-y-(--toast-swipe-movement-y) items-center gap-3 rounded-lg border border-border/70 bg-background px-3.5 py-3 shadow-lg transition-[translate,opacity] duration-300 data-ending-style:opacity-0 data-starting-style:-translate-y-3 data-starting-style:opacity-0 motion-reduce:transition-none"
            key={toast.id}
            swipeDirection={["up", "right"]}
            toast={toast}
          >
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-category-2/15 text-category-2-foreground"
            >
              <CheckIcon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <Toast.Title className="font-medium text-sm" />
              <Toast.Description className="mt-0.5 text-muted-foreground text-xs" />
            </div>
            <Toast.Close
              aria-label={t.dismiss}
              className="-me-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-10"
            >
              <XIcon aria-hidden className="size-3.5" />
            </Toast.Close>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

/** The provider and viewport for success toasts. Mount it once around your app. */
export function SuccessToaster({
  toastManager,
  children,
  className,
}: SuccessToasterProps) {
  return (
    <ScreenBoundary name="SuccessToaster">
      <Toast.Provider toastManager={toastManager}>
        {children}
        <Viewport className={className} />
      </Toast.Provider>
    </ScreenBoundary>
  );
}
