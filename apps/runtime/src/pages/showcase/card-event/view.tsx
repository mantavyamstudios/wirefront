// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Badge } from "@wirefront/ui/badge";
import { Button, buttonVariants } from "@wirefront/ui/button";
import { Card, CardContent } from "@wirefront/ui/card";
import { cn } from "@wirefront/ui/lib/utils";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
  useWirefront,
} from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { CheckIcon, ClockIcon, MapPinIcon, VideoIcon } from "lucide-react";
import { useState } from "react";

import type { RsvpInput, UpcomingEvent } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("upcomingEvents.<key>"). */
export const UPCOMING_EVENTS_MESSAGES = {
  title: "Up next",
  countOne: "1 event on your calendar.",
  countOther: "{count} events on your calendar.",
  empty: "Nothing on your calendar.",
  live: "Live",
  time: "{start} – {end}",
  moreAttendees: "+{count}",
  attendees: "{count} attending",
  decline: "Decline",
  accept: "RSVP",
  accepted: "Going",
  declined: "Declined",
  join: "Join",
};

export interface UpcomingEventsProps {
  events: UpcomingEvent[];
  /** Accept or decline (rsvp). Applied at once and rolled back if it fails. Buttons hide without it. */
  onRsvp?: Action<RsvpInput>;
  className?: string;
}

const TONES = [
  "from-category-5/20 to-category-4/10",
  "from-category-1/20 to-category-2/10",
  "from-category-3/20 to-category-4/10",
  "from-category-6/20 to-category-8/10",
];
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

function UpcomingEventsScreen({
  events,
  onRsvp,
  className,
}: UpcomingEventsProps) {
  const t = useMessages("upcomingEvents", UPCOMING_EVENTS_MESSAGES);
  const format = useFormat();
  const { now } = useWirefront();
  const [responses, setResponses] = useState<
    Record<string, UpcomingEvent["response"]>
  >({});
  const rsvp = useAction(onRsvp ?? (async () => {}), {
    optimistic: ({ eventId, response }) => {
      const before = responses[eventId];
      setResponses((r) => ({ ...r, [eventId]: response }));
      return () =>
        setResponses((r) => ({ ...r, [eventId]: before ?? "pending" }));
    },
  });
  const at = now().getTime();

  return (
    <div
      className={cn(
        "min-h-svh bg-background px-4 py-8 sm:px-6 sm:py-12",
        className
      )}
    >
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <h1 className="font-heading text-xl">{t.title}</h1>
          <p className="text-muted-foreground text-sm">
            {events.length === 1
              ? t.countOne
              : events.length
                ? interpolate(t.countOther, { count: events.length })
                : t.empty}
          </p>
        </header>
        {rsvp.error ? (
          <p className="mb-3 text-destructive-foreground text-sm" role="alert">
            {rsvp.error}
          </p>
        ) : null}
        <ul className="flex flex-col gap-3">
          {events.map((e, i) => {
            const live =
              Date.parse(e.startsAt) <= at && at < Date.parse(e.endsAt);
            const response = responses[e.id] ?? e.response;
            return (
              <li key={e.id}>
                <Card className="overflow-hidden">
                  <CardContent className="flex items-stretch gap-0 p-0">
                    <div
                      className={cn(
                        "flex w-16 shrink-0 flex-col items-center justify-center border-e bg-linear-to-b p-3 sm:w-20 sm:p-4",
                        TONES[i % TONES.length]
                      )}
                    >
                      <time className="contents" dateTime={e.startsAt}>
                        <span className="font-mono text-[10px] text-foreground/70 uppercase tracking-[0.2em]">
                          {format.date(e.startsAt, { month: "short" })}
                        </span>
                        <span className="font-heading text-2xl leading-none sm:text-3xl">
                          {format.date(e.startsAt, { day: "2-digit" })}
                        </span>
                        <span className="mt-1 font-mono text-[10px] text-foreground/70 uppercase tracking-[0.2em]">
                          {format.date(e.startsAt, { weekday: "short" })}
                        </span>
                      </time>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-heading font-semibold text-base">
                          {e.title}
                        </h2>
                        {live ? (
                          <Badge className="gap-1 bg-category-4-strong font-mono text-[10px] text-white uppercase">
                            <span
                              aria-hidden
                              className="size-1.5 animate-pulse rounded-full bg-white motion-reduce:animate-none"
                            />
                            {t.live}
                          </Badge>
                        ) : null}
                      </div>
                      {e.blurb ? (
                        <p className="text-muted-foreground text-sm">
                          {e.blurb}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
                        <span className="inline-flex items-center gap-1.5">
                          <ClockIcon aria-hidden className="size-3" />
                          {interpolate(t.time, {
                            start: format.time(e.startsAt),
                            end: format.time(e.endsAt),
                          })}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          {e.joinUrl ? (
                            <VideoIcon aria-hidden className="size-3" />
                          ) : (
                            <MapPinIcon aria-hidden className="size-3" />
                          )}
                          {e.location}
                        </span>
                      </div>
                      {/* Wraps so RSVP/Join can't be pushed past the card edge. */}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <ul
                          aria-label={interpolate(t.attendees, {
                            count: e.attendees.length,
                          })}
                          className="flex items-center -space-x-1.5"
                        >
                          {e.attendees.slice(0, 5).map((a) => (
                            <li key={a.id}>
                              <Avatar
                                className="size-6 border-2 border-card bg-muted"
                                title={a.name}
                              >
                                <AvatarFallback className="bg-muted text-[10px]">
                                  <span aria-hidden>{initialsOf(a.name)}</span>
                                  <span className="sr-only">{a.name}</span>
                                </AvatarFallback>
                              </Avatar>
                            </li>
                          ))}
                          {e.attendees.length > 5 ? (
                            <li className="z-10 inline-flex size-6 items-center justify-center rounded-full border-2 border-card bg-foreground font-mono text-[10px] text-background">
                              {interpolate(t.moreAttendees, {
                                count: e.attendees.length - 5,
                              })}
                            </li>
                          ) : null}
                        </ul>
                        <div className="ms-auto flex items-center gap-2">
                          {live && e.joinUrl ? (
                            <a
                              className={buttonVariants({ size: "xs" })}
                              href={e.joinUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {t.join}
                            </a>
                          ) : onRsvp ? (
                            response === "pending" ? (
                              <>
                                <Button
                                  disabled={rsvp.isPending(e.id)}
                                  onClick={() =>
                                    void rsvp.run(
                                      { eventId: e.id, response: "declined" },
                                      e.id
                                    )
                                  }
                                  size="xs"
                                  variant="ghost"
                                >
                                  {t.decline}
                                </Button>
                                <Button
                                  disabled={rsvp.isPending(e.id)}
                                  onClick={() =>
                                    void rsvp.run(
                                      { eventId: e.id, response: "accepted" },
                                      e.id
                                    )
                                  }
                                  size="xs"
                                >
                                  {t.accept}
                                </Button>
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                                {response === "accepted" ? (
                                  <CheckIcon
                                    aria-hidden
                                    className="size-3 text-success-foreground"
                                  />
                                ) : null}
                                {response === "accepted"
                                  ? t.accepted
                                  : t.declined}
                              </span>
                            )
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function UpcomingEvents(props: UpcomingEventsProps) {
  return (
    <ScreenBoundary name="UpcomingEvents">
      <UpcomingEventsScreen {...props} />
    </ScreenBoundary>
  );
}
