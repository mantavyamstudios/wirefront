// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@wirefront/ui/avatar";
import { Badge } from "@wirefront/ui/badge";
import { Button, buttonVariants } from "@wirefront/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@wirefront/ui/card";
import { cn } from "@wirefront/ui/lib/utils";
import { Separator } from "@wirefront/ui/separator";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { MailIcon, MapPinIcon, MessageSquareIcon } from "lucide-react";

import type { ProfileStat, ProfileSummary } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("profileCard.<key>"). */
export const PROFILE_CARD_MESSAGES = {
  message: "Message",
  viewProfile: "View profile",
};

export interface ProfileCardProps {
  person: ProfileSummary;
  /** Start a conversation. Hidden when not given. */
  onMessage?: (person: ProfileSummary) => void;
  /** Where "View profile" goes. Hidden when not given. */
  profileHref?: string;
  className?: string;
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

function ProfileCardScreen({ person, onMessage, profileHref, className }: ProfileCardProps) {
  const t = useMessages("profileCard", PROFILE_CARD_MESSAGES);
  const format = useFormat();
  const statValue = (s: ProfileStat) =>
    s.unit === "percent"
      ? format.number(s.value / 100, { style: "percent", maximumFractionDigits: 1 })
      : s.unit
        ? format.number(s.value, { style: "unit", unit: s.unit, unitDisplay: "narrow" })
        : format.number(s.value);

  return (
    <div className={cn("min-h-svh bg-background px-4 py-8 sm:px-6 sm:py-16", className)}>
      <div className="mx-auto max-w-md">
        <Card className="overflow-hidden">
          <div
            aria-hidden
            className="h-24"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--primary) 18%, transparent), color-mix(in srgb, var(--primary) 6%, transparent) 60%, transparent), radial-gradient(120% 100% at 0% 0%, color-mix(in srgb, var(--foreground) 8%, transparent), transparent 60%)",
            }}
          />
          <CardHeader className="relative -mt-10 pb-2">
            <Avatar className="size-20 border-4 border-background">
              {person.avatarUrl ? <AvatarImage alt="" src={person.avatarUrl} /> : null}
              <AvatarFallback className="bg-foreground font-heading font-semibold text-background text-xl">{initialsOf(person.name)}</AvatarFallback>
            </Avatar>
            <CardTitle className="mt-3 flex items-center gap-2">
              {person.name}
              {person.badge ? (
                <Badge className="font-mono text-[10px]" variant="secondary">
                  {person.badge}
                </Badge>
              ) : null}
            </CardTitle>
            {person.headline ? <p className="text-muted-foreground text-sm">{person.headline}</p> : null}
          </CardHeader>
          <CardContent className="pt-2">
            {person.location || person.email ? (
              <div className="flex flex-col gap-1.5 text-muted-foreground text-sm">
                {person.location ? (
                  <div className="flex items-center gap-2">
                    <MapPinIcon aria-hidden className="size-3.5" />
                    {person.location}
                  </div>
                ) : null}
                {person.email ? (
                  <div className="flex items-center gap-2">
                    <MailIcon aria-hidden className="size-3.5" />
                    <a className="rounded-sm hover:text-foreground hover:underline" href={`mailto:${person.email}`}>
                      {person.email}
                    </a>
                  </div>
                ) : null}
              </div>
            ) : null}
            {person.stats.length ? (
              <>
                <Separator className="my-4" />
                <dl className="grid gap-2 text-center" style={{ gridTemplateColumns: `repeat(${person.stats.length}, minmax(0, 1fr))` }}>
                  {person.stats.map((s) => (
                    <div className="flex flex-col-reverse" key={s.label}>
                      <dt className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em]">{s.label}</dt>
                      <dd className="font-heading font-semibold text-base">{statValue(s)}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : null}
          </CardContent>
          {onMessage || profileHref ? (
            <CardFooter className="gap-2 border-t bg-background">
              {onMessage ? (
                <Button className="flex-1" onClick={() => onMessage(person)}>
                  <MessageSquareIcon />
                  {t.message}
                </Button>
              ) : null}
              {profileHref ? (
                <WirefrontLink className={cn(buttonVariants({ variant: "outline" }), "flex-1")} href={profileHref}>
                  {t.viewProfile}
                </WirefrontLink>
              ) : null}
            </CardFooter>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

export function ProfileCard(props: ProfileCardProps) {
  return (
    <ScreenBoundary name="ProfileCard">
      <ProfileCardScreen {...props} />
    </ScreenBoundary>
  );
}
