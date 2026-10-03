import { useEffect, useState } from "react";
import { ArrowRightIcon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@orbit/ui/button";
import { PopoverPrimitive as Popover } from "@orbit/ui/popover";

interface Step {
  target: string; // matches data-tour="…" on a real element
  title: string;
  body: React.ReactNode;
}

const STEPS: Step[] = [
  {
    target: "status",
    title: "Filter by status.",
    body: (
      <>
        Stack filters to narrow the list.{" "}
        <span className="pointer-coarse:hidden">
          <kbd className="rounded bg-background/15 px-1 font-mono text-[11px]">⇧</kbd>{" "}
          click to multi-select values.
        </span>
        <span className="hidden pointer-coarse:inline">
          Long-press a value to multi-select.
        </span>
      </>
    ),
  },
  {
    target: "assignee",
    title: "See one person's load.",
    body: "Pick a teammate to see only what's on their plate.",
  },
  {
    target: "priority",
    title: "Surface what's urgent.",
    body: "Urgent and high-priority issues float to the top.",
  },
  {
    target: "row",
    title: "Open an issue.",
    body: "Each row opens in a side panel so you never lose your place.",
  },
  {
    target: "new",
    title: "Create an issue.",
    body: "Start typing a title — everything else is optional.",
  },
];

// The tooltip is a non-modal Popover anchored to the real target, so Base UI
// handles placement: right of the target when there's room, flipping or
// dropping below it on narrow screens. The arrow follows the chosen side.
export function ToursArrowTooltipShowcasePage() {
  const [step, setStep] = useState<number | null>(0);
  const current = step == null ? null : STEPS[step]!;
  // The real element for this step. Passing the element itself (not a lookup
  // function) makes Base UI re-run placement on every step, so the side —
  // and the arrow's edge — flip to whatever fits next to the new target.
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!current) return setAnchor(null);
    const el = document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
    setAnchor(el);
  }, [current]);

  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <FakeApp
        active={current?.target ?? null}
        onRestart={step == null ? () => setStep(0) : undefined}
      />

      <Popover.Root
        open={current != null && anchor != null}
        modal={false}
        onOpenChange={(open, details) => {
          // A tour shouldn't vanish on a stray tap outside; Esc still closes.
          if (!open && details.reason !== "outside-press") setStep(null);
        }}
      >
        <Popover.Portal>
          <Popover.Positioner
            anchor={anchor}
            side="right"
            align="center"
            sideOffset={12}
            collisionPadding={16}
            collisionAvoidance={{ side: "flip", align: "shift", fallbackAxisSide: "end" }}
            className="z-40"
          >
            <Popover.Popup
              initialFocus={false}
              className="w-[min(18rem,calc(100vw-2rem))] rounded-lg bg-foreground p-4 text-background shadow-2xl outline-none motion-safe:transition-[opacity,scale] data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0"
            >
              {/* Base UI places the arrow along the edge facing the target (and
                  keeps it aimed at the target when the popup shifts); data-side
                  picks which of the four edges it sits on. */}
              <Popover.Arrow className="size-3 rotate-45 rounded-[2px] bg-foreground data-[side=bottom]:-top-1.5 data-[side=left]:-right-1.5 data-[side=right]:-left-1.5 data-[side=top]:-bottom-1.5" />
              {current ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-60">
                        Tip · {step! + 1} / {STEPS.length}
                      </div>
                      <Popover.Title className="mt-1 font-medium text-sm">
                        {current.title}
                      </Popover.Title>
                    </div>
                    <Popover.Close
                      aria-label="Close tips"
                      className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-md opacity-60 transition-opacity hover:opacity-100 pointer-coarse:size-10"
                    >
                      <XIcon className="size-3.5" />
                    </Popover.Close>
                  </div>
                  <Popover.Description className="mt-2 text-xs leading-relaxed opacity-80">
                    {current.body}
                  </Popover.Description>

                  <div className="mt-3 flex items-center justify-between border-background/15 border-t pt-3">
                    <div aria-hidden className="flex items-center gap-1">
                      {STEPS.map((_, i) => (
                        <span
                          key={i}
                          className={`h-1 rounded-full transition-all ${
                            i === step
                              ? "w-4 bg-background"
                              : i < step!
                                ? "w-1 bg-background/60"
                                : "w-1 bg-background/20"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        className="text-background/80 hover:bg-background/10 hover:text-background"
                        onClick={() => setStep((s) => Math.max((s ?? 0) - 1, 0))}
                        disabled={step === 0}
                      >
                        Back
                      </Button>
                      <Button
                        size="sm"
                        type="button"
                        className="bg-background text-foreground hover:bg-background/90"
                        onClick={() =>
                          setStep((s) => (s! + 1 < STEPS.length ? s! + 1 : null))
                        }
                      >
                        {step === STEPS.length - 1 ? "Done" : "Next"}
                        {step === STEPS.length - 1 ? null : <ArrowRightIcon />}
                      </Button>
                    </div>
                  </div>
                </>
              ) : null}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

function FakeApp({
  active,
  onRestart,
}: {
  active: string | null;
  onRestart?: () => void;
}) {
  // The highlighted target gets a ring; everything else is a normal control.
  const ring = (name: string) =>
    active === name ? " ring-2 ring-primary/70 ring-offset-2 ring-offset-background" : "";
  return (
    <div className="grid min-h-svh grid-cols-1 sm:grid-cols-[60px_1fr]">
      <aside className="border-border/60 border-r bg-foreground/[0.02] max-sm:hidden" />
      <main className="min-w-0 p-4 pb-72 sm:p-6 lg:p-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
              Issues
            </div>
            <h1 className="mt-1 font-heading text-2xl">Workload</h1>
          </div>
          <Button data-tour="new" type="button" size="sm" className={ring("new")}>
            <PlusIcon />
            New issue
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 sm:mt-8">
          {[
            ["status", "Status"],
            ["assignee", "Assignee"],
            ["priority", "Priority"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              data-tour={id}
              className={
                "h-9 rounded-md border border-border/60 bg-background/40 px-3 text-muted-foreground text-sm hover:text-foreground pointer-coarse:h-10" +
                ring(id!)
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              data-tour={i === 0 ? "row" : undefined}
              className={
                "h-12 rounded-md border border-border/40 bg-foreground/[0.02]" +
                (i === 0 ? ring("row") : "")
              }
            />
          ))}
        </div>

        {onRestart ? (
          <Button type="button" variant="outline" className="mt-6" onClick={onRestart}>
            Show tips again
          </Button>
        ) : null}
      </main>
    </div>
  );
}
