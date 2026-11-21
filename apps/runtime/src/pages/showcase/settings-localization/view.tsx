// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import {
  Autocomplete,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
} from "@wirefront/ui/autocomplete";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { RadioGroup, RadioGroupItem } from "@wirefront/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@wirefront/ui/select";
import { Separator } from "@wirefront/ui/separator";
import { Skeleton } from "@wirefront/ui/skeleton";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { CalendarDaysIcon, CalendarRangeIcon, CheckIcon, ClockIcon, CoinsIcon, GlobeIcon, HashIcon, LanguagesIcon, SearchIcon } from "lucide-react";
import { type ReactNode, useEffect, useId, useMemo, useState } from "react";
import type { LocalePrefs } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("localizationSettings.<key>"). */
export const LOCALIZATION_SETTINGS_MESSAGES = {
  eyebrow: "Account · Localization",
  title: "Localization",
  subtitle: "Pick how dates, times, numbers, and currencies are shown to you across the app. Changes apply immediately and only affect your account.",
  language: "Language",
  languageHint: "The language used across menus, emails, and notifications.",
  displayLanguage: "Display language",
  region: "Time & region",
  regionHint: "Used for times, dates, and the calendar grid.",
  timeZone: "Time zone",
  timeZoneHint: "Search any city or region.",
  timeZonePlaceholder: "Search a city or region…",
  noTimeZones: "No time zones match.",
  firstDay: "First day of week",
  dateFormat: "Date format",
  timeFormat: "Time format",
  h12: "12-hour",
  h24: "24-hour",
  numbers: "Numbers & currency",
  numbersHint: "How numeric values are grouped, separated, and prefixed.",
  currency: "Currency",
  numberFormat: "Number format",
  preview: "Today’s preview",
  livePreview: "Live formatting",
  date: "Date",
  time: "Time",
  number: "Number",
  money: "Currency",
  relative: "Relative",
  calendar: "Calendar",
  weekStarts: "Week starts {day}",
  previewNote: "Preview uses the browser’s Intl formatters for {language}.",
  errorTitle: "Couldn’t load localization settings",
  retry: "Try again",
};

export interface LocalizationSettingsProps {
  /** The saved preferences. Leave it out while they load. */
  prefs?: LocalePrefs;
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Save after every change. The choice shows at once and reverts if this fails. Choices are read-only without it. */
  onSave?: Action<LocalePrefs>;
  /** BCP 47 tags to offer, e.g. ["en-US", "fr-FR"]. Each is named in its own language. */
  languages: string[];
  /** IANA time zones to offer. */
  timeZones: string[];
  /** ISO 4217 currency codes to offer. */
  currencies: string[];
  className?: string;
}

type FirstDay = LocalePrefs["firstDay"];
type DateFormatId = LocalePrefs["dateFormat"];
type NumberFormatId = LocalePrefs["numberFormat"];

/** How each date format is produced: a locale and options for Intl.DateTimeFormat, plus its pattern. */
const DATE_FORMATS: Record<DateFormatId, { pattern: string; locale: string; options: Intl.DateTimeFormatOptions }> = {
  "mdy-slash": { pattern: "MM/DD/YYYY", locale: "en-US", options: { year: "numeric", month: "2-digit", day: "2-digit" } },
  "dmy-slash": { pattern: "DD/MM/YYYY", locale: "en-GB", options: { year: "numeric", month: "2-digit", day: "2-digit" } },
  iso: { pattern: "YYYY-MM-DD", locale: "en-CA", options: { year: "numeric", month: "2-digit", day: "2-digit" } },
  med: { pattern: "MMM D, YYYY", locale: "en-US", options: { year: "numeric", month: "short", day: "numeric" } },
};
const DATE_ORDER: DateFormatId[] = ["mdy-slash", "dmy-slash", "iso", "med"];
/** Number formats by the locale whose separators they use. */
const NUMBER_FORMATS: Record<NumberFormatId, { locale: string }> = { us: { locale: "en-US" }, eu: { locale: "de-DE" }, fr: { locale: "fr-FR" } };
const NUMBER_ORDER: NumberFormatId[] = ["us", "eu", "fr"];
const FIRST_DAYS: FirstDay[] = ["sun", "mon", "sat"];
/** Day-of-week index (0 = Sunday) and a known date that falls on it, for naming it. */
const FIRST_DAY_INDEX: Record<FirstDay, { dow: number; sample: string }> = {
  sun: { dow: 0, sample: "2026-04-12T12:00:00Z" },
  mon: { dow: 1, sample: "2026-04-13T12:00:00Z" },
  sat: { dow: 6, sample: "2026-04-11T12:00:00Z" },
};
const SAMPLE_NUMBER = 1234567.89;
const card = "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors";
const checkedCard = "border-ring bg-accent/40";
const idleCard = "border-border/60 hover:bg-foreground/[0.03]";

/** A flag from a BCP 47 tag's region (en-GB → 🇬🇧); empty when it has none. */
function flagOf(tag: string) {
  const region = tag.split("-")[1];
  if (region?.length !== 2) return "";
  return String.fromCodePoint(...[...region.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function Section({ id, title, icon, hint, children }: { id: string; title: string; icon: ReactNode; hint?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <div className="flex items-center gap-2">
        <span aria-hidden className="inline-flex size-6 items-center justify-center rounded-md bg-foreground/[0.06]">
          {icon}
        </span>
        <h2 className="font-heading text-base" id={id}>
          {title}
        </h2>
      </div>
      {hint ? <p className="mt-1 text-muted-foreground text-xs leading-relaxed">{hint}</p> : null}
      <div className="mt-4 flex flex-col gap-5">{children}</div>
    </section>
  );
}

function LocalizationSettingsScreen({ prefs: saved, status = "ready", error, onRetry, onSave, languages, timeZones, currencies, className }: LocalizationSettingsProps) {
  const t = useMessages("localizationSettings", LOCALIZATION_SETTINGS_MESSAGES);
  const { now, locale } = useWirefront();
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
  const set = <K extends keyof LocalePrefs>(key: K, value: LocalePrefs[K]) => {
    if (prefs && prefs[key] !== value) void save.run({ ...prefs, [key]: value });
  };
  const readOnly = !onSave;
  const today = now();

  const languageName = (tag: string) => safe(() => new Intl.DisplayNames([tag], { type: "language" }).of(tag) ?? tag, tag);
  const currencyName = (code: string) => safe(() => new Intl.DisplayNames([locale], { type: "currency" }).of(code) ?? code, code);
  const currencySymbol = (code: string) =>
    safe(() => new Intl.NumberFormat(locale, { style: "currency", currency: code, currencyDisplay: "narrowSymbol" }).formatToParts(0).find((p) => p.type === "currency")?.value ?? code, code);
  const zoneCity = (zone: string) => (zone.split("/").pop() ?? zone).replace(/_/g, " ");
  const zoneLabel = (zone: string) => {
    const short = safe(() => new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: "short" }).formatToParts(today).find((p) => p.type === "timeZoneName")?.value ?? "", "");
    return short ? `${zoneCity(zone)} (${short})` : zoneCity(zone);
  };
  const weekdayName = (d: FirstDay, style: "long" | "short", lang = locale) => safe(() => new Intl.DateTimeFormat(lang, { weekday: style, timeZone: "UTC" }).format(new Date(FIRST_DAY_INDEX[d].sample)), d);

  const p = prefs;
  const formatDate = (fmt: DateFormatId) => safe(() => new Intl.DateTimeFormat(DATE_FORMATS[fmt].locale, { ...DATE_FORMATS[fmt].options, timeZone: p?.timeZone }).format(today), "");
  const formatTime = (h12: boolean) => safe(() => new Intl.DateTimeFormat(p?.language, { hour: "numeric", minute: "2-digit", hour12: h12, timeZone: p?.timeZone }).format(today), "");
  const numberFmt = (fmt: NumberFormatId) => new Intl.NumberFormat(NUMBER_FORMATS[fmt].locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const week = useMemo(() => {
    if (!p) return [];
    const start = FIRST_DAY_INDEX[p.firstDay].dow;
    // The calendar date in the chosen time zone, as UTC midnight, so weekday maths ignores DST.
    const iso = safe(() => new Intl.DateTimeFormat("en-CA", { timeZone: p.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(today), today.toISOString().slice(0, 10));
    const base = new Date(`${iso}T00:00:00Z`);
    const offset = (base.getUTCDay() - start + 7) % 7;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base.getTime() + (i - offset) * 86_400_000);
      return {
        iso: d.toISOString().slice(0, 10),
        weekday: safe(() => new Intl.DateTimeFormat(p.language, { weekday: "short", timeZone: "UTC" }).format(d), ""),
        day: d.getUTCDate(),
        isToday: i === offset,
      };
    });
  }, [p, today]);

  const grouped = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const zone of timeZones) {
      const region = zone.split("/")[0] ?? zone;
      groups.set(region, [...(groups.get(region) ?? []), zone]);
    }
    return [...groups.entries()];
  }, [timeZones]);

  // The search box shows the chosen zone; reset it whenever the choice changes.
  const [zoneText, setZoneText] = useState("");
  const [zoneTextFor, setZoneTextFor] = useState<string>();
  if (p && zoneTextFor !== p.timeZone) {
    setZoneTextFor(p.timeZone);
    setZoneText(zoneLabel(p.timeZone));
  }

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-10 sm:py-14">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
        <h1 className="mt-1 font-heading text-3xl">{t.title}</h1>
        <p className="mt-1.5 max-w-xl text-muted-foreground text-sm">{t.subtitle}</p>

        {status === "error" ? (
          <div className="mt-10 rounded-xl border border-border/60 p-10 text-center">
            <p className="font-medium">{t.errorTitle}</p>
            {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
            {onRetry ? (
              <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                {t.retry}
              </Button>
            ) : null}
          </div>
        ) : !p || status === "loading" ? (
          <div aria-busy="true" className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Skeleton className="h-96 w-full motion-reduce:animate-none" />
            <Skeleton className="h-96 w-full motion-reduce:animate-none" />
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="flex flex-col">
              {save.error ? (
                <p className="mb-6 text-destructive-foreground text-sm" role="alert">
                  {save.error}
                </p>
              ) : null}
              <Section hint={t.languageHint} icon={<LanguagesIcon className="size-4" />} id={`${id}-language`} title={t.language}>
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-sm leading-none" htmlFor={`${id}-lang`}>
                    {t.displayLanguage}
                  </label>
                  <Select disabled={readOnly} onValueChange={(v) => v && set("language", String(v))} value={p.language}>
                    <SelectTrigger className="w-full" id={`${id}-lang`}>
                      <SelectValue>
                        <span className="flex items-center gap-2">
                          <span aria-hidden className="text-base">
                            {flagOf(p.language)}
                          </span>
                          <span lang={p.language}>{languageName(p.language)}</span>
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start">
                      {languages.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          <span className="flex items-center gap-2">
                            <span aria-hidden className="text-base">
                              {flagOf(tag)}
                            </span>
                            <span lang={tag}>{languageName(tag)}</span>
                            <span className="ms-auto font-mono text-[10px] text-muted-foreground">{tag}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Section>

              <Separator className="my-8" />

              <Section hint={t.regionHint} icon={<GlobeIcon className="size-4" />} id={`${id}-region`} title={t.region}>
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-sm leading-none" htmlFor={`${id}-tz`}>
                    {t.timeZone}
                  </label>
                  <Autocomplete
                    onOpenChange={(open) => {
                      // Closing without picking puts the chosen zone back in the box.
                      if (!open) setZoneText(zoneLabel(p.timeZone));
                    }}
                    onValueChange={setZoneText}
                    value={zoneText}
                  >
                    <AutocompleteInput disabled={readOnly} id={`${id}-tz`} placeholder={t.timeZonePlaceholder} showClear startAddon={<SearchIcon />} />
                    <AutocompletePopup className="w-(--anchor-width)">
                      <AutocompleteList>
                        <AutocompleteEmpty>{t.noTimeZones}</AutocompleteEmpty>
                        {grouped.map(([region, zones]) => {
                          const q = zoneText.trim().toLowerCase();
                          const shown = !q || q === zoneLabel(p.timeZone).toLowerCase() ? zones : zones.filter((z) => z.toLowerCase().includes(q) || zoneLabel(z).toLowerCase().includes(q));
                          if (!shown.length) return null;
                          return (
                            <AutocompleteGroup key={region}>
                              <AutocompleteGroupLabel>{region}</AutocompleteGroupLabel>
                              {shown.map((zone) => (
                                <AutocompleteItem
                                  key={zone}
                                  onClick={() => {
                                    set("timeZone", zone);
                                    setZoneText(zoneLabel(zone));
                                  }}
                                  value={zoneLabel(zone)}
                                >
                                  <span className="flex w-full items-center gap-2">
                                    <span className="flex-1 truncate">{zoneLabel(zone)}</span>
                                    <span className="font-mono text-[10px] text-muted-foreground">{zone}</span>
                                    {zone === p.timeZone ? <CheckIcon aria-hidden className="size-3.5 text-primary" /> : null}
                                  </span>
                                </AutocompleteItem>
                              ))}
                            </AutocompleteGroup>
                          );
                        })}
                      </AutocompleteList>
                    </AutocompletePopup>
                  </Autocomplete>
                  <p className="text-muted-foreground text-xs">{t.timeZoneHint}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm leading-none" id={`${id}-first`}>
                    {t.firstDay}
                  </span>
                  <BaseRadioGroup aria-labelledby={`${id}-first`} className="inline-flex w-fit rounded-lg border border-border/60 p-0.5" disabled={readOnly} onValueChange={(v) => set("firstDay", v as FirstDay)} value={p.firstDay}>
                    {FIRST_DAYS.map((d) => (
                      <Radio.Root
                        className="cursor-pointer rounded-md px-3 py-1.5 text-muted-foreground text-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-accent data-checked:text-foreground data-disabled:cursor-default"
                        key={d}
                        value={d}
                      >
                        {weekdayName(d, "long")}
                      </Radio.Root>
                    ))}
                  </BaseRadioGroup>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm leading-none" id={`${id}-date`}>
                    {t.dateFormat}
                  </span>
                  <RadioGroup aria-labelledby={`${id}-date`} className="grid grid-cols-1 gap-2 sm:grid-cols-2" disabled={readOnly} onValueChange={(v) => v && set("dateFormat", v as DateFormatId)} value={p.dateFormat}>
                    {DATE_ORDER.map((fmt) => (
                      <div className={cn(card, p.dateFormat === fmt ? checkedCard : idleCard)} key={fmt}>
                        <RadioGroupItem className="mt-0.5" id={`${id}-date-${fmt}`} value={fmt} />
                        <label className="min-w-0 flex-1 cursor-pointer" htmlFor={`${id}-date-${fmt}`}>
                          <span className="block font-mono text-sm">{formatDate(fmt)}</span>
                          <span className="mt-0.5 block text-muted-foreground text-xs">{DATE_FORMATS[fmt].pattern}</span>
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm leading-none" id={`${id}-time`}>
                    {t.timeFormat}
                  </span>
                  <BaseRadioGroup aria-labelledby={`${id}-time`} className="grid grid-cols-2 gap-2" disabled={readOnly} onValueChange={(v) => set("timeFormat", v as LocalePrefs["timeFormat"])} value={p.timeFormat}>
                    {(["h12", "h24"] as const).map((fmt) => (
                      <Radio.Root
                        className={cn("flex flex-col items-start gap-1 rounded-lg border p-3 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", p.timeFormat === fmt ? checkedCard : idleCard)}
                        key={fmt}
                        value={fmt}
                      >
                        <span className="flex w-full items-center justify-between gap-2">
                          <span className="font-medium text-sm">{t[fmt]}</span>
                          {p.timeFormat === fmt ? <CheckIcon aria-hidden className="size-3.5 text-primary" /> : null}
                        </span>
                        <span className="font-mono text-muted-foreground text-xs">{formatTime(fmt === "h12")}</span>
                      </Radio.Root>
                    ))}
                  </BaseRadioGroup>
                </div>
              </Section>

              <Separator className="my-8" />

              <Section hint={t.numbersHint} icon={<HashIcon className="size-4" />} id={`${id}-numbers`} title={t.numbers}>
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-sm leading-none" htmlFor={`${id}-currency`}>
                    {t.currency}
                  </label>
                  <Select disabled={readOnly} onValueChange={(v) => v && set("currency", String(v))} value={p.currency}>
                    <SelectTrigger className="w-full" id={`${id}-currency`}>
                      <SelectValue>
                        <span className="flex items-center gap-2">
                          <span aria-hidden className="inline-flex size-5 items-center justify-center rounded bg-foreground/[0.06] font-mono text-xs">
                            {currencySymbol(p.currency)}
                          </span>
                          <span>
                            {p.currency} — {currencyName(p.currency)}
                          </span>
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start">
                      {currencies.map((code) => (
                        <SelectItem key={code} value={code}>
                          <span className="flex items-center gap-2">
                            <span aria-hidden className="inline-flex size-5 items-center justify-center rounded bg-foreground/[0.06] font-mono text-xs">
                              {currencySymbol(code)}
                            </span>
                            <span>
                              {code} — {currencyName(code)}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm leading-none" id={`${id}-number`}>
                    {t.numberFormat}
                  </span>
                  <RadioGroup aria-labelledby={`${id}-number`} className="grid grid-cols-1 gap-2 sm:grid-cols-3" disabled={readOnly} onValueChange={(v) => v && set("numberFormat", v as NumberFormatId)} value={p.numberFormat}>
                    {NUMBER_ORDER.map((fmt) => (
                      <div className={cn(card, p.numberFormat === fmt ? checkedCard : idleCard)} key={fmt}>
                        <RadioGroupItem className="mt-0.5" id={`${id}-number-${fmt}`} value={fmt} />
                        <label className="min-w-0 flex-1 cursor-pointer font-mono text-sm" htmlFor={`${id}-number-${fmt}`}>
                          {numberFmt(fmt).format(1234.56)}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </Section>
            </div>

            <aside aria-labelledby={`${id}-preview`} className="lg:sticky lg:top-12 lg:self-start">
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs/5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.preview}</div>
                    <h2 className="mt-1 font-heading text-base" id={`${id}-preview`}>
                      {t.livePreview}
                    </h2>
                  </div>
                  <span aria-hidden className="inline-flex size-8 items-center justify-center rounded-lg bg-foreground/[0.06]">
                    <GlobeIcon className="size-4 opacity-70" />
                  </span>
                </div>
                <Separator className="my-4" />
                <dl className="flex flex-col divide-y divide-border/50">
                  {[
                    { key: "date", icon: <CalendarDaysIcon className="size-3.5" />, label: t.date, value: formatDate(p.dateFormat) },
                    { key: "time", icon: <ClockIcon className="size-3.5" />, label: t.time, value: formatTime(p.timeFormat === "h12") },
                    { key: "number", icon: <HashIcon className="size-3.5" />, label: t.number, value: numberFmt(p.numberFormat).format(SAMPLE_NUMBER) },
                    {
                      key: "money",
                      icon: <CoinsIcon className="size-3.5" />,
                      label: t.money,
                      value: safe(() => new Intl.NumberFormat(NUMBER_FORMATS[p.numberFormat].locale, { style: "currency", currency: p.currency, currencyDisplay: "narrowSymbol" }).format(99999), ""),
                    },
                    { key: "relative", icon: <CalendarRangeIcon className="size-3.5" />, label: t.relative, value: safe(() => new Intl.RelativeTimeFormat(p.language, { numeric: "auto" }).format(-2, "hour"), "") },
                  ].map((row) => (
                    <div className="flex items-center justify-between gap-4 py-2.5" key={row.key}>
                      <dt className="flex items-center gap-2 text-muted-foreground text-xs">
                        <span aria-hidden className="inline-flex size-5 items-center justify-center rounded bg-foreground/[0.05] text-foreground/70">
                          {row.icon}
                        </span>
                        {row.label}
                      </dt>
                      <dd className="truncate font-mono text-foreground text-sm">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                <Separator className="my-4" />
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.calendar}</h3>
                    <span className="text-muted-foreground text-xs">{interpolate(t.weekStarts, { day: weekdayName(p.firstDay, "long") })}</span>
                  </div>
                  <ol className="mt-3 grid grid-cols-7 gap-1.5">
                    {week.map((d) => (
                      <li aria-current={d.isToday ? "date" : undefined} className={cn("flex flex-col items-center gap-1 rounded-md border px-1 py-1.5 text-center", d.isToday ? checkedCard : "border-border/50 bg-background/40")} key={d.iso}>
                        <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-[0.18em]">{d.weekday}</span>
                        <span className={cn("font-medium text-sm", d.isToday ? "text-foreground" : "text-foreground/80")}>{d.day}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <p className="mt-4 rounded-lg bg-foreground/[0.04] p-3 text-muted-foreground text-xs leading-relaxed">{interpolate(t.previewNote, { language: p.language })}</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

export function LocalizationSettings(props: LocalizationSettingsProps) {
  return (
    <ScreenBoundary name="LocalizationSettings">
      <LocalizationSettingsScreen {...props} />
    </ScreenBoundary>
  );
}
