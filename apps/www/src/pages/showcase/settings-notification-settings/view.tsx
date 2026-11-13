// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
"use client";

import { cn } from "@wirefront/ui/lib/utils";
import { SegmentedControl, SegmentedControlItem } from "@wirefront/ui/segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@wirefront/ui/select";
import { Switch } from "@wirefront/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@wirefront/ui/toggle-group";
import { useAction } from "@wirefront/ui/wirefront/action";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { CheckIcon, ChevronRightIcon, MailIcon, MessagesSquareIcon, MonitorIcon, SmartphoneIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useId, useState } from "react";

import { type ChannelId, type ChannelMode, DigestFrequency, Medium, type NotificationPreferences, type NotificationSettingsData } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("notificationSettings.<key>"). */
export const NOTIFICATION_SETTINGS_MESSAGES = {
  title: "Notifications",
  subtitle: "Choose what reaches you, and where.",
  saving: "Saving",
  saved: "Saved",
  restore: "Restore defaults",
  whereTitle: "Where we notify you",
  whereDescription: "How each channel reaches you. Everything always lands in your {product} inbox.",
  desktop: "Desktop",
  mobile: "Mobile",
  email: "Email",
  chat: "Chat",
  push: "Push",
  modeAll: "Enabled for all",
  modeMentions: "Mentions only",
  modeOff: "Off",
  shortAll: "All activity",
  shortMentions: "Mentions only",
  shortOff: "Off",
  channelNotifications: "{channel} notifications",
  sectionNotifications: "{section} notifications",
  event: "Event",
  channelsFor: "Channels for {event}",
  mediumFor: "{medium} for {event}",
  mediumForOff: "{medium} for {event} (channel off)",
  deliveryTitle: "Delivery",
  deliveryDescription: "When notifications can wait.",
  quietHours: "Quiet hours",
  quietOn: "Push and chat stay silent {from}–{to}, every day.",
  quietOff: "Mute push and chat overnight. Email waits for you anyway.",
  quietStart: "Quiet hours start",
  quietEnd: "Quiet hours end",
  to: "to",
  digest: "Email digest",
  digestOff: "Off. Each email is sent as it happens.",
  digestPaused: "Paused while email notifications are off.",
  nextDigest: "Next digest {when}",
  item: "item",
  items: "items",
  off: "Off",
  daily: "Daily",
  weekly: "Weekly",
};

export interface NotificationSettingsProps {
  /** The saved preferences, the defaults, channel details and the next digest. */
  data: NotificationSettingsData;
  /** Save the whole preference set. Called after every change; on failure the screen goes back to the last saved set and shows the error. */
  onSave: Action<NotificationPreferences>;
  /** Your product's name, in "lands in your … inbox". */
  product: string;
  className?: string;
}

const easeOut = [0.23, 1, 0.32, 1] as const;
const CHANNEL_ICONS: Record<ChannelId, ReactNode> = {
  desktop: <MonitorIcon />,
  mobile: <SmartphoneIcon />,
  email: <MailIcon />,
  chat: <MessagesSquareIcon />,
};
const CHANNELS: ChannelId[] = ["desktop", "mobile", "email", "chat"];
const MODES: ChannelMode[] = ["all", "mentions", "off"];
const MODE_DOT: Record<ChannelMode, string> = { all: "bg-success", mentions: "bg-info", off: "bg-muted-foreground/40" };
const MEDIUM_ICONS: Record<Medium, ReactNode> = { email: <MailIcon />, push: <SmartphoneIcon />, chat: <MessagesSquareIcon /> };
const HOURS = Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: `${String(h).padStart(2, "0")}:00` }));

type Messages = typeof NOTIFICATION_SETTINGS_MESSAGES;
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function SectionHeader({ title, description, action }: { title: string; description: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 className="font-medium text-sm">{title}</h2>
        <p className="text-pretty text-muted-foreground text-sm">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function RollingNumber({ value, reduce }: { value: number; reduce: boolean }) {
  return (
    <span className="relative inline-flex overflow-hidden align-bottom tabular-nums">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: reduce ? 0 : "-70%", opacity: 0 }}
          initial={{ y: reduce ? 0 : "70%", opacity: 0 }}
          key={value}
          transition={{ duration: 0.2, ease: easeOut }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function SaveStatus({ state, reduce, t }: { state: "idle" | "saving" | "saved"; reduce: boolean; t: Messages }) {
  return (
    <span aria-live="polite" className="inline-flex h-7 items-center text-xs">
      <AnimatePresence initial={false} mode="wait">
        {state !== "idle" && (
          <motion.span
            animate={{ opacity: 1, y: 0 }}
            className={cn("inline-flex items-center gap-1.5", state === "saved" ? "text-success-foreground" : "text-muted-foreground")}
            exit={{ opacity: 0, y: reduce ? 0 : -3 }}
            initial={{ opacity: 0, y: reduce ? 0 : 3 }}
            key={state}
            transition={{ duration: 0.15, ease: easeOut }}
          >
            {state === "saved" ? <CheckIcon className="size-3.5" /> : <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />}
            {state === "saved" ? t.saved : t.saving}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function ChannelRow({
  id,
  detail,
  mode,
  open,
  onOpen,
  onMode,
  reduce,
  t,
}: {
  id: ChannelId;
  detail?: string;
  mode: ChannelMode;
  open: boolean;
  onOpen: () => void;
  onMode: (mode: ChannelMode) => void;
  reduce: boolean;
  t: Messages;
}) {
  const panelId = `channel-${id}`;
  const label = t[id];
  return (
    <div className="border-t first:border-t-0">
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-accent/40 focus-visible:bg-accent/40"
        onClick={onOpen}
        type="button"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground [&_svg]:size-4">{CHANNEL_ICONS[id]}</span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-medium text-sm">{label}</span>
          <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <span className={cn("size-1.5 rounded-full transition-colors duration-200", MODE_DOT[mode])} />
            {t[`mode${capital(mode)}` as keyof Messages]}
          </span>
        </span>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          className="text-muted-foreground"
          initial={false}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }}
        >
          <ChevronRightIcon className="size-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.22, ease: easeOut }}
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 px-4 pb-3.5 sm:ps-15">
              <p className="min-w-0 flex-1 basis-44 text-pretty text-muted-foreground text-xs">{detail}</p>
              <SegmentedControl aria-label={interpolate(t.channelNotifications, { channel: label })} size="sm">
                {MODES.map((m) => (
                  <SegmentedControlItem aria-pressed={mode === m} data-pressed={mode === m ? "" : undefined} key={m} onClick={() => onMode(m)}>
                    {t[`short${capital(m)}` as keyof Messages]}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuietTrack({ from, to }: { from: number; to: number }) {
  const segments = from < to ? [[from, to]] : [[from, 24], [0, to]];
  return (
    <div aria-hidden className="flex w-full max-w-64 flex-col gap-1">
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        {segments.map(([a = 0, b = 0]) => (
          <span
            className="absolute inset-y-0 rounded-full bg-indigo-500 transition-[left,width] duration-200 ease-out dark:bg-indigo-400"
            key={`${a}-${b}`}
            style={{ left: `${(a / 24) * 100}%`, width: `${((b - a) / 24) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>24</span>
      </div>
    </div>
  );
}

function HourSelect({ label, value, onChange }: { label: string; value: number; onChange: (h: number) => void }) {
  return (
    <Select items={HOURS} onValueChange={(v) => v != null && onChange(Number(v))} value={String(value)}>
      <SelectTrigger aria-label={label} className="w-24 min-w-0 font-mono tabular-nums" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
        {HOURS.map((h) => (
          <SelectItem className="font-mono tabular-nums" key={h.value} value={h.value}>
            {h.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function NotificationSettingsScreen({ data, onSave, product, className }: NotificationSettingsProps) {
  const t = useMessages("notificationSettings", NOTIFICATION_SETTINGS_MESSAGES);
  const format = useFormat();
  const reduce = Boolean(useReducedMotion());
  const id = useId();
  const [prefs, setPrefs] = useState<NotificationPreferences>(data.preferences);
  const [saved, setSaved] = useState<NotificationPreferences>(data.preferences);
  const [openChannel, setOpenChannel] = useState<ChannelId | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  // A new `data` from the builder replaces local state.
  const [source, setSource] = useState(data);
  if (source !== data) {
    setSource(data);
    setPrefs(data.preferences);
    setSaved(data.preferences);
  }

  const save = useAction(onSave, {
    onSuccess: (_, next) => {
      setSaved(next);
      setStatus("saved");
    },
    onError: () => {
      setPrefs(saved);
      setStatus("idle");
    },
  });

  useEffect(() => {
    if (status !== "saved") return;
    const timer = setTimeout(() => setStatus("idle"), 1600);
    return () => clearTimeout(timer);
  }, [status]);

  const change = (update: (p: NotificationPreferences) => NotificationPreferences) => {
    const next = update(prefs);
    setPrefs(next);
    setStatus("saving");
    void save.run(next);
  };

  const { channels, sections, quietHours: quiet, digest } = prefs;
  const mediumOff: Record<Medium, boolean> = {
    email: channels.email === "off",
    push: channels.desktop === "off" && channels.mobile === "off",
    chat: channels.chat === "off",
  };
  const digestCount = sections.reduce(
    (n, s) =>
      s.enabled
        ? n + s.events.reduce((m, e) => (e.media.includes("email") && !mediumOff.email && (channels.email === "all" || e.mention) ? m + e.pending : m), 0)
        : n,
    0,
  );
  const digestLine = digest === "off" ? t.digestOff : mediumOff.email ? t.digestPaused : null;
  const isDefault = JSON.stringify(prefs) === JSON.stringify(data.defaults);
  const hour = (h: number) => HOURS[h]?.label ?? "";

  const restoreLink = (
    <button
      className="cursor-pointer rounded-sm text-muted-foreground text-sm underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50 disabled:hover:text-muted-foreground disabled:hover:no-underline"
      disabled={isDefault}
      onClick={() => {
        setOpenChannel(null);
        change(() => data.defaults);
      }}
      type="button"
    >
      {t.restore}
    </button>
  );

  return (
    <div className={cn("mx-auto w-full max-w-2xl px-6 py-10 md:px-10", className)}>
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold text-2xl tracking-tight">{t.title}</h1>
          <p className="mt-1 text-muted-foreground text-sm">{t.subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 pt-1.5">
          <SaveStatus reduce={reduce} state={status} t={t} />
          <span className="hidden sm:inline-flex">{restoreLink}</span>
        </div>
      </div>

      {save.error ? (
        <p className="mt-4 text-destructive-foreground text-sm" role="alert">
          {save.error}
        </p>
      ) : null}

      <section className="mt-10">
        <SectionHeader description={interpolate(t.whereDescription, { product })} title={t.whereTitle} />
        <div className="mt-3 overflow-hidden rounded-xl border bg-card">
          {CHANNELS.map((c) => (
            <ChannelRow
              detail={data.channelDetails[c]}
              id={c}
              key={c}
              mode={channels[c]}
              onMode={(m) => change((p) => ({ ...p, channels: { ...p.channels, [c]: m } }))}
              onOpen={() => setOpenChannel((o) => (o === c ? null : c))}
              open={openChannel === c}
              reduce={reduce}
              t={t}
            />
          ))}
        </div>
      </section>

      {sections.map((section) => (
        <section className="mt-10" key={section.id}>
          <SectionHeader
            action={
              <Switch
                aria-label={interpolate(t.sectionNotifications, { section: section.label })}
                checked={section.enabled}
                onCheckedChange={(v) => change((p) => ({ ...p, sections: p.sections.map((s) => (s.id === section.id ? { ...s, enabled: v } : s)) }))}
              />
            }
            description={section.description}
            title={section.label}
          />
          <div className="mt-3 overflow-hidden rounded-xl border bg-card">
            <div className="flex items-center gap-4 border-b px-4 py-2.5 font-medium text-muted-foreground text-xs">
              <span className="flex-1">{t.event}</span>
              <span aria-hidden className="flex">
                {Medium.options.map((m) => (
                  <span className="w-9 text-center" key={m}>
                    {t[m]}
                  </span>
                ))}
              </span>
            </div>
            <ul className={cn("divide-y transition-opacity duration-200", !section.enabled && "opacity-50")}>
              {section.events.map((e) => (
                <li className="flex items-center gap-4 px-4 py-3.5" key={e.id}>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="font-medium text-sm">{e.label}</span>
                    <span className="text-pretty text-muted-foreground text-xs">{e.hint}</span>
                  </div>
                  <ToggleGroup
                    aria-label={interpolate(t.channelsFor, { event: e.label })}
                    className="shrink-0"
                    disabled={!section.enabled}
                    multiple
                    onValueChange={(value) =>
                      change((p) => ({
                        ...p,
                        sections: p.sections.map((s) =>
                          s.id === section.id ? { ...s, events: s.events.map((x) => (x.id === e.id ? { ...x, media: value as Medium[] } : x)) } : s,
                        ),
                      }))
                    }
                    size="sm"
                    value={e.media}
                    variant="outline"
                  >
                    {Medium.options.map((m) => (
                      <ToggleGroupItem
                        aria-label={interpolate(mediumOff[m] ? t.mediumForOff : t.mediumFor, { medium: t[m], event: e.label })}
                        className="w-9 text-muted-foreground/50 data-pressed:text-foreground"
                        disabled={!section.enabled || mediumOff[m]}
                        key={m}
                        value={m}
                      >
                        {MEDIUM_ICONS[m]}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      <section className="mt-10">
        <SectionHeader description={t.deliveryDescription} title={t.deliveryTitle} />
        <div className="mt-3 overflow-hidden rounded-xl border bg-card">
          <div>
            <div className="flex items-center gap-4 px-4 py-3.5">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <label className="cursor-pointer font-medium text-sm" htmlFor={`${id}-quiet`}>
                  {t.quietHours}
                </label>
                <span className="text-pretty text-muted-foreground text-xs">
                  {quiet.enabled ? interpolate(t.quietOn, { from: hour(quiet.from), to: hour(quiet.to) }) : t.quietOff}
                </span>
              </span>
              <Switch
                checked={quiet.enabled}
                id={`${id}-quiet`}
                onCheckedChange={(v) => change((p) => ({ ...p, quietHours: { ...p.quietHours, enabled: v } }))}
              />
            </div>
            <AnimatePresence initial={false}>
              {quiet.enabled && (
                <motion.div
                  animate={{ height: "auto", opacity: 1 }}
                  className="overflow-hidden"
                  exit={{ height: 0, opacity: 0 }}
                  initial={{ height: 0, opacity: 0 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.22, ease: easeOut }}
                >
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 pb-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <HourSelect
                        label={t.quietStart}
                        onChange={(h) => h !== quiet.to && change((p) => ({ ...p, quietHours: { ...p.quietHours, from: h } }))}
                        value={quiet.from}
                      />
                      <span>{t.to}</span>
                      <HourSelect
                        label={t.quietEnd}
                        onChange={(h) => h !== quiet.from && change((p) => ({ ...p, quietHours: { ...p.quietHours, to: h } }))}
                        value={quiet.to}
                      />
                    </div>
                    <div className="min-w-40 flex-1">
                      <QuietTrack from={quiet.from} to={quiet.to} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-4 border-t px-4 py-3.5">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-medium text-sm">{t.digest}</span>
              <span aria-live="polite" className="text-pretty text-muted-foreground text-xs">
                {digestLine ?? (
                  <>
                    {data.nextDigestAt ? `${interpolate(t.nextDigest, { when: format.date(data.nextDigestAt, { weekday: "long", hour: "2-digit", minute: "2-digit" }) })} · ` : null}
                    <span className="font-medium text-foreground">
                      <RollingNumber reduce={reduce} value={digestCount} /> {digestCount === 1 ? t.item : t.items}
                    </span>
                  </>
                )}
              </span>
            </div>
            <Select
              items={DigestFrequency.options.map((d) => ({ value: d, label: t[d] }))}
              onValueChange={(v) => v && change((p) => ({ ...p, digest: v as DigestFrequency }))}
              value={digest}
            >
              <SelectTrigger aria-label={t.digest} className="w-28 min-w-0" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {DigestFrequency.options.map((d) => (
                  <SelectItem key={d} value={d}>
                    {t[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
      <div className="mt-8 flex justify-center sm:hidden">{restoreLink}</div>
    </div>
  );
}

export function NotificationSettings(props: NotificationSettingsProps) {
  return (
    <ScreenBoundary name="NotificationSettings">
      <NotificationSettingsScreen {...props} />
    </ScreenBoundary>
  );
}
