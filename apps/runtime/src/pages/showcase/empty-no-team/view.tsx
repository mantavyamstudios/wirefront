// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@wirefront/ui/input-group";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { CheckIcon, CopyIcon, MailPlusIcon } from "lucide-react";
import { useId, useState } from "react";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("noTeam.<key>"). */
export const NO_TEAM_MESSAGES = {
  members: "Members · {count}",
  title: "It’s just you in here.",
  description: "Add teammates to share projects, leave comments, and review each other’s work.",
  inviteLink: "Invite link",
  copy: "Copy",
  copied: "Copied",
  copyFailed: "Couldn’t copy. Select the link and copy it.",
  inviteByEmail: "Invite by email",
  linkNote: "Anyone with the link can join as a member.",
  changeIn: "Change in",
  settings: "workspace settings",
};

export interface NoTeamProps {
  /** The signed-in user; their initial fills the first seat. */
  userName: string;
  /** The workspace's join link. Hidden when not given. */
  inviteUrl?: string;
  /** Open your invite-by-email flow. The button only shows when this is given. */
  onInviteByEmail?: () => void;
  /** Where the invite-link settings live. The link only shows when this is given. */
  settingsHref?: string;
  className?: string;
}

function NoTeamScreen({ userName, inviteUrl, onInviteByEmail, settingsHref, className }: NoTeamProps) {
  const t = useMessages("noTeam", NO_TEAM_MESSAGES);
  const id = useId();
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const copyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
  };

  return (
    <div className={cn("relative min-h-svh overflow-x-clip bg-background", className)}>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[60%]" style={{ background: "radial-gradient(60% 80% at 50% 0%, color-mix(in srgb, var(--foreground) 5%, transparent) 0%, transparent 70%)" }} />
      <div className="relative mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center-safe px-4 py-10 text-center sm:px-6">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.4em]">{interpolate(t.members, { count: 1 })}</div>
        <div aria-hidden className="mt-6 mb-5 flex items-center -space-x-2">
          <div className="z-10 flex size-10 items-center justify-center rounded-full border-2 border-background bg-foreground font-medium text-background text-xs shadow-sm">
            {userName.trim().charAt(0).toUpperCase()}
          </div>
          {["seat-2", "seat-3", "seat-4"].map((seat, i) => (
            <div
              className="flex size-10 items-center justify-center rounded-full border-2 border-border/70 border-dashed bg-background/40 font-medium text-[11px] text-muted-foreground backdrop-blur"
              key={seat}
              style={{ zIndex: 3 - i }}
            >
              ?
            </div>
          ))}
        </div>
        <h1 className="mt-1 max-w-md font-heading text-3xl leading-tight md:text-4xl">{t.title}</h1>
        <p className="mt-3 max-w-sm text-muted-foreground text-sm leading-relaxed">{t.description}</p>
        <div className="mt-8 w-full max-w-md space-y-3">
          {inviteUrl ? (
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] max-[400px]:sr-only" htmlFor={`${id}-link`}>
                  {t.inviteLink}
                </label>
              </InputGroupAddon>
              <InputGroupInput className="min-w-0 truncate" id={`${id}-link`} readOnly value={inviteUrl} />
              <InputGroupAddon align="inline-end">
                <Button onClick={() => void copyLink()} size="xs" type="button" variant="ghost">
                  {copy === "copied" ? <CheckIcon /> : <CopyIcon />}
                  {copy === "copied" ? t.copied : t.copy}
                </Button>
              </InputGroupAddon>
            </InputGroup>
          ) : null}
          {copy === "failed" ? (
            <p className="text-destructive-foreground text-xs" role="alert">
              {t.copyFailed}
            </p>
          ) : null}
          {onInviteByEmail ? (
            <Button className="w-full" onClick={onInviteByEmail} type="button">
              <MailPlusIcon />
              {t.inviteByEmail}
            </Button>
          ) : null}
          {inviteUrl ? (
            <p className="pt-1 text-muted-foreground text-xs">
              {t.linkNote}
              {settingsHref ? (
                <>
                  {" "}
                  {t.changeIn}{" "}
                  <WirefrontLink className="text-foreground underline underline-offset-4" href={settingsHref}>
                    {t.settings}
                  </WirefrontLink>
                  .
                </>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function NoTeam(props: NoTeamProps) {
  return (
    <ScreenBoundary name="NoTeam">
      <NoTeamScreen {...props} />
    </ScreenBoundary>
  );
}
