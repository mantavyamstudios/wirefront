// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Toast } from "@base-ui/react/toast";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useMessages } from "@wirefront/ui/wirefront/provider";
import { type Action, settle } from "@wirefront/ui/wirefront/types";
import { AlertCircleIcon, CheckIcon, LoaderCircleIcon, RotateCcwIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("errorToaster.<key>"). */
export const ERROR_TOASTER_MESSAGES = {
  errorCode: "Error code",
  dismiss: "Dismiss",
  retry: "Retry",
  retrying: "Retrying…",
};

type ErrorData = { code?: string; retrying?: boolean; retry?: Action; success?: { title: string; description?: string } };
export type ErrorToastManager = ReturnType<typeof Toast.createToastManager<ErrorData>>;

export const createErrorToasts = (): ErrorToastManager => Toast.createToastManager<ErrorData>();

/**
 * Show an error that stays until dismissed. It uses normal priority on purpose: Base UI hides
 * high-priority toasts from assistive tech while their buttons stay focusable, which leaves Retry
 * unreachable for screen readers. The viewport's live region still announces it. With `retry`, the toast runs it:
 * on success it turns into `success`; on failure it shows the new reason and offers Retry again.
 */
export function notifyError(
  manager: ErrorToastManager,
  toast: { id: string; title: string; description?: string; code?: string; retry?: Action; success?: { title: string; description?: string } },
) {
  return manager.add({ id: toast.id, type: "error", timeout: 0, title: toast.title, description: toast.description, data: { code: toast.code, retry: toast.retry, success: toast.success } });
}

async function runRetry(manager: ErrorToastManager, id: string, data: ErrorData) {
  if (!data.retry) return;
  manager.update(id, { data: { ...data, retrying: true } });
  const result = await settle(data.retry, undefined);
  if (result.ok) {
    manager.update(id, { type: "success", timeout: 4000, title: data.success?.title, description: data.success?.description, data: {} });
  } else {
    manager.update(id, { description: result.error, data: { ...data, retrying: false } });
  }
}

export interface ErrorToasterProps {
  toastManager: ErrorToastManager;
  /** Your app; toasts render above it. */
  children?: ReactNode;
  className?: string;
}

// Phones: full-width under the top safe area. sm+: a 24rem column top-right.
function Viewport({ manager, className }: { manager: ErrorToastManager; className?: string }) {
  const t = useMessages("errorToaster", ERROR_TOASTER_MESSAGES);
  const { toasts } = Toast.useToastManager<ErrorData>();
  return (
    <Toast.Portal>
      <Toast.Viewport className={cn("fixed inset-x-0 top-0 z-50 flex flex-col gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))] outline-none sm:inset-x-auto sm:end-6 sm:top-6 sm:w-96 sm:px-0 sm:pt-0", className)}>
        {toasts.map((toast) => {
          const failed = toast.type === "error";
          const data = toast.data ?? {};
          return (
            <Toast.Root
              className={cn(
                "translate-x-(--toast-swipe-movement-x) translate-y-(--toast-swipe-movement-y) rounded-lg border bg-background shadow-lg transition-[translate,opacity] duration-300 data-ending-style:opacity-0 data-starting-style:-translate-y-3 data-starting-style:opacity-0 motion-reduce:transition-none",
                failed ? "border-destructive/40" : "border-border/70",
              )}
              key={toast.id}
              swipeDirection={["up", "right"]}
              toast={toast}
            >
              <div className="flex items-start gap-3 p-3.5">
                <span aria-hidden className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", failed ? "bg-destructive/15 text-destructive-foreground" : "bg-category-2/15 text-category-2-foreground")}>
                  {failed ? <AlertCircleIcon className="size-4" /> : <CheckIcon className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Toast.Title className="font-medium text-sm" />
                    {failed && data.code ? (
                      <span className="rounded bg-destructive/10 px-1.5 py-0.5 font-mono text-[10px] text-destructive-foreground uppercase tracking-[0.15em]">
                        <span className="sr-only">{t.errorCode} </span>
                        {data.code}
                      </span>
                    ) : null}
                  </div>
                  <Toast.Description className="mt-1 text-muted-foreground text-xs leading-relaxed" />
                </div>
                <Toast.Close aria-label={t.dismiss} className="-me-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-10">
                  <XIcon aria-hidden className="size-3.5" />
                </Toast.Close>
              </div>
              {failed && data.retry ? (
                <div className="grid grid-cols-2 gap-2 border-border/60 border-t px-3 py-2 sm:flex sm:items-center sm:justify-end">
                  <Toast.Close render={<Button size="sm" type="button" variant="ghost" />}>{t.dismiss}</Toast.Close>
                  <Toast.Action disabled={data.retrying} onClick={() => void runRetry(manager, toast.id, data)} render={<Button size="sm" type="button" variant="outline" />}>
                    {data.retrying ? <LoaderCircleIcon aria-hidden className="motion-safe:animate-spin" /> : <RotateCcwIcon aria-hidden />}
                    {data.retrying ? t.retrying : t.retry}
                  </Toast.Action>
                </div>
              ) : null}
            </Toast.Root>
          );
        })}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

/** The provider and viewport for error toasts with retry. Mount it once around your app. */
export function ErrorToaster({ toastManager, children, className }: ErrorToasterProps) {
  return (
    <ScreenBoundary name="ErrorToaster">
      <Toast.Provider toastManager={toastManager}>
        {children}
        <Viewport className={className} manager={toastManager} />
      </Toast.Provider>
    </ScreenBoundary>
  );
}
