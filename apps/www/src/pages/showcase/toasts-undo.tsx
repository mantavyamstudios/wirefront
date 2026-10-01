import { useEffect, useState } from "react";
import { ArchiveIcon, TrashIcon, XIcon } from "lucide-react";
import { Button } from "@orbit/ui/button";
import { ToastPrimitive as Toast } from "@orbit/ui/toast";

const UNDO_MS = 8000;
const PROJECTS = ["Q3 planning", "Design system", "Billing revamp", "Mobile app"];

// A dedicated manager keeps this showcase self-contained. In an app, mount
// <ToastProvider> once and use the shared `toastManager` from @orbit/ui/toast.
const toasts = Toast.createToastManager<{ undo: () => void }>();

// Archive → snackbar with Undo. The undo window is the toast's own timeout,
// so it pauses while the snackbar is hovered or focused, and the progress
// bar pauses with it. The window is announced once, not every tick.
export function ToastsUndoShowcasePage() {
  const [archived, setArchived] = useState<string[]>([]);

  const archive = (name: string) => {
    setArchived((a) => [...a, name]);
    toasts.add({
      id: `archived-${name}`,
      title: "Project archived",
      description: `"${name}" moved to archive. Undo within ${UNDO_MS / 1000} seconds.`,
      timeout: UNDO_MS,
      data: { undo: () => setArchived((a) => a.filter((n) => n !== name)) },
    });
  };

  useEffect(() => archive(PROJECTS[0]!), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Toast.Provider toastManager={toasts} limit={1}>
      <div className="relative min-h-svh bg-background p-4 pb-32 text-foreground sm:p-10">
        <h1 className="font-heading text-xl">Projects</h1>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PROJECTS.filter((p) => !archived.includes(p)).map((p) => (
            <li
              key={p}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-foreground/[0.02] px-4 py-3"
            >
              <span className="min-w-0 truncate text-sm">{p}</span>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => archive(p)}
                aria-label={`Archive ${p}`}
              >
                <ArchiveIcon />
                <span className="max-sm:sr-only">Archive</span>
              </Button>
            </li>
          ))}
        </ul>
        <UndoViewport />
      </div>
    </Toast.Provider>
  );
}

// Phones: full-width above the home indicator. sm+: a centred 24rem snackbar.
function UndoViewport() {
  const { toasts: list } = Toast.useToastManager<{ undo: () => void }>();
  return (
    <Toast.Portal>
      <Toast.Viewport className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] outline-none sm:inset-x-auto sm:bottom-8 sm:left-1/2 sm:w-96 sm:-translate-x-1/2 sm:px-0 sm:pb-0">
        {list.map((t) => (
          <Toast.Root
            key={t.id}
            toast={t}
            swipeDirection={["down", "left", "right"]}
            className="group/toast translate-x-(--toast-swipe-movement-x) translate-y-(--toast-swipe-movement-y) overflow-hidden rounded-lg border border-foreground/10 bg-foreground text-background shadow-xl transition-[translate,opacity] duration-300 data-ending-style:opacity-0 data-starting-style:translate-y-3 data-starting-style:opacity-0 motion-reduce:transition-none"
          >
            <div className="flex items-center gap-3 py-2 pr-2 pl-3.5">
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background/15"
              >
                <TrashIcon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <Toast.Title className="font-medium text-sm" />
                <Toast.Description className="mt-0.5 truncate text-xs opacity-70" />
              </div>
              <Toast.Close
                onClick={() => t.data?.undo()}
                className="min-h-8 shrink-0 rounded-md bg-background/15 px-3 font-medium text-xs transition-colors hover:bg-background/25 pointer-coarse:min-h-10"
              >
                Undo
              </Toast.Close>
              <Toast.Close
                aria-label="Dismiss"
                className="grid size-8 shrink-0 place-items-center rounded-md opacity-60 transition-opacity hover:opacity-100 pointer-coarse:size-10"
              >
                <XIcon className="size-3.5" />
              </Toast.Close>
            </div>
            {/* Drains over the undo window; pauses while the toast is expanded
                (hovered/focused), exactly like Base UI's timer. */}
            <div aria-hidden className="h-0.5 bg-background/10">
              <div
                className="h-full origin-left bg-background/40 [animation:undo-drain_linear_forwards] group-data-expanded/toast:[animation-play-state:paused] motion-reduce:hidden"
                style={{ animationDuration: `${UNDO_MS}ms` }}
              />
            </div>
          </Toast.Root>
        ))}
      </Toast.Viewport>
      <style>{"@keyframes undo-drain{from{transform:scaleX(1)}to{transform:scaleX(0)}}"}</style>
    </Toast.Portal>
  );
}
