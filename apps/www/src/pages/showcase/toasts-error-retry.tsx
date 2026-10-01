import { useEffect } from "react";
import {
  AlertCircleIcon,
  CheckIcon,
  LoaderCircleIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@orbit/ui/button";
import { ToastPrimitive as Toast } from "@orbit/ui/toast";

type InviteToast = { code?: string; retrying?: boolean };

// A dedicated manager keeps this showcase self-contained. In an app, mount
// <ToastProvider> once and use the shared `toastManager` from @orbit/ui/toast.
const toasts = Toast.createToastManager<InviteToast>();
const ID = "invite-failed";

function notifyFailed() {
  toasts.add({
    id: ID,
    type: "error",
    // Errors interrupt (role="alert") and never auto-dismiss while they offer
    // a Retry — the user decides when it goes away.
    priority: "high",
    timeout: 0,
    title: "Couldn't send invite",
    description:
      "Email gateway is unreachable right now. We'll keep your draft — try again or write to support.",
    data: { code: "503" },
  });
}

function retry() {
  toasts.update(ID, { data: { code: "503", retrying: true } });
  window.setTimeout(() => {
    toasts.update(ID, {
      type: "success",
      priority: "low",
      timeout: 4000,
      title: "Invite sent",
      description: "riya@acme.dev will get an email shortly.",
      data: {},
    });
  }, 1200);
}

export function ToastsErrorRetryShowcasePage() {
  useEffect(() => notifyFailed(), []);

  return (
    <Toast.Provider toastManager={toasts}>
      <div className="relative min-h-svh bg-background text-foreground">
        <FakeAppBackdrop onSend={notifyFailed} />
        <ErrorViewport />
      </div>
    </Toast.Provider>
  );
}

// Phones: full-width under the top safe area. sm+: a 24rem column top-right.
function ErrorViewport() {
  const { toasts: list } = Toast.useToastManager<InviteToast>();
  return (
    <Toast.Portal>
      <Toast.Viewport className="fixed inset-x-0 top-0 z-50 flex flex-col gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))] outline-none sm:inset-x-auto sm:top-6 sm:right-6 sm:w-96 sm:px-0 sm:pt-0">
        {list.map((t) => {
          const failed = t.type === "error";
          const retrying = !!t.data?.retrying;
          return (
            <Toast.Root
              key={t.id}
              toast={t}
              swipeDirection={["up", "right"]}
              className={
                "translate-x-(--toast-swipe-movement-x) translate-y-(--toast-swipe-movement-y) rounded-lg border bg-background shadow-lg transition-[translate,opacity] duration-300 data-ending-style:opacity-0 data-starting-style:-translate-y-3 data-starting-style:opacity-0 motion-reduce:transition-none " +
                (failed ? "border-destructive/40" : "border-border/70")
              }
            >
              <div className="flex items-start gap-3 p-3.5">
                <span
                  aria-hidden
                  className={
                    "flex size-7 shrink-0 items-center justify-center rounded-full " +
                    (failed
                      ? "bg-destructive/15 text-destructive"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400")
                  }
                >
                  {failed ? <AlertCircleIcon className="size-4" /> : <CheckIcon className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Toast.Title className="font-medium text-sm" />
                    {t.data?.code ? (
                      <span className="rounded bg-destructive/10 px-1.5 py-0.5 font-mono text-[10px] text-destructive uppercase tracking-[0.15em]">
                        <span className="sr-only">Error code </span>
                        {t.data.code}
                      </span>
                    ) : null}
                  </div>
                  <Toast.Description className="mt-1 text-muted-foreground text-xs leading-relaxed" />
                </div>
                <Toast.Close
                  aria-label="Dismiss"
                  className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground pointer-coarse:size-10"
                >
                  <XIcon className="size-3.5" />
                </Toast.Close>
              </div>
              {failed ? (
                <div className="grid grid-cols-2 gap-2 border-border/60 border-t px-3 py-2 sm:flex sm:items-center sm:justify-end">
                  <Toast.Close render={<Button size="sm" variant="ghost" type="button" />}>
                    Dismiss
                  </Toast.Close>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={retry}
                    disabled={retrying}
                  >
                    {retrying ? (
                      <LoaderCircleIcon className="motion-safe:animate-spin" />
                    ) : (
                      <RotateCcwIcon />
                    )}
                    {retrying ? "Retrying…" : "Retry"}
                  </Button>
                </div>
              ) : null}
            </Toast.Root>
          );
        })}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

function FakeAppBackdrop({ onSend }: { onSend: () => void }) {
  return (
    <div className="grid min-h-svh grid-cols-1 md:grid-cols-[200px_1fr]">
      <div
        aria-hidden
        className="space-y-2 border-border/40 border-r bg-foreground/[0.02] p-4 opacity-50 max-md:hidden"
      >
        <div className="h-3 w-24 rounded bg-foreground/10" />
        <div className="h-2 w-32 rounded bg-foreground/10" />
        <div className="h-2 w-28 rounded bg-foreground/10" />
      </div>
      <div className="space-y-3 p-4 pt-48 sm:p-10">
        <div aria-hidden className="space-y-3 opacity-50">
          <div className="h-4 w-48 max-w-full rounded bg-foreground/15" />
          <div className="h-2 w-72 max-w-full rounded bg-foreground/10" />
          <div className="h-40 rounded-xl border border-border/40 bg-foreground/[0.02]" />
        </div>
        <Button type="button" onClick={onSend}>
          Send invite
        </Button>
      </div>
    </div>
  );
}
