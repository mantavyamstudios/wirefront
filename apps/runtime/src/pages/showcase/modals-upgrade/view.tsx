// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@wirefront/ui/dialog";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
  WirefrontLink,
} from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { CheckIcon, SparklesIcon } from "lucide-react";

import type { UpgradePlan } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("upgradeDialog.<key>"). */
export const UPGRADE_DIALOG_MESSAGES = {
  pageTitle: "Workspace",
  trigger: "Upgrade",
  limit: "Limit reached · {used} / {limit} {resource}",
  title: "Time to grow into a bigger plan",
  description:
    "You’ve hit the {resource} limit on {plan}. Upgrade to keep shipping — switch back any time.",
  recommended: "Recommended",
  perMember: "/ member / mo",
  upgradeTo: "Upgrade to {plan}",
  choose: "Choose {plan}",
  guarantee: "14-day money-back · Cancel any time",
  compare: "See full plan comparison →",
};

export interface UpgradeDialogProps {
  /** Plans to offer (listUpgradePlans). */
  plans: UpgradePlan[];
  /** The plan the workspace is on now. */
  currentPlan: string;
  /** The limit that was hit, e.g. { used: 10, limit: 10, resource: "projects" }. The eyebrow hides without it. */
  limit?: { used: number; limit: number; resource: string };
  /** Start the upgrade (startUpgrade). Resolve with where to go next; the screen follows it. */
  onChoosePlan: Action<string, { redirectUrl: string } | undefined>;
  /** Where "See full plan comparison" goes. Hidden when not given. */
  compareHref?: string;
  /** Open the dialog on first render. */
  defaultOpen?: boolean;
  className?: string;
}

function UpgradeDialogScreen({
  plans,
  currentPlan,
  limit,
  onChoosePlan,
  compareHref,
  defaultOpen,
  className,
}: UpgradeDialogProps) {
  const t = useMessages("upgradeDialog", UPGRADE_DIALOG_MESSAGES);
  const format = useFormat();
  const choose = useAction(onChoosePlan, {
    onSuccess: (result) => {
      if (result?.redirectUrl) window.location.assign(result.redirectUrl);
    },
  });

  return (
    // Real Dialog. Tall content scrolls inside the dialog; bottom sheet on phones.
    <div className={cn("relative min-h-svh bg-background", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-8 sm:px-10 sm:py-10">
        <h1 className="font-heading text-2xl">{t.pageTitle}</h1>
        <Dialog defaultOpen={defaultOpen}>
          <DialogTrigger render={<Button />}>
            <SparklesIcon />
            {t.trigger}
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader className="sm:flex-row sm:items-start sm:gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background max-sm:hidden">
                <SparklesIcon aria-hidden className="size-5" />
              </div>
              <div className="flex flex-col gap-1">
                {limit ? (
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                    {interpolate(t.limit, {
                      used: format.number(limit.used),
                      limit: format.number(limit.limit),
                      resource: limit.resource,
                    })}
                  </div>
                ) : null}
                <DialogTitle className="text-xl">{t.title}</DialogTitle>
                <DialogDescription>
                  {interpolate(t.description, {
                    resource: limit?.resource ?? "",
                    plan: currentPlan,
                  })}
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="-mx-4 grid min-h-0 min-w-0 grid-cols-1 gap-3 overflow-y-auto px-4 pt-2 sm:grid-cols-2">
              {plans.map((p) => (
                <div
                  className={cn(
                    "relative rounded-xl border p-4 sm:p-5",
                    p.recommended
                      ? "border-foreground/60 bg-foreground/4"
                      : "border-border/60"
                  )}
                  key={p.id}
                >
                  {p.recommended ? (
                    <span className="absolute inset-e-4 -top-2 rounded-full bg-foreground px-2 py-0.5 font-mono text-[10px] text-background uppercase tracking-[0.2em]">
                      {t.recommended}
                    </span>
                  ) : null}
                  <h2 className="font-heading text-base">{p.name}</h2>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-heading text-3xl tracking-tight">
                      {format.money(p.price, p.currency, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {t.perMember}
                    </span>
                  </div>
                  <ul className="mt-4 flex flex-col gap-2">
                    {p.features.map((f) => (
                      <li
                        className="flex items-center gap-2 text-foreground/85 text-sm"
                        key={f}
                      >
                        <CheckIcon
                          aria-hidden
                          className="size-3.5 text-category-2-foreground"
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    aria-busy={choose.isPending(p.id)}
                    className="mt-5 w-full"
                    disabled={choose.isPending()}
                    onClick={() => void choose.run(p.id, p.id)}
                    type="button"
                    variant={p.recommended ? "default" : "outline"}
                  >
                    {choose.isPending(p.id) ? (
                      <Spinner data-icon="inline-start" />
                    ) : null}
                    {interpolate(p.recommended ? t.upgradeTo : t.choose, {
                      plan: p.name,
                    })}
                  </Button>
                </div>
              ))}
            </div>

            {choose.error ? (
              <p className="text-destructive-foreground text-sm" role="alert">
                {choose.error}
              </p>
            ) : null}

            <DialogFooter className="text-muted-foreground text-xs sm:items-center sm:justify-between">
              <span className="text-center sm:text-start">{t.guarantee}</span>
              {compareHref ? (
                <WirefrontLink
                  className="inline-flex min-h-8 items-center underline-offset-2 hover:text-foreground hover:underline pointer-coarse:min-h-10"
                  href={compareHref}
                >
                  {t.compare}
                </WirefrontLink>
              ) : null}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export function UpgradeDialog(props: UpgradeDialogProps) {
  return (
    <ScreenBoundary name="UpgradeDialog">
      <UpgradeDialogScreen {...props} />
    </ScreenBoundary>
  );
}
