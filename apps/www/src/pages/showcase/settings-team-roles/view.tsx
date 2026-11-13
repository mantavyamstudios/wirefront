// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@wirefront/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { Checkbox } from "@wirefront/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@wirefront/ui/dropdown-menu";
import { Input } from "@wirefront/ui/input";
import { cn } from "@wirefront/ui/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@wirefront/ui/select";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { CheckIcon, CopyIcon, EllipsisIcon, LockIcon, MailIcon, UserMinusIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useState } from "react";

import { InviteInput, type PermissionArea, type SaveRolesInput, type TeamData, type TeamHue, type TeamInvite, type TeamMember, type TeamRole } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("teamRoles.<key>"). */
export const TEAM_ROLES_MESSAGES = {
  title: "Members & roles",
  subtitle: "Invite people to {product} and decide what each role can do.",
  inviteTitle: "Invite people",
  inviteDescription: "They’ll get an email with a link that works for 7 days.",
  email: "Email address",
  emailPlaceholder: "name@company.com",
  roleForInvite: "Role for new invite",
  invite: "Invite",
  alreadyHere: "That person is already here or invited.",
  inviteSent: "Invite sent to {email}",
  membersTitle: "Members",
  peopleIn: "{count} in {product}.",
  personOne: "1 person",
  peopleOther: "{count} people",
  columnName: "Name",
  columnRole: "Role",
  columnLastActive: "Last active",
  actions: "Actions",
  you: "(you)",
  roleFor: "Role for {name}",
  now: "Now",
  never: "Never",
  actionsFor: "Actions for {name}",
  copyEmail: "Copy email",
  ownerCantBeRemoved: "Owner can’t be removed",
  removeFromWorkspace: "Remove from workspace",
  pendingInvites: "Pending invites",
  invitedBy: "{role} · invited by {by} {when}",
  resentNow: "{role} · resent just now",
  resend: "Resend",
  resent: "Resent",
  revoke: "Revoke",
  revoked: "Invite for {email} revoked",
  noInvites: "No invites waiting.",
  rolesTitle: "Roles",
  rolesDescription: "What each role can do. Owners can always do everything.",
  duplicate: "Duplicate {role}",
  customFrom: "Custom, based on {role}",
  newRoleName: "Contractor",
  customHint: "marks where {role} differs from {from}. Click its name to rename it.",
  noCustomHint: "Need something in between? Duplicate {role} and adjust it.",
  unsavedShort: "Unsaved changes",
  unsavedLong: "You have unsaved changes",
  affectsNone: "no one has these roles yet",
  affects: "affects {people}",
  discard: "Discard",
  save: "Save",
  rolesSaved: "Roles saved",
  removeTitle: "Remove {name}?",
  removeDescription: "They lose access to {product} straight away. Projects they created stay where they are.",
  cancel: "Cancel",
  remove: "Remove",
  removed: "{name} removed",
  permission: "Permission",
  customRoleName: "Custom role name",
  custom: "Custom",
  locked: "Locked",
  unsaved: "Unsaved changes",
  person: "person",
  people: "people",
  removeRole: "Remove {name} role",
};

export interface TeamRolesProps {
  data: TeamData;
  /** Your product's name, used in the copy. */
  product: string;
  /** Invite someone with a role; resolve with the invite. The form is hidden when not given. */
  onInvite?: Action<InviteInput, TeamInvite>;
  onResendInvite?: Action<string>;
  onRevokeInvite?: Action<string>;
  /** Change a member's role. Applied at once, rolled back if it fails. */
  onChangeRole?: Action<{ memberId: string; roleId: string }>;
  /** Remove a member (receives their id), after confirmation. */
  onRemoveMember?: Action<string>;
  /** Commit the role matrix (all roles except the locked owner). The matrix is read-only when not given. */
  onSaveRoles?: Action<SaveRolesInput>;
  /** The role "Duplicate …" copies. Defaults to "member". */
  duplicateFrom?: string;
  className?: string;
}

type Messages = typeof TEAM_ROLES_MESSAGES;
const easeOut = [0.23, 1, 0.32, 1] as const;
const spring = { type: "spring", stiffness: 500, damping: 40 } as const;
const press = "transition-[color,background-color,box-shadow,scale] duration-150 ease-out active:scale-[0.97]";

const avatarHues: Record<TeamHue, string> = {
  amber: "from-amber-300 to-orange-500",
  rose: "from-rose-300 to-pink-500",
  violet: "from-violet-400 to-indigo-500",
  teal: "from-teal-300 to-emerald-500",
  sky: "from-sky-300 to-blue-500",
  emerald: "from-emerald-300 to-teal-600",
  indigo: "from-indigo-400 to-violet-700",
  orange: "from-orange-300 to-red-500",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function sameGrants(a: string[], b: string[]) {
  return a.length === b.length && a.every((g) => b.includes(g));
}


function PersonAvatar({ name, hue }: { name: string; hue: TeamHue }) {
  return (
    <Avatar className="size-8">
      <AvatarFallback className={cn("bg-gradient-to-br font-medium text-white text-xs", avatarHues[hue])}>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}

function RoleSelect({
  roles,
  value,
  onChange,
  label,
  className,
}: {
  roles: TeamRole[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
}) {
  const options = roles.filter((r) => !r.locked);
  const items = options.map((r) => ({ value: r.id, label: r.name }));
  return (
    <Select items={items} onValueChange={(v) => v && onChange(v as string)} value={value}>
      <SelectTrigger aria-label={label} className={cn("w-32 min-w-0", className)} size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="w-64" align="start">
        {options.map((r) => (
          <SelectItem className="items-start py-1.5 [&>span:first-child]:mt-0.5" key={r.id} value={r.id}>
            <span className="flex flex-col">
              <span className="font-medium">{r.name}</span>
              <span className="text-muted-foreground text-xs">{r.description}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CheckCell({
  checked,
  locked,
  changed,
  label,
  onToggle,
}: {
  checked: boolean;
  locked?: boolean;
  changed?: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <span className="relative inline-flex">
      <Checkbox aria-label={label} checked={checked} className="size-[18px]" disabled={locked} onCheckedChange={onToggle} />
      {changed ? <span aria-hidden className="-top-1 -end-1 absolute size-1.5 rounded-full bg-warning ring-2 ring-card" /> : null}
    </span>
  );
}

function RollingCount({ value, reduce }: { value: number; reduce: boolean }) {
  return (
    <span className="relative inline-flex overflow-hidden tabular-nums">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: -8, opacity: 0 }}
          initial={reduce ? { opacity: 0 } : { y: 8, opacity: 0 }}
          key={value}
          transition={{ duration: 0.18, ease: easeOut }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function PermissionMatrix({
  areas,
  roles,
  draft,
  saved,
  counts,
  reduce,
  onToggle,
  onRename,
  onRemove,
  t,
}: {
  areas: PermissionArea[];
  roles: TeamRole[];
  draft: Record<string, string[]>;
  saved: Record<string, string[]>;
  counts: Record<string, number>;
  reduce: boolean;
  onToggle: (roleId: string, permissionId: string) => void;
  onRename: (roleId: string, name: string) => void;
  onRemove: (roleId: string) => void;
  t: Messages;
}) {
  const sticky = "sticky start-0 z-10 bg-card";
  const roleCol = "w-14 min-w-14 px-1 text-center sm:w-[4.75rem] sm:min-w-[4.75rem]";
  return (
    <div className="mt-3 overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto [scrollbar-width:thin]">
        <table className="w-full min-w-fit border-collapse text-start">
          <thead>
            <tr className="border-b">
              <th className={cn(sticky, "min-w-[7.5rem] px-4 pb-2.5 align-bottom font-medium text-muted-foreground text-xs sm:min-w-44")} scope="col">
                {t.permission}
              </th>
              {roles.map((r) => {
                const changed = !sameGrants(draft[r.id] ?? [], saved[r.id] ?? []);
                const count = counts[r.id] ?? 0;
                return (
                  <th className={cn(roleCol, "pt-3 pb-2.5 align-bottom font-normal")} key={r.id} scope="col">
                    <span className="flex flex-col items-center justify-end gap-0.5">
                      {r.from ? (
                        <input
                          aria-label={t.customRoleName}
                          className="w-full min-w-0 rounded-sm bg-transparent text-center font-medium text-xs underline decoration-dotted decoration-muted-foreground/60 underline-offset-4 outline-none focus-visible:no-underline focus-visible:ring-2 focus-visible:ring-ring"
                          onBlur={(e) => !e.target.value.trim() && onRename(r.id, t.custom)}
                          onChange={(e) => onRename(r.id, e.target.value)}
                          value={r.name}
                        />
                      ) : (
                        <span className="flex items-center gap-1 font-medium text-xs">
                          {r.locked ? <LockIcon aria-label={t.locked} className="size-3 text-muted-foreground" /> : null}
                          {r.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        {changed ? <span aria-label={t.unsaved} className="size-1.5 rounded-full bg-warning" role="img" /> : null}
                        <RollingCount reduce={reduce} value={count} /> {count === 1 ? t.person : t.people}
                      </span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          {areas.map((area) => (
            <tbody className="border-b last:border-b-0" key={area.id}>
              <tr>
                <th className={cn(sticky, "px-4 pt-3.5 pb-1 font-medium text-muted-foreground text-xs")} colSpan={roles.length + 1} scope="colgroup">
                  {area.name}
                </th>
              </tr>
              {area.permissions.map((p) => (
                <tr className="border-t first:border-t-0" key={p.id}>
                  <th className={cn(sticky, "py-1.5 ps-4 pe-2 font-normal text-sm leading-snug")} scope="row">
                    {p.label}
                  </th>
                  {roles.map((r) => {
                    const on = (draft[r.id] ?? []).includes(p.id);
                    const diverges = r.from ? on !== (draft[r.from] ?? []).includes(p.id) : false;
                    return (
                      <td className={cn(roleCol, "py-1.5")} key={r.id}>
                        <CheckCell changed={diverges} checked={on} label={`${r.name}: ${p.label}`} locked={r.locked} onToggle={() => onToggle(r.id, p.id)} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          ))}
          {roles.some((r) => r.from) ? (
            <tfoot>
              <tr className="border-t">
                <td className={sticky} />
                {roles.map((r) => (
                  <td className={cn(roleCol, "py-1.5")} key={r.id}>
                    {r.from ? (
                      <Button aria-label={interpolate(t.removeRole, { name: r.name })} className={press} onClick={() => onRemove(r.id)} size="icon-xs" variant="ghost">
                        <XIcon />
                      </Button>
                    ) : null}
                  </td>
                ))}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}

function TeamRolesScreen({
  data,
  product,
  onInvite,
  onResendInvite,
  onRevokeInvite,
  onChangeRole,
  onRemoveMember,
  onSaveRoles,
  duplicateFrom = "member",
  className,
}: TeamRolesProps) {
  const t = useMessages("teamRoles", TEAM_ROLES_MESSAGES);
  const format = useFormat();
  const { now } = useWirefront();
  const reduce = Boolean(useReducedMotion());
  const id = useId();

  const [savedRoles, setSavedRoles] = useState<TeamRole[]>(data.roles);
  const [roles, setRoles] = useState<TeamRole[]>(data.roles);
  const [members, setMembers] = useState<TeamMember[]>(data.members);
  const [invites, setInvites] = useState<TeamInvite[]>(data.invites);
  const [source, setSource] = useState(data);
  if (source !== data) {
    setSource(data);
    setSavedRoles(data.roles);
    setRoles(data.roles);
    setMembers(data.members);
    setInvites(data.invites);
  }

  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState(duplicateFrom);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [resent, setResent] = useState<string[]>([]);
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const [notice, setNotice] = useState<{ key: number; text: string } | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => setJustSaved(false), 1600);
    return () => clearTimeout(timer);
  }, [justSaved]);

  const say = (text: string) => setNotice((n) => ({ key: (n?.key ?? 0) + 1, text }));

  const invite = useAction(onInvite ?? (async () => {}), {
    onSuccess: (created, input) => {
      if (created) setInvites((all) => [created, ...all]);
      setEmail("");
      say(interpolate(t.inviteSent, { email: input.email }));
    },
  });
  const resend = useAction(onResendInvite ?? (async () => {}), { onSuccess: (_, inviteId) => setResent((r) => [...r, inviteId]) });
  const revoke = useAction(onRevokeInvite ?? (async () => {}), {
    onSuccess: (_, inviteId) => {
      const gone = invites.find((i) => i.id === inviteId);
      setInvites((all) => all.filter((i) => i.id !== inviteId));
      if (gone) say(interpolate(t.revoked, { email: gone.email }));
    },
  });
  const changeRole = useAction(onChangeRole ?? (async () => {}), {
    optimistic: ({ memberId, roleId }) => {
      const before = members.find((m) => m.id === memberId)?.roleId;
      setMembers((all) => all.map((m) => (m.id === memberId ? { ...m, roleId } : m)));
      return () => setMembers((all) => all.map((m) => (m.id === memberId && before ? { ...m, roleId: before } : m)));
    },
  });
  const removeMember = useAction(onRemoveMember ?? (async () => {}), {
    onSuccess: (_, memberId) => {
      const gone = members.find((m) => m.id === memberId);
      setRemoving(null);
      setMembers((all) => all.filter((m) => m.id !== memberId));
      if (gone) say(interpolate(t.removed, { name: gone.name }));
    },
  });
  const saveRoles = useAction(onSaveRoles ?? (async () => {}), {
    onSuccess: (_, saved) => {
      // Members of a deleted custom role move to the role it came from.
      const kept = new Set(saved.map((r) => r.id));
      const fallback = Object.fromEntries(savedRoles.filter((r) => !kept.has(r.id) && !r.locked).map((r) => [r.id, r.from ?? duplicateFrom]));
      setMembers((all) => all.map((m) => (fallback[m.roleId] ? { ...m, roleId: fallback[m.roleId] as string } : m)));
      setInvites((all) => all.map((i) => (fallback[i.roleId] ? { ...i, roleId: fallback[i.roleId] as string } : i)));
      setSavedRoles(roles);
      setJustSaved(true);
    },
  });
  const actionError = invite.error ?? resend.error ?? revoke.error ?? changeRole.error ?? removeMember.error ?? saveRoles.error;

  const draft = Object.fromEntries(roles.map((r) => [r.id, r.grants]));
  const saved = Object.fromEntries(savedRoles.map((r) => [r.id, r.grants]));
  const counts = Object.fromEntries(roles.map((r) => [r.id, members.filter((m) => m.roleId === r.id).length]));
  const dirty = JSON.stringify(roles) !== JSON.stringify(savedRoles);
  const changedRoles = roles.filter((r) => !sameGrants(draft[r.id] ?? [], saved[r.id] ?? []) || !savedRoles.some((s) => s.id === r.id));
  const affected = changedRoles.reduce((n, r) => n + (counts[r.id] ?? 0), 0);
  const customRole = roles.find((r) => r.from);
  const baseRole = roles.find((r) => r.id === duplicateFrom);
  const roleName = (rid: string) => roles.find((r) => r.id === rid)?.name ?? savedRoles.find((r) => r.id === rid)?.name ?? rid;
  const people = (n: number) => (n === 1 ? t.personOne : interpolate(t.peopleOther, { count: n }));
  const lastActive = (m: TeamMember) =>
    m.lastActiveAt === null ? t.never : now().getTime() - Date.parse(m.lastActiveAt) < 5 * 60_000 ? null : format.relative(m.lastActiveAt);

  const sendInvite = (e: { preventDefault(): void }) => {
    e.preventDefault();
    const parsed = InviteInput.safeParse({ email: email.trim(), roleId: inviteRole });
    if (!parsed.success) {
      setInviteError(parsed.error.issues[0]?.message ?? null);
      return;
    }
    const value = parsed.data.email.toLowerCase();
    if (invites.some((i) => i.email.toLowerCase() === value) || members.some((m) => m.email.toLowerCase() === value)) {
      setInviteError(t.alreadyHere);
      return;
    }
    void invite.run(parsed.data);
  };

  const toggle = (roleId: string, permissionId: string) =>
    setRoles((all) =>
      all.map((r) =>
        r.id === roleId ? { ...r, grants: r.grants.includes(permissionId) ? r.grants.filter((p) => p !== permissionId) : [...r.grants, permissionId] } : r,
      ),
    );

  const addCustom = () => {
    if (!baseRole) return;
    const rid = `new-${newCount + 1}`;
    setNewCount((n) => n + 1);
    setRoles((all) => {
      const ownerIndex = all.findIndex((r) => r.locked);
      const next = [...all];
      next.splice(ownerIndex < 0 ? all.length : ownerIndex, 0, {
        id: rid,
        name: t.newRoleName,
        description: interpolate(t.customFrom, { role: baseRole.name }),
        from: baseRole.id,
        grants: [...baseRole.grants],
      });
      return next;
    });
  };

  const fade = reduce ? { duration: 0 } : { duration: 0.22, ease: easeOut };
  const bar = dirty ? "dirty" : justSaved ? "saved" : null;

  return (
    <div className={cn("mx-auto w-full max-w-2xl px-6 py-10 md:px-10", className)}>
      <h1 className="font-semibold text-2xl tracking-tight">{t.title}</h1>
      <p className="mt-1 text-muted-foreground text-sm">{interpolate(t.subtitle, { product })}</p>

      {actionError ? (
        <p className="mt-4 text-destructive-foreground text-sm" role="alert">
          {actionError}
        </p>
      ) : null}

      {onInvite ? (
        <section className="mt-10">
          <h2 className="font-medium text-sm">{t.inviteTitle}</h2>
          <p className="text-muted-foreground text-sm">{t.inviteDescription}</p>
          <form className="mt-3 flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-start" noValidate onSubmit={sendInvite}>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Input
                aria-describedby={inviteError ? `${id}-invite-error` : undefined}
                aria-invalid={inviteError ? true : undefined}
                aria-label={t.email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setInviteError(null);
                }}
                placeholder={t.emailPlaceholder}
                type="email"
                value={email}
              />
              {inviteError ? (
                <p className="px-0.5 text-destructive-foreground text-xs" id={`${id}-invite-error`}>
                  {inviteError}
                </p>
              ) : null}
            </div>
            <div className="flex gap-2">
              <RoleSelect className="flex-1 sm:w-32 sm:flex-none" label={t.roleForInvite} onChange={setInviteRole} roles={savedRoles} value={inviteRole} />
              <Button aria-busy={invite.isPending()} className={press} disabled={!email.trim() || invite.isPending()} type="submit">
                {invite.isPending() ? <Spinner data-icon="inline-start" /> : null}
                {t.invite}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-medium text-sm">{t.membersTitle}</h2>
        <p className="text-muted-foreground text-sm">{interpolate(t.peopleIn, { count: people(members.length), product })}</p>
        <div className="mt-3 overflow-hidden rounded-xl border bg-card">
          <div className="hidden grid-cols-[minmax(0,1fr)_8rem_6.5rem_2rem] items-center gap-4 border-b px-4 py-2.5 font-medium text-muted-foreground text-xs sm:grid">
            <span>{t.columnName}</span>
            <span>{t.columnRole}</span>
            <span>{t.columnLastActive}</span>
            <span className="sr-only">{t.actions}</span>
          </div>
          <ul>
            <AnimatePresence initial={false}>
              {members.map((m) => {
                const role = savedRoles.find((r) => r.id === m.roleId);
                const you = m.id === data.currentUserId;
                const active = lastActive(m);
                return (
                  <motion.li
                    animate={{ opacity: 1, height: "auto" }}
                    className="overflow-hidden border-b last:border-b-0"
                    exit={{ opacity: 0, height: 0 }}
                    initial={false}
                    key={m.id}
                    transition={fade}
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_8rem_6.5rem_2rem]">
                      <div className="flex min-w-0 items-center gap-3">
                        <PersonAvatar hue={m.hue} name={m.name} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-sm">
                            {m.name}
                            {you ? <span className="font-normal text-muted-foreground"> {t.you}</span> : null}
                          </p>
                          <p className="truncate text-muted-foreground text-xs">{m.email}</p>
                        </div>
                      </div>
                      <div className="col-start-1 row-start-2 flex items-center gap-3 ps-11 sm:col-start-auto sm:row-start-auto sm:ps-0">
                        {role?.locked || !onChangeRole ? (
                          <span className="flex h-8 items-center gap-1.5 px-0.5 text-sm sm:h-7">
                            {roleName(m.roleId)}
                            {role?.locked ? <LockIcon className="size-3 text-muted-foreground" /> : null}
                          </span>
                        ) : (
                          <RoleSelect
                            className="w-32"
                            label={interpolate(t.roleFor, { name: m.name })}
                            onChange={(rid) => void changeRole.run({ memberId: m.id, roleId: rid }, m.id)}
                            roles={savedRoles}
                            value={m.roleId}
                          />
                        )}
                        <span className="text-muted-foreground text-xs sm:hidden">{active ?? t.now}</span>
                      </div>
                      <span className="hidden text-muted-foreground text-sm sm:block">
                        {active ?? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-success" />
                            {t.now}
                          </span>
                        )}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              aria-label={interpolate(t.actionsFor, { name: m.name })}
                              className={cn("col-start-2 row-start-1 justify-self-end sm:col-start-auto sm:row-start-auto", press)}
                              size="icon-sm"
                              variant="ghost"
                            />
                          }
                        >
                          {changeRole.isPending(m.id) || removeMember.isPending(m.id) ? <Spinner /> : <EllipsisIcon />}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => void navigator.clipboard?.writeText(m.email)}>
                            <CopyIcon />
                            {t.copyEmail}
                          </DropdownMenuItem>
                          {onRemoveMember ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem disabled={role?.locked || you} onClick={() => setRemoving(m)} variant="destructive">
                                <UserMinusIcon />
                                {role?.locked ? t.ownerCantBeRemoved : t.removeFromWorkspace}
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </div>

        <h3 className="mt-6 flex items-center gap-1.5 font-medium text-muted-foreground text-xs">
          {t.pendingInvites}
          <span className="tabular-nums">{invites.length}</span>
        </h3>
        <div className="mt-2 overflow-hidden rounded-xl border bg-card">
          <ul>
            <AnimatePresence initial={false}>
              {invites.map((inv) => {
                const wasResent = resent.includes(inv.id);
                return (
                  <motion.li
                    animate={{ opacity: 1, height: "auto" }}
                    className="overflow-hidden border-b last:border-b-0"
                    exit={{ opacity: 0, height: 0 }}
                    initial={false}
                    key={inv.id}
                    transition={fade}
                  >
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                      <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-dashed text-muted-foreground">
                          <MailIcon className="size-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-sm">{inv.email}</p>
                          <p className="truncate text-muted-foreground text-xs">
                            {wasResent
                              ? interpolate(t.resentNow, { role: roleName(inv.roleId) })
                              : interpolate(t.invitedBy, { role: roleName(inv.roleId), by: inv.invitedBy, when: format.relative(inv.sentAt) })}
                          </p>
                        </div>
                      </div>
                      <div className="ms-11 flex items-center gap-1.5 sm:ms-auto">
                        {onResendInvite ? (
                          <Button
                            aria-busy={resend.isPending(inv.id)}
                            className={cn("min-w-[5.5rem]", press)}
                            disabled={wasResent || resend.isPending(inv.id)}
                            onClick={() => void resend.run(inv.id, inv.id)}
                            size="sm"
                            variant="outline"
                          >
                            {wasResent ? <CheckIcon className="size-3.5" /> : null}
                            {wasResent ? t.resent : t.resend}
                          </Button>
                        ) : null}
                        {onRevokeInvite ? (
                          <Button
                            aria-busy={revoke.isPending(inv.id)}
                            className={press}
                            disabled={revoke.isPending(inv.id)}
                            onClick={() => void revoke.run(inv.id, inv.id)}
                            size="sm"
                            variant="ghost"
                          >
                            {t.revoke}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
          {invites.length === 0 ? <p className="px-4 py-6 text-center text-muted-foreground text-sm">{t.noInvites}</p> : null}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 className="font-medium text-sm">{t.rolesTitle}</h2>
            <p className="text-pretty text-muted-foreground text-sm">{t.rolesDescription}</p>
          </div>
          {onSaveRoles && baseRole ? (
            <Button className={cn("shrink-0 self-start sm:self-auto", press)} disabled={Boolean(customRole)} onClick={addCustom} size="sm" variant="outline">
              <CopyIcon />
              {interpolate(t.duplicate, { role: baseRole.name })}
            </Button>
          ) : null}
        </div>
        <PermissionMatrix
          areas={data.areas}
          counts={counts}
          draft={draft}
          onRemove={(rid) => setRoles((all) => all.filter((r) => r.id !== rid))}
          onRename={(rid, name) => setRoles((all) => all.map((r) => (r.id === rid ? { ...r, name } : r)))}
          onToggle={onSaveRoles ? toggle : () => {}}
          reduce={reduce}
          roles={onSaveRoles ? roles : roles.map((r) => ({ ...r, locked: true }))}
          saved={saved}
          t={t}
        />
        {onSaveRoles && baseRole ? (
          <p className="mt-2 text-pretty text-muted-foreground text-xs">
            {customRole ? (
              <>
                <span className="-translate-y-px me-1 inline-block size-1.5 rounded-full bg-warning align-middle" />
                {interpolate(t.customHint, { role: customRole.name, from: roleName(customRole.from ?? duplicateFrom) })}
              </>
            ) : (
              interpolate(t.noCustomHint, { role: baseRole.name })
            )}
          </p>
        ) : null}
      </section>

      <div className="sticky bottom-4 z-20 mt-6 flex justify-center">
        <AnimatePresence initial={false} mode="popLayout">
          {bar ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex w-full items-center gap-3 rounded-xl border bg-popover py-2 ps-4 pe-2 shadow-lg/5"
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
              role="status"
              transition={reduce ? { duration: 0 } : spring}
            >
              {bar === "dirty" ? (
                <>
                  <p className="min-w-0 flex-1 truncate text-sm">
                    <span className="sm:hidden">{t.unsavedShort}</span>
                    <span className="hidden sm:inline">{t.unsavedLong}</span>
                    <span className="hidden text-muted-foreground sm:inline">
                      {" "}
                      · {affected === 0 ? t.affectsNone : interpolate(t.affects, { people: people(affected) })}
                    </span>
                  </p>
                  <Button className={press} disabled={saveRoles.isPending()} onClick={() => setRoles(savedRoles)} size="sm" variant="ghost">
                    {t.discard}
                  </Button>
                  <Button
                    aria-busy={saveRoles.isPending()}
                    className={press}
                    disabled={saveRoles.isPending()}
                    onClick={() => void saveRoles.run(roles.filter((r) => !r.locked).map(({ locked: _locked, ...role }) => role))}
                    size="sm"
                  >
                    {saveRoles.isPending() ? <Spinner data-icon="inline-start" /> : null}
                    {t.save}
                  </Button>
                </>
              ) : (
                <p className="flex h-8 items-center gap-2 text-sm sm:h-7">
                  <CheckIcon className="size-4 text-success-foreground" />
                  {t.rolesSaved}
                </p>
              )}
            </motion.div>
          ) : notice ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex max-w-full items-center gap-3 rounded-xl border bg-popover py-1.5 ps-3.5 pe-3.5 text-sm shadow-lg/5"
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
              key={notice.key}
              role="status"
              transition={{ duration: 0.2, ease: easeOut }}
            >
              <p className="min-w-0 truncate">{notice.text}</p>
              <CheckIcon className="size-4 shrink-0 text-success-foreground" />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AlertDialog onOpenChange={(open) => !open && !removeMember.isPending() && setRemoving(null)} open={removing !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{interpolate(t.removeTitle, { name: removing?.name ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{interpolate(t.removeDescription, { product })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMember.isPending()} render={<Button variant="ghost" />}>
              {t.cancel}
            </AlertDialogCancel>
            <Button
              aria-busy={removeMember.isPending()}
              className="text-destructive-foreground"
              disabled={removeMember.isPending()}
              onClick={() => removing && void removeMember.run(removing.id, removing.id)}
              variant="destructive"
            >
              {removeMember.isPending() ? <Spinner data-icon="inline-start" /> : null}
              {t.remove}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function TeamRoles(props: TeamRolesProps) {
  return (
    <ScreenBoundary name="TeamRoles">
      <TeamRolesScreen {...props} />
    </ScreenBoundary>
  );
}
