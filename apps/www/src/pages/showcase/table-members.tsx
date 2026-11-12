// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { useState } from "react";
import {
  EllipsisIcon,
  MailIcon,
  ShieldIcon,
  TrashIcon,
  UserPlusIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { DropdownMenu, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@wirefront/ui/dropdown-menu";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@wirefront/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@wirefront/ui/table";

type Role = "owner" | "admin" | "member" | "viewer";

const ROLES: { label: string; value: Role }[] = [
  { label: "Owner", value: "owner" },
  { label: "Admin", value: "admin" },
  { label: "Member", value: "member" },
  { label: "Viewer", value: "viewer" },
];

interface Member {
  name: string;
  email: string;
  initials: string;
  tone: string;
  role: Role;
  team: string;
  active: string;
  twoFactor: boolean;
  pending?: boolean;
}

const MEMBERS: Member[] = [
  { name: "Ada Lovelace", email: "ada@calculus.dev", initials: "AL", tone: "bg-rose-500/15 text-rose-600 dark:text-rose-300", role: "owner", team: "Engineering", active: "Active now", twoFactor: true },
  { name: "Grace Hopper", email: "grace@cobol.io", initials: "GH", tone: "bg-amber-500/15 text-amber-600 dark:text-amber-300", role: "admin", team: "Engineering", active: "2m ago", twoFactor: true },
  { name: "Alan Turing", email: "alan@enigma.uk", initials: "AT", tone: "bg-sky-500/15 text-sky-600 dark:text-sky-300", role: "admin", team: "Research", active: "12m ago", twoFactor: false },
  { name: "Linus Torvalds", email: "linus@kernel.org", initials: "LT", tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300", role: "member", team: "Engineering", active: "1h ago", twoFactor: true },
  { name: "Margaret Hamilton", email: "margaret@apollo.nasa", initials: "MH", tone: "bg-violet-500/15 text-violet-600 dark:text-violet-300", role: "member", team: "Research", active: "Yesterday", twoFactor: true },
  { name: "Edsger Dijkstra", email: "edsger@graph.nl", initials: "ED", tone: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300", role: "viewer", team: "Design", active: "3 days ago", twoFactor: false, pending: true },
];

export function TableMembersShowcasePage() {
  return (
    <div className="min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-heading text-xl">Members</h1>
            <p className="text-muted-foreground text-sm">
              6 people · 2 pending invites
            </p>
          </div>
          <Button size="sm" className="pointer-coarse:h-10">
            <UserPlusIcon />
            Invite
          </Button>
        </header>

        {/*
          Priority columns: phones see Member + actions (team, role and 2FA move
          under the name; role is editable from the actions menu). Role select
          returns at sm, Team/Last active at md, 2FA at lg.
        */}
        <div className="rounded-xl border bg-card shadow-xs/5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-4">Member</TableHead>
                <TableHead className="max-md:hidden">Team</TableHead>
                <TableHead className="max-sm:hidden">Role</TableHead>
                <TableHead className="max-lg:hidden">2FA</TableHead>
                <TableHead className="max-md:hidden">Last active</TableHead>
                <TableHead className="pe-4 w-px">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MEMBERS.map((m) => (
                <MemberRow key={m.email} m={m} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function MemberRow({ m }: { m: Member }) {
  const [role, setRole] = useState<string>(m.role);
  const roleLabel = ROLES.find((r) => r.value === role)?.label ?? "Owner";
  return (
    <TableRow>
      <TableCell className="w-full max-w-0 ps-4 sm:w-auto sm:max-w-none">
        <div className="flex items-center gap-3">
          <Avatar className={"size-8 shrink-0 " + m.tone}>
            <AvatarFallback className="bg-transparent font-medium text-[11px]">
              {m.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{m.name}</span>
              {m.pending ? (
                <Badge variant="outline" className="h-4.5 rounded-sm px-1 text-[0.625rem] font-mono text-[10px] uppercase tracking-wider">
                  pending
                </Badge>
              ) : null}
            </div>
            <div className="truncate text-muted-foreground text-xs">{m.email}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-muted-foreground text-xs lg:hidden">
              <span className="sm:hidden">{m.role === "owner" ? "Owner" : roleLabel}</span>
              <span className="md:hidden">{m.team}</span>
              <span className="inline-flex items-center gap-1">
                <span
                  className={
                    "size-1.5 rounded-full " +
                    (m.twoFactor ? "bg-emerald-500" : "bg-muted-foreground/40")
                  }
                />
                2FA {m.twoFactor ? "on" : "off"}
              </span>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground max-md:hidden">{m.team}</TableCell>
      <TableCell className="max-sm:hidden">
        {m.role === "owner" ? (
          <Badge variant="outline" className="gap-1">
            <ShieldIcon className="size-3" />
            Owner
          </Badge>
        ) : (
          <Select items={ROLES} value={role} onValueChange={(v) => setRole(v as string)}>
            <SelectTrigger aria-label={`Role for ${m.name}`} className="h-8 w-32 text-sm pointer-coarse:h-10" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </TableCell>
      <TableCell className="max-lg:hidden">
        <div className="inline-flex items-center gap-1.5">
          <span
            className={
              "size-1.5 rounded-full " +
              (m.twoFactor ? "bg-emerald-500" : "bg-muted-foreground/40")
            }
          />
          <span className="text-muted-foreground text-xs">
            {m.twoFactor ? "Enabled" : "Off"}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums max-md:hidden">{m.active}</TableCell>
      <TableCell className="pe-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" aria-label={`Actions for ${m.name}`} className="pointer-coarse:size-11" />}
          >
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {m.role !== "owner" ? (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Role</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={role} onValueChange={(v) => setRole(v as string)}>
                    {ROLES.map((r) => (
                      <DropdownMenuRadioItem key={r.value} value={r.value}>
                        {r.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuItem>
              <MailIcon /> Send email
            </DropdownMenuItem>
            <DropdownMenuItem>Transfer ownership</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <TrashIcon /> Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
