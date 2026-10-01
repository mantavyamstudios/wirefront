import { CheckIcon, SparklesIcon } from "lucide-react";
import { Button } from "@orbit/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@orbit/ui/dialog";

const PLANS = [
  {
    name: "Pro",
    price: 24,
    highlight: false,
    features: [
      "10 projects",
      "Up to 10 members",
      "30-day audit log",
      "Email support",
    ],
  },
  {
    name: "Business",
    price: 79,
    highlight: true,
    features: [
      "Unlimited projects",
      "Unlimited members",
      "1-year audit log",
      "SSO & SCIM",
      "Priority support",
      "Custom retention",
    ],
  },
];

export function ModalsUpgradeShowcasePage() {
  return (
    // Real Dialog. Tall content scrolls inside DialogPanel (the old centred
    // overlay pushed the heading off-screen); bottom sheet on phones.
    <div className="relative min-h-svh bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-8 sm:px-10 sm:py-10">
        <div className="font-heading text-2xl">Workspace</div>
      <Dialog defaultOpen>
        <DialogTrigger render={<Button />}>
          <SparklesIcon />
          Upgrade
        </DialogTrigger>
        <DialogPopup className="sm:max-w-2xl">
          <DialogHeader className="sm:flex-row sm:items-start sm:gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background max-sm:hidden">
              <SparklesIcon className="size-5" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                Limit reached · 10 / 10 projects
              </div>
              <DialogTitle className="text-xl">
                Time to grow into a bigger plan
              </DialogTitle>
              <DialogDescription>
                You've hit the project limit on Free. Upgrade to keep shipping
                — switch back any time.
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogPanel className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={
                  "relative rounded-xl border p-4 sm:p-5 " +
                  (p.highlight
                    ? "border-foreground/60 bg-foreground/[0.04]"
                    : "border-border/60")
                }
              >
                {p.highlight ? (
                  <span className="absolute -top-2 right-4 rounded-full bg-foreground px-2 py-0.5 font-mono text-[10px] text-background uppercase tracking-[0.2em]">
                    Recommended
                  </span>
                ) : null}
                <div className="font-heading text-base">{p.name}</div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-heading text-3xl tracking-tight">
                    ${p.price}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    / member / mo
                  </span>
                </div>
                <ul className="mt-4 flex flex-col gap-2">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-foreground/85 text-sm"
                    >
                      <CheckIcon className="size-3.5 text-emerald-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  variant={p.highlight ? "default" : "outline"}
                  className="mt-5 w-full"
                >
                  {p.highlight ? "Upgrade to " + p.name : "Choose " + p.name}
                </Button>
              </div>
            ))}
          </DialogPanel>

          <DialogFooter className="text-muted-foreground text-xs sm:items-center sm:justify-between">
            <span className="text-center sm:text-left">14-day money-back · Cancel any time</span>
            <button
              type="button"
              className="min-h-8 underline-offset-2 hover:text-foreground hover:underline pointer-coarse:min-h-10"
            >
              See full plan comparison →
            </button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
      </div>
    </div>
  );
}
