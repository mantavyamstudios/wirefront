// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@wirefront/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@wirefront/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@wirefront/ui/input-group";
import { cn } from "@wirefront/ui/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@wirefront/ui/sheet";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@wirefront/ui/table";
import { useAction } from "@wirefront/ui/wirefront/action";
import { pageCount, toggleSort, useSelection, withFilter, withPage, withSearch } from "@wirefront/ui/wirefront/list";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus, ListQuery } from "@wirefront/ui/wirefront/types";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  EllipsisIcon,
  FilterIcon,
  KeyRoundIcon,
  LaptopIcon,
  LogInIcon,
  MailIcon,
  SearchIcon,
  SendIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  UserCogIcon,
  UserMinusIcon,
  UserPlusIcon,
  UserRoundCheckIcon,
  UserRoundXIcon,
  XIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";

import type {
  AdminActivityKind,
  AdminRole,
  AdminStatus,
  AdminSummary,
  AdminUser,
  AdminUserDetails,
  AssignableAdminRole,
  InviteAdminRole,
  InviteMembersInput,
  RoleChangeInput,
} from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("adminUsers.<key>"). */
export const ADMIN_USERS_MESSAGES = {
  title: "Members",
  subtitle: "Manage who can access {org} and what they can do.",
  invite: "Invite members",
  overview: "Overview",
  seats: "Seats",
  seatsLeft: "{count} left",
  ofSeats: "of {total}",
  invites: "Invites",
  pendingInvites: "Pending invites",
  invitesExpire: "Invites expire after 14 days",
  twoFactorShort: "2FA",
  twoFactorCoverage: "Two-factor coverage",
  withoutTwoFactorOne: "1 active member without 2FA",
  withoutTwoFactor: "{count} active members without 2FA",
  statusFilter: "Status",
  all: "All",
  active: "Active",
  invited: "Invited",
  suspended: "Suspended",
  search: "Search members",
  searchPlaceholder: "Name, email or team",
  filter: "Filter",
  filterActive: "Filter, {count} active",
  role: "Role",
  security: "Security",
  twoFactorOffFilter: "Two-factor off",
  removeFilter: "Remove filter: {name}",
  rolePrefix: "Role:",
  twoFactorOffChip: "2FA off",
  clearAll: "Clear all",
  selectAll: "Select all members on this page",
  select: "Select {name}",
  memberCount: "{count} members",
  member: "Member",
  status: "Status",
  twoFactor: "2FA",
  teams: "Teams",
  lastActive: "Last active",
  actions: "Actions",
  actionsFor: "Actions for {name}",
  roleFor: "Role for {name}: {role}",
  you: "you",
  notJoined: "Hasn’t joined yet",
  sentOn: "Sent {date}",
  never: "Never",
  noTeams: "No teams",
  on: "On",
  off: "Off",
  owner: "Owner",
  ownerHint: "Full control, including billing and deleting the org.",
  admin: "Admin",
  adminHint: "Manage members, settings and integrations.",
  memberRole: "Member",
  memberHint: "Create and edit projects they’re added to.",
  viewer: "Viewer",
  viewerHint: "Read-only access. Free, doesn’t use a seat.",
  billing: "Billing",
  billingHint: "Invoices and payment methods only.",
  viewDetails: "View details",
  resendInvite: "Resend invite",
  suspend: "Suspend",
  reactivate: "Reactivate",
  revokeInvite: "Revoke invite",
  removeFromOrg: "Remove from org",
  noMatch: "Nobody matches “{query}”",
  noMatchHint: "Search works on names, emails and teams.",
  noFiltered: "No members match these filters",
  noFilteredHint: "Try removing a filter.",
  showEveryone: "Show everyone",
  errorTitle: "Couldn’t load members",
  retry: "Try again",
  range: "{from}–{to} of {total}",
  pagination: "Pagination",
  previous: "Previous page",
  next: "Next page",
  bulkActions: "Bulk actions",
  selected: "selected",
  changeRoleTo: "Change role to",
  resend: "Resend",
  remove: "Remove",
  revoke: "Revoke",
  clearSelection: "Clear selection",
  roleChanged: "{name} is now {role}",
  rolesChanged: "{count} members are now {role}",
  inviteResent: "Invite resent to {email}",
  invitesResent: "{count} invites resent",
  suspendedOne: "{name} suspended. Sessions signed out.",
  suspendedMany: "{count} suspended. Their sessions were signed out.",
  reactivatedOne: "{name} reactivated",
  reactivatedMany: "{count} reactivated",
  removedOne: "Member removed. Their work stays in the projects.",
  removedMany: "{count} members removed",
  invitesSentOne: "1 invite sent",
  invitesSent: "{count} invites sent",
  details: "Member details",
  joined: "Joined",
  invitedLabel: "Invited",
  twoFactorLabel: "Two-factor",
  location: "Location",
  devices: "Signed-in devices",
  activeNow: "Active now",
  activity: "Activity",
  loadingDetails: "Loading details",
  detailsError: "Couldn’t load devices and activity.",
  confirmTitleOne: "Remove {name}?",
  confirmTitleMany: "Remove {count} members?",
  confirmBodyOne: "They lose access right away and their seat is freed. Projects and comments they made stay put.",
  confirmBodyMany: "They all lose access right away and their seats are freed. Projects and comments they made stay put.",
  cancel: "Cancel",
  dismiss: "Dismiss",
  inviteTitle: "Invite members",
  inviteSub: "They’ll get an email with a link that works for 14 days.",
  emails: "Email addresses",
  addAnother: "Add another",
  emailPlaceholder: "name@company.com",
  removeEmail: "Remove {email}",
  badEmailOne: "“{email}” doesn’t look like an email. Remove or fix it.",
  badEmailMany: "{count} addresses don’t look right. Remove or fix them.",
  emailHelp: "Separate addresses with commas or paste a list.",
  overSeats: "Only {count} seats left. Add seats or invite as viewers.",
  usesSeats: "Uses {count} of {left} remaining seats",
  seatsRemaining: "{count} seats left",
  viewersFree: "Viewers are free",
  sendOne: "Send invite",
  sendMany: "Send {count} invites",
  genericError: "Something went wrong. Try again.",
};

type Messages = typeof ADMIN_USERS_MESSAGES;

export type AdminUserFilters = {
  status: AdminStatus;
  role: AdminRole[];
  twoFactor: "off";
};

/** Search, filters, sort and page; send it to your API (see `AdminUsersQuery` in schema.ts). */
export type AdminUsersListQuery = ListQuery<AdminUserFilters>;

export interface AdminUsersProps {
  /** The current page of people. */
  users: AdminUser[];
  /** People matching the query across all pages. */
  total: number;
  /** Org-wide numbers for the overview strip and the tabs. */
  summary: AdminSummary;
  query: AdminUsersListQuery;
  /** Called when the user searches, filters, sorts or pages. Fetch the new page and pass it back in. */
  onQueryChange: (query: AdminUsersListQuery) => void;
  /** "loading" shows skeleton rows; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  orgName: string;
  /** The signed-in admin; their own row can't be selected or changed. */
  currentUserId: string;
  /** Devices and activity for the details drawer; those sections are hidden without it. */
  loadDetails?: (id: string) => Promise<AdminUserDetails>;
  /** The Invite button only shows when this is given. */
  onInvite?: Action<InviteMembersInput>;
  /** Applied at once and rolled back if it fails. */
  onRoleChange?: Action<RoleChangeInput>;
  onSuspend?: Action<string[]>;
  onReactivate?: Action<string[]>;
  onResendInvite?: Action<string[]>;
  /** Removes people or revokes invitations, after the user confirms. */
  onRemove?: Action<string[]>;
  className?: string;
}

const spring = { type: "spring", stiffness: 520, damping: 46, mass: 1 } as const;
const easeOut = [0.23, 1, 0.32, 1] as const;
const press = "transition-[color,background-color,box-shadow,scale] duration-150 ease-out active:scale-[0.97]";
const ring = "outline-none focus-visible:ring-2 focus-visible:ring-ring";
const hit = "relative after:absolute after:-inset-3 after:content-['']";
const menuPop =
  "transition-[opacity,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 data-ending-style:duration-100";
const barSurface = "rounded-full bg-primary text-primary-foreground shadow-lg/15 dark:border dark:bg-popover dark:text-popover-foreground dark:shadow-lg/40";
const barButton = cn(
  "flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 outline-none hover:bg-primary-foreground/12 focus-visible:ring-2 focus-visible:ring-primary-foreground/40 data-popup-open:bg-primary-foreground/12 dark:data-popup-open:bg-accent dark:focus-visible:ring-ring dark:hover:bg-accent",
  press,
);

const ROLES: AdminRole[] = ["owner", "admin", "member", "viewer", "billing"];
const ASSIGNABLE: AssignableAdminRole[] = ["admin", "member", "viewer", "billing"];
const INVITE_ROLES: InviteAdminRole[] = ["admin", "member", "viewer"];
const STATUS_TABS = ["all", "active", "invited", "suspended"] as const;
type StatusTab = (typeof STATUS_TABS)[number];
const SKELETON_ROWS = ["s1", "s2", "s3", "s4", "s5", "s6"];

const ROLE_PILL: Record<AdminRole, string> = {
  owner: "bg-violet-500/10 text-violet-700 dark:bg-violet-400/16 dark:text-violet-300",
  admin: "bg-sky-500/10 text-sky-700 dark:bg-sky-400/16 dark:text-sky-300",
  member: "bg-muted text-foreground/80",
  viewer: "bg-transparent text-muted-foreground ring-1 ring-border ring-inset",
  billing: "bg-amber-500/12 text-amber-800 dark:bg-amber-400/16 dark:text-amber-300",
};

const STATUS_LOOK: Record<AdminStatus, { dot: string; text: string }> = {
  active: { dot: "bg-success", text: "text-foreground" },
  invited: { dot: "bg-info", text: "text-info-foreground" },
  suspended: { dot: "bg-destructive", text: "text-destructive-foreground" },
};

const ACTIVITY_ICON: Record<AdminActivityKind, ReactNode> = {
  signin: <LogInIcon />,
  role: <UserCogIcon />,
  key: <KeyRoundIcon />,
  join: <UserRoundCheckIcon />,
  invite: <MailIcon />,
  suspend: <UserRoundXIcon />,
  "2fa": <ShieldCheckIcon />,
};

const AVATAR_TONES = [
  "bg-orange-500/16 text-orange-800 dark:bg-orange-400/18 dark:text-orange-200",
  "bg-teal-500/16 text-teal-800 dark:bg-teal-400/18 dark:text-teal-200",
  "bg-violet-500/16 text-violet-800 dark:bg-violet-400/18 dark:text-violet-200",
  "bg-sky-500/16 text-sky-800 dark:bg-sky-400/18 dark:text-sky-200",
  "bg-rose-500/16 text-rose-800 dark:bg-rose-400/18 dark:text-rose-200",
  "bg-amber-500/20 text-amber-900 dark:bg-amber-400/18 dark:text-amber-200",
  "bg-emerald-500/16 text-emerald-800 dark:bg-emerald-400/18 dark:text-emerald-200",
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function useReducedMotionAfterMount() {
  const prefers = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && Boolean(prefers);
}

function initials(u: AdminUser) {
  return (u.name || u.email)
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function hashIndex(s: string, n: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % n;
}

const nameOf = (u: AdminUser) => u.name || u.email;

function UserAvatar({ user, size = 8 }: { user: AdminUser; size?: 7 | 8 | 14 }) {
  const sizes = { 7: "[--avatar-size:--spacing(7)]", 8: "[--avatar-size:--spacing(8)]", 14: "[--avatar-size:--spacing(14)]" };
  return (
    <Avatar className={cn(sizes[size], user.status === "suspended" && "opacity-80 grayscale")}>
      <AvatarFallback className={cn("font-semibold", AVATAR_TONES[hashIndex(user.email, AVATAR_TONES.length)])}>{initials(user)}</AvatarFallback>
    </Avatar>
  );
}

function RolePill({ role, label }: { role: AdminRole; label: string }) {
  const reduce = useReducedMotionAfterMount();
  return (
    <motion.span
      animate={{ opacity: 1, scale: 1 }}
      className={cn("inline-flex h-6 items-center rounded-full px-2.5 font-medium text-xs", ROLE_PILL[role])}
      initial={reduce ? { opacity: 0.6 } : { opacity: 0.6, scale: 0.95 }}
      key={role}
      transition={{ duration: 0.18, ease: easeOut }}
    >
      {label}
    </motion.span>
  );
}

function StatusTag({ status, label }: { status: AdminStatus; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", STATUS_LOOK[status].text)}>
      <span className={cn("size-1.5 rounded-full", STATUS_LOOK[status].dot)} />
      {label}
    </span>
  );
}

const noAction = async () => {};

interface Local {
  source: AdminUser[];
  patch: Record<string, Partial<AdminUser>>;
  removed: ReadonlySet<string>;
}

export function AdminUsers({
  users,
  total,
  summary,
  query,
  onQueryChange,
  status = "ready",
  error,
  onRetry,
  orgName,
  currentUserId,
  loadDetails,
  onInvite,
  onRoleChange,
  onSuspend,
  onReactivate,
  onResendInvite,
  onRemove,
  className,
}: AdminUsersProps) {
  const t = useMessages("adminUsers", ADMIN_USERS_MESSAGES);
  const format = useFormat();
  const reduce = useReducedMotionAfterMount();
  const ids = useId();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [confirm, setConfirm] = useState<string[] | null>(null);
  const [notice, setNotice] = useState<{ id: number; text: string; error?: boolean } | null>(null);
  const counter = useRef(0);

  const say = (text: string, isError = false) => {
    counter.current += 1;
    setNotice({ id: counter.current, text, error: isError });
  };
  const sayError = (message: string) => say(message, true);

  useEffect(() => {
    if (!notice || notice.error) return;
    const timer = setTimeout(() => setNotice(null), 3200);
    return () => clearTimeout(timer);
  }, [notice]);

  // Optimistic changes sit on top of the page the builder passed in, until a new page arrives.
  const [local, setLocal] = useState<Local>({ source: users, patch: {}, removed: new Set() });
  if (local.source !== users) setLocal({ source: users, patch: {}, removed: new Set() });
  const patchMany = (list: string[], patch: Partial<AdminUser>) => {
    const before = local.patch;
    setLocal((l) => ({ ...l, patch: { ...l.patch, ...Object.fromEntries(list.map((id) => [id, { ...l.patch[id], ...patch }])) } }));
    return () => setLocal((l) => ({ ...l, patch: before }));
  };

  const rows = users.filter((u) => !local.removed.has(u.id)).map((u) => (local.patch[u.id] ? { ...u, ...local.patch[u.id] } : u));
  const byId = (id: string) => rows.find((u) => u.id === id);
  const roleLabel = (r: AdminRole) => (r === "member" ? t.memberRole : t[r]);
  const statusLabel = (s: AdminStatus) => t[s];
  const nameFor = (id = "") => {
    const u = byId(id);
    return u ? nameOf(u) : "";
  };
  const many = (list: string[], one: string, several: string) =>
    list.length === 1 ? interpolate(one, { name: nameFor(list[0]) }) : interpolate(several, { count: list.length });

  const roleChange = useAction(onRoleChange ?? noAction, {
    optimistic: ({ ids: list, role }) => patchMany(list, { role }),
    onSuccess: (_, { ids: list, role }) =>
      say(interpolate(list.length === 1 ? t.roleChanged : t.rolesChanged, { name: nameFor(list[0]), count: list.length, role: roleLabel(role).toLowerCase() })),
    onError: sayError,
  });
  const suspend = useAction(onSuspend ?? noAction, {
    optimistic: (list) => patchMany(list, { status: "suspended" }),
    onSuccess: (_, list) => say(many(list, t.suspendedOne, t.suspendedMany)),
    onError: sayError,
  });
  const reactivate = useAction(onReactivate ?? noAction, {
    optimistic: (list) => patchMany(list, { status: "active" }),
    onSuccess: (_, list) => say(many(list, t.reactivatedOne, t.reactivatedMany)),
    onError: sayError,
  });
  const resend = useAction(onResendInvite ?? noAction, {
    onSuccess: (_, list) =>
      say(list.length === 1 ? interpolate(t.inviteResent, { email: byId(list[0] ?? "")?.email ?? "" }) : interpolate(t.invitesResent, { count: list.length })),
    onError: sayError,
  });
  const remove = useAction(onRemove ?? noAction, {
    onSuccess: (_, list) => {
      setLocal((l) => ({ ...l, removed: new Set([...l.removed, ...list]) }));
      if (detailId && list.includes(detailId)) setDetailId(null);
      say(list.length === 1 ? t.removedOne : interpolate(t.removedMany, { count: list.length }));
    },
    onError: sayError,
  });

  const selectable = rows.filter((u) => u.id !== currentUserId).map((u) => u.id);
  const selection = useSelection(selectable);
  const selectedRows = rows.filter((u) => selection.isSelected(u.id));
  const changeable = selectedRows.filter((u) => u.role !== "owner").map((u) => u.id);
  const selectedInvited = selectedRows.filter((u) => u.status === "invited").map((u) => u.id);
  const selectedActive = selectedRows.filter((u) => u.status === "active" && u.role !== "owner").map((u) => u.id);

  const tab: StatusTab = query.filters?.status ?? "all";
  const roleFilter = query.filters?.role ?? [];
  const no2fa = query.filters?.twoFactor === "off";
  const search = query.search?.trim() ?? "";
  const filterCount = roleFilter.length + (no2fa ? 1 : 0);
  const pages = pageCount(query, total);
  const from = total === 0 ? 0 : (query.page - 1) * query.pageSize + 1;
  const to = Math.min(query.page * query.pageSize, total);
  const seatsLeft = Math.max(0, summary.seats - summary.seatsUsed);
  const active = summary.counts.active;
  const twoFaPct = active ? Math.round(((active - summary.activeWithoutTwoFactor) / active) * 100) : 0;
  const detail = detailId ? (byId(detailId) ?? null) : null;

  const setRoleFilter = (next: AdminRole[]) => onQueryChange(withFilter(query, "role", next));
  const setNo2fa = (on: boolean) => onQueryChange(withFilter(query, "twoFactor", on ? "off" : undefined));
  const setTab = (next: StatusTab) => {
    selection.clear();
    onQueryChange(withFilter(query, "status", next === "all" ? undefined : next));
  };
  const showEveryone = () => onQueryChange({ page: 1, pageSize: query.pageSize, sort: query.sort });

  const lastActive = (u: AdminUser) => (u.lastActiveAt ? format.relative(u.lastActiveAt) : t.never);
  const shortDate = (iso: string) => format.date(iso, { month: "short", day: "numeric", year: "numeric" });

  const sortHeader = (id: "name" | "lastActiveAt", text: string) => {
    const dir = query.sort?.id === id ? query.sort.direction : undefined;
    return (
      <button
        className={cn("-mx-1 inline-flex cursor-pointer items-center gap-1 rounded px-1 hover:text-foreground", ring)}
        onClick={() => onQueryChange(toggleSort(query, id))}
        type="button"
      >
        {text}
        {dir === "asc" ? <ArrowUpIcon className="size-3" /> : dir === "desc" ? <ArrowDownIcon className="size-3" /> : null}
      </button>
    );
  };
  const ariaSort = (id: string) =>
    query.sort?.id === id ? (query.sort.direction === "asc" ? ("ascending" as const) : ("descending" as const)) : ("none" as const);

  const roleMenu = (u: AdminUser) =>
    u.role === "owner" || u.id === currentUserId || !onRoleChange ? (
      <RolePill label={roleLabel(u.role)} role={u.role} />
    ) : (
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={interpolate(t.roleFor, { name: nameOf(u), role: roleLabel(u.role) })}
          className={cn("group/role relative inline-flex cursor-pointer items-center gap-1 rounded-full after:absolute after:-inset-x-1 after:-inset-y-2 after:content-['']", ring)}
        >
          <RolePill label={roleLabel(u.role)} role={u.role} />
          <ChevronDownIcon className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover/role:opacity-100 group-data-popup-open/role:opacity-100 pointer-coarse:opacity-100" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={cn("w-64", menuPop)}>
          <DropdownMenuRadioGroup onValueChange={(v) => roleChange.run({ ids: [u.id], role: v as AssignableAdminRole }, u.id)} value={u.role}>
            {ASSIGNABLE.map((r) => (
              <DropdownMenuRadioItem key={r} value={r}>
                <span className="flex flex-col py-0.5">
                  <span className="font-medium">{roleLabel(r)}</span>
                  <span className="text-pretty text-muted-foreground text-xs">{t[`${r}Hint`]}</span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );

  const rowMenu = (u: AdminUser) =>
    u.id === currentUserId ? (
      <span className="block size-8" />
    ) : (
      <DropdownMenu>
        <DropdownMenuTrigger aria-label={interpolate(t.actionsFor, { name: nameOf(u) })} render={<Button className={press} size="icon-sm" variant="ghost" />}>
          <EllipsisIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={cn("w-48", menuPop)}>
          <DropdownMenuItem onClick={() => setDetailId(u.id)}>
            <UserCogIcon /> {t.viewDetails}
          </DropdownMenuItem>
          {u.status === "invited" && onResendInvite ? (
            <DropdownMenuItem onClick={() => resend.run([u.id])}>
              <SendIcon /> {t.resendInvite}
            </DropdownMenuItem>
          ) : null}
          {u.status === "active" && u.role !== "owner" && onSuspend ? (
            <DropdownMenuItem onClick={() => suspend.run([u.id])}>
              <UserRoundXIcon /> {t.suspend}
            </DropdownMenuItem>
          ) : null}
          {u.status === "suspended" && onReactivate ? (
            <DropdownMenuItem onClick={() => reactivate.run([u.id])}>
              <UserRoundCheckIcon /> {t.reactivate}
            </DropdownMenuItem>
          ) : null}
          {u.role !== "owner" && onRemove ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setConfirm([u.id])} variant="destructive">
                <UserMinusIcon /> {u.status === "invited" ? t.revokeInvite : t.removeFromOrg}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    );

  const teamChips = (u: AdminUser, all = false) =>
    u.teams.length === 0 ? (
      <span className="text-muted-foreground text-xs">{t.noTeams}</span>
    ) : (
      <span className={cn("flex min-w-0 items-center gap-1", all && "flex-wrap")}>
        {(all ? u.teams : u.teams.slice(0, 2)).map((team) => (
          <span className="truncate rounded-md border px-1.5 py-0.5 text-muted-foreground text-xs" key={team}>
            {team}
          </span>
        ))}
        {!all && u.teams.length > 2 && <span className="text-muted-foreground text-xs tabular-nums">+{u.teams.length - 2}</span>}
      </span>
    );

  const twoFa = (u: AdminUser) =>
    u.status === "invited" ? (
      <span className="text-muted-foreground text-xs">—</span>
    ) : u.twoFactor ? (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <ShieldCheckIcon className="size-3.5 text-success-foreground" /> {t.on}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-warning-foreground text-xs">
        <ShieldAlertIcon className="size-3.5" /> {t.off}
      </span>
    );

  const checkbox = (u: AdminUser) =>
    u.id === currentUserId ? (
      <span className="size-4 shrink-0" />
    ) : (
      <Checkbox aria-label={interpolate(t.select, { name: nameOf(u) })} checked={selection.isSelected(u.id)} className={hit} onCheckedChange={() => selection.toggle(u.id)} />
    );

  const nameButton = (u: AdminUser) => (
    <button className={cn("flex w-fit max-w-full cursor-pointer items-center gap-1.5 truncate rounded text-left font-medium hover:underline", ring)} onClick={() => setDetailId(u.id)} type="button">
      <span className="truncate">{nameOf(u)}</span>
      {u.id === currentUserId && <span className="font-normal text-muted-foreground text-xs">{t.you}</span>}
    </button>
  );

  let list: ReactNode;
  if (status === "loading") {
    list = (
      <ul aria-busy className="divide-y">
        {SKELETON_ROWS.map((key) => (
          <li className="flex items-center gap-3 px-4 py-3" key={key}>
            <Skeleton className="size-8 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
          </li>
        ))}
      </ul>
    );
  } else if (status === "error") {
    list = (
      <div className="flex flex-col items-center gap-1 px-6 py-14 text-center">
        <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive-foreground">
          <CircleAlertIcon className="size-4.5" />
        </span>
        <p className="font-medium">{t.errorTitle}</p>
        {error ? <p className="text-pretty text-muted-foreground text-xs">{error}</p> : null}
        {onRetry ? (
          <Button className={cn("mt-3", press)} onClick={onRetry} size="sm" variant="outline">
            {t.retry}
          </Button>
        ) : null}
      </div>
    );
  } else if (rows.length === 0) {
    list = (
      <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
        <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          {search ? <SearchIcon className="size-4.5" /> : <FilterIcon className="size-4.5" />}
        </span>
        <div className="flex max-w-72 flex-col gap-1">
          <span className="text-balance font-medium">{search ? interpolate(t.noMatch, { query: search }) : t.noFiltered}</span>
          <span className="text-pretty text-muted-foreground text-xs">{search ? t.noMatchHint : t.noFilteredHint}</span>
        </div>
        <Button className={press} onClick={showEveryone} size="sm" variant="outline">
          {t.showEveryone}
        </Button>
      </div>
    );
  } else {
    list = (
      <>
        <div className="@3xl:hidden">
          <div className="flex items-center gap-3 border-b px-4 py-2.5 text-muted-foreground text-xs">
            <Checkbox
              aria-label={t.selectAll}
              checked={selection.allSelected}
              className={hit}
              indeterminate={selection.someSelected}
              onCheckedChange={selection.toggleAll}
            />
            <span className="flex-1 font-medium tabular-nums">{interpolate(t.memberCount, { count: total })}</span>
            {sortHeader("lastActiveAt", t.lastActive)}
          </div>
          <ul className="divide-y">
            {rows.map((u) => (
              <li className={cn("flex items-center gap-3 px-4 py-3 transition-colors", selection.isSelected(u.id) && "bg-accent/60")} key={u.id}>
                {checkbox(u)}
                <button className={cn("flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg text-left", ring)} onClick={() => setDetailId(u.id)} type="button">
                  <UserAvatar user={u} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-1.5 truncate font-medium">
                      <span className="truncate">{nameOf(u)}</span>
                      {u.id === currentUserId && <span className="font-normal text-muted-foreground text-xs">{t.you}</span>}
                    </span>
                    <span className="flex items-center gap-2 text-muted-foreground text-xs">
                      <StatusTag label={statusLabel(u.status)} status={u.status} />
                      <span aria-hidden>·</span>
                      <span className="truncate tabular-nums">{u.status === "invited" ? interpolate(t.sentOn, { date: shortDate(u.joinedAt) }) : lastActive(u)}</span>
                    </span>
                  </span>
                </button>
                <RolePill label={roleLabel(u.role)} role={u.role} />
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden @3xl:block">
          <Table className="min-w-[860px] table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/30 text-muted-foreground text-xs not-in-data-[variant=card]:hover:bg-muted/30 dark:not-in-data-[variant=card]:hover:bg-muted/30 [&_th]:h-9 [&_th]:font-medium [&_th]:text-muted-foreground [&_th]:text-xs">
                <TableHead aria-sort={ariaSort("name")} className="ps-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      aria-label={t.selectAll}
                      checked={selection.allSelected}
                      className={hit}
                      indeterminate={selection.someSelected}
                      onCheckedChange={selection.toggleAll}
                    />
                    {sortHeader("name", t.member)}
                  </div>
                </TableHead>
                <TableHead className="w-32">{t.role}</TableHead>
                <TableHead className="w-28">{t.status}</TableHead>
                <TableHead className="w-20">{t.twoFactor}</TableHead>
                <TableHead className="w-44">{t.teams}</TableHead>
                <TableHead aria-sort={ariaSort("lastActiveAt")} className="w-32">
                  {sortHeader("lastActiveAt", t.lastActive)}
                </TableHead>
                <TableHead className="w-14 pe-3">
                  <span className="sr-only">{t.actions}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow data-state={selection.isSelected(u.id) ? "selected" : undefined} key={u.id}>
                  <TableCell className="py-2.5 ps-4">
                    <div className="flex min-w-0 items-center gap-3">
                      {checkbox(u)}
                      <UserAvatar user={u} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        {nameButton(u)}
                        <span className="truncate text-muted-foreground text-xs">{u.name ? u.email : t.notJoined}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{roleMenu(u)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <StatusTag label={statusLabel(u.status)} status={u.status} />
                      {u.status === "invited" && <span className="text-muted-foreground text-xs">{interpolate(t.sentOn, { date: shortDate(u.joinedAt) })}</span>}
                    </div>
                  </TableCell>
                  <TableCell>{twoFa(u)}</TableCell>
                  <TableCell>{teamChips(u)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs tabular-nums">{lastActive(u)}</TableCell>
                  <TableCell className="pe-3 text-right">{rowMenu(u)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }

  const confirmRows = (confirm ?? []).map(byId).filter((u): u is AdminUser => !!u);

  return (
    <div className={cn("@container relative isolate flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-background text-foreground text-sm", className)}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 px-4 pt-5 pb-28 @3xl:px-6 @3xl:pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h2 className="text-balance font-heading font-semibold text-xl tracking-tight">{t.title}</h2>
              <p className="text-pretty text-muted-foreground">{interpolate(t.subtitle, { org: orgName })}</p>
            </div>
            {onInvite ? (
              <Button className={press} onClick={() => setInviting(true)}>
                <UserPlusIcon /> {t.invite}
              </Button>
            ) : null}
          </div>

          <section aria-label={t.overview} className="grid grid-cols-3 divide-x overflow-hidden rounded-xl border bg-card">
            <div className="flex min-w-0 flex-col gap-2 p-3 @xl:gap-2.5 @xl:px-4 @xl:py-3.5">
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground text-xs">{t.seats}</span>
                <span className="hidden text-muted-foreground text-xs tabular-nums @xl:inline">{interpolate(t.seatsLeft, { count: seatsLeft })}</span>
              </div>
              <span className="font-heading font-semibold text-lg tabular-nums">
                {summary.seatsUsed} <span className="font-normal text-muted-foreground text-sm">{interpolate(t.ofSeats, { total: summary.seats })}</span>
              </span>
              <span aria-hidden className="block h-1.5 overflow-hidden rounded-full bg-muted">
                <span
                  className={cn("block h-full rounded-full transition-[width] duration-300", summary.seatsUsed / Math.max(1, summary.seats) > 0.9 ? "bg-warning" : "bg-primary")}
                  style={{ width: `${Math.min(100, (summary.seatsUsed / Math.max(1, summary.seats)) * 100)}%` }}
                />
              </span>
            </div>
            <button
              className={cn("flex min-w-0 cursor-pointer flex-col gap-2 p-3 text-left transition-colors duration-150 @xl:gap-2.5 @xl:px-4 @xl:py-3.5 [@media(hover:hover)]:hover:bg-accent/40", ring, "focus-visible:ring-inset")}
              onClick={() => setTab("invited")}
              type="button"
            >
              <span className="truncate text-muted-foreground text-xs">
                <span className="@xl:hidden">{t.invites}</span>
                <span className="hidden @xl:inline">{t.pendingInvites}</span>
              </span>
              <span className="font-heading font-semibold text-lg tabular-nums">{summary.counts.invited}</span>
              <span className="hidden text-muted-foreground text-xs @xl:block">{t.invitesExpire}</span>
            </button>
            <button
              className={cn("flex min-w-0 cursor-pointer flex-col gap-2 p-3 text-left transition-colors duration-150 @xl:gap-2.5 @xl:px-4 @xl:py-3.5 [@media(hover:hover)]:hover:bg-accent/40", ring, "focus-visible:ring-inset")}
              onClick={() => {
                selection.clear();
                onQueryChange(withFilter(withFilter(query, "status", "active"), "twoFactor", "off"));
              }}
              type="button"
            >
              <span className="truncate text-muted-foreground text-xs">
                <span className="@xl:hidden">{t.twoFactorShort}</span>
                <span className="hidden @xl:inline">{t.twoFactorCoverage}</span>
              </span>
              <span className="flex items-center gap-2 font-heading font-semibold text-lg tabular-nums">
                {format.number(twoFaPct / 100, { style: "percent" })}
                {twoFaPct < 100 && <ShieldAlertIcon className="size-4 text-warning-foreground" />}
              </span>
              <span className="hidden text-muted-foreground text-xs @xl:block">
                {summary.activeWithoutTwoFactor === 1 ? t.withoutTwoFactorOne : interpolate(t.withoutTwoFactor, { count: summary.activeWithoutTwoFactor })}
              </span>
            </button>
          </section>

          <div className="flex flex-col gap-3 @4xl:flex-row @4xl:items-center">
            <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] @3xl:-mx-6 @3xl:px-6 @4xl:mx-0 @4xl:px-0">
              <fieldset className="relative flex w-fit items-center gap-0.5 rounded-lg bg-muted p-0.5">
                <legend className="sr-only">{t.statusFilter}</legend>
                {STATUS_TABS.map((value) => (
                  <button
                    aria-pressed={tab === value}
                    className={cn("relative flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2.5 font-medium", ring)}
                    key={value}
                    onClick={() => setTab(value)}
                    type="button"
                  >
                    {tab === value && (
                      <motion.span className="absolute inset-0 rounded-md bg-background shadow-xs/5 dark:bg-input" layoutId={`${ids}-tab`} transition={reduce ? { duration: 0 } : spring} />
                    )}
                    <span className={cn("relative transition-colors", tab === value ? "text-foreground" : "text-muted-foreground")}>{t[value]}</span>
                    <span className={cn("relative text-xs tabular-nums", tab === value ? "text-foreground/70" : "text-muted-foreground")}>{summary.counts[value]}</span>
                  </button>
                ))}
              </fieldset>
            </div>
            <div className="flex gap-2 @4xl:ms-auto">
              <InputGroup className="@4xl:w-60">
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                  aria-label={t.search}
                  onChange={(e) => onQueryChange(withSearch(query, e.target.value))}
                  placeholder={t.searchPlaceholder}
                  type="search"
                  value={query.search ?? ""}
                />
              </InputGroup>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={filterCount ? interpolate(t.filterActive, { count: filterCount }) : t.filter}
                  render={<Button className={cn("relative", press)} variant="outline" />}
                >
                  <FilterIcon />
                  <span className="hidden @md:inline">{t.filter}</span>
                  {filterCount > 0 ? (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 font-medium text-[10px] text-primary-foreground tabular-nums ring-2 ring-background">
                      {filterCount}
                    </span>
                  ) : null}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={cn("w-52", menuPop)}>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>{t.role}</DropdownMenuLabel>
                    {ROLES.map((r) => (
                      <DropdownMenuCheckboxItem
                        checked={roleFilter.includes(r)}
                        key={r}
                        onCheckedChange={(on) => setRoleFilter(on ? [...roleFilter, r] : roleFilter.filter((x) => x !== r))}
                      >
                        {roleLabel(r)}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>{t.security}</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem checked={no2fa} onCheckedChange={(on) => setNo2fa(on)}>
                      {t.twoFactorOffFilter}
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {filterCount > 0 ? (
            <div className="-mt-2 flex flex-wrap items-center gap-1.5 pt-0.5">
              {roleFilter.map((r) => (
                <button
                  aria-label={interpolate(t.removeFilter, { name: `${t.rolePrefix} ${roleLabel(r)}` })}
                  className={cn("flex h-7 cursor-pointer items-center gap-1 rounded-full border bg-background ps-2.5 pe-1.5 text-xs hover:bg-accent dark:bg-input/32", ring, press)}
                  key={r}
                  onClick={() => setRoleFilter(roleFilter.filter((x) => x !== r))}
                  type="button"
                >
                  <span className="text-muted-foreground">{t.rolePrefix}</span> {roleLabel(r)}
                  <XIcon className="size-3.5 text-muted-foreground" />
                </button>
              ))}
              {no2fa ? (
                <button
                  aria-label={interpolate(t.removeFilter, { name: t.twoFactorOffChip })}
                  className={cn("flex h-7 cursor-pointer items-center gap-1 rounded-full border bg-background ps-2.5 pe-1.5 text-xs hover:bg-accent dark:bg-input/32", ring, press)}
                  onClick={() => setNo2fa(false)}
                  type="button"
                >
                  {t.twoFactorOffChip}
                  <XIcon className="size-3.5 text-muted-foreground" />
                </button>
              ) : null}
              <Button className={press} onClick={() => onQueryChange(withFilter(withFilter(query, "role", undefined), "twoFactor", undefined))} size="xs" variant="ghost">
                {t.clearAll}
              </Button>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border bg-card">{list}</div>

          {status === "ready" && pages > 1 ? (
            <nav aria-label={t.pagination} className="-mt-2 flex items-center justify-end gap-2 text-muted-foreground text-xs">
              <span className="tabular-nums">{interpolate(t.range, { from, to, total })}</span>
              <Button aria-label={t.previous} disabled={query.page <= 1} onClick={() => onQueryChange(withPage(query, query.page - 1, total))} size="icon-sm" variant="outline">
                <ChevronLeftIcon />
              </Button>
              <Button aria-label={t.next} disabled={query.page >= pages} onClick={() => onQueryChange(withPage(query, query.page + 1, total))} size="icon-sm" variant="outline">
                <ChevronRightIcon />
              </Button>
            </nav>
          ) : null}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center px-3">
        <AnimatePresence initial={false} mode="popLayout">
          {selection.selected.size > 0 && !detail ? (
            <motion.div
              animate={{ y: 0, opacity: 1, scale: 1 }}
              aria-label={t.bulkActions}
              className={cn(barSurface, "pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto p-1 [scrollbar-width:none]")}
              exit={{ y: 8, opacity: 0, scale: 0.97, transition: { duration: 0.12, ease: easeOut } }}
              initial={reduce ? { opacity: 0 } : { y: 16, opacity: 0, scale: 0.96 }}
              key="bulk"
              role="toolbar"
              transition={reduce ? { duration: 0.15 } : spring}
            >
              <span className="flex h-8 shrink-0 items-center gap-2 ps-2.5 pe-1.5 font-medium">
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-foreground px-1.5 text-primary text-xs tabular-nums dark:bg-primary dark:text-primary-foreground">
                  {selection.selected.size}
                </span>
                <span className="hidden @md:inline">{t.selected}</span>
              </span>
              <span className="h-5 w-px shrink-0 bg-primary-foreground/20 dark:bg-border" />
              {onRoleChange && changeable.length ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className={barButton}>
                    <UserCogIcon className="size-3.5 opacity-80" /> {t.role}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className={menuPop} side="top" sideOffset={8}>
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>{t.changeRoleTo}</DropdownMenuLabel>
                      {ASSIGNABLE.map((r) => (
                        <DropdownMenuItem key={r} onClick={() => roleChange.run({ ids: changeable, role: r })}>
                          {roleLabel(r)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              {onResendInvite && selectedInvited.length ? (
                <button className={barButton} onClick={() => resend.run(selectedInvited)} type="button">
                  <SendIcon className="size-3.5 opacity-80" /> {t.resend}
                </button>
              ) : null}
              {onSuspend && selectedActive.length ? (
                <button className={barButton} onClick={() => suspend.run(selectedActive)} type="button">
                  <UserRoundXIcon className="size-3.5 opacity-80" /> {t.suspend}
                </button>
              ) : null}
              {onRemove && changeable.length ? (
                <button
                  className={cn(barButton, "hover:bg-destructive hover:text-white dark:hover:bg-destructive dark:hover:text-white")}
                  onClick={() => setConfirm(changeable)}
                  type="button"
                >
                  <UserMinusIcon className="size-3.5 opacity-80" /> {t.remove}
                </button>
              ) : null}
              <button aria-label={t.clearSelection} className={cn(barButton, "w-8 justify-center px-0")} onClick={selection.clear} type="button">
                <XIcon className="size-4" />
              </button>
            </motion.div>
          ) : notice ? (
            <motion.div
              animate={{ y: 0, opacity: 1, scale: 1 }}
              className={cn(
                barSurface,
                "pointer-events-auto flex max-w-full items-center gap-2 px-4 py-2",
                notice.error && "bg-destructive text-white dark:bg-destructive dark:text-white",
              )}
              exit={{ y: 8, opacity: 0, scale: 0.97, transition: { duration: 0.12, ease: easeOut } }}
              initial={reduce ? { opacity: 0 } : { y: 16, opacity: 0, scale: 0.96 }}
              key={notice.id}
              role={notice.error ? "alert" : "status"}
              transition={reduce ? { duration: 0.15 } : spring}
            >
              {notice.error ? <CircleAlertIcon className="size-4 shrink-0 opacity-80" /> : <CheckIcon className="size-4 shrink-0 opacity-80" />}
              <span className="truncate">{notice.text}</span>
              {notice.error ? (
                <button aria-label={t.dismiss} className={cn("-me-1.5 flex size-6 items-center justify-center rounded-full hover:bg-white/15", ring)} onClick={() => setNotice(null)} type="button">
                  <XIcon className="size-3.5" />
                </button>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <Sheet onOpenChange={(open) => !open && setDetailId(null)} open={detail !== null}>
        <SheetContent className="w-full gap-0 p-0 sm:max-w-[420px]">
          {detail ? (
            <MemberDetails
              detail={detail}
              footer={
                detail.role !== "owner" && detail.id !== currentUserId ? (
                  <div className="flex shrink-0 gap-2 border-t p-4">
                    {detail.status === "invited" ? (
                      onResendInvite ? (
                        <Button className={cn("flex-1", press)} onClick={() => resend.run([detail.id])} variant="outline">
                          <SendIcon /> {t.resendInvite}
                        </Button>
                      ) : null
                    ) : detail.status === "suspended" ? (
                      onReactivate ? (
                        <Button className={cn("flex-1", press)} onClick={() => reactivate.run([detail.id])} variant="outline">
                          <UserRoundCheckIcon /> {t.reactivate}
                        </Button>
                      ) : null
                    ) : onSuspend ? (
                      <Button className={cn("flex-1", press)} onClick={() => suspend.run([detail.id])} variant="outline">
                        <UserRoundXIcon /> {t.suspend}
                      </Button>
                    ) : null}
                    {onRemove ? (
                      <Button className={cn("flex-1 text-destructive-foreground", press)} onClick={() => setConfirm([detail.id])} variant="destructive">
                        <UserMinusIcon /> {detail.status === "invited" ? t.revoke : t.remove}
                      </Button>
                    ) : null}
                  </div>
                ) : null
              }
              lastActive={lastActive(detail)}
              loadDetails={loadDetails}
              roleControl={roleMenu(detail)}
              shortDate={shortDate}
              statusLabel={statusLabel(detail.status)}
              t={t}
              teams={teamChips(detail, true)}
              twoFa={twoFa(detail)}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog onOpenChange={(open) => !open && setConfirm(null)} open={confirm !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmRows.length === 1 ? interpolate(t.confirmTitleOne, { name: nameOf(confirmRows[0] as AdminUser) }) : interpolate(t.confirmTitleMany, { count: confirmRows.length })}
            </AlertDialogTitle>
            <AlertDialogDescription>{confirmRows.length === 1 ? t.confirmBodyOne : t.confirmBodyMany}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <Button
              className="text-destructive-foreground"
              onClick={() => {
                if (confirm) {
                  selection.clear();
                  void remove.run(confirm);
                }
                setConfirm(null);
              }}
              variant="destructive"
            >
              {t.remove}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {onInvite ? (
        <InviteDialog
          onInvite={onInvite}
          onOpenChange={setInviting}
          onSent={(count) => say(count === 1 ? t.invitesSentOne : interpolate(t.invitesSent, { count }))}
          open={inviting}
          roleLabel={roleLabel}
          seatsLeft={seatsLeft}
          t={t}
        />
      ) : null}
    </div>
  );
}

function MemberDetails({
  detail,
  loadDetails,
  roleControl,
  statusLabel,
  twoFa,
  teams,
  lastActive,
  shortDate,
  footer,
  t,
}: {
  detail: AdminUser;
  loadDetails?: (id: string) => Promise<AdminUserDetails>;
  roleControl: ReactNode;
  statusLabel: string;
  twoFa: ReactNode;
  teams: ReactNode;
  lastActive: string;
  shortDate: (iso: string) => string;
  footer: ReactNode;
  t: Messages;
}) {
  const format = useFormat();
  const [extra, setExtra] = useState<{ id: string; status: AsyncStatus; data?: AdminUserDetails }>({ id: "", status: "loading" });

  useEffect(() => {
    if (!loadDetails) return;
    let current = true;
    setExtra({ id: detail.id, status: "loading" });
    loadDetails(detail.id).then(
      (data) => current && setExtra({ id: detail.id, status: "ready", data }),
      () => current && setExtra({ id: detail.id, status: "error" }),
    );
    return () => {
      current = false;
    };
  }, [loadDetails, detail.id]);

  const data = extra.id === detail.id ? extra : { id: detail.id, status: "loading" as const };

  return (
    <>
      <SheetHeader className="h-12 shrink-0 justify-center border-b px-4 py-0">
        <SheetTitle className="font-medium text-muted-foreground text-xs">{t.details}</SheetTitle>
        <SheetDescription className="sr-only">{nameOf(detail)}</SheetDescription>
      </SheetHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6 p-5">
          <div className="flex items-center gap-4">
            <UserAvatar size={14} user={detail} />
            <div className="flex min-w-0 flex-col gap-1">
              <h3 className="truncate font-heading font-semibold text-lg">{nameOf(detail)}</h3>
              <span className="truncate text-muted-foreground">{detail.name ? detail.email : t.notJoined}</span>
              <span className="flex items-center gap-2">
                {roleControl}
                <StatusTag label={statusLabel} status={detail.status} />
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border bg-card p-4 text-xs">
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">{detail.status === "invited" ? t.invitedLabel : t.joined}</dt>
              <dd className="font-medium">{shortDate(detail.joinedAt)}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">{t.lastActive}</dt>
              <dd className="font-medium tabular-nums">{lastActive}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">{t.twoFactorLabel}</dt>
              <dd>{twoFa}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">{t.location}</dt>
              <dd className="truncate font-medium">{detail.location ?? "—"}</dd>
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <dt className="text-muted-foreground">{t.teams}</dt>
              <dd>{teams}</dd>
            </div>
          </dl>

          {loadDetails ? (
            data.status === "loading" ? (
              <div aria-busy className="flex items-center gap-2 text-muted-foreground text-xs">
                <Spinner className="size-3.5" /> {t.loadingDetails}
              </div>
            ) : data.status === "error" || !data.data ? (
              <p className="text-destructive-foreground text-xs" role="alert">
                {t.detailsError}
              </p>
            ) : (
              <>
                {data.data.devices.length ? (
                  <section className="flex flex-col gap-2">
                    <h4 className="font-medium text-muted-foreground text-xs">{t.devices}</h4>
                    <ul className="divide-y rounded-xl border">
                      {data.data.devices.map((d) => (
                        <li className="flex items-center gap-3 px-3 py-2.5" key={d.id}>
                          <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">
                            {d.kind === "mobile" ? <SmartphoneIcon /> : <LaptopIcon />}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate font-medium text-xs">{d.name}</span>
                            <span className="truncate text-muted-foreground text-xs tabular-nums">
                              {[d.location, format.relative(d.lastActiveAt)].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                          {d.current && <span className="text-success-foreground text-xs">{t.activeNow}</span>}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                {data.data.activity.length ? (
                  <section className="flex flex-col gap-3">
                    <h4 className="font-medium text-muted-foreground text-xs">{t.activity}</h4>
                    <ol className="relative flex flex-col gap-4">
                      <span aria-hidden className="absolute top-3 bottom-3 left-[13px] w-px bg-border" />
                      {data.data.activity.map((a) => (
                        <li className="relative flex gap-3" key={a.id}>
                          <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground [&_svg]:size-3.5">
                            {ACTIVITY_ICON[a.kind]}
                          </span>
                          <span className="flex min-w-0 flex-col gap-0.5 pt-1">
                            <span className="text-pretty text-xs leading-5">{a.text}</span>
                            <span className="text-muted-foreground text-xs tabular-nums">{format.relative(a.at)}</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </section>
                ) : null}
              </>
            )
          ) : null}
        </div>
      </div>
      {footer}
    </>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  onInvite,
  onSent,
  seatsLeft,
  roleLabel,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: Action<InviteMembersInput>;
  onSent: (count: number) => void;
  seatsLeft: number;
  roleLabel: (role: AdminRole) => string;
  t: Messages;
}) {
  const ids = useId();
  const reduce = useReducedMotionAfterMount();
  const [emails, setEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState<InviteAdminRole>("member");
  const inputRef = useRef<HTMLInputElement>(null);
  const send = useAction(onInvite, {
    onSuccess: (_, input) => {
      onSent(input.emails.length);
      setEmails([]);
      setDraft("");
      onOpenChange(false);
    },
  });

  const commit = (raw: string) => {
    const parts = raw
      .split(/[\s,;]+/)
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean);
    if (!parts.length) return;
    setEmails((e) => [...e, ...parts.filter((p) => !e.includes(p))]);
    setDraft("");
  };

  const invalid = emails.filter((e) => !EMAIL.test(e));
  const validCount = emails.length - invalid.length;
  const usesSeats = role !== "viewer";
  const overSeats = usesSeats && validCount > seatsLeft;
  const canSend = emails.length > 0 && invalid.length === 0 && !overSeats && !send.isPending();
  const submit = () => canSend && send.run({ emails, role });

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg" initialFocus={inputRef}>
        <DialogHeader>
          <DialogTitle>{t.inviteTitle}</DialogTitle>
          <DialogDescription>{t.inviteSub}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <label className="font-medium text-xs" htmlFor={`${ids}-emails`}>
            {t.emails}
          </label>
          <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background p-1.5 shadow-xs/5 transition-shadow has-focus-visible:border-ring has-focus-visible:ring-[3px] has-focus-visible:ring-ring/24 dark:bg-input/32">
            <AnimatePresence initial={false}>
              {emails.map((e) => {
                const bad = !EMAIL.test(e);
                return (
                  <motion.span
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "flex h-7 items-center gap-1 rounded-md ps-2 pe-1 text-xs",
                      bad ? "bg-destructive/10 text-destructive-foreground ring-1 ring-destructive/30 ring-inset" : "bg-muted text-foreground",
                    )}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1 } }}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                    key={e}
                    layout={reduce ? false : "position"}
                    transition={{ duration: 0.15, ease: easeOut }}
                  >
                    {e}
                    <button
                      aria-label={interpolate(t.removeEmail, { email: e })}
                      className={cn("flex size-5 cursor-pointer items-center justify-center rounded hover:bg-foreground/10", ring)}
                      onClick={() => setEmails((all) => all.filter((x) => x !== e))}
                      type="button"
                    >
                      <XIcon className="size-3" />
                    </button>
                  </motion.span>
                );
              })}
            </AnimatePresence>
            <input
              aria-describedby={`${ids}-help`}
              aria-invalid={invalid.length > 0 || undefined}
              className="h-7 min-w-36 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground/72"
              id={`${ids}-emails`}
              onBlur={() => commit(draft)}
              onChange={(e) => {
                const v = e.target.value;
                if (/[,;\s]$/.test(v)) commit(v);
                else setDraft(v);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (draft.trim()) commit(draft);
                  else submit();
                } else if (e.key === "Backspace" && !draft && emails.length) {
                  setEmails((all) => all.slice(0, -1));
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                commit(e.clipboardData.getData("text"));
              }}
              placeholder={emails.length ? t.addAnother : t.emailPlaceholder}
              ref={inputRef}
              value={draft}
            />
          </div>
          <span className={cn("text-xs", invalid.length ? "text-destructive-foreground" : "text-muted-foreground")} id={`${ids}-help`}>
            {invalid.length === 1
              ? interpolate(t.badEmailOne, { email: invalid[0] ?? "" })
              : invalid.length
                ? interpolate(t.badEmailMany, { count: invalid.length })
                : t.emailHelp}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-medium text-xs" id={`${ids}-role`}>
            {t.role}
          </span>
          <RadioGroup aria-labelledby={`${ids}-role`} className="grid grid-cols-1 gap-2 sm:grid-cols-3" onValueChange={(v) => setRole(v as InviteAdminRole)} value={role}>
            {INVITE_ROLES.map((r) => (
              <Radio.Root
                className={cn(
                  "relative flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-left hover:bg-accent/40 active:scale-[0.98] data-checked:border-foreground/40 data-checked:bg-accent/60",
                  ring,
                  press,
                )}
                key={r}
                value={r}
              >
                <span className="flex items-center justify-between font-medium">
                  {roleLabel(r)}
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-full border transition-colors",
                      role === r ? "border-primary bg-primary text-primary-foreground" : "border-input",
                    )}
                  >
                    {role === r && <CheckIcon className="size-2.5" strokeWidth={3} />}
                  </span>
                </span>
                <span className="text-pretty text-muted-foreground text-xs leading-4">{t[`${r}Hint`]}</span>
              </Radio.Root>
            ))}
          </RadioGroup>
        </div>

        {send.error ? (
          <p className="text-destructive-foreground text-xs" role="alert">
            {send.error}
          </p>
        ) : null}

        <DialogFooter className="items-center sm:justify-between">
          <span className={cn("text-xs tabular-nums", overSeats ? "text-destructive-foreground" : "text-muted-foreground")}>
            {usesSeats
              ? overSeats
                ? interpolate(t.overSeats, { count: seatsLeft })
                : validCount
                  ? interpolate(t.usesSeats, { count: validCount, left: seatsLeft })
                  : interpolate(t.seatsRemaining, { count: seatsLeft })
              : t.viewersFree}
          </span>
          <div className="flex gap-2">
            <Button className={press} onClick={() => onOpenChange(false)} variant="ghost">
              {t.cancel}
            </Button>
            <Button className={press} disabled={!canSend} onClick={submit}>
              {send.isPending() ? <Spinner /> : <SendIcon />} {validCount > 1 ? interpolate(t.sendMany, { count: validCount }) : t.sendOne}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
