// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Button } from "@wirefront/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@wirefront/ui/dropdown-menu";
import { Input } from "@wirefront/ui/input";
import { cn } from "@wirefront/ui/lib/utils";
import { Separator } from "@wirefront/ui/separator";
import { Spinner } from "@wirefront/ui/spinner";
import { Switch } from "@wirefront/ui/switch";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ChevronsUpDownIcon, type LucideIcon, UploadIcon } from "lucide-react";
import { Fragment, type ReactNode, type SelectHTMLAttributes, useId, useRef, useState } from "react";

import { type DateFormat, GeneralSettings, type UploadedAvatar } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("workspaceSettings.<key>"). */
export const WORKSPACE_SETTINGS_MESSAGES = {
  workspace: "Workspace",
  sections: "Settings sections",
  switchSection: "{workspace}, {section}: switch settings section",
  eyebrow: "Settings · General",
  title: "General",
  description: "Workspace identity, region, and default behaviours.",
  identity: "Identity",
  identityHint: "Visible to anyone with access.",
  avatar: "Workspace avatar",
  uploadAvatar: "Upload avatar",
  avatarHint: "PNG or SVG, 1024×1024 max.",
  name: "Name",
  slug: "Slug",
  slugHint: "Used in URLs.",
  region: "Region",
  regionHint: "Defaults applied to new members and exports.",
  timeZone: "Timezone",
  dateFormat: "Date format",
  ymd: "YYYY-MM-DD",
  dmy: "DD/MM/YYYY",
  mdy: "MM/DD/YYYY",
  defaults: "Defaults",
  publicSignUp: "Public sign-up",
  publicSignUpDescription: "Anyone with a workspace email can request access.",
  requireAdminTwoFactor: "Two-factor for admins",
  requireAdminTwoFactorDescription: "Require a second factor for owner and admin roles.",
  showProjectIds: "Show project IDs",
  showProjectIdsDescription: "Display the short ID next to project names everywhere.",
  unsaved: "Unsaved changes",
  saving: "Saving",
  saved: "All saved",
  discard: "Discard",
  save: "Save changes",
};

/** A link in the settings navigation. */
export interface SettingsNavItem {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  /** Set apart and tinted, for a danger zone. */
  danger?: boolean;
}

export interface TimeZoneOption {
  /** An IANA time zone. */
  value: string;
  label: string;
}

export interface WorkspaceSettingsProps {
  /** The saved settings (getGeneralSettings). */
  defaultValues: GeneralSettings;
  /** Save the form. Return fieldErrors (e.g. a taken slug) to show them on the fields. */
  onSave: Action<GeneralSettings>;
  timeZones: TimeZoneOption[];
  /** Shown before the slug, e.g. "acme.app/". */
  urlPrefix?: string;
  avatarUrl?: string;
  /** Upload a new avatar. The button hides without it. */
  onUploadAvatar?: Action<File, UploadedAvatar>;
  /** Settings navigation. Without it the screen shows only the form. */
  nav?: SettingsNavItem[];
  /** The nav item for this page. */
  activeSection?: string;
  className?: string;
}

const DATE_FORMATS: DateFormat[] = ["ymd", "dmy", "mdy"];
const TOGGLES = ["publicSignUp", "requireAdminTwoFactor", "showProjectIds"] as const;

const same = (a: GeneralSettings, b: GeneralSettings) => (Object.keys(a) as (keyof GeneralSettings)[]).every((key) => a[key] === b[key]);

function WorkspaceSettingsScreen({
  defaultValues,
  onSave,
  timeZones,
  urlPrefix,
  avatarUrl,
  onUploadAvatar,
  nav,
  activeSection,
  className,
}: WorkspaceSettingsProps) {
  const t = useMessages("workspaceSettings", WORKSPACE_SETTINGS_MESSAGES);
  const id = useId();
  const [saved, setSaved] = useState(defaultValues);
  const [values, setValues] = useState(defaultValues);
  const [avatar, setAvatar] = useState(avatarUrl);
  const fileInput = useRef<HTMLInputElement>(null);
  const form = useActionForm({ schema: GeneralSettings, action: onSave, onSuccess: (_, input) => setSaved(input) });
  const upload = useAction(onUploadAvatar ?? (async () => {}), { onSuccess: (result) => result && setAvatar(result.avatarUrl) });
  const dirty = !same(values, saved);
  const set = <Key extends keyof GeneralSettings>(key: Key, value: GeneralSettings[Key]) => setValues((v) => ({ ...v, [key]: value }));
  const active = nav?.find((item) => item.id === activeSection);
  const ActiveIcon = active?.icon;

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className={cn("mx-auto min-h-svh max-w-5xl", nav && "md:grid md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)]")}>
        {nav ? (
          <>
            {/* Phones: one sticky section switcher (current section + a menu of
                all sections) instead of a wall of chips. md+: the side nav. */}
            <div className="sticky top-0 z-20 border-border/60 border-b bg-background/95 px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={interpolate(t.switchSection, { workspace: values.name, section: active?.label ?? t.title })}
                  className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-border/60 bg-card px-3 text-start"
                >
                  {ActiveIcon ? <ActiveIcon aria-hidden className={cn("size-4 shrink-0", active?.danger ? "text-destructive" : "opacity-70")} /> : null}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{values.name}</span>
                    <span className="block truncate text-sm">{active?.label ?? t.title}</span>
                  </span>
                  <ChevronsUpDownIcon aria-hidden className="size-4 shrink-0 opacity-60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-(--anchor-width)">
                  {nav.map(({ icon: Icon, ...item }) => (
                    <Fragment key={item.id}>
                      {item.danger ? <DropdownMenuSeparator /> : null}
                      <DropdownMenuItem
                        className={item.danger ? "text-destructive-foreground" : undefined}
                        render={<WirefrontLink aria-current={item.id === activeSection ? "page" : undefined} href={item.href} />}
                      >
                        {Icon ? <Icon aria-hidden className="opacity-70" /> : null}
                        {item.label}
                      </DropdownMenuItem>
                    </Fragment>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <aside className="hidden border-border/60 border-e py-8 md:block md:px-4">
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.workspace}</div>
              <div className="mt-1 truncate font-heading text-lg">{values.name}</div>
              <nav aria-label={t.sections}>
                <ul className="mt-6 flex flex-col gap-0.5">
                  {nav.map(({ icon: Icon, ...item }) => {
                    const current = item.id === activeSection;
                    return (
                      <li className={item.danger ? "mt-3" : undefined} key={item.id}>
                        <WirefrontLink
                          aria-current={current ? "page" : undefined}
                          className={cn(
                            "flex w-full items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm transition-colors pointer-coarse:min-h-11",
                            item.danger
                              ? current
                                ? "bg-destructive/8 text-destructive-foreground"
                                : "text-destructive-foreground hover:bg-destructive/6"
                              : current
                                ? "bg-foreground/6 text-foreground"
                                : "text-muted-foreground hover:bg-foreground/3 hover:text-foreground",
                          )}
                          href={item.href}
                        >
                          {Icon ? <Icon aria-hidden className="size-4 opacity-70" /> : null}
                          {item.label}
                        </WirefrontLink>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>
          </>
        ) : null}

        <Form className="min-w-0 px-4 pt-8 pb-32 sm:px-6 md:pt-12 lg:px-10" errors={form.formProps.errors} noValidate onFormSubmit={() => void form.submit(values)}>
          <header className="border-border/60 border-b pb-6">
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
            <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
            <p className="mt-1 text-muted-foreground text-sm">{t.description}</p>
          </header>

          <Section hint={t.identityHint} title={t.identity}>
            <div className="flex items-center gap-4">
              {avatar ? (
                <img alt={t.avatar} className="size-14 shrink-0 rounded-lg object-cover ring-1 ring-border/60" src={avatar} />
              ) : (
                <div aria-hidden className="size-14 shrink-0 rounded-lg bg-linear-to-br from-primary/40 to-primary/10 ring-1 ring-border/60" />
              )}
              {onUploadAvatar ? (
                <div className="flex-1">
                  <input
                    accept="image/png,image/svg+xml"
                    aria-label={t.uploadAvatar}
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) void upload.run(file);
                    }}
                    ref={fileInput}
                    tabIndex={-1}
                    type="file"
                  />
                  <Button aria-busy={upload.isPending()} disabled={upload.isPending()} onClick={() => fileInput.current?.click()} size="sm" type="button" variant="outline">
                    {upload.isPending() ? <Spinner data-icon="inline-start" /> : <UploadIcon />}
                    {t.uploadAvatar}
                  </Button>
                  <p className="mt-1.5 text-muted-foreground text-xs">{t.avatarHint}</p>
                  {upload.error ? (
                    <p className="mt-1.5 text-destructive-foreground text-xs" role="alert">
                      {upload.error}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <Field.Root className="flex flex-col gap-1.5" name="name">
              <Field.Label className="font-medium text-sm leading-none">{t.name}</Field.Label>
              <Input autoComplete="organization" onChange={(e) => set("name", e.target.value)} value={values.name} />
              <Field.Error className="text-destructive-foreground text-xs" />
            </Field.Root>

            <Field.Root className="flex flex-col gap-1.5" name="slug">
              <Field.Label className="font-medium text-sm leading-none">{t.slug}</Field.Label>
              <div className="flex h-9 items-center gap-1 rounded-lg border border-input bg-background px-3 font-mono text-sm focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/24 pointer-coarse:h-11">
                {urlPrefix ? <span className="shrink-0 text-muted-foreground">{urlPrefix}</span> : null}
                <Field.Control
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(e) => set("slug", e.target.value)}
                  spellCheck={false}
                  value={values.slug}
                />
              </div>
              <Field.Description className="text-muted-foreground text-xs">{t.slugHint}</Field.Description>
              <Field.Error className="text-destructive-foreground text-xs" />
            </Field.Root>
          </Section>

          <Separator className="my-10" />

          <Section hint={t.regionHint} title={t.region}>
            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-sm leading-none" htmlFor={`${id}-tz`}>
                {t.timeZone}
              </label>
              <NativeSelect id={`${id}-tz`} onChange={(e) => set("timeZone", e.target.value)} value={values.timeZone}>
                {timeZones.map((zone) => (
                  <option key={zone.value} value={zone.value}>
                    {zone.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-sm leading-none" htmlFor={`${id}-fmt`}>
                {t.dateFormat}
              </label>
              <NativeSelect id={`${id}-fmt`} onChange={(e) => set("dateFormat", e.target.value as DateFormat)} value={values.dateFormat}>
                {DATE_FORMATS.map((format) => (
                  <option key={format} value={format}>
                    {t[format]}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </Section>

          <Separator className="my-10" />

          <Section title={t.defaults}>
            {TOGGLES.map((key) => (
              // The whole row is the label, so the hit area isn't just the 20px switch.
              <label
                className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-border/60 bg-background/40 px-4 py-3 sm:gap-6"
                htmlFor={`${id}-${key}-switch`}
                key={key}
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm" id={`${id}-${key}`}>
                    {t[key]}
                  </div>
                  <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed" id={`${id}-${key}-hint`}>
                    {t[`${key}Description`]}
                  </p>
                </div>
                <Switch
                  aria-describedby={`${id}-${key}-hint`}
                  aria-labelledby={`${id}-${key}`}
                  checked={values[key]}
                  className="mt-0.5 shrink-0"
                  id={`${id}-${key}-switch`}
                  onCheckedChange={(on) => set(key, on)}
                />
              </label>
            ))}
          </Section>

          {form.formError ? (
            <p className="mt-8 text-destructive-foreground text-sm" role="alert">
              {form.formError}
            </p>
          ) : null}

          <div className="fixed inset-x-0 bottom-0 z-30 border-border/60 border-t bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.3em]" role="status">
                {form.pending ? t.saving : dirty ? t.unsaved : t.saved}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className="pointer-coarse:h-11"
                  disabled={!dirty || form.pending}
                  onClick={() => {
                    setValues(saved);
                    form.reset();
                  }}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  {t.discard}
                </Button>
                <Button aria-busy={form.pending} className="pointer-coarse:h-11" disabled={!dirty || form.pending} size="sm" type="submit">
                  {form.pending ? <Spinner data-icon="inline-start" /> : null}
                  {t.save}
                </Button>
              </div>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mt-8 grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-[160px_minmax(0,1fr)] md:gap-y-6 lg:grid-cols-[180px_minmax(0,1fr)]">
      <div>
        <h2 className="font-medium text-sm">{title}</h2>
        {hint ? <p className="mt-1 text-muted-foreground text-xs leading-relaxed">{hint}</p> : null}
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

function NativeSelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-9 w-full appearance-none rounded-lg border border-input bg-background ps-3 pe-9 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/24 pointer-coarse:h-11",
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

export function WorkspaceSettings(props: WorkspaceSettingsProps) {
  return (
    <ScreenBoundary name="WorkspaceSettings">
      <WorkspaceSettingsScreen {...props} />
    </ScreenBoundary>
  );
}
