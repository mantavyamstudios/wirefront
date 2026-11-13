// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { Label } from "@wirefront/ui/label";
import { cn } from "@wirefront/ui/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@wirefront/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@wirefront/ui/select";
import { Spinner } from "@wirefront/ui/spinner";
import { Textarea } from "@wirefront/ui/textarea";
import { useAction } from "@wirefront/ui/wirefront/action";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ArrowRightIcon, CheckIcon, ChevronDownIcon, CopyIcon, LinkIcon, ShieldIcon, SparklesIcon, XIcon } from "lucide-react";
import { type ClipboardEvent, type KeyboardEvent, useEffect, useId, useState } from "react";
import { z } from "zod";

import { type Invitation, InviteRole, type SendInvitesInput, type SendInvitesResult } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("inviteTeammates.<key>"). */
export const INVITE_TEAMMATES_MESSAGES = {
  eyebrow: "Members · invite",
  title: "Bring people in.",
  subtitle: "Paste or type emails — separate with spaces, commas, or new lines.",
  expires: "Links expire after {days} days.",
  invitees: "Invitees",
  defaultRole: "Default role",
  admin: "Admin",
  adminDescription: "Manage workspace and people.",
  member: "Member",
  memberDescription: "Create and edit projects.",
  viewer: "Viewer",
  viewerDescription: "Read-only access.",
  emails: "Invitee emails",
  placeholder: "name@example.com, another@example.com…",
  addAnother: "Add another",
  toInvite: "{count} to invite",
  autoJoinCount: "{count} auto-join",
  invalidCount: "{count} invalid",
  auto: "Auto",
  invalid: "Invalid",
  changeRole: "{role}, change role for {email}",
  remove: "Remove {email}",
  note: "Personal note",
  hide: "Hide",
  addNote: "+ Add a personal note",
  notePlaceholder: "Add a quick hello so they know what they’re joining.",
  sendOne: "Send 1 invite",
  sendOther: "Send {count} invites",
  sendNone: "Send invites",
  sent: "Sent {count} invitations.",
  copyLink: "Copy link",
  copied: "Copied",
  autoJoinTitle: "Domain auto-join is on",
  autoJoinBody: "Anyone with an @{domain} email joins automatically — no invite needed.",
  manage: "Manage",
};

export interface InviteTeammatesProps {
  /** Send the invitations (valid addresses outside the auto-join domain) and the note. */
  onSend: Action<SendInvitesInput, SendInvitesResult>;
  onSent?: (result: SendInvitesResult | undefined) => void;
  /** People who join automatically with this email domain don't need an invite. */
  autoJoinDomain?: string;
  /** Where the auto-join setting is managed. "Manage" is hidden when not given. */
  manageAutoJoinHref?: string;
  /** A shareable invite link. The copy button is hidden when not given. */
  inviteLink?: string;
  /** How long invitations stay valid; mentioned when given. */
  expiresInDays?: number;
  defaultInvitees?: Invitation[];
  defaultMessage?: string;
  className?: string;
}

interface Chip extends Invitation {
  key: string;
}

const Email = z.email();
const SPLIT = /[\s,;]+/;
const initials = (email: string) => email.trim().split("@")[0]?.slice(0, 2).toUpperCase() || "??";

export function InviteTeammates({
  onSend,
  onSent,
  autoJoinDomain,
  manageAutoJoinHref,
  inviteLink,
  expiresInDays,
  defaultInvitees = [],
  defaultMessage = "",
  className,
}: InviteTeammatesProps) {
  const t = useMessages("inviteTeammates", INVITE_TEAMMATES_MESSAGES);
  const id = useId();
  const [chips, setChips] = useState<Chip[]>(() => defaultInvitees.map((inv) => ({ ...inv, key: inv.email.toLowerCase() })));
  const [draft, setDraft] = useState("");
  const [defaultRole, setDefaultRole] = useState<InviteRole>("member");
  const [message, setMessage] = useState(defaultMessage);
  const [showMessage, setShowMessage] = useState(false);
  const [sentCount, setSentCount] = useState<number>();

  const isValid = (email: string) => Email.safeParse(email).success;
  const isAutoJoin = (email: string) => Boolean(autoJoinDomain) && email.toLowerCase().endsWith(`@${autoJoinDomain?.toLowerCase()}`);
  const sendable = chips.filter((c) => isValid(c.email) && !isAutoJoin(c.email));
  const autojoin = chips.filter((c) => isValid(c.email) && isAutoJoin(c.email)).length;
  const invalid = chips.filter((c) => !isValid(c.email)).length;

  const send = useAction(onSend, {
    onSuccess: (result) => {
      setChips((all) => all.filter((c) => !sendable.some((s) => s.key === c.key)));
      setSentCount(result?.sent ?? sendable.length);
      onSent?.(result);
    },
  });

  const addEmails = (raw: string) => {
    const parts = raw.split(SPLIT).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    setSentCount(undefined);
    setChips((prev) => {
      const seen = new Set(prev.map((c) => c.key));
      const next = [...prev];
      for (const email of parts) {
        const key = email.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        next.push({ key, email, role: defaultRole });
      }
      return next;
    });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";" || e.key === "Tab") {
      if (!draft.trim()) return;
      e.preventDefault();
      addEmails(draft);
      setDraft("");
    } else if (e.key === "Backspace" && !draft && chips.length) {
      e.preventDefault();
      setChips((prev) => prev.slice(0, -1));
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (!SPLIT.test(text)) return;
    e.preventDefault();
    addEmails(`${draft} ${text}`);
    setDraft("");
  };

  const submit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!sendable.length || send.isPending()) return;
    const note = showMessage ? message.trim() : "";
    void send.run({ invitations: sendable.map(({ email, role }) => ({ email, role })), ...(note ? { message: note } : {}) });
  };

  const roleLabel = (r: InviteRole) => t[r];
  const sendLabel = sendable.length === 0 ? t.sendNone : sendable.length === 1 ? t.sendOne : interpolate(t.sendOther, { count: sendable.length });
  const mono = "font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]";

  return (
    <div className={cn("min-h-svh bg-background px-4 py-8 text-foreground sm:px-6 sm:py-16", className)}>
      <div className="mx-auto max-w-2xl">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
        <h1 className="mt-1 font-heading text-3xl">{t.title}</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          {t.subtitle}
          {expiresInDays ? ` ${interpolate(t.expires, { days: expiresInDays })}` : null}
        </p>

        <form className="mt-8 rounded-xl border border-border/60 bg-background/40 p-4 sm:p-5" onSubmit={submit}>
          <div className="flex items-center justify-between gap-3">
            <Label className="font-medium text-sm" htmlFor={`${id}-emails`}>
              {t.invitees}
            </Label>
            <div className="flex items-center gap-2">
              <span className={cn(mono, "hidden sm:inline")}>{t.defaultRole}</span>
              <Select items={InviteRole.options.map((r) => ({ value: r, label: roleLabel(r) }))} onValueChange={(v) => setDefaultRole(v as InviteRole)} value={defaultRole}>
                <SelectTrigger aria-label={t.defaultRole} className="h-8 w-32 text-sm pointer-coarse:h-11" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  {InviteRole.options.map((r) => (
                    <SelectItem key={r} value={r}>
                      <div className="flex flex-col">
                        <span>{roleLabel(r)}</span>
                        <span className="text-muted-foreground text-xs">{t[`${r}Description`]}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-3 flex w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background p-2 transition-shadow focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/24">
            {chips.map((chip) => (
              <ChipPill
                autoJoin={isValid(chip.email) && isAutoJoin(chip.email)}
                chip={chip}
                key={chip.key}
                onRemove={() => setChips((prev) => prev.filter((c) => c.key !== chip.key))}
                onRole={(role) => setChips((prev) => prev.map((c) => (c.key === chip.key ? { ...c, role } : c)))}
                t={t}
                valid={isValid(chip.email)}
              />
            ))}
            <input
              aria-label={t.emails}
              className="min-w-[12ch] flex-1 bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-muted-foreground pointer-coarse:min-h-9"
              id={`${id}-emails`}
              onBlur={() => {
                if (!draft.trim()) return;
                addEmails(draft);
                setDraft("");
              }}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              placeholder={chips.length ? t.addAnother : t.placeholder}
              type="email"
              value={draft}
            />
          </div>

          <div aria-live="polite" className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            <span>{interpolate(t.toInvite, { count: sendable.length })}</span>
            {autojoin > 0 ? (
              <span className="flex items-center gap-1">
                <SparklesIcon className="size-3" />
                {interpolate(t.autoJoinCount, { count: autojoin })}
              </span>
            ) : null}
            {invalid > 0 ? <span className="text-destructive-foreground">{interpolate(t.invalidCount, { count: invalid })}</span> : null}
          </div>

          {showMessage ? (
            <div className="mt-5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-sm" htmlFor={`${id}-note`}>
                  {t.note}
                </Label>
                <button className={cn(mono, "min-h-8 px-1 hover:text-foreground pointer-coarse:min-h-11")} onClick={() => setShowMessage(false)} type="button">
                  {t.hide}
                </button>
              </div>
              <Textarea id={`${id}-note`} maxLength={500} onChange={(e) => setMessage(e.target.value)} placeholder={t.notePlaceholder} rows={3} value={message} />
            </div>
          ) : (
            <button className={cn(mono, "mt-3 min-h-8 hover:text-foreground pointer-coarse:min-h-11")} onClick={() => setShowMessage(true)} type="button">
              {t.addNote}
            </button>
          )}

          {send.error ? (
            <p className="mt-4 text-destructive-foreground text-sm" role="alert">
              {send.error}
            </p>
          ) : sentCount !== undefined ? (
            <p className="mt-4 text-emerald-700 text-sm dark:text-emerald-400" role="status">
              {interpolate(t.sent, { count: sentCount })}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 border-border/60 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            {inviteLink ? <CopyLinkButton link={inviteLink} t={t} /> : <span />}
            <Button aria-busy={send.isPending()} className="pointer-coarse:h-11 max-sm:w-full" disabled={sendable.length === 0 || send.isPending()} type="submit">
              {send.isPending() ? <Spinner data-icon="inline-start" /> : null}
              {sendLabel}
              <ArrowRightIcon />
            </Button>
          </div>
        </form>

        {autoJoinDomain ? (
          <div className="mt-5 rounded-lg border border-border/60 bg-background/40 px-4 py-3 text-sm">
            <div className="flex items-start gap-3">
              <ShieldIcon className="mt-0.5 size-4 shrink-0 opacity-60" />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{t.autoJoinTitle}</div>
                <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">{interpolate(t.autoJoinBody, { domain: autoJoinDomain })}</p>
              </div>
              {manageAutoJoinHref ? (
                <Button nativeButton={false} render={<WirefrontLink href={manageAutoJoinHref} />} size="sm" variant="ghost">
                  {t.manage}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type Messages = typeof INVITE_TEAMMATES_MESSAGES;

function ChipPill({
  chip,
  valid,
  autoJoin,
  onRemove,
  onRole,
  t,
}: {
  chip: Chip;
  valid: boolean;
  autoJoin: boolean;
  onRemove: () => void;
  onRole: (role: InviteRole) => void;
  t: Messages;
}) {
  return (
    <span
      className={cn(
        "group inline-flex h-7 items-center gap-1.5 rounded-full border pr-1 pl-1 text-xs",
        !valid && "border-destructive/50 bg-destructive/8 text-destructive-foreground",
        valid && autoJoin && "border-emerald-500/30 bg-emerald-500/8 text-foreground",
        valid && !autoJoin && "border-border bg-foreground/[0.03] text-foreground",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[9px] uppercase",
          autoJoin ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" : valid ? "bg-foreground/[0.06] text-muted-foreground" : "bg-destructive/15 text-destructive-foreground",
        )}
      >
        {valid ? initials(chip.email) : "!"}
      </span>
      <span className="truncate">{chip.email}</span>

      {autoJoin ? (
        <span className="flex items-center gap-0.5 font-mono text-[10px] text-emerald-700 uppercase tracking-[0.2em] dark:text-emerald-400">
          <SparklesIcon className="size-2.5" />
          {t.auto}
        </span>
      ) : valid ? (
        <Popover>
          <PopoverTrigger
            aria-label={interpolate(t.changeRole, { role: t[chip.role], email: chip.email })}
            render={
              <button
                className="flex h-6 items-center gap-0.5 rounded-full px-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.18em] transition-colors hover:bg-foreground/[0.06] hover:text-foreground pointer-coarse:h-8"
                type="button"
              />
            }
          >
            {t[chip.role]}
            <ChevronDownIcon aria-hidden className="size-2.5" />
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1">
            {InviteRole.options.map((r) => (
              <button
                aria-pressed={r === chip.role}
                className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-foreground/[0.04]"
                key={r}
                onClick={() => onRole(r)}
                type="button"
              >
                <CheckIcon className={cn("mt-0.5 size-3.5 shrink-0", r === chip.role ? "opacity-100" : "opacity-0")} />
                <div className="flex-1">
                  <div>{t[r]}</div>
                  <div className="text-muted-foreground text-xs">{t[`${r}Description`]}</div>
                </div>
              </button>
            ))}
          </PopoverContent>
        </Popover>
      ) : (
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">{t.invalid}</span>
      )}

      <button
        aria-label={interpolate(t.remove, { email: chip.email })}
        className="flex size-6 items-center justify-center rounded-full opacity-50 hover:bg-foreground/[0.06] hover:opacity-100 pointer-coarse:size-8"
        onClick={onRemove}
        type="button"
      >
        <XIcon className="size-3" />
      </button>
    </span>
  );
}

function CopyLinkButton({ link, t }: { link: string; t: Messages }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1200);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <button
      className="group inline-flex min-w-0 max-w-full items-center gap-2 rounded-md border border-border/60 border-dashed px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-border hover:text-foreground pointer-coarse:min-h-11"
      onClick={() => void navigator.clipboard?.writeText(link).then(() => setCopied(true))}
      type="button"
    >
      {copied ? <CheckIcon className="size-3.5 text-emerald-700 dark:text-emerald-400" /> : <LinkIcon className="size-3.5 opacity-60 group-hover:opacity-100" />}
      <span className="truncate">{link.replace(/^https?:\/\//, "")}</span>
      <span className="flex items-center gap-1">
        <CopyIcon className="size-3" />
        <span className="uppercase tracking-[0.2em]">{copied ? t.copied : t.copyLink}</span>
      </span>
    </button>
  );
}
