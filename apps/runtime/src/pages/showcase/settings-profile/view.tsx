// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Button, buttonVariants } from "@wirefront/ui/button";
import { Input } from "@wirefront/ui/input";
import { cn } from "@wirefront/ui/lib/utils";
import { Separator } from "@wirefront/ui/separator";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { Textarea } from "@wirefront/ui/textarea";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import { useMessages, useWirefront, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { AtSignIcon, GlobeIcon, KeyRoundIcon, ShieldCheckIcon, TrashIcon, UploadIcon } from "lucide-react";
import { type ReactNode, type SelectHTMLAttributes, useId, useRef, useState, useSyncExternalStore } from "react";
import { type AccountProfile, AccountProfileInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("accountProfile.<key>"). */
export const ACCOUNT_PROFILE_MESSAGES = {
  eyebrow: "Account · Profile",
  title: "Your profile",
  subtitle: "How you appear across every workspace you belong to.",
  photo: "Photo",
  upload: "Upload",
  remove: "Remove",
  photoHint: "Recommended: 400×400 PNG, JPG, or SVG.",
  choosePhoto: "Choose a photo",
  identity: "Identity",
  displayName: "Display name",
  handle: "Handle",
  pronouns: "Pronouns",
  pronounsPlaceholder: "e.g. they / them",
  bio: "Bio",
  bioPlaceholder: "Designer, engineer, generally indoors.",
  bioHint: "Up to 240 characters.",
  locale: "Locale",
  email: "Email",
  language: "Language",
  timeZone: "Time zone",
  security: "Security",
  twoFactor: "Two-factor authentication",
  manage: "Manage",
  sessions: "Active sessions",
  review: "Review",
  deleteAccount: "Delete account",
  deleteHint: "Permanently remove your account and personal data.",
  delete: "Delete",
  unsaved: "Unsaved changes",
  saved: "All saved",
  discard: "Discard",
  save: "Save changes",
  errorTitle: "Couldn’t load your profile",
  retry: "Try again",
};

export interface AccountProfileProps {
  /** The profile. Leave it out while it loads. */
  profile?: AccountProfile;
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Save the profile. The values are already validated. Resolve with `fail(message, { handle? })` or throw to show what went wrong. */
  onSave: Action<AccountProfileInput>;
  /** Upload a new photo. The Upload button only shows when this is given. */
  onUploadPhoto?: Action<File>;
  /** Remove the photo. The Remove button only shows when this and a photo are given. */
  onRemovePhoto?: Action;
  /** The language options, as codes and their names. */
  languages: { value: string; label: string }[];
  /** IANA time zones to offer, e.g. ["America/New_York", "UTC"]. */
  timeZones: string[];
  /** Two-factor settings: its status line and where "Manage" goes. Hidden when not given. */
  twoFactor?: { description: string; href: string };
  /** Signed-in sessions: a status line and where "Review" goes. Hidden when not given. */
  sessions?: { description: string; href: string };
  /** Where "Delete account" goes (a confirmation flow). Hidden when not given. */
  deleteAccountHref?: string;
  className?: string;
}

const FORM_ID = "account-profile-form";
const fieldError = "text-destructive-foreground text-xs";
const label = "font-medium text-sm leading-none";

const noSubscribe = () => () => {};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-heading text-base">{title}</h2>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function NativeSelect({ className, icon, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { icon?: ReactNode }) {
  return (
    <div className="relative">
      {icon ? <span className="pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2">{icon}</span> : null}
      <select
        className={cn(
          "h-9 w-full appearance-none rounded-lg border border-input bg-background pe-9 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/24",
          icon ? "ps-8" : "ps-3",
          className,
        )}
        {...props}
      />
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-e-3 top-1/2 size-3.5 -translate-y-1/2 opacity-60"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        viewBox="0 0 16 16"
      >
        <polyline points="4 6 8 10 12 6" />
      </svg>
    </div>
  );
}

function SecurityLink({ icon, title, description, cta, href, destructive }: { icon: ReactNode; title: string; description: string; cta: string; href: string; destructive?: boolean }) {
  return (
    <div className={cn("flex items-center gap-4 rounded-lg border p-3.5", destructive ? "border-destructive/40 bg-destructive/3" : "border-border/60 bg-background/40")}>
      <div aria-hidden className={cn("flex size-8 shrink-0 items-center justify-center rounded-md", destructive ? "bg-destructive/10 text-destructive-foreground" : "bg-foreground/6")}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-sm">{title}</h3>
        <p className="mt-0.5 text-muted-foreground text-xs">{description}</p>
      </div>
      <WirefrontLink
        className={cn(buttonVariants({ size: "sm", variant: destructive ? "outline" : "ghost" }), destructive && "border-destructive/40 text-destructive-foreground hover:bg-destructive/10")}
        href={href}
      >
        {cta}
        <span className="sr-only">, {title}</span>
      </WirefrontLink>
    </div>
  );
}

function AccountProfileScreen({
  profile,
  status = "ready",
  error,
  onRetry,
  onSave,
  onUploadPhoto,
  onRemovePhoto,
  languages,
  timeZones,
  twoFactor,
  sessions,
  deleteAccountHref,
  className,
}: AccountProfileProps) {
  const t = useMessages("accountProfile", ACCOUNT_PROFILE_MESSAGES);
  const { locale } = useWirefront();
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dirty, setDirty] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const form = useActionForm({ schema: AccountProfileInput, action: onSave, onSuccess: () => setDirty(false) });
  const upload = useAction(onUploadPhoto ?? (async () => {}));
  const remove = useAction(onRemovePhoto ?? (async () => {}));
  const photoError = upload.error ?? remove.error;

  // Time-zone names come from the runtime's ICU data, which differs between the server and the
  // browser, so the server and the first client render show the IANA id and the name follows.
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  const zoneName = (zone: string) => {
    if (!hydrated) return zone;
    try {
      const name = new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: "longGeneric" }).formatToParts(new Date(0)).find((p) => p.type === "timeZoneName")?.value;
      return name ? `${name} (${zone})` : zone;
    } catch {
      return zone;
    }
  };

  const discard = () => {
    form.reset();
    setDirty(false);
    setFormKey((k) => k + 1);
  };

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className="mx-auto max-w-3xl px-4 pt-8 pb-32 sm:px-6 sm:pt-12 lg:px-8">
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
        ) : !profile || status === "loading" ? (
          <div aria-busy="true" className="mt-8 flex flex-col gap-4">
            <Skeleton className="h-20 w-full motion-reduce:animate-none" />
            <Skeleton className="h-64 w-full motion-reduce:animate-none" />
          </div>
        ) : (
          <>
            <Section title={t.photo}>
              <div className="flex items-center gap-4 sm:gap-5">
                {profile.avatarUrl ? (
                  <img alt="" className="size-16 shrink-0 rounded-full object-cover ring-1 ring-border/60 sm:size-20" height={80} src={profile.avatarUrl} width={80} />
                ) : (
                  <div aria-hidden className="size-16 shrink-0 rounded-full bg-linear-to-br from-primary/40 to-primary/10 ring-1 ring-border/60 sm:size-20" />
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {onUploadPhoto || (onRemovePhoto && profile.avatarUrl) ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {onUploadPhoto ? (
                        <>
                          <input
                            accept="image/png,image/jpeg,image/svg+xml"
                            aria-label={t.choosePhoto}
                            className="sr-only"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void upload.run(file);
                              e.target.value = "";
                            }}
                            ref={fileRef}
                            tabIndex={-1}
                            type="file"
                          />
                          <Button aria-busy={upload.isPending()} disabled={upload.isPending()} onClick={() => fileRef.current?.click()} size="sm" type="button" variant="outline">
                            {upload.isPending() ? <Spinner data-icon="inline-start" /> : <UploadIcon />}
                            {t.upload}
                          </Button>
                        </>
                      ) : null}
                      {onRemovePhoto && profile.avatarUrl ? (
                        <Button aria-busy={remove.isPending()} disabled={remove.isPending()} onClick={() => void remove.run()} size="sm" type="button" variant="ghost">
                          {t.remove}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                  <p className="text-muted-foreground text-xs">{t.photoHint}</p>
                  {photoError ? (
                    <p className={fieldError} role="alert">
                      {photoError}
                    </p>
                  ) : null}
                </div>
              </div>
            </Section>

            <Separator className="my-8" />

            <Form className="flex flex-col" id={FORM_ID} key={formKey} noValidate onChange={() => setDirty(true)} {...form.formProps}>
              <Section title={t.identity}>
                <Field.Root className="flex flex-col gap-1.5" name="displayName">
                  <Field.Label className={label}>{t.displayName}</Field.Label>
                  <Input autoComplete="nickname" defaultValue={profile.displayName} />
                  <Field.Error className={fieldError} />
                </Field.Root>
                <Field.Root className="flex flex-col gap-1.5" name="handle">
                  <Field.Label className={label}>{t.handle}</Field.Label>
                  <div className="flex h-9 items-center gap-1 rounded-lg border border-input bg-background px-3 font-mono text-sm focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/24">
                    <AtSignIcon aria-hidden className="size-3.5 opacity-60" />
                    <Field.Control autoComplete="off" className="min-w-0 flex-1 bg-transparent outline-none" defaultValue={profile.handle} spellCheck={false} />
                  </div>
                  <Field.Error className={fieldError} />
                </Field.Root>
                <Field.Root className="flex flex-col gap-1.5" name="pronouns">
                  <Field.Label className={label}>{t.pronouns}</Field.Label>
                  <Input defaultValue={profile.pronouns} placeholder={t.pronounsPlaceholder} />
                  <Field.Error className={fieldError} />
                </Field.Root>
                <Field.Root className="flex flex-col gap-1.5" name="bio">
                  <Field.Label className={label}>{t.bio}</Field.Label>
                  <Field.Control defaultValue={profile.bio} placeholder={t.bioPlaceholder} render={<Textarea rows={3} />} />
                  <Field.Description className="text-muted-foreground text-xs">{t.bioHint}</Field.Description>
                  <Field.Error className={fieldError} />
                </Field.Root>
              </Section>

              <Separator className="my-8" />

              <Section title={t.locale}>
                <div className="flex flex-col gap-1.5">
                  <label className={label} htmlFor={`${id}-email`}>
                    {t.email}
                  </label>
                  <Input autoComplete="email" defaultValue={profile.email} id={`${id}-email`} readOnly type="email" />
                </div>
                <Field.Root className="flex flex-col gap-1.5" name="language">
                  <Field.Label className={label}>{t.language}</Field.Label>
                  <Field.Control
                    defaultValue={profile.language}
                    render={
                      <NativeSelect>
                        {languages.map((l) => (
                          <option key={l.value} lang={l.value} value={l.value}>
                            {l.label}
                          </option>
                        ))}
                      </NativeSelect>
                    }
                  />
                </Field.Root>
                <Field.Root className="flex flex-col gap-1.5" name="timeZone">
                  <Field.Label className={label}>{t.timeZone}</Field.Label>
                  <Field.Control
                    defaultValue={profile.timeZone}
                    render={
                      <NativeSelect icon={<GlobeIcon aria-hidden className="size-3.5 opacity-60" />}>
                        {timeZones.map((zone) => (
                          <option key={zone} value={zone}>
                            {zoneName(zone)}
                          </option>
                        ))}
                      </NativeSelect>
                    }
                  />
                </Field.Root>
              </Section>
            </Form>

            {twoFactor || sessions || deleteAccountHref ? (
              <>
                <Separator className="my-8" />
                <Section title={t.security}>
                  {twoFactor ? <SecurityLink cta={t.manage} description={twoFactor.description} href={twoFactor.href} icon={<ShieldCheckIcon className="size-4" />} title={t.twoFactor} /> : null}
                  {sessions ? <SecurityLink cta={t.review} description={sessions.description} href={sessions.href} icon={<KeyRoundIcon className="size-4" />} title={t.sessions} /> : null}
                  {deleteAccountHref ? (
                    <SecurityLink cta={t.delete} description={t.deleteHint} destructive href={deleteAccountHref} icon={<TrashIcon className="size-4" />} title={t.deleteAccount} />
                  ) : null}
                </Section>
              </>
            ) : null}
          </>
        )}
      </div>

      {profile && status === "ready" ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-border/60 border-t bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div aria-live="polite">
              {form.formError ? (
                <p className="text-destructive-foreground text-xs" role="alert">
                  {form.formError}
                </p>
              ) : (
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.3em]">{dirty ? t.unsaved : t.saved}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button disabled={!dirty || form.pending} onClick={discard} size="sm" type="button" variant="ghost">
                {t.discard}
              </Button>
              <Button aria-busy={form.pending} disabled={!dirty || form.pending} form={FORM_ID} size="sm" type="submit">
                {form.pending ? <Spinner data-icon="inline-start" /> : null}
                {t.save}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AccountProfileSettings(props: AccountProfileProps) {
  return (
    <ScreenBoundary name="AccountProfileSettings">
      <AccountProfileScreen {...props} />
    </ScreenBoundary>
  );
}
