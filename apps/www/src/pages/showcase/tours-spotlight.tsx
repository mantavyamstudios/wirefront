import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRightIcon, PlusIcon, SearchIcon, UserPlusIcon, XIcon } from "lucide-react";
import { Button } from "@orbit/ui/button";

interface Step {
  target: string; // matches data-tour="…" on a real element
  title: string;
  body: string;
  kbd?: string;
}

const STEPS: Step[] = [
  {
    target: "search",
    title: "Search anything.",
    body: "Type the first few letters of any project, page, or person. It also runs commands like \"create issue\" or \"switch theme\".",
    kbd: "⌘K",
  },
  {
    target: "new",
    title: "Start a project.",
    body: "Projects group docs, issues and people. You can move things between them later.",
  },
  {
    target: "projects",
    title: "Your projects live here.",
    body: "Pinned projects stay at the top. Drag to reorder, or open one to see its activity.",
  },
  {
    target: "invite",
    title: "Bring your team.",
    body: "Invite by email or share a link. New members get this tour too.",
  },
];

const PAD = 6; // breathing room around the highlighted element
const GAP = 12; // distance between target and card
const CARD_W = 320;

type Rect = { x: number; y: number; w: number; h: number };

// Measures the current step's target (viewport coordinates) and keeps it in
// sync with scroll, resize and layout changes.
function useTargetRect(target: string | null) {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!target) return setRect(null);
    const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
    if (!el) return setRect(null);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });

    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(document.documentElement);
    window.addEventListener("scroll", measure, { passive: true, capture: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", measure, { capture: true });
      window.removeEventListener("resize", measure);
    };
  }, [target]);

  return rect;
}

// The spotlight is computed from the real target, so it follows the layout at
// every breakpoint. sm+: the step card sits below (or above) the target,
// clamped to the viewport. Phones: the card is a bottom sheet.
export function ToursSpotlightShowcasePage() {
  const [step, setStep] = useState<number | null>(0);
  const current = step == null ? null : STEPS[step]!;
  const rect = useTargetRect(current?.target ?? null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ left: 16, top: 16 });

  // Place the card once we know both the target and the card's height.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!rect || !card) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const ch = card.offsetHeight;
    const below = rect.y + rect.h + PAD + GAP;
    const top = below + ch < vh - 16 ? below : Math.max(16, rect.y - PAD - GAP - ch);
    const left = Math.min(Math.max(16, rect.x - PAD), vw - CARD_W - 16);
    setPos({ left, top });
  }, [rect]);

  // Move focus into the card on every step so screen readers read it.
  useEffect(() => {
    if (step != null) cardRef.current?.focus({ preventScroll: true });
  }, [step]);

  const close = useCallback(() => setStep(null), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <FakeApp onRestart={step == null ? () => setStep(0) : undefined} />

      {current && rect ? (
        <>
          <svg aria-hidden className="pointer-events-none fixed inset-0 z-40 h-full w-full">
            <defs>
              <mask id="spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={rect.x - PAD}
                  y={rect.y - PAD}
                  width={rect.w + PAD * 2}
                  height={rect.h + PAD * 2}
                  rx="10"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              mask="url(#spotlight-mask)"
              className="fill-black/55 dark:fill-black/70"
            />
          </svg>

          <div
            aria-hidden
            className="pointer-events-none fixed z-40 rounded-[10px] ring-2 ring-foreground motion-safe:transition-all motion-safe:duration-300"
            style={{
              left: rect.x - PAD,
              top: rect.y - PAD,
              width: rect.w + PAD * 2,
              height: rect.h + PAD * 2,
            }}
          >
            <span
              className="absolute inset-0 rounded-[10px] ring-1 ring-foreground/40 motion-safe:animate-pulse"
              style={{ animationDuration: "2s" }}
            />
          </div>

          <div
            ref={cardRef}
            role="dialog"
            aria-labelledby="tour-step-title"
            aria-describedby="tour-step-body"
            tabIndex={-1}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border border-border/70 bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl outline-none sm:inset-x-auto sm:bottom-auto sm:left-(--x) sm:top-(--y) sm:w-80 sm:rounded-xl sm:pb-4 motion-safe:sm:transition-[left,top] motion-safe:sm:duration-300"
            style={{ "--x": `${pos.left}px`, "--y": `${pos.top}px` } as React.CSSProperties}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
                  Step {step! + 1} of {STEPS.length}
                </div>
                <h3 id="tour-step-title" className="mt-1 font-heading text-base">
                  {current.title}
                  {current.kbd ? (
                    <kbd className="ml-2 rounded border border-border/70 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground pointer-coarse:hidden">
                      {current.kbd}
                    </kbd>
                  ) : null}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close tour"
                onClick={close}
                className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground pointer-coarse:size-10"
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
            <p id="tour-step-body" className="mt-2 text-muted-foreground text-sm leading-relaxed sm:text-xs">
              {current.body}
            </p>
            <div className="mt-3 flex items-center justify-between border-border/60 border-t pt-3">
              <div aria-hidden className="flex items-center gap-1">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step
                        ? "w-5 bg-foreground"
                        : i < step!
                          ? "w-1.5 bg-foreground/60"
                          : "w-1.5 bg-foreground/15"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setStep((s) => Math.max((s ?? 0) - 1, 0))}
                  disabled={step === 0}
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  type="button"
                  onClick={() =>
                    setStep((s) => (s! + 1 < STEPS.length ? s! + 1 : null))
                  }
                >
                  {step === STEPS.length - 1 ? "Done" : "Next"}
                  {step === STEPS.length - 1 ? null : <ArrowRightIcon />}
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function FakeApp({ onRestart }: { onRestart?: () => void }) {
  return (
    <div className="grid min-h-svh grid-cols-1 md:grid-cols-[220px_1fr]">
      <aside className="space-y-2 border-border/60 border-r bg-foreground/[0.02] p-4 max-md:hidden">
        <div className="h-3 w-24 rounded bg-foreground/15" />
        <div className="h-2 w-32 rounded bg-foreground/10" />
        <div className="h-2 w-28 rounded bg-foreground/10" />
        <div className="h-2 w-24 rounded bg-foreground/10" />
      </aside>
      <main className="min-w-0 p-4 pb-64 sm:p-6 lg:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <div
            data-tour="search"
            className="flex h-9 min-w-0 flex-1 basis-full items-center gap-2 rounded-lg border border-border/60 px-3 text-muted-foreground text-sm sm:max-w-xs sm:basis-auto"
          >
            <SearchIcon className="size-4 shrink-0" />
            <span className="truncate">Search…</span>
          </div>
          <Button data-tour="new" type="button" size="sm">
            <PlusIcon />
            New project
          </Button>
          <Button data-tour="invite" type="button" size="sm" variant="outline">
            <UserPlusIcon />
            Invite
          </Button>
        </div>
        <div className="mt-8 h-3 w-48 max-w-full rounded bg-foreground/20" />
        <div className="mt-2 h-2 w-72 max-w-full rounded bg-foreground/10" />
        <div
          data-tour="projects"
          className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3"
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-border/50 bg-foreground/[0.02]"
            />
          ))}
        </div>
        {onRestart ? (
          <Button type="button" variant="outline" className="mt-6" onClick={onRestart}>
            Restart tour
          </Button>
        ) : null}
      </main>
    </div>
  );
}
