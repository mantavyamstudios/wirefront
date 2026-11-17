// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { KeyRoundIcon, LaptopIcon, LockIcon, ShieldAlertIcon, ShieldCheckIcon, SmartphoneIcon, TabletIcon } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import type { Credentials, DeviceSession } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("credentialsSessions.<key>"). */
export const CREDENTIALS_SESSIONS_MESSAGES = {
  eyebrow: "Settings · security",
  title: "Credentials & sessions",
  subtitle: "Manage where you’re signed in and how you sign in. We notify you on new devices.",
  protectedBoth: "Your account is protected with two-factor and a passkey.",
  protectedTwoFactor: "Your account is protected with two-factor.",
  protectedPasskey: "Your account is protected with a passkey.",
  unprotected: "Turn on two-factor or add a passkey to protect your account.",
  recovery: "Recovery codes regenerated {when}.",
  review: "Review",
  sessions: "Active sessions",
  sessionsSummary: "{devices} devices · {active} active now",
  signOutAll: "Sign out everywhere",
  thisDevice: "This device",
  trusted: "Trusted",
  activeNow: "active now",
  currentSession: "Current session",
  signOut: "Sign out",
  signOutDevice: "Sign out {device}",
  keys: "Passkeys & security keys",
  addPasskey: "Add a passkey",
  keyMeta: "Added {added} · last used {used}",
  keyAdded: "Added {added}",
  remove: "Remove",
  removeKey: "Remove {label}",
  noKeys: "No passkeys or security keys yet.",
  errorTitle: "Couldn’t load your credentials",
  retry: "Try again",
};

export interface CredentialsSessionsProps {
  /** Sign-in methods and sessions. Leave it out while they load. */
  data?: Credentials;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Sign one device out; it goes at once and comes back if this fails. Hidden without it. */
  onSignOut?: Action<string>;
  /** Sign out every device except this one. Hidden without it. */
  onSignOutAll?: Action;
  /** Remove a key. Hidden without it. */
  onRemoveKey?: Action<string>;
  /** Start your passkey registration. Hidden without it. */
  onAddPasskey?: () => void;
  /** Open your two-factor settings. Hidden without it. */
  onReview?: () => void;
  className?: string;
}

const KIND_ICON: Record<DeviceSession["kind"], ReactNode> = {
  laptop: <LaptopIcon aria-hidden className="size-5 opacity-70" />,
  phone: <SmartphoneIcon aria-hidden className="size-5 opacity-70" />,
  tablet: <TabletIcon aria-hidden className="size-5 opacity-70" />,
};
const ghostButton = "min-h-8 whitespace-nowrap rounded-md border border-border/60 px-3 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] outline-none hover:border-category-4/40 hover:text-category-4-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 pointer-coarse:min-h-10";

function CredentialsSessionsScreen({ data, status = "ready", error, onRetry, onSignOut, onSignOutAll, onRemoveKey, onAddPasskey, onReview, className }: CredentialsSessionsProps) {
  const t = useMessages("credentialsSessions", CREDENTIALS_SESSIONS_MESSAGES);
  const fmt = useFormat();
  const { now } = useWirefront();
  const [sessions, setSessions] = useState(data?.sessions ?? []);
  const [keys, setKeys] = useState(data?.keys ?? []);
  useEffect(() => {
    setSessions(data?.sessions ?? []);
    setKeys(data?.keys ?? []);
  }, [data]);
  const removeFrom = <T extends { id: string }>(set: (fn: (all: T[]) => T[]) => void, current: T[]) => (id: string) => {
    set((all) => all.filter((x) => x.id !== id));
    return () => set(() => current);
  };
  const signOut = useAction(onSignOut ?? (async () => {}), { optimistic: (id) => removeFrom(setSessions, sessions)(id) });
  const signOutAll = useAction(onSignOutAll ?? (async () => {}), {
    optimistic: () => {
      const before = sessions;
      setSessions((all) => all.filter((s) => s.current));
      return () => setSessions(before);
    },
  });
  const removeKey = useAction(onRemoveKey ?? (async () => {}), { optimistic: (id) => removeFrom(setKeys, keys)(id) });
  const active = (at: string) => (now().getTime() - new Date(at).getTime() < 5 * 60_000 ? t.activeNow : fmt.relative(at));
  const day = (iso: string) => fmt.date(iso.length === 10 ? `${iso}T00:00:00Z` : iso, { month: "short", year: "numeric", timeZone: "UTC" });
  const actionError = signOut.error ?? signOutAll.error ?? removeKey.error;

  if (status === "error" || !data || status === "loading") {
    return (
      <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
        <div className="mx-auto max-w-3xl">
          <h1 className="font-heading text-2xl">{t.title}</h1>
          {status === "error" ? (
            <div className="mt-6 rounded-xl border border-border/60 py-12 text-center">
              <p className="font-medium">{t.errorTitle}</p>
              {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
              {onRetry ? (
                <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                  {t.retry}
                </Button>
              ) : null}
            </div>
          ) : (
            <div aria-busy="true" className="mt-6 flex flex-col gap-4">
              <Skeleton className="h-16 w-full rounded-xl motion-reduce:animate-none" />
              <Skeleton className="h-72 w-full rounded-xl motion-reduce:animate-none" />
            </div>
          )}
        </div>
      </div>
    );
  }

  const protectedBy = data.twoFactor && keys.length ? t.protectedBoth : data.twoFactor ? t.protectedTwoFactor : keys.length ? t.protectedPasskey : t.unprotected;
  const safe = data.twoFactor || keys.length > 0;
  const activeCount = sessions.filter((s) => now().getTime() - new Date(s.lastActiveAt).getTime() < 5 * 60_000).length;

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-3xl">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
        <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
        <p className="mt-1 text-muted-foreground text-sm">{t.subtitle}</p>

        <div className={cn("mt-6 rounded-xl border p-4", safe ? "border-border/60 bg-category-2/[0.04]" : "border-category-4/30 bg-category-4/[0.05]")}>
          <div className="flex flex-wrap items-start gap-3 sm:flex-nowrap">
            {safe ? <ShieldCheckIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-category-2-foreground" /> : <ShieldAlertIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-category-4-foreground" />}
            <div className="min-w-0 flex-1 basis-[calc(100%-2rem)] sm:basis-auto">
              <div className="text-sm">{protectedBy}</div>
              {data.recoveryRotatedAt ? <div className="mt-0.5 text-muted-foreground text-xs">{interpolate(t.recovery, { when: fmt.relative(data.recoveryRotatedAt) })}</div> : null}
            </div>
            {onReview ? (
              <Button className="max-sm:ms-6" onClick={onReview} type="button" variant="ghost">
                {t.review}
              </Button>
            ) : null}
          </div>
        </div>
        {actionError ? (
          <p className="mt-4 text-destructive-foreground text-sm" role="alert">
            {actionError}
          </p>
        ) : null}

        <section aria-labelledby="credentials-sessions" className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-lg" id="credentials-sessions">
                {t.sessions}
              </h2>
              <p className="text-muted-foreground text-xs">{interpolate(t.sessionsSummary, { devices: sessions.length, active: activeCount })}</p>
            </div>
            {onSignOutAll && sessions.some((s) => !s.current) ? (
              <Button className="self-start sm:self-auto" disabled={signOutAll.isPending()} onClick={() => void signOutAll.run()} type="button" variant="outline">
                {signOutAll.isPending() ? <Spinner /> : null}
                {t.signOutAll}
              </Button>
            ) : null}
          </div>
          <ul className="mt-4 divide-y divide-border/40 overflow-hidden rounded-xl border border-border/60 bg-background/40">
            {sessions.map((s) => (
              <li
                // Phones: icon · device + meta (last active/IP move under the client line) · action.
                className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3.5 sm:grid-cols-[44px_minmax(0,1fr)_140px_auto] sm:px-4"
                key={s.id}
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/[0.06]">{KIND_ICON[s.kind]}</div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    {s.device}
                    {s.current ? <span className="rounded-full bg-category-2/15 px-2 py-0.5 font-mono text-[10px] text-category-2-foreground uppercase tracking-[0.2em]">{t.thisDevice}</span> : null}
                    {s.trusted ? <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{t.trusted}</span> : null}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {s.client} · {s.location}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground sm:hidden">
                    {active(s.lastActiveAt)} · {s.ip}
                  </div>
                </div>
                <div className="text-end font-mono text-[10px] text-muted-foreground max-sm:hidden">
                  <div>{active(s.lastActiveAt)}</div>
                  <div>{s.ip}</div>
                </div>
                {s.current ? (
                  <span className="px-3 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                    <span className="sr-only">{t.currentSession}</span>
                    <span aria-hidden>—</span>
                  </span>
                ) : onSignOut ? (
                  <button className={ghostButton} disabled={signOut.isPending(s.id)} onClick={() => void signOut.run(s.id, s.id)} type="button">
                    <span className="sr-only">{interpolate(t.signOutDevice, { device: s.device })}</span>
                    <span aria-hidden>{t.signOut}</span>
                  </button>
                ) : (
                  <span />
                )}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="credentials-keys" className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-heading text-lg" id="credentials-keys">
              {t.keys}
            </h2>
            {onAddPasskey ? (
              <Button className="self-start sm:self-auto" onClick={onAddPasskey} type="button" variant="outline">
                <KeyRoundIcon aria-hidden />
                {t.addPasskey}
              </Button>
            ) : null}
          </div>
          {keys.length === 0 ? (
            <p className="mt-4 rounded-xl border border-border/60 px-4 py-6 text-center text-muted-foreground text-sm">{t.noKeys}</p>
          ) : (
            <ul className="mt-4 divide-y divide-border/40 overflow-hidden rounded-xl border border-border/60 bg-background/40">
              {keys.map((k) => (
                <li className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:px-4" key={k.id}>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/[0.06]">
                    <LockIcon aria-hidden className="size-4 opacity-70" />
                  </div>
                  <div className="min-w-0">
                    <div className="break-words text-sm">{k.label}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{k.lastUsedAt ? interpolate(t.keyMeta, { added: day(k.addedAt), used: fmt.relative(k.lastUsedAt) }) : interpolate(t.keyAdded, { added: day(k.addedAt) })}</div>
                  </div>
                  {onRemoveKey ? (
                    <button className={ghostButton} disabled={removeKey.isPending(k.id)} onClick={() => void removeKey.run(k.id, k.id)} type="button">
                      <span className="sr-only">{interpolate(t.removeKey, { label: k.label })}</span>
                      <span aria-hidden>{t.remove}</span>
                    </button>
                  ) : (
                    <span />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export function CredentialsSessions(props: CredentialsSessionsProps) {
  return (
    <ScreenBoundary name="CredentialsSessions">
      <CredentialsSessionsScreen {...props} />
    </ScreenBoundary>
  );
}
