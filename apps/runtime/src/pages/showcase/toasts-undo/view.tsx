// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Toast } from "@base-ui/react/toast";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useMessages } from "@wirefront/ui/wirefront/provider";
import { TrashIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("undoToaster.<key>"). */
export const UNDO_TOASTER_MESSAGES = {
  undo: "Undo",
  dismiss: "Dismiss",
};

type UndoData = { undo: () => void; window: number };
export type UndoToastManager = ReturnType<typeof Toast.createToastManager<UndoData>>;

export const createUndoToasts = (): UndoToastManager => Toast.createToastManager<UndoData>();

/** Show an undo snackbar. The undo window is the toast's timeout, so it pauses while the snackbar is hovered or focused. */
export function notifyUndo(manager: UndoToastManager, toast: { id: string; title: string; description?: string; undo: () => void; timeout?: number }) {
  const timeout = toast.timeout ?? 8000;
  return manager.add({ id: toast.id, title: toast.title, description: toast.description, timeout, data: { undo: toast.undo, window: timeout } });
}

export interface UndoToasterProps {
  toastManager: UndoToastManager;
  /** Your app; the snackbar renders above it. */
  children?: ReactNode;
  className?: string;
}

// Phones: full-width above the home indicator. sm+: a centred 24rem snackbar.
function Viewport({ manager, className }: { manager: UndoToastManager; className?: string }) {
  const t = useMessages("undoToaster", UNDO_TOASTER_MESSAGES);
  const { toasts } = Toast.useToastManager<UndoData>();
  return (
    <Toast.Portal>
      <Toast.Viewport className={cn("fixed inset-x-0 bottom-0 z-50 flex flex-col gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] outline-none sm:inset-x-auto sm:bottom-8 sm:left-1/2 sm:w-96 sm:-translate-x-1/2 sm:px-0 sm:pb-0", className)}>
        {toasts.map((toast) => (
          <Toast.Root
            className="group/toast translate-x-(--toast-swipe-movement-x) translate-y-(--toast-swipe-movement-y) overflow-hidden rounded-lg border border-foreground/10 bg-foreground text-background shadow-xl transition-[translate,opacity] duration-300 data-ending-style:opacity-0 data-starting-style:translate-y-3 data-starting-style:opacity-0 motion-reduce:transition-none"
            key={toast.id}
            swipeDirection={["down", "left", "right"]}
            toast={toast}
          >
            <div className="flex items-center gap-3 py-2 ps-3.5 pe-2">
              <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background/15">
                <TrashIcon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <Toast.Title className="font-medium text-sm" />
                <Toast.Description className="mt-0.5 truncate text-xs opacity-70" />
              </div>
              <Toast.Action
                className="min-h-8 shrink-0 rounded-md bg-background/15 px-3 font-medium text-xs outline-none transition-colors hover:bg-background/25 focus-visible:ring-2 focus-visible:ring-background pointer-coarse:min-h-10"
                onClick={() => {
                  toast.data?.undo();
                  manager.close(toast.id);
                }}
              >
                {t.undo}
              </Toast.Action>
              <Toast.Close aria-label={t.dismiss} className="grid size-8 shrink-0 place-items-center rounded-md opacity-60 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-background pointer-coarse:size-10">
                <XIcon aria-hidden className="size-3.5" />
              </Toast.Close>
            </div>
            {/* Drains over the undo window; pauses while the toast is expanded (hovered/focused), like Base UI's timer. */}
            <div aria-hidden className="h-0.5 bg-background/10">
              <div className="h-full origin-left bg-background/40 [animation:undo-drain_linear_forwards] group-data-expanded/toast:[animation-play-state:paused] motion-reduce:hidden" style={{ animationDuration: `${toast.data?.window ?? 8000}ms` }} />
            </div>
          </Toast.Root>
        ))}
      </Toast.Viewport>
      <style>{"@keyframes undo-drain{from{transform:scaleX(1)}to{transform:scaleX(0)}}"}</style>
    </Toast.Portal>
  );
}

/** The provider and viewport for undo snackbars, one at a time. Mount it once around your app. */
export function UndoToaster({ toastManager, children, className }: UndoToasterProps) {
  return (
    <ScreenBoundary name="UndoToaster">
      <Toast.Provider limit={1} toastManager={toastManager}>
        {children}
        <Viewport className={className} manager={toastManager} />
      </Toast.Provider>
    </ScreenBoundary>
  );
}
