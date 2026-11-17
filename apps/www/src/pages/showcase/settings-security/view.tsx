// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button, buttonVariants } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Separator } from "@wirefront/ui/separator";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { type Action, type AsyncStatus, ok } from "@wirefront/ui/wirefront/types";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  LaptopIcon,
  LogOutIcon,
  MapPinIcon,
  PlusIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  TrashIcon,
  UsbIcon,
  XIcon,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import type { Passkey, SecurityOverview as Overview, SignInSession } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("securityOverview.<key>"). */
export const SECURITY_OVERVIEW_MESSAGES = {
  eyebrow: "Account · Security",
  title: "Security",
  subtitle: "Sign-in methods, devices, and recovery options.",
  twoFactor: "Two-factor authentication",
  enabled: "Enabled",
  disabled: "Off",
  lastVerified: "Last verified {when}",
  manage: "Manage",
  setUp: "Set up",
  passkeys: "Passkeys",
  passkeysHint: "Phishing-resistant sign-in via Touch ID, Face ID, or hardware keys.",
  addPasskey: "Add passkey",
  neverUsed: "Never used",
  removePasskey: "Remove {name}",
  noPasskeys: "No passkeys yet.",
  sessions: "Active sessions",
  sessionCount: "{count} signed-in devices.",
  sessionColumns: "IP · last active",
  thisDevice: "This device",
  current: "Current",
  revoke: "Revoke",
  revokeIn: "Revoke session in {location}",
  revokeOthersHint: "Signs out everything except this device.",
  revokeOthers: "Sign out of all other sessions",
  recovery: "Recovery codes",
  recoveryHint: "Use one of these one-time codes if you lose access to your authenticator.",
  codesLeft: "{count} unused codes left.",
  reveal: "Reveal codes",
  hide: "Hide codes",
  hidden: "Hidden",
  regenerateWarning: "Regenerating invalidates every code above. Store the new set somewhere safe.",
  regenerate: "Regenerate codes",
  errorTitle: "Couldn’t load security settings",
  retry: "Try again",
};

export interface SecurityOverviewProps {
  /** Two-factor status, passkeys, sessions and the recovery code count. Leave it out while it loads. */
  data?: Overview;
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Where "Manage" / "Set up" for two-factor goes. Hidden when not given. */
  twoFactorHref?: string;
  /** Register a new passkey (run the WebAuthn ceremony). The button only shows when this is given. */
  onAddPasskey?: Action;
  /** Remove a passkey (receives its id). Remove buttons only show when this is given. */
  onRemovePasskey?: Action<string>;
  /** Sign a session out (receives its id). Revoke buttons only show when this is given. */
  onRevokeSession?: Action<string>;
  /** Sign out every other session. The button only shows when this is given. */
  onRevokeOtherSessions?: Action;
  /** Fetch the recovery codes (ask for re-authentication first if you need to). The section shows only with this. */
  onRevealCodes?: Action<void, string[]>;
  /** Replace the codes; resolve with the new set. The button only shows when this is given. */
  onRegenerateCodes?: Action<void, string[]>;
  className?: string;
}

const KIND_ICON: Record<Passkey["kind"] | SignInSession["kind"], ReactNode> = {
  computer: <LaptopIcon className="size-4" />,
  phone: <SmartphoneIcon className="size-4" />,
  "security-key": <UsbIcon className="size-4" />,
};
const SKELETON_ROWS = ["r1", "r2", "r3"];
const fieldError = "text-destructive-foreground text-xs";

function SecurityOverviewScreen({
  data,
  status = "ready",
  error,
  onRetry,
  twoFactorHref,
  onAddPasskey,
  onRemovePasskey,
  onRevokeSession,
  onRevokeOtherSessions,
  onRevealCodes,
  onRegenerateCodes,
  className,
}: SecurityOverviewProps) {
  const t = useMessages("securityOverview", SECURITY_OVERVIEW_MESSAGES);
  const format = useFormat();
  const [codes, setCodes] = useState<string[] | null>(null);
  const [shown, setShown] = useState(false);
  const addPasskey = useAction(onAddPasskey ?? (async () => {}));
  const removePasskey = useAction(onRemovePasskey ?? (async () => {}));
  const revoke = useAction(onRevokeSession ?? (async () => {}));
  const revokeOthers = useAction(onRevokeOtherSessions ?? (async () => {}));
  const reveal = useAction(onRevealCodes ?? (async () => ok<string[]>([])), {
    onSuccess: (list) => {
      setCodes(list);
      setShown(true);
    },
  });
  const regenerate = useAction(onRegenerateCodes ?? (async () => ok<string[]>([])), {
    onSuccess: (list) => {
      setCodes(list);
      setShown(true);
    },
  });
  const ready = status === "ready" && data ? data : undefined;
  const others = ready?.sessions.filter((s) => !s.current).length ?? 0;
  const toggleCodes = () => {
    if (shown) setShown(false);
    else if (codes) setShown(true);
    else void reveal.run();
  };
  // The placeholder shows the right number of blurred slots before the codes are fetched.
  const slots = codes ?? Array.from({ length: ready?.recoveryCodesLeft ?? 8 }, (_, i) => `XXXX-XXXX-${String(i).padStart(4, "0")}`);

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
        <h1 className="mt-1 font-heading text-3xl">{t.title}</h1>
        <p className="mt-1.5 text-muted-foreground text-sm">{t.subtitle}</p>

        {status === "error" ? (
          <div className="mt-8 rounded-xl border border-border/60 p-10 text-center">
            <p className="font-medium">{t.errorTitle}</p>
            {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
            {onRetry ? (
              <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                {t.retry}
              </Button>
            ) : null}
          </div>
        ) : !ready ? (
          <div aria-busy="true" className="mt-8 flex flex-col gap-3">
            {SKELETON_ROWS.map((key) => (
              <Skeleton className="h-32 w-full rounded-xl motion-reduce:animate-none" key={key} />
            ))}
          </div>
        ) : (
          <>
            <section
              aria-labelledby="security-2fa"
              className={cn(
                "mt-8 overflow-hidden rounded-xl border",
                ready.twoFactor.enabled ? "border-category-2/30 bg-gradient-to-br from-category-2/[0.07] to-category-2/[0.02]" : "border-category-3/30 bg-category-3/[0.04]",
              )}
            >
              <div className="flex flex-wrap items-start gap-3 p-4 sm:flex-nowrap sm:gap-4 sm:p-5">
                <div
                  aria-hidden
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg",
                    ready.twoFactor.enabled ? "bg-category-2/15 text-category-2-foreground" : "bg-category-3/15 text-category-3-foreground",
                  )}
                >
                  {ready.twoFactor.enabled ? <ShieldCheckIcon className="size-5" /> : <ShieldAlertIcon className="size-5" />}
                </div>
                <div className="min-w-0 flex-1 max-sm:basis-[calc(100%-3.25rem)]">
                  <h2 className="flex flex-wrap items-center gap-2" id="security-2fa">
                    <span className="font-medium text-sm">{t.twoFactor}</span>{" "}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em]",
                        ready.twoFactor.enabled ? "bg-category-2/15 text-category-2-foreground" : "bg-category-3/15 text-category-3-foreground",
                      )}
                    >
                      {ready.twoFactor.enabled ? <CheckCircle2Icon aria-hidden className="size-2.5" /> : null}
                      {ready.twoFactor.enabled ? t.enabled : t.disabled}
                    </span>
                  </h2>
                  {ready.twoFactor.enabled ? <p className="mt-1 text-muted-foreground text-xs">{ready.twoFactor.method}</p> : null}
                  {ready.twoFactor.lastVerifiedAt ? (
                    <div className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                      <ClockIcon aria-hidden className="size-2.5" />
                      {interpolate(t.lastVerified, { when: format.relative(ready.twoFactor.lastVerifiedAt) })}
                    </div>
                  ) : null}
                </div>
                {twoFactorHref ? (
                  <WirefrontLink className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "max-sm:ms-[3.25rem]")} href={twoFactorHref}>
                    {ready.twoFactor.enabled ? t.manage : t.setUp}
                  </WirefrontLink>
                ) : null}
              </div>
            </section>

            <section aria-labelledby="security-passkeys" className="mt-3 rounded-xl border border-border/60 bg-background/40">
              <header className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
                <div>
                  <h2 className="font-heading text-base" id="security-passkeys">
                    {t.passkeys}
                  </h2>
                  <p className="mt-1 text-muted-foreground text-xs">{t.passkeysHint}</p>
                </div>
                {onAddPasskey ? (
                  <Button aria-busy={addPasskey.isPending()} disabled={addPasskey.isPending()} onClick={() => void addPasskey.run()} size="sm" type="button">
                    {addPasskey.isPending() ? <Spinner data-icon="inline-start" /> : <PlusIcon />}
                    {t.addPasskey}
                  </Button>
                ) : null}
              </header>
              {addPasskey.error || removePasskey.error ? (
                <p className={cn(fieldError, "px-5 pb-3")} role="alert">
                  {addPasskey.error ?? removePasskey.error}
                </p>
              ) : null}
              <Separator />
              {ready.passkeys.length ? (
                <ul>
                  {ready.passkeys.map((p) => (
                    <li className="flex items-center gap-3 border-border/40 border-b px-4 py-3.5 last:border-b-0 sm:gap-4 sm:px-5" key={p.id}>
                      <div aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-md bg-foreground/[0.06] text-muted-foreground">
                        {KIND_ICON[p.kind]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm">{p.name}</div>
                        <div className="mt-0.5 text-muted-foreground text-xs">{p.detail}</div>
                      </div>
                      <div className="hidden font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] sm:block">{p.lastUsedAt ? format.relative(p.lastUsedAt) : t.neverUsed}</div>
                      {onRemovePasskey ? (
                        <button
                          aria-label={interpolate(t.removePasskey, { name: p.name })}
                          className="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted-foreground outline-none transition-colors hover:bg-destructive/10 hover:text-destructive-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 pointer-coarse:p-3"
                          disabled={removePasskey.isPending(p.id)}
                          onClick={() => void removePasskey.run(p.id, p.id)}
                          type="button"
                        >
                          <TrashIcon aria-hidden className="size-3.5" />
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-6 text-center text-muted-foreground text-sm">{t.noPasskeys}</p>
              )}
            </section>

            <section aria-labelledby="security-sessions" className="mt-3 rounded-xl border border-border/60 bg-background/40">
              <header className="flex items-center justify-between gap-3 p-4 sm:p-5">
                <div>
                  <h2 className="font-heading text-base" id="security-sessions">
                    {t.sessions}
                  </h2>
                  <p className="mt-1 text-muted-foreground text-xs">{interpolate(t.sessionCount, { count: ready.sessions.length })}</p>
                </div>
                <span aria-hidden className="hidden font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] sm:inline">
                  {t.sessionColumns}
                </span>
              </header>
              {revoke.error || revokeOthers.error ? (
                <p className={cn(fieldError, "px-5 pb-3")} role="alert">
                  {revoke.error ?? revokeOthers.error}
                </p>
              ) : null}
              <Separator />
              <ul className="px-2 py-2">
                {ready.sessions.map((s) => (
                  <li
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 sm:gap-4",
                      s.current ? "bg-category-2/[0.06] ring-1 ring-category-2/25" : "transition-colors hover:bg-foreground/[0.03]",
                    )}
                    key={s.id}
                  >
                    <div
                      aria-hidden
                      className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", s.current ? "bg-category-2/15 text-category-2-foreground" : "bg-foreground/[0.06] text-muted-foreground")}
                    >
                      {KIND_ICON[s.kind]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 font-medium text-sm">
                          <MapPinIcon aria-hidden className="size-3 opacity-50" />
                          {s.location}
                        </span>
                        {s.current ? (
                          <span className="inline-flex items-center gap-1 rounded bg-category-2/15 px-1.5 py-0.5 font-mono text-[10px] text-category-2-foreground uppercase tracking-[0.2em]">
                            <CheckCircle2Icon aria-hidden className="size-2.5" />
                            {t.thisDevice}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-0.5 text-muted-foreground text-xs">
                        {s.browser} · {s.os}
                      </div>
                    </div>
                    <div className="hidden flex-col items-end text-end sm:flex">
                      <span className="font-mono text-[11px] text-muted-foreground">{s.ip}</span>
                      <span className="mt-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{format.relative(s.lastActiveAt)}</span>
                    </div>
                    {s.current ? (
                      <span className="shrink-0 text-end font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] sm:w-[68px]">{t.current}</span>
                    ) : onRevokeSession ? (
                      <button
                        aria-label={interpolate(t.revokeIn, { location: s.location })}
                        className="inline-flex shrink-0 items-center justify-center gap-1 rounded-md border border-border/60 bg-background/40 px-2 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] outline-none transition-colors hover:border-destructive/40 hover:text-destructive-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 sm:w-[68px] pointer-coarse:min-h-10"
                        disabled={revoke.isPending(s.id)}
                        onClick={() => void revoke.run(s.id, s.id)}
                        type="button"
                      >
                        <XIcon aria-hidden className="size-2.5" />
                        {t.revoke}
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
              {onRevokeOtherSessions && others > 0 ? (
                <>
                  <Separator />
                  {/* Stacks below sm: the long-label button can't shrink, so it gets its own row. */}
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-muted-foreground text-xs">{t.revokeOthersHint}</p>
                    <Button
                      aria-busy={revokeOthers.isPending()}
                      className="border-destructive/40 text-destructive-foreground hover:bg-destructive/10 max-sm:w-full"
                      disabled={revokeOthers.isPending()}
                      onClick={() => void revokeOthers.run()}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {revokeOthers.isPending() ? <Spinner data-icon="inline-start" /> : <LogOutIcon />}
                      {t.revokeOthers}
                    </Button>
                  </div>
                </>
              ) : null}
            </section>

            {onRevealCodes ? (
              <section aria-labelledby="security-codes" className="mt-3 rounded-xl border border-border/60 bg-background/40 p-4 sm:p-6">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <KeyRoundIcon aria-hidden className="size-4 opacity-60" />
                      <h2 className="font-heading text-base" id="security-codes">
                        {t.recovery}
                      </h2>
                    </div>
                    <p className="mt-1 text-muted-foreground text-xs">
                      {t.recoveryHint} {interpolate(t.codesLeft, { count: ready.recoveryCodesLeft })}
                    </p>
                  </div>
                  <Button aria-busy={reveal.isPending()} aria-expanded={shown} disabled={reveal.isPending()} onClick={toggleCodes} size="sm" type="button" variant="ghost">
                    {reveal.isPending() ? <Spinner data-icon="inline-start" /> : shown ? <EyeOffIcon /> : <EyeIcon />}
                    {shown ? t.hide : t.reveal}
                  </Button>
                </header>
                {reveal.error ? (
                  <p className={cn(fieldError, "mt-3")} role="alert">
                    {reveal.error}
                  </p>
                ) : null}

                <div className="relative mt-4">
                  <ol aria-hidden={!shown} className={cn("grid grid-cols-2 gap-2 transition", !shown && "select-none blur-sm")}>
                    {slots.map((code, i) => (
                      <li className="flex items-center gap-2 rounded-md border border-border/50 bg-background/60 px-2.5 py-2 sm:gap-3 sm:px-3" key={code}>
                        <span aria-hidden className="font-mono text-[10px] text-muted-foreground tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-mono text-[12px] tracking-wide sm:text-[13px] sm:tracking-wider">{shown ? code : "••••-••••-••••"}</span>
                      </li>
                    ))}
                  </ol>
                  {!shown ? (
                    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="rounded-full bg-background/80 px-3 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] ring-1 ring-border/60 backdrop-blur">
                        {t.hidden}
                      </span>
                    </div>
                  ) : null}
                </div>

                {onRegenerateCodes ? (
                  <div className="mt-5 flex flex-col gap-3 rounded-lg border border-category-3/30 bg-category-3/[0.06] p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangleIcon aria-hidden className="mt-0.5 size-3.5 shrink-0 text-category-3-foreground" />
                      <p className="text-category-3-foreground text-xs leading-relaxed">{t.regenerateWarning}</p>
                    </div>
                    <Button
                      aria-busy={regenerate.isPending()}
                      className="shrink-0 border-category-3/40 text-category-3-foreground hover:bg-category-3/10"
                      disabled={regenerate.isPending()}
                      onClick={() => void regenerate.run()}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {regenerate.isPending() ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon />}
                      {t.regenerate}
                    </Button>
                  </div>
                ) : null}
                {regenerate.error ? (
                  <p className={cn(fieldError, "mt-3")} role="alert">
                    {regenerate.error}
                  </p>
                ) : null}
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export function SecurityOverview(props: SecurityOverviewProps) {
  return (
    <ScreenBoundary name="SecurityOverview">
      <SecurityOverviewScreen {...props} />
    </ScreenBoundary>
  );
}
