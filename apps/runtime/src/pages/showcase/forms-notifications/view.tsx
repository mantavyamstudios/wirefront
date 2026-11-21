// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Separator } from "@wirefront/ui/separator";
import { Switch } from "@wirefront/ui/switch";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { BellIcon, MailIcon, MessageSquareIcon } from "lucide-react";
import { useId, useState } from "react";

import type { NotificationChannel, NotificationPreferences, PreferenceChange } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("notificationSettings.<key>"). */
export const NOTIFICATION_SETTINGS_MESSAGES = {
  eyebrow: "Settings · Notifications",
  title: "Notifications",
  description: "Pick which moments deserve a tap on the shoulder. Defaults err on the quiet side — turn things on as you need them.",
  email: "Email",
  push: "Push",
  switchLabel: "{title} — {channel}",
  quietHours: "Quiet hours",
  quietHoursDescription: "Push notifications are paused between {start} and {end} in your workspace timezone.",
  editQuietHours: "Edit",
};

export interface NotificationPreference {
  key: string;
  title: string;
  description?: string;
}

export interface NotificationSection {
  id: string;
  title: string;
  description?: string;
  preferences: NotificationPreference[];
}

export interface NotificationSettingsProps {
  /** The preferences, grouped the way the screen shows them. */
  sections: NotificationSection[];
  /** The user's saved choices (getPreferences). Missing keys start off. */
  defaultPreferences: NotificationPreferences;
  /** Save one switch. The switch flips at once and flips back if this fails. */
  onChange: Action<PreferenceChange>;
  /** Quiet hours as 24-hour "HH:MM" times. The card hides without it. */
  quietHours?: { start: string; end: string };
  /** Open the builder's quiet-hours editor. The button hides without it. */
  onEditQuietHours?: () => void;
  className?: string;
}

const CHANNELS: NotificationChannel[] = ["email", "push"];

function NotificationSettingsScreen({ sections, defaultPreferences, onChange, quietHours, onEditQuietHours, className }: NotificationSettingsProps) {
  const t = useMessages("notificationSettings", NOTIFICATION_SETTINGS_MESSAGES);
  const format = useFormat();
  const id = useId();
  const [prefs, setPrefs] = useState(defaultPreferences);
  const set = ({ key, channel, enabled }: PreferenceChange) =>
    setPrefs((p) => ({ ...p, [key]: { ...(p[key] ?? { email: false, push: false }), [channel]: enabled } }));
  const save = useAction(onChange, {
    optimistic: (change) => {
      set(change);
      return () => set({ ...change, enabled: !change.enabled });
    },
  });
  // A wall-clock time, so it formats the same in every timezone.
  const clock = (hhmm: string) => format.time(`1970-01-01T${hhmm}:00Z`, { timeStyle: "short", timeZone: "UTC" });
  const channelLabel = { email: t.email, push: t.push };

  return (
    <div className={cn("min-h-svh bg-background py-8 text-foreground sm:py-16", className)}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
        <h1 className="mt-1 font-heading text-3xl">{t.title}</h1>
        <p className="mt-2 text-muted-foreground text-sm">{t.description}</p>

        {/* Visual column headers; each switch carries its own accessible name. */}
        <div
          aria-hidden
          className="sticky top-0 z-10 mt-8 flex items-center justify-end gap-2 border-y border-border/60 bg-background/95 py-3 pe-4 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] backdrop-blur sm:gap-6 sm:tracking-[0.3em]"
        >
          <span className="flex w-14 justify-center gap-1.5 sm:w-16">
            <MailIcon className="size-3.5 opacity-70" />
            {t.email}
          </span>
          <span className="flex w-14 justify-center gap-1.5 sm:w-16">
            <BellIcon className="size-3.5 opacity-70" />
            {t.push}
          </span>
        </div>

        <div aria-live="polite">{save.error ? <p className="mt-4 text-destructive-foreground text-sm" role="alert">{save.error}</p> : null}</div>

        {sections.map((section) => (
          <section className="mt-8" key={section.id}>
            <header>
              <h2 className="font-heading text-base">{section.title}</h2>
              {section.description ? <p className="mt-0.5 text-muted-foreground text-xs">{section.description}</p> : null}
            </header>

            <ul className="mt-4 divide-y divide-border/50 rounded-xl border border-border/60 bg-background/40">
              {section.preferences.map((p) => (
                <li className="flex items-center gap-2 py-1.5 ps-4 sm:gap-6" key={p.key}>
                  <div className="min-w-0 flex-1 py-2">
                    <div className="font-medium text-sm">{p.title}</div>
                    {p.description ? <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">{p.description}</p> : null}
                  </div>
                  <div className="flex items-stretch justify-center gap-2 pe-4 sm:gap-6">
                    {CHANNELS.map((channel) => (
                      // Each cell is a label so the whole 44px area toggles.
                      <label
                        className="flex min-h-11 w-14 cursor-pointer items-center justify-center rounded-md hover:bg-foreground/[0.03] sm:w-16"
                        htmlFor={`${id}-${p.key}-${channel}`}
                        key={channel}
                      >
                        <Switch
                          aria-label={interpolate(t.switchLabel, { title: p.title, channel: channelLabel[channel] })}
                          checked={prefs[p.key]?.[channel] ?? false}
                          disabled={save.isPending(`${p.key}:${channel}`)}
                          id={`${id}-${p.key}-${channel}`}
                          onCheckedChange={(enabled) => void save.run({ key: p.key, channel, enabled }, `${p.key}:${channel}`)}
                        />
                      </label>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {quietHours ? (
          <>
            <Separator className="my-10" />
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-start gap-3">
                <MessageSquareIcon aria-hidden className="mt-0.5 size-4 shrink-0 opacity-60" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm">{t.quietHours}</div>
                  <p className="mt-0.5 text-muted-foreground text-xs">
                    {interpolate(t.quietHoursDescription, { start: clock(quietHours.start), end: clock(quietHours.end) })}
                  </p>
                </div>
                {onEditQuietHours ? (
                  <Button className="pointer-coarse:h-11" onClick={onEditQuietHours} size="sm" type="button" variant="outline">
                    {t.editQuietHours}
                  </Button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </div>
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
