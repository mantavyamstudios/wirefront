// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button, buttonVariants } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Separator } from "@wirefront/ui/separator";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Switch } from "@wirefront/ui/switch";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { CheckIcon, LockIcon, MinusIcon, PlusIcon, SearchIcon, ShieldIcon } from "lucide-react";
import { Fragment, useEffect, useId, useMemo, useState } from "react";
import type { Grant, PermissionMatrix, SetGrantInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("rolePermissions.<key>"). */
export const ROLE_PERMISSIONS_MESSAGES = {
  eyebrow: "Settings · Permissions",
  title: "Roles & permissions",
  summary: "{roles} roles · {capabilities} capabilities across {groups} groups",
  roles: "Roles",
  members: "{count} members",
  createRole: "Create custom role",
  filter: "Filter capabilities",
  filterPlaceholder: "Filter capabilities…",
  differencesOnly: "Show only differences",
  capability: "Capability",
  allowed: "Allowed",
  notAllowed: "Not allowed",
  notApplicable: "Not applicable",
  toggle: "{capability} for {role}",
  locked: "{role} can’t be edited",
  noMatch: "No capabilities match “{query}”.",
  editing: "Editing",
  viewing: "Viewing",
  errorTitle: "Couldn’t load permissions",
  retry: "Try again",
};

export interface RolePermissionsProps {
  /** Roles and capabilities. Leave it out while it loads. */
  data?: PermissionMatrix;
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /**
   * Allow or deny a capability for a role. Cells in the selected role's column
   * become switches; the change shows at once and reverts if this fails.
   * The matrix is read-only without it.
   */
  onSetGrant?: Action<SetGrantInput>;
  /** Where "Create custom role" goes. Hidden when not given. */
  createRoleHref?: string;
  className?: string;
}

const ROLE_TONE: Record<number, string> = {
  1: "bg-category-1/15 text-category-1-foreground",
  2: "bg-category-2/15 text-category-2-foreground",
  3: "bg-category-3/15 text-category-3-foreground",
  4: "bg-category-4/15 text-category-4-foreground",
  5: "bg-category-5/15 text-category-5-foreground",
  6: "bg-category-6/15 text-category-6-foreground",
  7: "bg-category-7/15 text-category-7-foreground",
  8: "bg-category-8/15 text-category-8-foreground",
};
const NEUTRAL_TONE = "bg-foreground/8 text-muted-foreground";
const SKELETON_ROWS = ["r1", "r2", "r3"];
const groupTint = "bg-[color-mix(in_srgb,var(--background),var(--foreground)_2.5%)]";

function GrantMark({ grant, label }: { grant: Grant; label: string }) {
  if (grant === "yes")
    return (
      <span aria-label={label} className="inline-flex size-5 items-center justify-center rounded-full bg-category-2/15 text-category-2-foreground" role="img">
        <CheckIcon className="size-3" strokeWidth={3} />
      </span>
    );
  if (grant === "na")
    return (
      <span aria-label={label} className="inline-flex size-5 items-center justify-center rounded-full bg-foreground/4 text-muted-foreground" role="img">
        <LockIcon className="size-2.5" />
      </span>
    );
  return (
    <span aria-label={label} className="inline-flex size-5 items-center justify-center text-muted-foreground" role="img">
      <MinusIcon className="size-3.5" />
    </span>
  );
}

function RolePermissionsScreen({ data, status = "ready", error, onRetry, onSetGrant, createRoleHref, className }: RolePermissionsProps) {
  const t = useMessages("rolePermissions", ROLE_PERMISSIONS_MESSAGES);
  const id = useId();
  const [groups, setGroups] = useState(data?.groups ?? []);
  useEffect(() => setGroups(data?.groups ?? []), [data]);
  const roles = data?.roles ?? [];
  const [activeRole, setActiveRole] = useState<string>("");
  const active = roles.find((r) => r.id === activeRole) ?? roles.find((r) => !r.locked) ?? roles[0];
  const [query, setQuery] = useState("");
  const [diffOnly, setDiffOnly] = useState(false);
  const grantLabel: Record<Grant, string> = { yes: t.allowed, no: t.notAllowed, na: t.notApplicable };

  const setGrant = useAction(onSetGrant ?? (async () => {}), {
    optimistic: ({ roleId, capabilityId, allowed }) => {
      const apply = (value: Grant) =>
        setGroups((all) => all.map((g) => ({ ...g, capabilities: g.capabilities.map((c) => (c.id === capabilityId ? { ...c, grants: { ...c.grants, [roleId]: value } } : c)) })));
      apply(allowed ? "yes" : "no");
      return () => apply(allowed ? "no" : "yes");
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        capabilities: g.capabilities.filter((cap) => {
          if (q && !cap.label.toLowerCase().includes(q)) return false;
          if (diffOnly) {
            const states = roles.map((r) => cap.grants[r.id] ?? "na");
            if (states.every((s) => s === states[0])) return false;
          }
          return true;
        }),
      }))
      .filter((g) => g.capabilities.length > 0);
  }, [groups, roles, query, diffOnly]);

  const total = groups.reduce((sum, g) => sum + g.capabilities.length, 0);
  const visible = filtered.reduce((sum, g) => sum + g.capabilities.length, 0);
  const ready = status === "ready" && data;
  const editable = Boolean(onSetGrant && active && !active.locked);

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
        <h1 className="mt-1 font-heading text-3xl">{t.title}</h1>
        {ready ? <p className="mt-1.5 text-muted-foreground text-sm">{interpolate(t.summary, { roles: roles.length, capabilities: total, groups: groups.length })}</p> : null}

        {status === "error" ? (
          <div className="mt-8 rounded-xl border border-border/60 p-10 text-center">
            <p className="font-medium">{t.errorTitle}</p>
            {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
            {onRetry ? (
              <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                {t.retry}
              </Button>
            ) : null}
          </div>
        ) : !ready || !active ? (
          <div aria-busy="true" className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
            <Skeleton className="h-64 w-full motion-reduce:animate-none" />
            <div className="flex flex-col gap-3">
              {SKELETON_ROWS.map((key) => (
                <Skeleton className="h-24 w-full motion-reduce:animate-none" key={key} />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside aria-labelledby={`${id}-roles`} className="flex flex-col gap-2">
              <h2 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]" id={`${id}-roles`}>
                {t.roles}
              </h2>
              {/* Every role visible at once: one column on phones, two from sm, a vertical list beside the matrix from lg. */}
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 lg:gap-1">
                {roles.map((role) => {
                  const isActive = role.id === active.id;
                  return (
                    <li className="min-w-0" key={role.id}>
                      <button
                        aria-pressed={isActive}
                        className={cn(
                          "group w-full rounded-lg border px-3 py-2.5 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                          isActive ? "border-foreground/30 bg-foreground/4" : "border-border/60 bg-background/40 hover:border-foreground/20 hover:bg-foreground/2",
                        )}
                        onClick={() => setActiveRole(role.id)}
                        type="button"
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-2">
                            <span aria-hidden className={cn("inline-flex size-5 shrink-0 items-center justify-center rounded", role.category ? ROLE_TONE[role.category] : NEUTRAL_TONE)}>
                              {role.locked ? <LockIcon className="size-3" /> : <ShieldIcon className="size-3" />}
                            </span>
                            <span className="font-medium text-sm">{role.name}</span>
                          </span>{" "}
                          <span className="rounded bg-foreground/6 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground tabular-nums">
                            <span className="sr-only">{interpolate(t.members, { count: role.members })}</span>
                            <span aria-hidden>{role.members}</span>
                          </span>
                        </span>{" "}
                        <span className="mt-1 line-clamp-1 text-muted-foreground text-xs">{role.description}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {createRoleHref ? (
                <>
                  <Separator className="my-3 max-lg:hidden" />
                  <WirefrontLink className={cn(buttonVariants({ size: "sm", variant: "outline" }), "justify-start self-start lg:self-auto")} href={createRoleHref}>
                    <PlusIcon />
                    {t.createRole}
                  </WirefrontLink>
                </>
              ) : null}
            </aside>

            <section className="min-w-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-2 rounded-md border border-border/70 bg-background/40 px-3 focus-within:ring-2 focus-within:ring-ring">
                  <SearchIcon aria-hidden className="size-3.5 opacity-50" />
                  <input
                    aria-label={t.filter}
                    className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground pointer-coarse:h-11"
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.filterPlaceholder}
                    type="search"
                    value={query}
                  />
                  {query ? (
                    <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                      {visible}/{total}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2.5 rounded-md border border-border/60 bg-background/40 px-3 py-1.5 pointer-coarse:min-h-11">
                  <Switch checked={diffOnly} className="h-4! w-7! [--thumb-size:--spacing(3)]" id={`${id}-diff`} onCheckedChange={setDiffOnly} />
                  <label className="cursor-pointer font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]" htmlFor={`${id}-diff`}>
                    {t.differencesOnly}
                  </label>
                </div>
              </div>

              {setGrant.error ? (
                <p className="mt-3 text-destructive-foreground text-xs" role="alert">
                  {setGrant.error}
                </p>
              ) : null}

              <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-background/40">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                      <tr className="border-border/60 border-b">
                        <th
                          className="sticky inset-s-0 z-20 min-w-37.5 bg-background px-3 py-3 text-start font-mono font-normal text-[10px] text-muted-foreground uppercase tracking-[0.25em] sm:min-w-50 sm:px-4 lg:min-w-60"
                          scope="col"
                        >
                          {t.capability}
                        </th>
                        {roles.map((role) => {
                          const isActive = role.id === active.id;
                          return (
                            <th
                              className={cn("w-18 min-w-18 border-border/40 border-s px-1.5 py-3 text-center font-normal transition-colors sm:w-22 sm:px-2", isActive && "bg-foreground/4")}
                              key={role.id}
                              scope="col"
                            >
                              <button aria-pressed={isActive} className="flex w-full flex-col items-center gap-1 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10" onClick={() => setActiveRole(role.id)} type="button">
                                <span className={cn("font-mono text-[10px] uppercase tracking-widest sm:tracking-[0.2em]", isActive ? "text-foreground" : "text-muted-foreground")}>{role.name}</span>
                                <span aria-hidden className="font-mono text-[10px] text-muted-foreground tabular-nums">
                                  {role.members}
                                </span>
                              </button>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((group, gi) => (
                        <Fragment key={group.id}>
                          {/* Section label lives in its own pinned cell (a full-width colSpan cell can't stick), so it stays put while the role columns scroll. */}
                          <tr className="border-border/40 border-b">
                            <th className={cn("sticky inset-s-0 z-10 px-3 py-2 text-start font-mono font-normal text-[10px] text-muted-foreground uppercase tracking-[0.25em] sm:px-4", groupTint)} colSpan={1} scope="colgroup">
                              {group.label}
                            </th>
                            <td aria-hidden className={groupTint} colSpan={roles.length} />
                          </tr>
                          {group.capabilities.map((cap, ci) => {
                            const lastRow = gi === filtered.length - 1 && ci === group.capabilities.length - 1;
                            return (
                              <tr className={cn("group/row transition-colors odd:bg-foreground/[0.012] hover:bg-foreground/4", !lastRow && "border-border/30 border-b")} key={cap.id}>
                                {/* Opaque sticky cell: the row tint is translucent, so scrolled cells would show through. */}
                                <th className="sticky inset-s-0 z-10 min-w-37.5 bg-background px-3 py-2.5 text-start font-normal sm:min-w-50 sm:px-4 lg:min-w-60" scope="row">
                                  <span className="flex flex-col">
                                    <span className="font-medium text-[13px]">{cap.label}</span>
                                    {cap.hint ? <span className="line-clamp-2 text-muted-foreground text-xs">{cap.hint}</span> : null}
                                  </span>
                                </th>
                                {roles.map((role) => {
                                  const grant = cap.grants[role.id] ?? "na";
                                  const isActive = role.id === active.id;
                                  const canEdit = isActive && editable && grant !== "na";
                                  const key = `${role.id}:${cap.id}`;
                                  return (
                                    <td className={cn("border-border/30 border-s px-2 py-2.5 text-center", isActive && "bg-foreground/2.5")} key={role.id}>
                                      {canEdit ? (
                                        <Switch
                                          aria-label={interpolate(t.toggle, { capability: cap.label, role: role.name })}
                                          checked={grant === "yes"}
                                          className="h-4! w-7! [--thumb-size:--spacing(3)]"
                                          disabled={setGrant.isPending(key)}
                                          onCheckedChange={(on) => void setGrant.run({ roleId: role.id, capabilityId: cap.id, allowed: on }, key)}
                                        />
                                      ) : (
                                        <GrantMark grant={grant} label={grantLabel[grant]} />
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </Fragment>
                      ))}
                      {filtered.length === 0 ? (
                        <tr>
                          <td className="px-4 py-12 text-center text-muted-foreground text-sm" colSpan={roles.length + 1}>
                            {interpolate(t.noMatch, { query })}
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>

                <Separator />
                <div className="flex flex-wrap items-center gap-4 px-4 py-2.5">
                  {(["yes", "no", "na"] as const).map((grant) => (
                    <div className="inline-flex items-center gap-1.5" key={grant}>
                      <span aria-hidden className="inline-flex">
                        <GrantMark grant={grant} label={grantLabel[grant]} />
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{grantLabel[grant]}</span>
                    </div>
                  ))}
                  <span className="ms-auto font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                    {active.locked ? interpolate(t.locked, { role: active.name }) : <>{editable ? t.editing : t.viewing} <span className="text-foreground">{active.name}</span></>}
                  </span>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export function RolePermissions(props: RolePermissionsProps) {
  return (
    <ScreenBoundary name="RolePermissions">
      <RolePermissionsScreen {...props} />
    </ScreenBoundary>
  );
}
