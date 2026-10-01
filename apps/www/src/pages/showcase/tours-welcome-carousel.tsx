import { useRef, useState } from "react";
import {
  ArrowRightIcon,
  KeyboardIcon,
  LayersIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import { Button } from "@orbit/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@orbit/ui/dialog";

interface Step {
  Icon: React.ComponentType<{ className?: string }>;
  badge: string;
  title: string;
  body: React.ReactNode;
}

const STEPS: Step[] = [
  {
    Icon: SparklesIcon,
    badge: "Welcome",
    title: "Welcome to Orbit.",
    body: "A quieter way to ship — projects, comments, and audit log all in one workspace. Three quick things before we drop you in.",
  },
  {
    Icon: LayersIcon,
    badge: "Step 1",
    title: "Projects are how you organise work.",
    body: "Bundle issues, docs, and members together. You can split into teams later — for now, one project is enough.",
  },
  {
    Icon: UsersIcon,
    badge: "Step 2",
    title: "Bring people in when you're ready.",
    body: "We won't ping anyone until you say so. Drop in emails and we'll send invites in your name.",
  },
  {
    Icon: KeyboardIcon,
    badge: "Step 3",
    title: "Keyboard-first, always.",
    body: (
      <>
        <span className="pointer-coarse:hidden">
          Press ⌘K anywhere to jump to anything. Press ? to see every shortcut.
        </span>
        <span className="hidden pointer-coarse:inline">
          Pull down on any screen to search for anything. On a keyboard, ⌘K does the same.
        </span>{" "}
        We won't get in your way.
      </>
    ),
  },
];

// A real Dialog (focus trap, Esc, scroll lock) that opens on load for the
// showcase. Swipe left/right on touch, or use ←/→ on a keyboard, to move
// between steps. On phones it becomes a bottom sheet.
export function ToursWelcomeCarouselShowcasePage() {
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;
  const current = STEPS[step]!;
  const startX = useRef<number | null>(null);

  const go = (d: number) =>
    setStep((s) => Math.min(Math.max(s + d, 0), STEPS.length - 1));

  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <FakeAppBackdrop />
      <Dialog defaultOpen onOpenChange={(open) => open && setStep(0)}>
        <div className="relative z-10 grid min-h-svh place-items-center p-4">
          <DialogTrigger render={<Button type="button" variant="outline" />}>
            Show welcome tour
          </DialogTrigger>
        </div>
        <DialogPopup
          showCloseButton={false}
          className="overflow-hidden p-0 sm:max-w-md"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(1);
            if (e.key === "ArrowLeft") go(-1);
          }}
        >
          <div
            className="touch-pan-y select-none"
            onPointerDown={(e) => {
              if (e.pointerType !== "mouse") startX.current = e.clientX;
            }}
            onPointerUp={(e) => {
              if (startX.current == null) return;
              const dx = e.clientX - startX.current;
              startX.current = null;
              if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
            }}
          >
            <div className="relative h-36 max-h-[30svh] overflow-hidden bg-gradient-to-br from-primary/30 via-primary/10 to-background sm:h-44">
              <div
                aria-hidden
                className="absolute inset-0 opacity-50"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 30%, color-mix(in srgb, var(--primary) 50%, transparent), transparent 50%), radial-gradient(circle at 80% 70%, color-mix(in srgb, var(--primary) 30%, transparent), transparent 50%)",
                }}
              />
              <div className="relative flex h-full items-center justify-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-background/85 shadow-lg ring-1 ring-border/60 backdrop-blur sm:size-20">
                  <current.Icon className="size-8 sm:size-9" />
                </div>
              </div>
            </div>

            <div aria-live="polite" className="px-5 py-5 sm:px-6 sm:py-6">
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
                {current.badge}
              </div>
              <DialogTitle className="mt-1 font-heading text-xl sm:text-2xl">
                {current.title}
              </DialogTitle>
              <DialogDescription className="mt-2 text-muted-foreground text-sm leading-relaxed">
                {current.body}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-border/60 border-t px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-3">
            <div className="flex items-center">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStep(i)}
                  aria-label={`Go to step ${i + 1}`}
                  aria-current={i === step ? "step" : undefined}
                  // 24×32 hit area around a small visual dot.
                  className="group grid h-8 min-w-6 place-items-center px-1 pointer-coarse:h-10"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all ${
                      i === step
                        ? "w-6 bg-foreground"
                        : "w-1.5 bg-foreground/20 group-hover:bg-foreground/40"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {step === 0 ? (
                <DialogClose render={<Button variant="ghost" size="sm" type="button" />}>
                  Skip
                </DialogClose>
              ) : (
                <Button variant="ghost" size="sm" type="button" onClick={() => go(-1)}>
                  Back
                </Button>
              )}
              {last ? (
                <DialogClose render={<Button size="sm" type="button" />}>
                  Get started
                  <ArrowRightIcon />
                </DialogClose>
              ) : (
                <Button size="sm" type="button" onClick={() => go(1)}>
                  Next
                  <ArrowRightIcon />
                </Button>
              )}
            </div>
          </div>
        </DialogPopup>
      </Dialog>
    </div>
  );
}

function FakeAppBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 grid grid-cols-1 opacity-30 md:grid-cols-[200px_1fr]">
      <div className="space-y-2 border-border/40 border-r bg-foreground/[0.02] p-4 max-md:hidden">
        <div className="h-3 w-24 rounded bg-foreground/10" />
        <div className="h-2 w-32 rounded bg-foreground/10" />
        <div className="h-2 w-28 rounded bg-foreground/10" />
      </div>
      <div className="space-y-3 p-4 sm:p-10">
        <div className="h-4 w-48 max-w-full rounded bg-foreground/15" />
        <div className="h-2 w-72 max-w-full rounded bg-foreground/10" />
        <div className="h-32 rounded-xl border border-border/40 bg-foreground/[0.02]" />
        <div className="h-32 rounded-xl border border-border/40 bg-foreground/[0.02]" />
      </div>
    </div>
  );
}
