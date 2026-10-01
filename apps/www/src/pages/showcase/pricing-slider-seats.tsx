import { useState } from "react";
import { CheckIcon } from "lucide-react";
import { Button } from "@orbit/ui/button";

const PER_SEAT = 24;

export function PricingSliderSeatsShowcasePage() {
  const [seats, setSeats] = useState(8);
  const [annual, setAnnual] = useState(true);
  const monthly = seats * PER_SEAT;
  const yearly = monthly * 12 * 0.8;
  const display = annual ? Math.round(yearly / 12) : monthly;
  const totalAnnual = annual ? Math.round(yearly) : null;

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="w-full max-w-2xl">
        <div className="text-center">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
            Pro plan
          </div>
          <h1 className="mt-1 font-heading text-3xl">
            How big is your team?
          </h1>
        </div>

        <div className="mt-8 rounded-2xl border border-border/60 bg-background/40 p-5 sm:mt-10 sm:p-8">
          {/* Price over the billing toggle on phones; side by side from sm. */}
          <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <div aria-live="polite" className="flex items-baseline gap-1">
                <span className="font-heading text-4xl tracking-tight sm:text-5xl">${display}</span>
                <span className="text-muted-foreground text-sm">/ month</span>
              </div>
              {totalAnnual ? (
                <p className="mt-1 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.25em]">
                  ${totalAnnual.toLocaleString()} billed annually · save 20%
                </p>
              ) : (
                <p className="mt-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                  Billed monthly
                </p>
              )}
            </div>
            <div
              role="radiogroup"
              aria-label="Billing period"
              className="inline-flex self-start rounded-full border border-border/60 bg-background/40 p-0.5 font-mono text-[11px] uppercase tracking-[0.2em] sm:self-auto"
            >
              <button
                type="button"
                role="radio"
                aria-checked={!annual}
                onClick={() => setAnnual(false)}
                className={`min-h-8 rounded-full px-3 py-1.5 transition-colors pointer-coarse:min-h-10 ${
                  !annual ? "bg-foreground text-background" : "text-muted-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={annual}
                onClick={() => setAnnual(true)}
                className={`min-h-8 rounded-full px-3 py-1.5 transition-colors pointer-coarse:min-h-10 ${
                  annual ? "bg-foreground text-background" : "text-muted-foreground"
                }`}
              >
                Yearly
              </button>
            </div>
          </div>

          <div className="mt-10">
            <div className="flex items-baseline justify-between">
              <label
                htmlFor="seats"
                className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]"
              >
                Seats
              </label>
              <div className="font-mono text-sm">
                <span className="font-heading text-2xl">{seats}</span>
                <span className="text-muted-foreground"> × ${PER_SEAT}</span>
              </div>
            </div>
            <input
              id="seats"
              type="range"
              min={1}
              max={50}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              aria-valuetext={`${seats} seat${seats === 1 ? "" : "s"}, $${display} per month`}
              // Taller input = bigger touch target for the native thumb.
              className="mt-3 h-6 w-full cursor-pointer accent-foreground pointer-coarse:h-10"
            />
            {/* Ticks sit at their real slider positions (1–50). */}
            <div aria-hidden className="relative mt-1 h-4 font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.1em]">
              {[1, 10, 20, 30, 40, 50].map((v, i, all) => (
                <span
                  key={v}
                  className={
                    "absolute " +
                    (i === 0 ? "left-0" : i === all.length - 1 ? "right-0" : "-translate-x-1/2")
                  }
                  style={i > 0 && i < all.length - 1 ? { left: `${((v - 1) / 49) * 100}%` } : undefined}
                >
                  {v === 50 ? "50+" : v}
                </span>
              ))}
            </div>
          </div>

          <ul className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {[
              "Unlimited projects",
              "1M API requests / mo",
              "30-day audit log",
              "SSO via Google",
              "Priority email support",
              "Custom roles",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {f}
              </li>
            ))}
          </ul>

          <Button size="lg" type="button" className="mt-8 w-full">
            Continue with {seats} seat{seats === 1 ? "" : "s"}
          </Button>
          <p className="mt-2 text-center text-muted-foreground text-xs">
            14-day free trial · no card required
          </p>
        </div>
      </div>
    </div>
  );
}
