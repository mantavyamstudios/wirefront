// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@wirefront/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@wirefront/ui/avatar";
import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@wirefront/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@wirefront/ui/dropdown-menu";
import { Input } from "@wirefront/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@wirefront/ui/input-group";
import { cn } from "@wirefront/ui/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@wirefront/ui/select";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@wirefront/ui/table";
import { useAction } from "@wirefront/ui/wirefront/action";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import { pageCount, toggleSort, withFilter, withPage, withSearch } from "@wirefront/ui/wirefront/list";
import { interpolate, useCan, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus, ListQuery } from "@wirefront/ui/wirefront/types";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
  MailIcon,
  SearchIcon,
  ShieldIcon,
  TrashIcon,
  UserPlusIcon,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import { type AssignableRole, InviteInput, type Member, type Role } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("membersTable.<key>"). */
export const MEMBERS_TABLE_MESSAGES = {
  title: "Members",
  countOne: "1 person",
  countOther: "{count} people",
  invite: "Invite",
  search: "Search members",
  allRoles: "All roles",
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
  columnMember: "Member",
  columnTeam: "Team",
  columnRole: "Role",
  columnTwoFactor: "2FA",
  columnLastActive: "Last active",
  actions: "Actions",
  actionsFor: "Actions for {name}",
  roleFor: "Role for {name}",
  invited: "Invited",
  never: "Never",
  twoFactorOn: "Enabled",
  twoFactorOff: "Off",
  twoFactorShortOn: "2FA on",
  twoFactorShortOff: "2FA off",
  sendEmail: "Send email",
  transferOwnership: "Transfer ownership",
  remove: "Remove",
  revokeInvite: "Revoke invitation",
  removeTitle: "Remove {name}?",
  removeDescription: "They lose access to this workspace straight away. You can invite them again later.",
  transferTitle: "Make {name} the owner?",
  transferDescription: "They get full control of the workspace, including billing. You become an admin.",
  cancel: "Cancel",
  emptyTitle: "No members yet",
  emptyDescription: "Invite your team to start working together.",
  noMatchTitle: "No members match",
  noMatchDescription: "Try a different name, email or role.",
  clearFilters: "Clear filters",
  errorTitle: "Couldn’t load members",
  retry: "Try again",
  pagination: "Pagination",
  previous: "Previous page",
  next: "Next page",
  range: "{from}–{to} of {total}",
  inviteTitle: "Invite someone",
  inviteDescription: "They get an email with a link to join.",
  email: "Email",
  emailPlaceholder: "name@company.com",
  role: "Role",
  sendInvite: "Send invite",
};

export type MembersListQuery = ListQuery<{ role: Role }>;

export interface MembersTableProps {
  /** The current page of members. */
  members: Member[];
  /** Members matching the query across all pages. */
  total: number;
  /** Search, role filter, sort and page; send it to your API (see `MembersQuery` in schema.ts). */
  query: MembersListQuery;
  /** Called when the user searches, filters, sorts or pages. Fetch the new page and pass it back in. */
  onQueryChange: (query: MembersListQuery) => void;
  /** "loading" shows skeleton rows; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  /** Why the list failed to load. */
  error?: string;
  onRetry?: () => void;
  /** Invite by email. The Invite button only shows when this is given. */
  onInvite?: Action<InviteInput, Member>;
  /** Change a member's role. Applied at once and rolled back if it fails. */
  onRoleChange?: Action<{ id: string; role: AssignableRole }>;
  /** Remove a member or revoke an invitation (receives the id), after the user confirms. */
  onRemove?: Action<string>;
  /** Make someone the owner (receives the id), after the user confirms. */
  onTransferOwnership?: Action<string>;
  className?: string;
}

const SKELETON_ROWS = ["s1", "s2", "s3", "s4", "s5"];
const ASSIGNABLE: AssignableRole[] = ["admin", "member", "viewer"];
const TONES = [
  "bg-category-4/15 text-category-4-foreground",
  "bg-category-3/15 text-category-3-foreground",
  "bg-category-1/15 text-category-1-foreground",
  "bg-category-2/15 text-category-2-foreground",
  "bg-category-5/15 text-category-5-foreground",
  "bg-category-8/15 text-category-8-foreground",
];

/** A stable colour per member, from their id. */
function toneFor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length];
}

function initials(name: string) {
  const parts = name.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

type Confirm = { kind: "remove" | "transfer"; member: Member } | null;

/** Optimistic changes, kept until the next `members` from the builder replaces them. */
interface Local {
  source: Member[];
  roles: Record<string, Role>;
  removed: ReadonlySet<string>;
}

function MembersTableScreen({
  members,
  total,
  query,
  onQueryChange,
  status = "ready",
  error,
  onRetry,
  onInvite,
  onRoleChange,
  onRemove,
  onTransferOwnership,
  className,
}: MembersTableProps) {
  const t = useMessages("membersTable", MEMBERS_TABLE_MESSAGES);
  const can = useCan();
  const format = useFormat();
  const manage = can("manage", "members");
  const [inviting, setInviting] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const [local, setLocal] = useState<Local>({ source: members, roles: {}, removed: new Set() });
  if (local.source !== members) setLocal({ source: members, roles: {}, removed: new Set() });

  const roleChange = useAction(onRoleChange ?? (async () => {}), {
    optimistic: ({ id, role }) => {
      setLocal((l) => ({ ...l, roles: { ...l.roles, [id]: role } }));
      return () =>
        setLocal((l) => {
          const { [id]: _undone, ...roles } = l.roles;
          return { ...l, roles };
        });
    },
  });
  const remove = useAction(onRemove ?? (async () => {}), {
    onSuccess: (_, id) => setLocal((l) => ({ ...l, removed: new Set(l.removed).add(id) })),
  });
  const transfer = useAction(onTransferOwnership ?? (async () => {}));
  const actionError = roleChange.error ?? remove.error ?? transfer.error;

  const rows = members
    .filter((m) => !local.removed.has(m.id))
    .map((m) => (local.roles[m.id] ? { ...m, role: local.roles[m.id] as Role } : m));
  const roleLabel = (role: Role) => t[role];
  const filtered = Boolean(query.search || query.filters?.role);
  const pages = pageCount(query, total);
  const from = total === 0 ? 0 : (query.page - 1) * query.pageSize + 1;
  const to = Math.min(query.page * query.pageSize, total);

  const sortHead = (id: "name" | "lastActiveAt", label: string, cellClass?: string) => {
    const active = query.sort?.id === id ? query.sort.direction : undefined;
    return (
      <TableHead aria-sort={active === "asc" ? "ascending" : active === "desc" ? "descending" : "none"} className={cellClass}>
        <button
          className="-mx-1 inline-flex items-center gap-1 rounded-sm px-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onQueryChange(toggleSort(query, id))}
          type="button"
        >
          {label}
          {active === "asc" ? <ArrowUpIcon className="size-3" /> : active === "desc" ? <ArrowDownIcon className="size-3" /> : null}
        </button>
      </TableHead>
    );
  };

  let body: ReactNode;
  if (status === "loading") {
    body = SKELETON_ROWS.slice(0, Math.min(query.pageSize, SKELETON_ROWS.length)).map((key) => (
      <TableRow key={key}>
        <TableCell className="ps-4" colSpan={6}>
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full motion-reduce:animate-none" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-36 motion-reduce:animate-none" />
              <Skeleton className="h-3 w-48 motion-reduce:animate-none" />
            </div>
          </div>
        </TableCell>
      </TableRow>
    ));
  } else if (status === "error") {
    body = (
      <TableRow>
        <TableCell className="whitespace-normal py-12 text-center" colSpan={6}>
          <p className="font-medium">{t.errorTitle}</p>
          {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
          {onRetry ? (
            <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
              {t.retry}
            </Button>
          ) : null}
        </TableCell>
      </TableRow>
    );
  } else if (rows.length === 0) {
    body = (
      <TableRow>
        <TableCell className="whitespace-normal py-12 text-center" colSpan={6}>
          <p className="font-medium">{filtered ? t.noMatchTitle : t.emptyTitle}</p>
          <p className="mt-1 text-muted-foreground text-sm">{filtered ? t.noMatchDescription : t.emptyDescription}</p>
          {filtered ? (
            <Button
              className="mt-4"
              onClick={() => onQueryChange(withFilter(withSearch(query, ""), "role", undefined))}
              size="sm"
              variant="outline"
            >
              {t.clearFilters}
            </Button>
          ) : null}
        </TableCell>
      </TableRow>
    );
  } else {
    body = rows.map((m) => (
      <MemberRow
        key={m.id}
        lastActive={m.status === "invited" ? t.invited : m.lastActiveAt ? format.relative(m.lastActiveAt) : t.never}
        m={m}
        onRoleChange={manage && onRoleChange ? (role) => void roleChange.run({ id: m.id, role }, m.id) : undefined}
        onRemove={manage && onRemove ? () => setConfirm({ kind: "remove", member: m }) : undefined}
        onTransfer={manage && onTransferOwnership && m.status === "active" ? () => setConfirm({ kind: "transfer", member: m }) : undefined}
        pending={roleChange.isPending(m.id) || remove.isPending(m.id) || transfer.isPending(m.id)}
        roleLabel={roleLabel}
        t={t}
      />
    ));
  }

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-12", className)}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-heading text-xl">{t.title}</h1>
            <p className="text-muted-foreground text-sm">
              {total === 1 ? t.countOne : interpolate(t.countOther, { count: format.number(total) })}
            </p>
          </div>
          {manage && onInvite ? (
            <Button className="pointer-coarse:h-10" onClick={() => setInviting(true)} size="sm">
              <UserPlusIcon />
              {t.invite}
            </Button>
          ) : null}
        </header>

        <div className="mb-3 flex flex-col gap-2 sm:flex-row">
          <InputGroup className="sm:max-w-xs">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              aria-label={t.search}
              onChange={(e) => onQueryChange(withSearch(query, e.target.value))}
              placeholder={t.search}
              type="search"
              value={query.search ?? ""}
            />
          </InputGroup>
          <Select
            items={[{ label: t.allRoles, value: "all" }, ...(["owner", ...ASSIGNABLE] as Role[]).map((r) => ({ label: roleLabel(r), value: r }))]}
            onValueChange={(v) => onQueryChange(withFilter(query, "role", v === "all" ? undefined : v))}
            value={query.filters?.role ?? "all"}
          >
            <SelectTrigger aria-label={t.columnRole} className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="all">{t.allRoles}</SelectItem>
              {(["owner", ...ASSIGNABLE] as Role[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {roleLabel(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {actionError ? (
          <p className="mb-3 text-destructive-foreground text-sm" role="alert">
            {actionError}
          </p>
        ) : null}

        {/*
          Priority columns: phones see Member + actions (team, role and 2FA move
          under the name; role is editable from the actions menu). Role select
          returns at sm, Team/Last active at md, 2FA at lg.
        */}
        <div className="rounded-xl border bg-card shadow-xs/5">
          <Table aria-busy={status === "loading"}>
            <TableHeader>
              <TableRow>
                {sortHead("name", t.columnMember, "ps-4")}
                <TableHead className="max-md:hidden">{t.columnTeam}</TableHead>
                <TableHead className="max-sm:hidden">{t.columnRole}</TableHead>
                <TableHead className="max-lg:hidden">{t.columnTwoFactor}</TableHead>
                {sortHead("lastActiveAt", t.columnLastActive, "max-md:hidden")}
                <TableHead className="w-px pe-4">
                  <span className="sr-only">{t.actions}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{body}</TableBody>
          </Table>
        </div>

        {status === "ready" && pages > 1 ? (
          <nav aria-label={t.pagination} className="mt-3 flex items-center justify-end gap-2 text-muted-foreground text-sm">
            <span className="tabular-nums">{interpolate(t.range, { from, to, total })}</span>
            <Button
              aria-label={t.previous}
              disabled={query.page <= 1}
              onClick={() => onQueryChange(withPage(query, query.page - 1, total))}
              size="icon-sm"
              variant="outline"
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              aria-label={t.next}
              disabled={query.page >= pages}
              onClick={() => onQueryChange(withPage(query, query.page + 1, total))}
              size="icon-sm"
              variant="outline"
            >
              <ChevronRightIcon />
            </Button>
          </nav>
        ) : null}
      </div>

      {onInvite ? <InviteDialog onInvite={onInvite} onOpenChange={setInviting} open={inviting} roleLabel={roleLabel} t={t} /> : null}

      <AlertDialog onOpenChange={(open) => !open && setConfirm(null)} open={confirm !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm ? interpolate(confirm.kind === "remove" ? t.removeTitle : t.transferTitle, { name: confirm.member.name }) : null}
            </AlertDialogTitle>
            <AlertDialogDescription>{confirm?.kind === "transfer" ? t.transferDescription : t.removeDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <Button
              onClick={() => {
                if (!confirm) return;
                const { id } = confirm.member;
                void (confirm.kind === "remove" ? remove.run(id, id) : transfer.run(id, id));
                setConfirm(null);
              }}
              variant={confirm?.kind === "remove" ? "destructive" : "default"}
            >
              {confirm?.kind === "transfer" ? t.transferOwnership : confirm?.member.status === "invited" ? t.revokeInvite : t.remove}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type Messages = typeof MEMBERS_TABLE_MESSAGES;

function MemberRow({
  m,
  lastActive,
  pending,
  roleLabel,
  onRoleChange,
  onRemove,
  onTransfer,
  t,
}: {
  m: Member;
  lastActive: string;
  pending: boolean;
  roleLabel: (role: Role) => string;
  onRoleChange?: (role: AssignableRole) => void;
  onRemove?: () => void;
  onTransfer?: () => void;
  t: Messages;
}) {
  const owner = m.role === "owner";
  const editable = !owner && onRoleChange;
  const twoFactor = (
    <span className={cn("size-1.5 rounded-full", m.twoFactor ? "bg-category-2" : "bg-muted-foreground/40")} />
  );
  return (
    <TableRow aria-busy={pending || undefined} className={cn(pending && "opacity-60")}>
      <TableCell className="w-full max-w-0 ps-4 sm:w-auto sm:max-w-none">
        <div className="flex items-center gap-3">
          <Avatar className={cn("size-8 shrink-0", toneFor(m.id))}>
            {m.avatarUrl ? <AvatarImage alt="" src={m.avatarUrl} /> : null}
            <AvatarFallback className="bg-transparent font-medium text-[11px]">{initials(m.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{m.name}</span>
              {m.status === "invited" ? (
                <Badge className="h-4.5 rounded-sm px-1 font-mono text-[10px] uppercase tracking-wider" variant="outline">
                  {t.invited}
                </Badge>
              ) : null}
            </div>
            <div className="truncate text-muted-foreground text-xs">{m.email}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-muted-foreground text-xs lg:hidden">
              <span className="sm:hidden">{roleLabel(m.role)}</span>
              {m.team ? <span className="md:hidden">{m.team}</span> : null}
              <span className="inline-flex items-center gap-1">
                {twoFactor}
                {m.twoFactor ? t.twoFactorShortOn : t.twoFactorShortOff}
              </span>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground max-md:hidden">{m.team}</TableCell>
      <TableCell className="max-sm:hidden">
        {editable ? (
          <Select
            items={ASSIGNABLE.map((r) => ({ label: roleLabel(r), value: r }))}
            onValueChange={(v) => onRoleChange(v as AssignableRole)}
            value={m.role}
          >
            <SelectTrigger aria-label={interpolate(t.roleFor, { name: m.name })} className="h-8 w-32 text-sm pointer-coarse:h-10" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {ASSIGNABLE.map((r) => (
                <SelectItem key={r} value={r}>
                  {roleLabel(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : owner ? (
          <Badge className="gap-1" variant="outline">
            <ShieldIcon className="size-3" />
            {t.owner}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">{roleLabel(m.role)}</span>
        )}
      </TableCell>
      <TableCell className="max-lg:hidden">
        <div className="inline-flex items-center gap-1.5">
          {twoFactor}
          <span className="text-muted-foreground text-xs">{m.twoFactor ? t.twoFactorOn : t.twoFactorOff}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums max-md:hidden">{lastActive}</TableCell>
      <TableCell className="pe-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label={interpolate(t.actionsFor, { name: m.name })}
                className="pointer-coarse:size-11"
                size="icon"
                variant="ghost"
              />
            }
          >
            {pending ? <Spinner /> : <EllipsisIcon />}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {editable ? (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{t.role}</DropdownMenuLabel>
                  <DropdownMenuRadioGroup onValueChange={(v) => onRoleChange(v as AssignableRole)} value={m.role}>
                    {ASSIGNABLE.map((r) => (
                      <DropdownMenuRadioItem key={r} value={r}>
                        {roleLabel(r)}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuItem render={<a href={`mailto:${m.email}`} />}>
              <MailIcon /> {t.sendEmail}
            </DropdownMenuItem>
            {onTransfer && !owner ? <DropdownMenuItem onClick={onTransfer}>{t.transferOwnership}</DropdownMenuItem> : null}
            {onRemove && !owner ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onRemove} variant="destructive">
                  <TrashIcon /> {m.status === "invited" ? t.revokeInvite : t.remove}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  onInvite,
  roleLabel,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: Action<InviteInput, Member>;
  roleLabel: (role: Role) => string;
  t: Messages;
}) {
  const form = useActionForm({ schema: InviteInput, action: onInvite, onSuccess: () => onOpenChange(false) });
  const fieldError = "text-destructive-foreground text-xs";
  return (
    <Dialog
      onOpenChange={(next) => {
        if (!next) form.reset();
        onOpenChange(next);
      }}
      open={open}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.inviteTitle}</DialogTitle>
          <DialogDescription>{t.inviteDescription}</DialogDescription>
        </DialogHeader>
        <Form className="flex flex-col gap-4" noValidate {...form.formProps}>
          <Field.Root className="flex flex-col gap-2" name="email">
            <Field.Label className="font-medium text-sm">{t.email}</Field.Label>
            <Input autoComplete="off" inputMode="email" placeholder={t.emailPlaceholder} type="text" />
            <Field.Error className={fieldError} />
          </Field.Root>
          <Field.Root className="flex flex-col gap-2" name="role">
            <Field.Label className="font-medium text-sm">{t.role}</Field.Label>
            <Select defaultValue="member" items={ASSIGNABLE.map((r) => ({ label: roleLabel(r), value: r }))} name="role">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE.map((r) => (
                  <SelectItem key={r} value={r}>
                    {roleLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Field.Error className={fieldError} />
          </Field.Root>
          {form.formError ? (
            <p className={fieldError} role="alert">
              {form.formError}
            </p>
          ) : null}
          <DialogFooter>
            <Button aria-busy={form.pending} disabled={form.pending} type="submit">
              {form.pending ? <Spinner data-icon="inline-start" /> : null}
              {t.sendInvite}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function MembersTable(props: MembersTableProps) {
  return (
    <ScreenBoundary name="MembersTable">
      <MembersTableScreen {...props} />
    </ScreenBoundary>
  );
}
