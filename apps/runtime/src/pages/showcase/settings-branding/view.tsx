// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Button } from "@wirefront/ui/button";
import { Input } from "@wirefront/ui/input";
import { cn } from "@wirefront/ui/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@wirefront/ui/popover";
import { Separator } from "@wirefront/ui/separator";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import {
  interpolate,
  useFormat,
  useMessages,
} from "@wirefront/ui/wirefront/provider";
import {
  type Action,
  type AsyncStatus,
  fail,
} from "@wirefront/ui/wirefront/types";
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  CircleSlashIcon,
  CopyIcon,
  GlobeIcon,
  ImageIcon,
  MailIcon,
  RefreshCwIcon,
  UploadCloudIcon,
} from "lucide-react";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  BrandColors,
  type BrandLogo,
  type Branding,
  DomainInput,
  type DomainStatus,
  EmailSender,
} from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("workspaceBranding.<key>"). */
export const WORKSPACE_BRANDING_MESSAGES = {
  eyebrow: "Settings · Branding",
  title: "Workspace branding",
  subtitle: "Logo, colours, custom domain, and the from-name on outbound mail.",
  logo: "Logo",
  logoHint: "Shown in nav, login, and emails. Pick one for each surface.",
  lightLogo: "Light mode logo",
  darkLogo: "Dark mode logo",
  light: "Light",
  dark: "Dark",
  noLogo: "No logo yet",
  replace: "Replace",
  upload: "Upload",
  chooseLogo: "Choose a {variant} logo",
  logoRules: "SVG or PNG · max 2MB",
  palette: "Colour palette",
  paletteHint: "Five tokens drive the look of the whole product.",
  primary: "Primary",
  primaryHint: "Buttons, links",
  accent: "Accent",
  accentHint: "Highlights",
  surface: "Surface",
  surfaceHint: "Cards",
  border: "Border",
  borderHint: "Dividers",
  foreground: "Foreground",
  foregroundHint: "Body text",
  edit: "Edit",
  hexValue: "{token} hex value",
  presets: "Presets",
  usePreset: "Use {value}",
  reset: "Reset",
  done: "Done",
  resetAll: "Reset all",
  saveColors: "Save colours",
  livePreview: "Live preview",
  previewBrand: "Acme · Pro",
  previewVersion: "v2.4",
  previewMetric: "Active users",
  previewValue: "12,408",
  previewChange: "+4.1%",
  previewSave: "Save changes",
  previewCancel: "Cancel",
  domain: "Custom domain",
  domainHint: "Serve the workspace from your own subdomain.",
  domainLabel: "Domain",
  domainPlaceholder: "workspace.yourcompany.com",
  saveDomain: "Save domain",
  verify: "Check DNS",
  verified: "Verified",
  pending: "Pending DNS",
  unset: "Not configured",
  txtRecord: "TXT record",
  txtHint: "Add this to your DNS so we can verify ownership.",
  copy: "Copy",
  copied: "Copied",
  type: "Type",
  txtType: "TXT",
  host: "Host",
  value: "Value",
  email: "Email from-name",
  emailHint: "What recipients see in their inbox.",
  fromName: "From name",
  replyTo: "Reply-to address",
  saveEmail: "Save sender",
  inboxPreview: "Inbox preview",
  inboxSubject: "Welcome to {name} — your account is ready.",
  inboxSnippet: "Tap to confirm your email and get started in under a minute…",
  inboxTime: "2m",
  errorTitle: "Couldn’t load branding",
  retry: "Try again",
};
type Messages = typeof WORKSPACE_BRANDING_MESSAGES;

export interface WorkspaceBrandingProps {
  /** The current branding. Leave it out while it loads. */
  data?: Branding;
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Upload a logo; resolve with the stored file. Upload buttons only show with this. */
  onUploadLogo?: Action<{ variant: "light" | "dark"; file: File }, BrandLogo>;
  /** Save the palette. The palette is read-only without it. */
  onSaveColors?: Action<BrandColors>;
  /** What "Reset" goes back to. Reset buttons only show with this. */
  defaultColors?: BrandColors;
  /** Colours offered in each swatch's picker. */
  presets?: string[];
  /** Save the custom domain. Read-only without it. */
  onSaveDomain?: Action<DomainInput>;
  /** Check DNS for the TXT record now; resolve with the new status. The button only shows with this. */
  onVerifyDomain?: Action<void, { status: DomainStatus }>;
  /** Save the email sender. Read-only without it. */
  onSaveEmail?: Action<EmailSender>;
  className?: string;
}

type Token = keyof BrandColors;
const TOKENS: Token[] = [
  "primary",
  "accent",
  "surface",
  "border",
  "foreground",
];
const TOKEN_HINT: Record<Token, keyof Messages> = {
  primary: "primaryHint",
  accent: "accentHint",
  surface: "surfaceHint",
  border: "borderHint",
  foreground: "foregroundHint",
};
/** The logo boxes always show their own scheme, whatever the app's theme. */
const LOGO_SCHEME: Record<
  "light" | "dark",
  { bg: string; fg: string; bar: string; barBorder: string; barText: string }
> = {
  light: {
    bg: "#fafafa",
    fg: "#0a0a0a",
    bar: "rgba(255,255,255,0.85)",
    barBorder: "#e4e4e7",
    barText: "#52525b",
  },
  dark: {
    bg: "#0a0a0a",
    fg: "#fafafa",
    bar: "rgba(0,0,0,0.55)",
    barBorder: "#27272a",
    barText: "#d4d4d8",
  },
};
const STATUS_PILL: Record<
  DomainStatus,
  { className: string; icon: ReactNode }
> = {
  verified: {
    className:
      "border-category-2/30 bg-category-2/10 text-category-2-foreground",
    icon: <CheckCircle2Icon aria-hidden className="size-3.5" />,
  },
  pending: {
    className:
      "border-category-3/30 bg-category-3/10 text-category-3-foreground",
    icon: <CircleAlertIcon aria-hidden className="size-3.5" />,
  },
  unset: {
    className: "border-border/60 bg-foreground/4 text-muted-foreground",
    icon: <CircleSlashIcon aria-hidden className="size-3.5" />,
  },
};
const fieldError = "text-destructive-foreground text-xs";
const label = "font-medium text-sm leading-none";
const eyebrow =
  "font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]";

/** Readable text on any colour: dark on light, white on dark. */
function contrastOn(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "#ffffff";
  const [r, g, b] = [0, 2, 4].map((i) =>
    Number.parseInt(h.slice(i, i + 2), 16)
  );
  return (0.299 * (r ?? 0) + 0.587 * (g ?? 0) + 0.114 * (b ?? 0)) / 255 > 0.6
    ? "#0a0a0a"
    : "#ffffff";
}

function SectionHeader({
  id,
  title,
  hint,
}: {
  id: string;
  title: string;
  hint?: string;
}) {
  return (
    <header>
      <h2 className="font-heading text-base" id={id}>
        {title}
      </h2>
      {hint ? (
        <p className="mt-1 text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </header>
  );
}

function LogoZone({
  variant,
  logo,
  onUpload,
  t,
}: {
  variant: "light" | "dark";
  logo: BrandLogo | null;
  onUpload?: Action<{ variant: "light" | "dark"; file: File }, BrandLogo>;
  t: Messages;
}) {
  const format = useFormat();
  const fileRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState(logo);
  useEffect(() => setCurrent(logo), [logo]);
  const upload = useAction(onUpload ?? (async () => fail("")), {
    onSuccess: (saved) => setCurrent(saved),
  });
  const scheme = LOGO_SCHEME[variant];
  const name = variant === "light" ? t.lightLogo : t.darkLogo;
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-background/40">
      <div className="flex items-center justify-between gap-2 border-border/40 border-b px-4 py-2.5">
        <h3 className="flex items-center gap-2 font-medium text-sm">
          <span
            aria-hidden
            className="size-2.5 rounded-full ring-1 ring-border/60"
            style={{ background: scheme.bg }}
          />
          {name}
        </h3>
        <span className={eyebrow}>
          {variant === "light" ? t.light : t.dark}
        </span>
      </div>
      <div
        className="relative flex h-32 items-center justify-center overflow-hidden"
        style={{ background: scheme.bg, color: scheme.fg }}
      >
        {current ? (
          <img
            alt={name}
            className="max-h-16 max-w-[70%] object-contain"
            src={current.url}
          />
        ) : (
          <span
            className="inline-flex items-center gap-2 text-sm"
            style={{ color: scheme.barText }}
          >
            <ImageIcon aria-hidden className="size-4" />
            {t.noLogo}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <span className={eyebrow}>
          {current
            ? `${current.fileName} · ${format.number(current.bytes / 1024, { maximumFractionDigits: 1 })} KB`
            : ""}
        </span>
        {onUpload ? (
          <>
            <input
              accept="image/svg+xml,image/png"
              aria-label={interpolate(t.chooseLogo, {
                variant: variant === "light" ? t.light : t.dark,
              })}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload.run({ variant, file });
                e.target.value = "";
              }}
              ref={fileRef}
              tabIndex={-1}
              type="file"
            />
            <Button
              aria-busy={upload.isPending()}
              disabled={upload.isPending()}
              onClick={() => fileRef.current?.click()}
              size="sm"
              type="button"
              variant="outline"
            >
              {upload.isPending() ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <UploadCloudIcon />
              )}
              {current ? t.replace : t.upload}{" "}
              <span className="sr-only">{name}</span>
            </Button>
          </>
        ) : null}
      </div>
      {upload.error ? (
        <p className={cn(fieldError, "px-4 pb-3")} role="alert">
          {upload.error}
        </p>
      ) : null}
    </div>
  );
}

function PalettePreview({ colors, t }: { colors: BrandColors; t: Messages }) {
  const style = {
    "--p-primary": colors.primary,
    "--p-accent": colors.accent,
    "--p-surface": colors.surface,
    "--p-border": colors.border,
    "--p-foreground": colors.foreground,
  } as CSSProperties;
  return (
    <div
      aria-hidden
      className="mt-2 overflow-hidden rounded-xl shadow-sm ring-1 ring-border/60"
      style={{
        ...style,
        background: "var(--p-surface)",
        color: "var(--p-foreground)",
      }}
    >
      <div
        className="flex items-center justify-between border-b px-3 py-2 text-[10px] uppercase tracking-[0.25em]"
        style={{ borderColor: "var(--p-border)" }}
      >
        <span className="flex items-center gap-1.5">
          <span
            className="size-1.5 rounded-full"
            style={{ background: "var(--p-accent)" }}
          />
          {t.previewBrand}
        </span>
        <span>{t.previewVersion}</span>
      </div>
      <div className="p-4">
        <div
          className="rounded-lg border p-3"
          style={{ borderColor: "var(--p-border)" }}
        >
          <div
            className="font-mono text-[10px] uppercase tracking-[0.25em]"
            style={{ opacity: 0.7 }}
          >
            {t.previewMetric}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-heading text-2xl">{t.previewValue}</span>
            <span
              className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em]"
              style={{
                background:
                  "color-mix(in srgb, var(--p-accent) 20%, transparent)",
              }}
            >
              {t.previewChange}
            </span>
          </div>
          <div
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
            style={{
              background:
                "color-mix(in srgb, var(--p-foreground) 8%, transparent)",
            }}
          >
            <div
              className="h-full w-[62%] rounded-full"
              style={{ background: "var(--p-accent)" }}
            />
          </div>
        </div>
        <span
          className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg px-3 font-medium text-sm"
          style={{
            background: "var(--p-primary)",
            color: contrastOn(colors.primary),
          }}
        >
          {t.previewSave}
        </span>
        <span
          className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-lg border px-3 font-medium text-sm"
          style={{ borderColor: "var(--p-border)" }}
        >
          {t.previewCancel}
        </span>
      </div>
    </div>
  );
}

function WorkspaceBrandingScreen({
  data,
  status = "ready",
  error,
  onRetry,
  onUploadLogo,
  onSaveColors,
  defaultColors,
  presets = [],
  onSaveDomain,
  onVerifyDomain,
  onSaveEmail,
  className,
}: WorkspaceBrandingProps) {
  const t = useMessages("workspaceBranding", WORKSPACE_BRANDING_MESSAGES);
  const id = useId();
  const [colors, setColors] = useState<BrandColors | undefined>(data?.colors);
  const [openToken, setOpenToken] = useState<Token | null>(null);
  const [domainStatus, setDomainStatus] = useState<DomainStatus>(
    data?.domain.status ?? "unset"
  );
  const [domainName, setDomainName] = useState(data?.domain.name ?? "");
  const [sender, setSender] = useState(data?.email);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!data) return;
    setColors(data.colors);
    setDomainStatus(data.domain.status);
    setDomainName(data.domain.name);
    setSender(data.email);
  }, [data]);

  const saveColors = useAction(onSaveColors ?? (async () => {}));
  const domainForm = useActionForm({
    schema: DomainInput,
    action: onSaveDomain ?? (async () => {}),
    onSuccess: (_, input) => {
      setDomainName(input.name);
      setDomainStatus("pending");
    },
  });
  const verify = useAction(onVerifyDomain ?? (async () => fail("")), {
    onSuccess: (r) => setDomainStatus(r.status),
  });
  const emailForm = useActionForm({
    schema: EmailSender,
    action: onSaveEmail ?? (async () => {}),
  });
  const copyTxt = useAction(
    async (value: string) => {
      if (!navigator.clipboard) return fail(t.copy);
      await navigator.clipboard.writeText(value);
    },
    {
      onSuccess: () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      },
    }
  );

  const ready = status === "ready" && data && colors && sender;
  const colorsDirty = Boolean(
    ready &&
      TOKENS.some(
        (k) => colors[k].toLowerCase() !== data.colors[k].toLowerCase()
      )
  );
  const colorsValid = Boolean(colors && BrandColors.safeParse(colors).success);
  const pill = STATUS_PILL[domainStatus];

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          {t.eyebrow}
        </div>
        <h1 className="mt-1 font-heading text-3xl">{t.title}</h1>
        <p className="mt-1.5 text-muted-foreground text-sm">{t.subtitle}</p>

        {status === "error" ? (
          <div className="mt-10 rounded-xl border border-border/60 p-10 text-center">
            <p className="font-medium">{t.errorTitle}</p>
            {error ? (
              <p className="mt-1 text-muted-foreground text-sm">{error}</p>
            ) : null}
            {onRetry ? (
              <Button
                className="mt-4"
                onClick={onRetry}
                size="sm"
                variant="outline"
              >
                {t.retry}
              </Button>
            ) : null}
          </div>
        ) : !ready ? (
          <div aria-busy="true" className="mt-10 flex flex-col gap-6">
            <Skeleton className="h-48 w-full rounded-xl motion-reduce:animate-none" />
            <Skeleton className="h-64 w-full rounded-xl motion-reduce:animate-none" />
          </div>
        ) : (
          <>
            <section aria-labelledby={`${id}-logo`} className="mt-10">
              <SectionHeader
                hint={t.logoHint}
                id={`${id}-logo`}
                title={t.logo}
              />
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <LogoZone
                  logo={data.logos.light}
                  onUpload={onUploadLogo}
                  t={t}
                  variant="light"
                />
                <LogoZone
                  logo={data.logos.dark}
                  onUpload={onUploadLogo}
                  t={t}
                  variant="dark"
                />
              </div>
              <p
                className={cn(
                  eyebrow,
                  "mt-2.5 inline-flex items-center gap-1.5"
                )}
              >
                <ImageIcon aria-hidden className="size-3" />
                {t.logoRules}
              </p>
            </section>

            <Separator className="my-10" />

            <section aria-labelledby={`${id}-palette`}>
              <SectionHeader
                hint={t.paletteHint}
                id={`${id}-palette`}
                title={t.palette}
              />
              <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div>
                  <div className="flex flex-wrap items-start gap-3">
                    {TOKENS.map((token) => (
                      <Popover
                        key={token}
                        onOpenChange={(o) => setOpenToken(o ? token : null)}
                        open={openToken === token}
                      >
                        <PopoverTrigger
                          disabled={!onSaveColors}
                          render={
                            <button
                              className="group flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-background/40 p-3 outline-none transition-colors hover:border-border focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
                              type="button"
                            />
                          }
                        >
                          <span
                            aria-hidden
                            className="size-10 rounded-full ring-1 ring-border/60 ring-offset-2 ring-offset-background transition-transform group-hover:scale-105"
                            style={{ background: colors[token] }}
                          />
                          <span className="sr-only">{t.edit}</span>{" "}
                          <span className="font-medium text-xs">
                            {t[token]}
                          </span>{" "}
                          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                            {colors[token]}
                          </span>
                        </PopoverTrigger>
                        <PopoverContent className="w-[min(15rem,calc(100vw-2rem))] p-3">
                          <div className={eyebrow}>
                            {t[token]} · {t[TOKEN_HINT[token]]}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              aria-hidden
                              className="size-7 shrink-0 rounded-md ring-1 ring-border/60"
                              style={{ background: colors[token] }}
                            />
                            <Input
                              aria-label={interpolate(t.hexValue, {
                                token: t[token],
                              })}
                              className="h-7 font-mono text-xs"
                              onChange={(e) =>
                                setColors((c) =>
                                  c ? { ...c, [token]: e.target.value } : c
                                )
                              }
                              spellCheck={false}
                              value={colors[token]}
                            />
                          </div>
                          {presets.length ? (
                            <>
                              <div className={cn(eyebrow, "mt-3")}>
                                {t.presets}
                              </div>
                              <div className="mt-1.5 grid grid-cols-6 gap-1.5">
                                {presets.map((p) => (
                                  <button
                                    aria-label={interpolate(t.usePreset, {
                                      value: p,
                                    })}
                                    aria-pressed={
                                      colors[token].toLowerCase() ===
                                      p.toLowerCase()
                                    }
                                    className="aspect-square w-full rounded-md outline-none ring-1 ring-border/60 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring aria-pressed:ring-2 aria-pressed:ring-foreground"
                                    key={p}
                                    onClick={() =>
                                      setColors((c) =>
                                        c ? { ...c, [token]: p } : c
                                      )
                                    }
                                    style={{ background: p }}
                                    type="button"
                                  />
                                ))}
                              </div>
                            </>
                          ) : null}
                          <div className="mt-3 flex items-center justify-between">
                            {defaultColors ? (
                              <button
                                className="rounded font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                onClick={() =>
                                  setColors((c) =>
                                    c
                                      ? { ...c, [token]: defaultColors[token] }
                                      : c
                                  )
                                }
                                type="button"
                              >
                                {t.reset}
                              </button>
                            ) : (
                              <span />
                            )}
                            <Button
                              onClick={() => setOpenToken(null)}
                              size="sm"
                              variant="ghost"
                            >
                              {t.done}
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ))}
                    {defaultColors && onSaveColors ? (
                      <button
                        className="ms-auto inline-flex h-8 items-center gap-1.5 self-start rounded-md px-2.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] outline-none transition-colors hover:bg-foreground/4 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => setColors(defaultColors)}
                        type="button"
                      >
                        <RefreshCwIcon aria-hidden className="size-3" />
                        {t.resetAll}
                      </button>
                    ) : null}
                  </div>
                  {onSaveColors ? (
                    <div className="mt-4 flex items-center gap-3">
                      <Button
                        aria-busy={saveColors.isPending()}
                        disabled={
                          !colorsDirty || !colorsValid || saveColors.isPending()
                        }
                        onClick={() => void saveColors.run(colors)}
                        size="sm"
                        type="button"
                      >
                        {saveColors.isPending() ? (
                          <Spinner data-icon="inline-start" />
                        ) : null}
                        {t.saveColors}
                      </Button>
                      {!colorsValid ? (
                        <p className={fieldError} role="alert">
                          {
                            BrandColors.safeParse(colors).error?.issues[0]
                              ?.message
                          }
                        </p>
                      ) : saveColors.error ? (
                        <p className={fieldError} role="alert">
                          {saveColors.error}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <aside
                  aria-labelledby={`${id}-preview`}
                  className="lg:sticky lg:top-12 lg:self-start"
                >
                  <h3
                    className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]"
                    id={`${id}-preview`}
                  >
                    {t.livePreview}
                  </h3>
                  <PalettePreview
                    colors={colorsValid ? colors : data.colors}
                    t={t}
                  />
                </aside>
              </div>
            </section>

            <Separator className="my-10" />

            <section aria-labelledby={`${id}-domain`}>
              <SectionHeader
                hint={t.domainHint}
                id={`${id}-domain`}
                title={t.domain}
              />
              <div className="mt-4 rounded-xl border border-border/60 bg-background/40 p-5">
                <Form
                  className="flex flex-col gap-1.5"
                  noValidate
                  {...domainForm.formProps}
                >
                  <Field.Root
                    className="flex flex-col gap-1.5"
                    disabled={!onSaveDomain}
                    name="name"
                  >
                    <Field.Label className={label}>{t.domainLabel}</Field.Label>
                    <div className="flex flex-wrap items-stretch gap-2">
                      <div className="relative min-w-48 flex-1">
                        <span className="pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2">
                          <GlobeIcon
                            aria-hidden
                            className="size-3.5 opacity-60"
                          />
                        </span>
                        <Input
                          className="ps-8 font-mono text-sm"
                          defaultValue={domainName}
                          placeholder={t.domainPlaceholder}
                          spellCheck={false}
                        />
                      </div>
                      <span
                        className={cn(
                          "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 font-mono text-[10px] uppercase tracking-[0.25em]",
                          pill.className
                        )}
                        role="status"
                      >
                        {pill.icon}
                        {t[domainStatus]}
                      </span>
                    </div>
                    <Field.Error className={fieldError} />
                  </Field.Root>
                  {domainForm.formError ? (
                    <p className={fieldError} role="alert">
                      {domainForm.formError}
                    </p>
                  ) : null}
                  {onSaveDomain || onVerifyDomain ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {onSaveDomain ? (
                        <Button
                          aria-busy={domainForm.pending}
                          disabled={domainForm.pending}
                          size="sm"
                          type="submit"
                          variant="outline"
                        >
                          {domainForm.pending ? (
                            <Spinner data-icon="inline-start" />
                          ) : null}
                          {t.saveDomain}
                        </Button>
                      ) : null}
                      {onVerifyDomain && domainStatus === "pending" ? (
                        <Button
                          aria-busy={verify.isPending()}
                          disabled={verify.isPending()}
                          onClick={() => void verify.run()}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          {verify.isPending() ? (
                            <Spinner data-icon="inline-start" />
                          ) : (
                            <RefreshCwIcon />
                          )}
                          {t.verify}
                        </Button>
                      ) : null}
                      {verify.error ? (
                        <p className={fieldError} role="alert">
                          {verify.error}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </Form>

                {domainStatus !== "unset" ? (
                  <div className="mt-5 rounded-lg border border-border/60 bg-foreground/2 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className={eyebrow}>{t.txtRecord}</h3>
                        <p className="mt-1 text-muted-foreground text-xs">
                          {t.txtHint}
                        </p>
                      </div>
                      <Button
                        onClick={() => void copyTxt.run(data.domain.txtRecord)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {copied ? <CheckCircle2Icon /> : <CopyIcon />}
                        {copied ? t.copied : t.copy}
                      </Button>
                    </div>
                    <dl className="mt-3 grid grid-cols-[80px_1fr] gap-x-3 gap-y-1.5 rounded-md border border-border/60 bg-background p-3 font-mono text-[11px]">
                      <dt className="text-muted-foreground uppercase tracking-[0.2em]">
                        {t.type}
                      </dt>
                      <dd>{t.txtType}</dd>
                      <dt className="text-muted-foreground uppercase tracking-[0.2em]">
                        {t.host}
                      </dt>
                      <dd>{domainName || "@"}</dd>
                      <dt className="text-muted-foreground uppercase tracking-[0.2em]">
                        {t.value}
                      </dt>
                      <dd className="break-all">{data.domain.txtRecord}</dd>
                    </dl>
                  </div>
                ) : null}
              </div>
            </section>

            <Separator className="my-10" />

            <section aria-labelledby={`${id}-email`} className="pb-12">
              <SectionHeader
                hint={t.emailHint}
                id={`${id}-email`}
                title={t.email}
              />
              <div className="mt-4 rounded-xl border border-border/60 bg-background/40 p-5">
                <Form
                  noValidate
                  onChange={(e) => {
                    const form = e.currentTarget as HTMLFormElement;
                    const fd = new FormData(form);
                    setSender({
                      fromName: String(fd.get("fromName") ?? ""),
                      replyTo: String(fd.get("replyTo") ?? ""),
                    });
                  }}
                  {...emailForm.formProps}
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
                    <Field.Root
                      className="flex flex-col gap-1.5"
                      disabled={!onSaveEmail}
                      name="fromName"
                    >
                      <Field.Label className={label}>{t.fromName}</Field.Label>
                      <Input defaultValue={data.email.fromName} />
                      <Field.Error className={fieldError} />
                    </Field.Root>
                    <Field.Root
                      className="flex flex-col gap-1.5"
                      disabled={!onSaveEmail}
                      name="replyTo"
                    >
                      <Field.Label className={label}>{t.replyTo}</Field.Label>
                      <Input
                        autoComplete="email"
                        className="font-mono text-sm"
                        defaultValue={data.email.replyTo}
                        type="email"
                      />
                      <Field.Error className={fieldError} />
                    </Field.Root>
                  </div>
                  {emailForm.formError ? (
                    <p className={cn(fieldError, "mt-2")} role="alert">
                      {emailForm.formError}
                    </p>
                  ) : null}
                  {onSaveEmail ? (
                    <Button
                      aria-busy={emailForm.pending}
                      className="mt-3"
                      disabled={emailForm.pending}
                      size="sm"
                      type="submit"
                      variant="outline"
                    >
                      {emailForm.pending ? (
                        <Spinner data-icon="inline-start" />
                      ) : null}
                      {t.saveEmail}
                    </Button>
                  ) : null}
                </Form>

                <h3 className={cn(eyebrow, "mt-4")}>{t.inboxPreview}</h3>
                <div
                  aria-hidden
                  className="mt-2 flex items-center gap-3 rounded-lg border border-border/60 bg-background p-3"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/30 to-primary/5 ring-1 ring-border/60">
                    <MailIcon className="size-4 opacity-70" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-sm">
                        {sender.fromName || data.email.fromName}
                      </span>
                      <span className="truncate font-mono text-[11px] text-muted-foreground">
                        &lt;{sender.replyTo || data.email.replyTo}&gt;
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-sm">
                      {interpolate(t.inboxSubject, {
                        name: sender.fromName || data.email.fromName,
                      })}
                    </div>
                    <div className="mt-0.5 truncate text-muted-foreground text-xs">
                      {t.inboxSnippet}
                    </div>
                  </div>
                  <span className={cn(eyebrow, "shrink-0")}>{t.inboxTime}</span>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export function WorkspaceBranding(props: WorkspaceBrandingProps) {
  return (
    <ScreenBoundary name="WorkspaceBranding">
      <WorkspaceBrandingScreen {...props} />
    </ScreenBoundary>
  );
}
