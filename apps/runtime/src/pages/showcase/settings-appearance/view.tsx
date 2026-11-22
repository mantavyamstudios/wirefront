// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import {
  type ReactNode,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from "react";
import type { AppearancePrefs } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("appearanceSettings.<key>"). */
export const APPEARANCE_SETTINGS_MESSAGES = {
  eyebrow: "Settings · Appearance",
  title: "Make it yours",
  subtitle:
    "Tweak everything from the comfort of one screen. Changes preview live on the right.",
  mode: "Mode",
  modeHint: "Light, dark, or follow your system.",
  light: "Light",
  dark: "Dark",
  system: "System",
  palette: "Palette",
  paletteHint: "Accent and primary colours.",
  graphite: "Graphite",
  indigo: "Indigo",
  crimson: "Crimson",
  sage: "Sage",
  amber: "Amber",
  violet: "Violet",
  density: "Density",
  densityHint: "Tighter spacing for power users, looser for clarity.",
  comfortable: "Comfortable",
  cozy: "Cozy",
  compact: "Compact",
  font: "Font",
  fontHint: "Used everywhere except code.",
  fontSample: "AaBbCc 0123",
  preview: "Preview",
  previewHint: "A sample of how the app will look.",
  reset: "Reset",
  saved: "Saved",
  previewWorkspace: "Acme · Workspace",
  previewInitial: "A",
  previewProject: "Project · Q3 planning",
  previewTitle: "Roadmap notes",
  previewSave: "Save",
  previewBadge: "Pro",
  previewUpdated: "Updated 2m ago",
  previewHeadline: "Three things shipped this week.",
  previewBody:
    "The audit log API, scoped invites, and a simpler pricing page. Light read.",
  previewRow1: "Two-factor auth",
  previewRow2: "Public sign-up",
  previewRow3: "Show project IDs",
  previewMode: "Mode · {mode}",
  errorTitle: "Couldn’t load appearance settings",
  retry: "Try again",
};

export interface AppearanceSettingsProps {
  /** The saved preferences. Leave it out while they load. */
  prefs?: AppearancePrefs;
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Save after every change. The choice shows at once and reverts if this fails. Choices are read-only without it. */
  onSave?: Action<AppearancePrefs>;
  /** What "Reset" goes back to. Hidden when not given. */
  defaults?: AppearancePrefs;
  className?: string;
}

type Mode = AppearancePrefs["mode"];
type Density = AppearancePrefs["density"];
type Palette = AppearancePrefs["palette"];
type FontId = AppearancePrefs["font"];

/** Swatch colours for the palette chips and the preview's accent. */
const PALETTES: Record<Palette, { swatch: [string, string] }> = {
  graphite: { swatch: ["#71717a", "#a1a1aa"] },
  indigo: { swatch: ["#3b82f6", "#1e40af"] },
  crimson: { swatch: ["#ef4444", "#991b1b"] },
  sage: { swatch: ["#22c55e", "#15803d"] },
  amber: { swatch: ["#f59e0b", "#b45309"] },
  violet: { swatch: ["#a855f7", "#7e22ce"] },
};
const PALETTE_ORDER: Palette[] = [
  "graphite",
  "indigo",
  "crimson",
  "sage",
  "amber",
  "violet",
];

/** Font names are proper nouns, so they aren't translated. */
const FONTS: Record<FontId, { label: string; stack: string }> = {
  geist: {
    label: "Geist",
    stack: '"Geist Variable", "Geist", system-ui, sans-serif',
  },
  inter: {
    label: "Inter",
    stack: '"Inter Variable", "Inter", system-ui, sans-serif',
  },
  mono: {
    label: "Geist Mono",
    stack:
      '"Geist Mono Variable", "Geist Mono", ui-monospace, "SF Mono", monospace',
  },
};
const FONT_ORDER: FontId[] = ["geist", "inter", "mono"];
const MODE_ORDER: Mode[] = ["light", "dark", "system"];
const DENSITY_ORDER: Density[] = ["comfortable", "cozy", "compact"];
const MODE_ICON: Record<Mode, ReactNode> = {
  light: <SunIcon aria-hidden className="size-3.5" />,
  dark: <MoonIcon aria-hidden className="size-3.5" />,
  system: <MonitorIcon aria-hidden className="size-3.5" />,
};
const MODE_PREVIEW: Record<Mode, "light" | "dark" | "split"> = {
  light: "light",
  dark: "dark",
  system: "split",
};

const card =
  "relative cursor-pointer rounded-xl border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring data-checked:border-foreground/60 data-checked:bg-foreground/4 border-border/60 bg-background/40 hover:border-border data-disabled:cursor-default";

// Reading matchMedia during render made server and client HTML differ.
// useSyncExternalStore hydrates with the server snapshot, then switches to
// the real OS scheme and follows changes.
const DARK_QUERY = "(prefers-color-scheme: dark)";
function subscribeOsScheme(onChange: () => void) {
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
function useOsScheme(): "light" | "dark" {
  return useSyncExternalStore(
    subscribeOsScheme,
    () => (window.matchMedia(DARK_QUERY).matches ? "dark" : "light"),
    () => "dark"
  );
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

function AppearanceSettingsScreen({
  prefs: saved,
  status = "ready",
  error,
  onRetry,
  onSave,
  defaults,
  className,
}: AppearanceSettingsProps) {
  const t = useMessages("appearanceSettings", APPEARANCE_SETTINGS_MESSAGES);
  const id = useId();
  const [prefs, setPrefs] = useState(saved);
  useEffect(() => setPrefs(saved), [saved]);
  const save = useAction(onSave ?? (async () => {}), {
    optimistic: (next) => {
      const before = prefs;
      setPrefs(next);
      return () => setPrefs(before);
    },
  });
  const set = <K extends keyof AppearancePrefs>(
    key: K,
    value: AppearancePrefs[K]
  ) => {
    if (prefs && prefs[key] !== value)
      void save.run({ ...prefs, [key]: value });
  };
  const readOnly = !onSave;

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
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
        ) : !prefs || status === "loading" ? (
          <div
            aria-busy="true"
            className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]"
          >
            <Skeleton className="h-96 w-full motion-reduce:animate-none" />
            <Skeleton className="h-96 w-full motion-reduce:animate-none" />
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              {save.error ? (
                <p
                  className="mb-6 text-destructive-foreground text-sm"
                  role="alert"
                >
                  {save.error}
                </p>
              ) : null}
              <section>
                <SectionHeader
                  hint={t.modeHint}
                  id={`${id}-mode`}
                  title={t.mode}
                />
                <RadioGroup
                  aria-labelledby={`${id}-mode`}
                  className="mt-4 grid max-w-2xl grid-cols-3 gap-3"
                  disabled={readOnly}
                  onValueChange={(v) => set("mode", v as Mode)}
                  value={prefs.mode}
                >
                  {MODE_ORDER.map((mode) => (
                    <Radio.Root
                      className={cn(
                        card,
                        "group flex flex-col gap-3 overflow-hidden text-start"
                      )}
                      key={mode}
                      value={mode}
                    >
                      <ModePreview scheme={MODE_PREVIEW[mode]} />
                      <span className="flex items-center justify-between px-3 pb-3 text-sm">
                        <span className="flex items-center gap-2">
                          {MODE_ICON[mode]}
                          {t[mode]}
                        </span>
                        {prefs.mode === mode ? (
                          <CheckIcon
                            aria-hidden
                            className="size-3.5 opacity-80"
                          />
                        ) : null}
                      </span>
                    </Radio.Root>
                  ))}
                </RadioGroup>
              </section>

              <section className="mt-10">
                <SectionHeader
                  hint={t.paletteHint}
                  id={`${id}-palette`}
                  title={t.palette}
                />
                <RadioGroup
                  aria-labelledby={`${id}-palette`}
                  className="mt-4 grid max-w-2xl grid-cols-3 gap-3 sm:grid-cols-6"
                  disabled={readOnly}
                  onValueChange={(v) => set("palette", v as Palette)}
                  value={prefs.palette}
                >
                  {PALETTE_ORDER.map((p) => {
                    const [a, b] = PALETTES[p].swatch;
                    return (
                      <Radio.Root
                        className={cn(
                          card,
                          "group flex flex-col items-center gap-2 p-3"
                        )}
                        key={p}
                        value={p}
                      >
                        <span
                          aria-hidden
                          className="relative flex size-12 items-center justify-center"
                        >
                          <span
                            className="absolute size-12 rounded-full opacity-30 blur-md"
                            style={{ background: a }}
                          />
                          <span
                            className="relative size-7 rounded-full ring-2 ring-background"
                            style={{ background: a }}
                          />
                          <span
                            className="-ms-3 relative size-7 rounded-full ring-2 ring-background"
                            style={{ background: b }}
                          />
                        </span>
                        <span className="font-medium text-xs">{t[p]}</span>
                        {prefs.palette === p ? (
                          <CheckIcon
                            aria-hidden
                            className="absolute inset-e-1.5 top-1.5 size-3 opacity-80"
                          />
                        ) : null}
                      </Radio.Root>
                    );
                  })}
                </RadioGroup>
              </section>

              <section className="mt-10">
                <SectionHeader
                  hint={t.densityHint}
                  id={`${id}-density`}
                  title={t.density}
                />
                <RadioGroup
                  aria-labelledby={`${id}-density`}
                  className="mt-4 grid max-w-2xl grid-cols-3 gap-1 rounded-xl border border-border/60 bg-background/40 p-1"
                  disabled={readOnly}
                  onValueChange={(v) => set("density", v as Density)}
                  value={prefs.density}
                >
                  {DENSITY_ORDER.map((d) => (
                    <Radio.Root
                      className="cursor-pointer rounded-lg px-3 py-2.5 text-muted-foreground text-sm outline-none transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-foreground data-checked:text-background data-disabled:cursor-default"
                      key={d}
                      value={d}
                    >
                      {t[d]}
                    </Radio.Root>
                  ))}
                </RadioGroup>
              </section>

              <section className="mt-10">
                <SectionHeader
                  hint={t.fontHint}
                  id={`${id}-font`}
                  title={t.font}
                />
                <RadioGroup
                  aria-labelledby={`${id}-font`}
                  className="mt-4 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3"
                  disabled={readOnly}
                  onValueChange={(v) => set("font", v as FontId)}
                  value={prefs.font}
                >
                  {FONT_ORDER.map((f) => (
                    <Radio.Root
                      className={cn(card, "p-4 text-start")}
                      key={f}
                      value={f}
                    >
                      <span
                        aria-hidden
                        className="block text-xl tracking-tight"
                        style={{ fontFamily: FONTS[f].stack }}
                      >
                        {t.fontSample}
                      </span>
                      <span className="mt-2 block font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                        {FONTS[f].label}
                      </span>
                      {prefs.font === f ? (
                        <CheckIcon
                          aria-hidden
                          className="absolute inset-e-2.5 top-2.5 size-3.5 opacity-80"
                        />
                      ) : null}
                    </Radio.Root>
                  ))}
                </RadioGroup>
              </section>
            </div>

            <aside
              aria-labelledby={`${id}-preview`}
              className="lg:sticky lg:top-12 lg:self-start"
            >
              <h2
                className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]"
                id={`${id}-preview`}
              >
                {t.preview}
              </h2>
              <div className="mt-2 flex items-center justify-between text-muted-foreground text-xs">
                <span>{t.previewHint}</span>
                {defaults && onSave ? (
                  <button
                    className="rounded font-mono text-[10px] uppercase tracking-[0.25em] outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => void save.run(defaults)}
                    type="button"
                  >
                    {t.reset}
                  </button>
                ) : null}
              </div>
              <div aria-hidden>
                <PreviewPane
                  density={prefs.density}
                  font={prefs.font}
                  mode={prefs.mode}
                  palette={prefs.palette}
                />
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

export function AppearanceSettings(props: AppearanceSettingsProps) {
  return (
    <ScreenBoundary name="AppearanceSettings">
      <AppearanceSettingsScreen {...props} />
    </ScreenBoundary>
  );
}

const DENSITY: Record<
  Density,
  {
    padCard: string;
    padRow: string;
    gapStack: string;
    rowH: string;
    text: string;
  }
> = {
  comfortable: {
    padCard: "20px",
    padRow: "12px 14px",
    gapStack: "14px",
    rowH: "44px",
    text: "14px",
  },
  cozy: {
    padCard: "16px",
    padRow: "10px 12px",
    gapStack: "10px",
    rowH: "38px",
    text: "13.5px",
  },
  compact: {
    padCard: "12px",
    padRow: "6px 10px",
    gapStack: "6px",
    rowH: "30px",
    text: "12.5px",
  },
};

const SCHEMES = {
  light: {
    bg: "#fafafa",
    surface: "#ffffff",
    surfaceMuted: "#f4f4f5",
    text: "#0a0a0a",
    textMuted: "#71717a",
    border: "#e4e4e7",
    rail: "#f4f4f5",
    railBorder: "#e4e4e7",
    activeWash: "rgba(0,0,0,0.05)",
  },
  dark: {
    bg: "#0a0a0a",
    surface: "#141416",
    surfaceMuted: "#101012",
    text: "#fafafa",
    textMuted: "#a1a1aa",
    border: "#27272a",
    rail: "#101012",
    railBorder: "#27272a",
    activeWash: "rgba(255,255,255,0.06)",
  },
} as const;

type Scheme = (typeof SCHEMES)[keyof typeof SCHEMES];

function PreviewPane({
  mode,
  palette,
  density,
  font,
}: {
  mode: Mode;
  palette: Palette;
  density: Density;
  font: FontId;
}) {
  const osScheme = useOsScheme();
  const effectiveMode: "light" | "dark" = mode === "system" ? osScheme : mode;
  const s = SCHEMES[effectiveMode];
  const t = useMessages("appearanceSettings", APPEARANCE_SETTINGS_MESSAGES);
  const [accent] = PALETTES[palette].swatch;
  const fontStack = FONTS[font].stack;
  const d = DENSITY[density];

  return (
    <div
      className="mt-3 overflow-hidden rounded-xl ring-1 ring-border/60 shadow-sm"
      style={{
        background: s.bg,
        color: s.text,
        fontFamily: fontStack,
        fontSize: d.text,
      }}
    >
      <div
        className="flex items-center justify-between border-b px-3 py-1.5 text-[10px] uppercase tracking-[0.25em]"
        style={{ borderColor: s.border, color: s.textMuted }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="size-1.5 rounded-full"
            style={{ background: accent }}
          />
          {t.previewWorkspace}
        </div>
        <div className="flex items-center gap-1">
          <span
            className="size-1.5 rounded-full"
            style={{ background: "#ef4444", opacity: 0.7 }}
          />
          <span
            className="size-1.5 rounded-full"
            style={{ background: "#f59e0b", opacity: 0.7 }}
          />
          <span
            className="size-1.5 rounded-full"
            style={{ background: "#22c55e", opacity: 0.7 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-[80px_1fr]">
        <div
          className="flex flex-col items-center gap-1.5 border-e"
          style={{
            background: s.rail,
            borderColor: s.railBorder,
            padding: "10px 0",
          }}
        >
          <div
            className="flex size-7 items-center justify-center rounded-md text-[11px] font-medium"
            style={{
              background: accent,
              color: "#fff",
            }}
          >
            {t.previewInitial}
          </div>
          <RailItem active scheme={s} accent={accent}>
            ●
          </RailItem>
          <RailItem scheme={s}>○</RailItem>
          <RailItem scheme={s}>◇</RailItem>
          <div className="mt-auto" />
          <RailItem scheme={s}>⚙</RailItem>
        </div>

        <div
          className="flex flex-col"
          style={{ padding: d.padCard, gap: d.gapStack }}
        >
          <div
            className="flex items-center justify-between"
            style={{ minHeight: d.rowH }}
          >
            <div>
              <div
                className="text-[10px] uppercase tracking-[0.25em]"
                style={{ color: s.textMuted }}
              >
                {t.previewProject}
              </div>
              <div
                className="mt-0.5 font-medium"
                style={{ fontSize: `calc(${d.text} + 4px)` }}
              >
                {t.previewTitle}
              </div>
            </div>
            <span
              className="inline-flex items-center rounded-md px-2.5 font-medium"
              style={{
                background: accent,
                color: "#fff",
                fontSize: `calc(${d.text} - 1px)`,
                height: `calc(${d.rowH} - 8px)`,
              }}
            >
              {t.previewSave}
            </span>
          </div>

          <div
            className="rounded-lg border"
            style={{
              background: s.surface,
              borderColor: s.border,
              padding: d.padCard,
            }}
          >
            <div
              className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em]"
              style={{ color: s.textMuted }}
            >
              <span
                className="rounded-full px-1.5 py-0.5"
                style={{
                  background: `${accent}22`,
                  color: s.text,
                  letterSpacing: "0.2em",
                }}
              >
                {t.previewBadge}
              </span>
              {t.previewUpdated}
            </div>
            <div
              className="mt-2 font-medium"
              style={{ fontSize: `calc(${d.text} + 1px)` }}
            >
              {t.previewHeadline}
            </div>
            <p
              className="mt-1 leading-relaxed"
              style={{ color: s.textMuted, fontSize: `calc(${d.text} - 1px)` }}
            >
              {t.previewBody}
            </p>
          </div>

          <div className="flex flex-col" style={{ gap: d.gapStack }}>
            <Row scheme={s} density={d}>
              <span
                className="inline-flex items-center gap-2"
                style={{ color: s.text }}
              >
                <span
                  className="flex size-3.5 items-center justify-center rounded-sm"
                  style={{ background: accent }}
                >
                  <CheckIcon className="size-2.5" style={{ color: "#fff" }} />
                </span>
                {t.previewRow1}
              </span>
              <ToggleDot on accent={accent} scheme={s} />
            </Row>
            <Row scheme={s} density={d}>
              <span style={{ color: s.text }}>{t.previewRow2}</span>
              <ToggleDot accent={accent} scheme={s} />
            </Row>
            <Row scheme={s} density={d}>
              <span style={{ color: s.text }}>{t.previewRow3}</span>
              <ToggleDot on accent={accent} scheme={s} />
            </Row>
          </div>

          <div
            className="flex items-center justify-between border-t pt-2 text-[10px] uppercase tracking-[0.25em]"
            style={{ borderColor: s.border, color: s.textMuted }}
          >
            <span>
              {interpolate(t.previewMode, { mode: t[effectiveMode] })}
            </span>
            <span>{t[density]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RailItem({
  children,
  active,
  scheme,
  accent,
}: {
  children: ReactNode;
  active?: boolean;
  scheme: Scheme;
  accent?: string;
}) {
  return (
    <div className="relative">
      {active ? (
        <span
          className="-translate-y-1/2 absolute top-1/2 -inset-s-2 h-3 w-1 rounded-e-full"
          style={{ background: accent }}
        />
      ) : null}
      <div
        className="flex size-7 items-center justify-center rounded-md text-[10px]"
        style={{
          background: active ? scheme.activeWash : "transparent",
          color: active ? scheme.text : scheme.textMuted,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Row({
  children,
  scheme,
  density,
}: {
  children: ReactNode;
  scheme: Scheme;
  density: (typeof DENSITY)[Density];
}) {
  return (
    <div
      className="flex items-center justify-between rounded-md border"
      style={{
        background: scheme.surface,
        borderColor: scheme.border,
        padding: density.padRow,
      }}
    >
      {children}
    </div>
  );
}

function ToggleDot({
  on,
  accent,
  scheme,
}: {
  on?: boolean;
  accent: string;
  scheme: Scheme;
}) {
  return (
    <span
      className="relative inline-block h-4 w-7 rounded-full transition-colors"
      style={{
        background: on ? accent : scheme.border,
      }}
    >
      <span
        className="absolute top-0.5 size-3 rounded-full transition-all"
        style={{
          background: "#fff",
          left: on ? "calc(100% - 14px)" : "2px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      />
    </span>
  );
}

function ModePreview({ scheme }: { scheme: "light" | "dark" | "split" }) {
  if (scheme === "split") {
    return (
      <div className="relative h-24 w-full">
        <div
          className="absolute inset-0"
          style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
        >
          <MiniChrome scheme="light" />
        </div>
        <div
          className="absolute inset-0"
          style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
        >
          <MiniChrome scheme="dark" />
        </div>
      </div>
    );
  }
  return <MiniChrome scheme={scheme} />;
}

function MiniChrome({ scheme }: { scheme: "light" | "dark" }) {
  const s = SCHEMES[scheme];
  return (
    <div className="flex h-24" style={{ background: s.bg }}>
      <div
        className="flex w-6.5 flex-col items-center gap-1.5 border-e py-2"
        style={{ background: s.rail, borderColor: s.railBorder }}
      >
        <span
          className="size-2.5 rounded"
          style={{ background: "var(--primary)" }}
        />
        <span
          className="size-1.5 rounded-sm"
          style={{ background: s.textMuted, opacity: 0.45 }}
        />
        <span
          className="size-1.5 rounded-sm"
          style={{ background: s.textMuted, opacity: 0.25 }}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2">
        <span
          className="h-1 w-12 rounded-full"
          style={{ background: s.textMuted, opacity: 0.45 }}
        />
        <div
          className="flex flex-1 flex-col justify-between rounded-md border p-1.5"
          style={{ background: s.surface, borderColor: s.border }}
        >
          <span
            className="h-1 w-10 rounded-full"
            style={{ background: s.textMuted, opacity: 0.45 }}
          />
          <span
            className="inline-flex h-3 items-center rounded px-1.5 font-semibold text-[7px] text-white"
            style={{ background: "var(--primary)" }}
          >
            <span aria-hidden>›</span>
          </span>
        </div>
      </div>
    </div>
  );
}
