import { useEffect } from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "@orbit/ui/button";
import { ToastPrimitive as Toast } from "@orbit/ui/toast";

// A dedicated manager keeps this showcase self-contained. In an app, mount
// <ToastProvider> once and call the shared `toastManager` from @orbit/ui/toast.
const toasts = Toast.createToastManager();

function notifySaved(timeout?: number) {
  toasts.add({
    id: "settings-saved", // re-saving refreshes the same toast instead of stacking
    type: "success",
    title: "Saved",
    description: "Workspace settings updated.",
    timeout,
  });
}

export function ToastsSuccessShowcasePage() {
  // Shown on load for the showcase (and kept until dismissed).
  useEffect(() => notifySaved(0), []);

  return (
    <Toast.Provider toastManager={toasts}>
      <div className="relative min-h-svh bg-background text-foreground">
        <FakeAppBackdrop onSave={() => notifySaved()} />
        <SuccessViewport />
      </div>
    </Toast.Provider>
  );
}

// Phones: full-width under the top safe area. sm+: a 20rem column top-right.
// Toasts announce politely (role="status"), pause on hover/focus and can be
// swiped away.
function SuccessViewport() {
  const { toasts: list } = Toast.useToastManager();
  return (
    <Toast.Portal>
      <Toast.Viewport className="fixed inset-x-0 top-0 z-50 flex flex-col gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))] outline-none sm:inset-x-auto sm:top-6 sm:right-6 sm:w-80 sm:px-0 sm:pt-0">
        {list.map((t) => (
          <Toast.Root
            key={t.id}
            toast={t}
            swipeDirection={["up", "right"]}
            className="flex translate-x-(--toast-swipe-movement-x) translate-y-(--toast-swipe-movement-y) items-center gap-3 rounded-lg border border-border/70 bg-background px-3.5 py-3 shadow-lg transition-[translate,opacity] duration-300 data-ending-style:opacity-0 data-starting-style:-translate-y-3 data-starting-style:opacity-0 motion-reduce:transition-none"
          >
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            >
              <CheckIcon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <Toast.Title className="font-medium text-sm" />
              <Toast.Description className="mt-0.5 text-muted-foreground text-xs" />
            </div>
            <Toast.Close
              aria-label="Dismiss"
              className="-mr-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground pointer-coarse:size-10"
            >
              <XIcon className="size-3.5" />
            </Toast.Close>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

function FakeAppBackdrop({ onSave }: { onSave: () => void }) {
  return (
    <div className="grid min-h-svh grid-cols-1 md:grid-cols-[200px_1fr]">
      <div
        aria-hidden
        className="space-y-2 border-border/40 border-r bg-foreground/[0.02] p-4 opacity-50 max-md:hidden"
      >
        <div className="h-3 w-24 rounded bg-foreground/10" />
        <div className="h-2 w-32 rounded bg-foreground/10" />
        <div className="h-2 w-28 rounded bg-foreground/10" />
        <div className="h-2 w-24 rounded bg-foreground/10" />
      </div>
      <div className="space-y-3 p-4 pt-24 sm:p-10">
        <div aria-hidden className="space-y-3 opacity-50">
          <div className="h-4 w-48 max-w-full rounded bg-foreground/15" />
          <div className="h-2 w-72 max-w-full rounded bg-foreground/10" />
          <div className="h-32 rounded-xl border border-border/40 bg-foreground/[0.02]" />
        </div>
        <Button type="button" onClick={onSave}>
          Save settings
        </Button>
      </div>
    </div>
  );
}
