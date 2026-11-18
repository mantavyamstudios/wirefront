// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@wirefront/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@wirefront/ui/dropdown-menu";
import { Input } from "@wirefront/ui/input";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { CheckIcon, ChevronDownIcon, CopyIcon, GlobeIcon, LinkIcon, LockIcon, Share2Icon } from "lucide-react";
import { type SubmitEvent, useState } from "react";

import { type LinkAccess, ShareInviteInput, type ShareMember, type ShareRole, type ShareRoleChange } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("shareDialog.<key>"). */
export const SHARE_DIALOG_MESSAGES = {
  share: "Share",
  title: "Share “{name}”",
  invite: "Add people by email",
  invitePlaceholder: "Add people by email, separated by commas…",
  inviteRole: "Role for new people",
  send: "Invite",
  owner: "Owner",
  editor: "Editor",
  viewer: "Viewer",
  removeAccess: "Remove access",
  memberRole: "{name}: {role}",
  restricted: "Only people with access",
  restrictedHint: "Only the people below can open it.",
  view: "Anyone with the link",
  viewHint: "No sign-in required. Anyone with the link can view.",
  edit: "Anyone with the link",
  editHint: "No sign-in required. Anyone with the link can edit.",
  linkAccess: "Link access",
  linkRestricted: "Restricted",
  linkView: "Can view",
  linkEdit: "Can edit",
  copyLink: "Copy link",
  copy: "Copy",
  copied: "Copied",
  copyFailed: "Couldn’t copy. Select the link and copy it.",
  peopleWithAccess: "People with access · {count}",
  footer: "Workspace defaults to viewer access",
  done: "Done",
};

export interface ShareDialogProps {
  /** The document being shared. */
  documentName: string;
  /** Shown under the page title, e.g. "Last edited by Maya 2h ago". */
  documentMeta?: string;
  /** Who has access (listAccess). */
  members: ShareMember[];
  linkUrl: string;
  linkAccess: LinkAccess;
  /** Give people access (invite). */
  onInvite: Action<ShareInviteInput>;
  /** Change someone's role (changeRole). Applied at once and rolled back if it fails. Roles are read-only without it. */
  onRoleChange?: Action<ShareRoleChange>;
  /** Remove someone's access (removeAccess). Hidden without it. */
  onRemove?: Action<string>;
  /** Change what the link allows (setLinkAccess). Read-only without it. */
  onLinkAccessChange?: Action<LinkAccess>;
  defaultInviteRole?: Exclude<ShareRole, "owner">;
  /** Open the dialog on first render. */
  defaultOpen?: boolean;
  className?: string;
}

const pill =
  "inline-flex min-h-8 shrink-0 items-center gap-1 rounded-md border border-border/60 px-2.5 font-mono text-[11px] text-muted-foreground outline-none hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none pointer-coarse:min-h-10";
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

function ShareDialogScreen({
  documentName,
  documentMeta,
  members: initialMembers,
  linkUrl,
  linkAccess: initialLinkAccess,
  onInvite,
  onRoleChange,
  onRemove,
  onLinkAccessChange,
  defaultInviteRole = "editor",
  defaultOpen,
  className,
}: ShareDialogProps) {
  const t = useMessages("shareDialog", SHARE_DIALOG_MESSAGES);
  const [members, setMembers] = useState(initialMembers);
  const [linkAccess, setLinkAccess] = useState(initialLinkAccess);
  const [emails, setEmails] = useState("");
  const [inviteRole, setInviteRole] = useState(defaultInviteRole);
  const [inviteError, setInviteError] = useState<string>();
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");

  const invite = useAction(onInvite, { onSuccess: () => setEmails("") });
  const role = useAction(onRoleChange ?? (async () => {}), {
    optimistic: ({ memberId, role: next }) => {
      const before = members;
      setMembers((list) => list.map((m) => (m.id === memberId ? { ...m, role: next } : m)));
      return () => setMembers(before);
    },
  });
  const remove = useAction(onRemove ?? (async () => {}), {
    optimistic: (memberId) => {
      const before = members;
      setMembers((list) => list.filter((m) => m.id !== memberId));
      return () => setMembers(before);
    },
  });
  const link = useAction(onLinkAccessChange ?? (async () => {}), {
    optimistic: (next) => {
      const before = linkAccess;
      setLinkAccess(next);
      return () => setLinkAccess(before);
    },
  });
  const failure = inviteError ?? invite.error ?? role.error ?? remove.error ?? link.error;

  const submitInvite = (event: SubmitEvent) => {
    event.preventDefault();
    const parsed = ShareInviteInput.safeParse({ emails: emails.split(/[\s,;]+/).filter(Boolean), role: inviteRole });
    if (!parsed.success) {
      setInviteError(parsed.error.issues[0]?.message);
      return;
    }
    setInviteError(undefined);
    void invite.run(parsed.data);
  };

  const roleLabel: Record<ShareRole, string> = { owner: t.owner, editor: t.editor, viewer: t.viewer };
  const linkLabel: Record<LinkAccess, string> = { restricted: t.linkRestricted, view: t.linkView, edit: t.linkEdit };
  const linkTitle = { restricted: t.restricted, view: t.view, edit: t.edit }[linkAccess];
  const linkHint = { restricted: t.restrictedHint, view: t.viewHint, edit: t.editHint }[linkAccess];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
  };

  return (
    // Real Dialog: focus trap, Esc, scroll lock, labelled title. On phones it
    // becomes a bottom sheet with a scrolling body.
    <div className={cn("relative min-h-svh bg-background", className)}>
      <div className="flex flex-col gap-4 px-4 py-8 sm:flex-row sm:items-start sm:justify-between sm:px-10 sm:py-10">
        <div>
          <h1 className="font-heading text-2xl">{documentName}</h1>
          {documentMeta ? <p className="mt-2 text-muted-foreground text-sm">{documentMeta}</p> : null}
        </div>

        <Dialog defaultOpen={defaultOpen}>
          <DialogTrigger render={<Button className="self-start" variant="outline" />}>
            <Share2Icon />
            {t.share}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader className="min-w-0">
              <DialogTitle className="flex items-center gap-2 pe-8 text-base">
                <LinkIcon aria-hidden className="size-4 shrink-0 opacity-60" />
                <span className="min-w-0 truncate">{interpolate(t.title, { name: documentName })}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="-mx-4 min-h-0 min-w-0 space-y-4 overflow-y-auto px-4">
              <form className="flex items-center gap-2" noValidate onSubmit={submitInvite}>
                <Input
                  aria-label={t.invite}
                  autoComplete="off"
                  className="min-w-0 flex-1"
                  inputMode="email"
                  onChange={(e) => {
                    setEmails(e.target.value);
                    setInviteError(undefined);
                  }}
                  placeholder={t.invitePlaceholder}
                  value={emails}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger aria-label={interpolate(t.memberRole, { name: t.inviteRole, role: roleLabel[inviteRole] })} className={pill}>
                    {roleLabel[inviteRole]}
                    <ChevronDownIcon aria-hidden className="size-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuRadioGroup onValueChange={(v) => setInviteRole(v as typeof inviteRole)} value={inviteRole}>
                      <DropdownMenuRadioItem value="editor">{t.editor}</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="viewer">{t.viewer}</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                {emails.trim() ? (
                  <Button aria-busy={invite.isPending()} disabled={invite.isPending()} size="sm" type="submit">
                    {invite.isPending() ? <Spinner data-icon="inline-start" /> : null}
                    {t.send}
                  </Button>
                ) : null}
              </form>

              <div aria-live="polite">
                {failure ? (
                  <p className="text-destructive-foreground text-xs" role="alert">
                    {failure}
                  </p>
                ) : null}
              </div>

              <div className="rounded-lg border border-border/60 bg-background p-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground/[0.06]">
                    {linkAccess === "restricted" ? <LockIcon aria-hidden className="size-4 opacity-70" /> : <GlobeIcon aria-hidden className="size-4 opacity-70" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-2">
                      <span className="text-sm">{linkTitle}</span>
                      {onLinkAccessChange ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger aria-label={interpolate(t.memberRole, { name: t.linkAccess, role: linkLabel[linkAccess] })} className={pill}>
                            {linkLabel[linkAccess]}
                            <ChevronDownIcon aria-hidden className="size-3" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuRadioGroup onValueChange={(v) => void link.run(v as LinkAccess)} value={linkAccess}>
                              {(["restricted", "view", "edit"] as const).map((value) => (
                                <DropdownMenuRadioItem key={value} value={value}>
                                  {linkLabel[value]}
                                </DropdownMenuRadioItem>
                              ))}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="font-mono text-[11px] text-muted-foreground">{linkLabel[linkAccess]}</span>
                      )}
                    </div>
                    <p className="mt-1 text-muted-foreground text-xs">{linkHint}</p>
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border/60 bg-background py-1 ps-3 pe-1">
                <LockIcon aria-hidden className="size-3.5 shrink-0 opacity-50" />
                <code className="min-w-0 flex-1 truncate font-mono text-xs">{linkUrl}</code>
                <Button aria-label={t.copyLink} className="shrink-0" onClick={() => void copyLink()} size="sm" type="button" variant="ghost">
                  {copy === "copied" ? <CheckIcon /> : <CopyIcon />}
                  <span aria-hidden className="max-sm:hidden">
                    {copy === "copied" ? t.copied : t.copy}
                  </span>
                </Button>
              </div>
              {copy === "failed" ? (
                <p className="text-destructive-foreground text-xs" role="alert">
                  {t.copyFailed}
                </p>
              ) : null}

              <div>
                <h2 className="mb-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{interpolate(t.peopleWithAccess, { count: members.length })}</h2>
                <ul className="divide-y divide-border/40 rounded-lg border border-border/60">
                  {members.map((m) => (
                    <li className="flex items-center gap-3 px-3 py-2.5" key={m.id}>
                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback className="text-[10px]">{initialsOf(m.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm">{m.name}</div>
                        <div className="truncate text-muted-foreground text-xs">{m.email}</div>
                      </div>
                      {m.role === "owner" || !(onRoleChange || onRemove) ? (
                        <span className="px-2.5 font-mono text-[11px] text-muted-foreground">{roleLabel[m.role]}</span>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger aria-label={interpolate(t.memberRole, { name: m.name, role: roleLabel[m.role] })} className={pill}>
                            {roleLabel[m.role]}
                            <ChevronDownIcon aria-hidden className="size-3" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onRoleChange ? (
                              <DropdownMenuRadioGroup onValueChange={(v) => void role.run({ memberId: m.id, role: v as "editor" | "viewer" })} value={m.role}>
                                <DropdownMenuRadioItem value="editor">{t.editor}</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="viewer">{t.viewer}</DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                            ) : null}
                            {onRoleChange && onRemove ? <DropdownMenuSeparator /> : null}
                            {onRemove ? (
                              <DropdownMenuItem onClick={() => void remove.run(m.id)} variant="destructive">
                                {t.removeAccess}
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <DialogFooter className="sm:items-center sm:justify-between">
              <span className="text-center text-muted-foreground text-xs sm:text-start">{t.footer}</span>
              <DialogClose render={<Button type="button" />}>{t.done}</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export function ShareDialog(props: ShareDialogProps) {
  return (
    <ScreenBoundary name="ShareDialog">
      <ShareDialogScreen {...props} />
    </ScreenBoundary>
  );
}
