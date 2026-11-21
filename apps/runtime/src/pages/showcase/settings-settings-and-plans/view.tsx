// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@wirefront/ui/alert";
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
import { Badge } from "@wirefront/ui/badge";
import { Button, buttonVariants } from "@wirefront/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@wirefront/ui/dropdown-menu";
import { Input } from "@wirefront/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@wirefront/ui/input-group";
import { Label } from "@wirefront/ui/label";
import { cn } from "@wirefront/ui/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@wirefront/ui/select";
import { Spinner } from "@wirefront/ui/spinner";
import { Switch } from "@wirefront/ui/switch";
import { useAction } from "@wirefront/ui/wirefront/action";
import { interpolate, useFormat, useMessages, useWirefront, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  AlertTriangleIcon,
  CheckIcon,
  CopyIcon,
  CreditCardIcon,
  DownloadIcon,
  EllipsisIcon,
  KeyRoundIcon,
  MailIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { type ReactNode, useEffect, useId, useState } from "react";

import {
  type CreateKeyInput,
  InviteInput,
  KeyScope,
  type KeyWithSecret,
  type MemberRole,
  type PlansMember,
  type PlansUsage,
  type SettingsAndPlansData,
  type SettingsTab,
  WorkspaceSettings,
  type WorkspacePreferences,
} from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("settingsAndPlans.<key>"). */
export const SETTINGS_AND_PLANS_MESSAGES = {
  workspaceTitle: "General",
  workspaceDescription: "Your workspace’s name, address and where its data lives.",
  membersTitle: "Members",
  membersDescription: "Who can get in, and what they can touch.",
  keysTitle: "API keys",
  keysDescription: "Secret keys for scripts, CI and server-side calls.",
  billingTitle: "Billing",
  billingDescription: "Your plan, this cycle’s usage, how you pay and past invoices.",
  workspaceSection: "Workspace",
  workspaceSectionDescription: "Shown in the switcher, in emails and on shared links.",
  logo: "Logo",
  logoHelp: "The workspace’s initials.",
  name: "Name",
  url: "URL",
  urlHelp: "Changing it breaks links people have saved.",
  region: "Data region",
  regionHelp: "Moving copies your data and takes about an hour.",
  preferences: "Preferences",
  preferencesDescription: "Defaults that apply to everyone in the workspace.",
  prefAgents: "Members can create agents",
  prefAgentsHint: "Otherwise only admins can publish new agents.",
  prefSso: "Require single sign-on",
  prefSsoHint: "Everyone signs in through your identity provider.",
  prefDigest: "Weekly digest",
  prefDigestHint: "A Monday summary of runs, spend and failures.",
  dangerZone: "Danger zone",
  deleteWorkspace: "Delete workspace",
  deleteHelp: "Removes projects, runs and keys after a 7-day grace period.",
  deleteScheduled: "Scheduled for {date}. Everyone keeps access until then.",
  cancelDeletion: "Cancel deletion",
  deleteEllipsis: "Delete…",
  deleteTitle: "Delete {name}?",
  deleteDescription: "Projects, runs and API keys are removed after 7 days. You can cancel any time before then.",
  typeToConfirm: "Type {slug} to confirm",
  cancel: "Cancel",
  unsavedShort: "Unsaved changes",
  unsavedLong: "You have unsaved changes",
  discard: "Discard",
  save: "Save",
  workspaceSaved: "Workspace saved",
  invitePeople: "Invite people",
  seatsUsed: "{used} of {limit} seats used.",
  email: "Email address",
  emailPlaceholder: "name@company.com",
  roleForInvite: "Role for invite",
  invite: "Invite",
  inviteHint: "Invites expire after 7 days. Resend them from the list.",
  inviteInvalid: "That doesn’t look like a full email address.",
  inviteDuplicate: "{email} is already in this workspace.",
  inviteFull: "All {limit} seats are in use. Remove someone or upgrade to add more.",
  inviteSent: "Invite sent to {email}.",
  inviteResent: "Invite resent to {email}.",
  copiedEmail: "Copied {email}.",
  peopleCount: "{count} people, including pending invites.",
  member: "Member",
  role: "Role",
  lastActive: "Last active",
  actions: "Actions",
  invited: "Invited",
  inviteSentShort: "Invite sent",
  never: "Never",
  now: "Now",
  roleFor: "Role for {name}",
  actionsFor: "Actions for {name}",
  resendInvite: "Resend invite",
  copyEmail: "Copy email",
  revokeInvite: "Revoke invite",
  removeFromWorkspace: "Remove from workspace",
  revokeInviteTitle: "Revoke the invite for {email}?",
  removeTitle: "Remove {name}?",
  revokeInviteDescription: "The link in their email stops working straight away.",
  removeDescription: "They lose access straight away and their seat frees up. Projects they made stay put.",
  remove: "Remove",
  removed: "{name} removed.",
  inviteRevoked: "Invite for {email} revoked.",
  owner: "Owner",
  ownerHint: "Billing and deleting the workspace",
  admin: "Admin",
  adminHint: "Members, keys and settings",
  memberRole: "Member",
  memberHint: "Create and edit projects",
  viewer: "Viewer",
  viewerHint: "Read-only access",
  secretKeys: "Secret keys",
  secretKeysDescription: "Keys act as the workspace. Keep them out of client-side code.",
  createKey: "Create key",
  keyName: "Name",
  keyNamePlaceholder: "e.g. Staging worker",
  scope: "Scope",
  read: "Read",
  readHint: "List and fetch",
  write: "Read & write",
  writeHint: "Create runs, edit data",
  adminScope: "Admin",
  adminScopeHint: "Everything, incl. members",
  keyReady: "{name} is ready. Copy it now: you won’t see it again.",
  copy: "Copy",
  copied: "Copied",
  savedIt: "I’ve saved it",
  neverUsed: "Never used",
  usedWhen: "Used {when}",
  revoke: "Revoke",
  noKeys: "No keys yet",
  noKeysHint: "Create one for your server or CI.",
  revokeKeyTitle: "Revoke {name}?",
  revokeKeyDescription: "Anything still using this key starts getting 401s immediately. This can’t be undone.",
  keepKey: "Keep key",
  revokeKey: "Revoke key",
  paymentFailed: "The {date} payment didn’t go through",
  paymentFailedDetail: "{amount} on the card ending {last4} was declined.",
  paymentReceived: "Payment received",
  paymentReceivedDetail: "{number} is paid. A receipt is on its way to {email}.",
  yourBillingEmail: "your billing email",
  retryPayment: "Retry payment",
  plan: "Plan",
  current: "Current",
  perSeat: "{price} per seat / month · {blurb}",
  changePlan: "Change plan",
  choosePlan: "Choose a plan",
  seatSuffix: " / seat",
  switchTo: "Switch to {plan}",
  nextInvoice: "Next invoice",
  nextInvoiceHelp: "{seats} seats × {price}, charged {date}",
  usageTitle: "Usage this cycle",
  usageDescription: "Resets {date}, {days} days from now.",
  projectedBy: "Projected by {date}",
  runs: "runs",
  estimatedOverage: "Estimated overage",
  overageRate: " at {rate} / 1k",
  paymentMethod: "Payment method",
  cardEnding: "{brand} ending {last4}",
  cardExpires: "Expires {month}/{year} · {holder}",
  noCard: "No card on file.",
  replace: "Replace",
  billingEmail: "Billing email",
  edit: "Edit",
  invoices: "Invoices",
  invoicesSentTo: "Sent to {email} when they’re issued.",
  invoice: "Invoice",
  date: "Date",
  status: "Status",
  amount: "Amount",
  download: "Download",
  downloadInvoice: "Download {number}",
  noInvoices: "No invoices yet. The first one arrives on {date}.",
  paid: "Paid",
  due: "Due",
  failed: "Failed",
};

type Messages = typeof SETTINGS_AND_PLANS_MESSAGES;

export interface SettingsAndPlansProps {
  data: SettingsAndPlansData;
  /** Which part to show. Each tab usually has its own route in your settings. */
  tab: SettingsTab;
  /** Your workspace URL host, shown before the slug. */
  domain: string;
  onSaveWorkspace?: Action<WorkspaceSettings>;
  /** Save the workspace preferences after each toggle (rolled back on failure). */
  onSavePreferences?: Action<WorkspacePreferences>;
  /** Schedule deletion; resolve with when it takes effect. */
  onScheduleDeletion?: Action<void, { scheduledFor: string }>;
  onCancelDeletion?: Action;
  onInvite?: Action<InviteInput, PlansMember>;
  onResendInvite?: Action<string>;
  onChangeRole?: Action<{ memberId: string; role: MemberRole }>;
  onRemoveMember?: Action<string>;
  /** Create a key; resolve with it and its secret, shown once. */
  onCreateKey?: Action<CreateKeyInput, KeyWithSecret>;
  onRevokeKey?: Action<string>;
  onChangePlan?: Action<string>;
  onRetryPayment?: Action<string>;
  /** Your billing provider's portal, for replacing the card and editing the billing email. */
  portalHref?: string;
  className?: string;
}

const spring = { type: "spring", stiffness: 420, damping: 40 } as const;
const easeOut = [0.23, 1, 0.32, 1] as const;
const press = "transition-[scale,background-color,box-shadow] duration-150 ease-out motion-safe:active:scale-[0.97]";
const DAY = 86_400_000;
const AVATAR_HUES = ["from-category-5/60 to-category-8", "from-category-1/35 to-category-1", "from-category-6/35 to-category-2", "from-category-3/35 to-category-7", "from-category-4/35 to-category-4", "from-category-8/60 to-category-5-strong"];
const ASSIGNABLE: MemberRole[] = ["admin", "member", "viewer"];
const PREFS = ["agents", "sso", "digest"] as const;
const INVOICE_TONE = {
  paid: "bg-success/8 text-success-foreground dark:bg-success/16",
  due: "bg-warning/8 text-warning-foreground dark:bg-warning/16",
  failed: "bg-destructive/8 text-destructive-foreground dark:bg-destructive/16",
} as const;
const memberGrid = "sm:grid-cols-[minmax(0,1fr)_8rem_6.5rem_2rem]";
const keyGrid = "sm:grid-cols-[minmax(0,1fr)_6.5rem_6.5rem_2rem]";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function hueFor(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_HUES[hash % AVATAR_HUES.length];
}

function useCalm() {
  return Boolean(useReducedMotion());
}

function RollingNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const reduce = useCalm();
  const mv = useMotionValue(value);
  const text = useTransform(mv, format);
  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.45, ease: easeOut });
    return () => controls.stop();
  }, [value, reduce, mv]);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

function Collapse({ show, children }: { show: boolean; children: ReactNode }) {
  const reduce = useCalm();
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          animate={{ height: "auto", opacity: 1 }}
          className="overflow-hidden"
          exit={{ height: 0, opacity: 0 }}
          initial={{ height: 0, opacity: 0 }}
          transition={reduce ? { duration: 0 } : spring}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Swap({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  const reduce = useCalm();
  return (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.span
        animate={{ opacity: 1, y: 0 }}
        className={cn("block", className)}
        exit={{ opacity: 0, y: reduce ? 0 : -3 }}
        initial={{ opacity: 0, y: reduce ? 0 : 3 }}
        key={id}
        transition={{ duration: 0.16, ease: easeOut }}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}

function Section({ title, description, action, children }: { title: ReactNode; description?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-medium text-sm">{title}</h2>
          {description ? <p className="mt-0.5 text-pretty text-muted-foreground text-sm">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Rows({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mt-3 divide-y overflow-hidden rounded-xl border bg-card", className)}>{children}</div>;
}

function Row({ label, help, htmlFor, children, wide }: { label: ReactNode; help?: ReactNode; htmlFor?: string; children?: ReactNode; wide?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-3.5">
      <div className="min-w-0 flex-1 basis-44">
        {htmlFor ? (
          <Label className="font-medium text-sm" htmlFor={htmlFor}>
            {label}
          </Label>
        ) : (
          <p className="font-medium text-sm">{label}</p>
        )}
        {help ? <div className="mt-0.5 text-pretty text-muted-foreground text-xs">{help}</div> : null}
      </div>
      {children ? <div className={cn("flex shrink-0 items-center gap-2", wide && "w-full sm:w-64")}>{children}</div> : null}
    </div>
  );
}

function TableHeadRow({ className, children }: { className: string; children: ReactNode }) {
  return <div className={cn("hidden items-center gap-4 bg-muted/30 px-4 py-2 font-medium text-muted-foreground text-xs sm:grid", className)}>{children}</div>;
}

function FieldError({ id, children }: { id: string; children: string | null }) {
  return (
    <Collapse show={Boolean(children)}>
      <p className="pt-1.5 text-destructive-foreground text-xs" id={id}>
        {children}
      </p>
    </Collapse>
  );
}

function CopyButton({ text, t }: { text: string; t: Messages }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <Button className={cn(press, "min-w-21")} onClick={() => void navigator.clipboard?.writeText(text).then(() => setCopied(true))} size="sm" variant="outline">
      <Swap className="inline-flex" id={copied ? "y" : "n"}>
        {copied ? <CheckIcon className="size-3.5 text-success-foreground" /> : <CopyIcon className="size-3.5" />}
      </Swap>
      {copied ? t.copied : t.copy}
    </Button>
  );
}

/** A Base UI radio card: a picker option with a label and a hint. */
function OptionCard({ value, label, hint, extra }: { value: string; label: ReactNode; hint: string; extra?: ReactNode }) {
  return (
    <Radio.Root
      className={cn(
        "relative flex cursor-pointer flex-col items-start gap-0.5 rounded-lg border bg-background px-3 py-2.5 text-start outline-none hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring data-checked:border-foreground data-checked:ring-1 data-checked:ring-foreground data-checked:hover:bg-background",
        press,
      )}
      value={value}
    >
      <span className="flex w-full items-center justify-between gap-2 font-medium text-sm">{label}</span>
      {extra}
      <span className="text-pretty text-muted-foreground text-xs">{hint}</span>
    </Radio.Root>
  );
}

function WorkspacePanel({
  data,
  draft,
  setDraft,
  domain,
  onSavePreferences,
  onScheduleDeletion,
  onCancelDeletion,
  t,
}: {
  data: SettingsAndPlansData;
  draft: WorkspaceSettings;
  setDraft: (fn: (d: WorkspaceSettings) => WorkspaceSettings) => void;
  domain: string;
  onSavePreferences?: Action<WorkspacePreferences>;
  onScheduleDeletion?: Action<void, { scheduledFor: string }>;
  onCancelDeletion?: Action;
  t: Messages;
}) {
  const format = useFormat();
  const ids = useId();
  const [prefs, setPrefs] = useState(data.preferences);
  const [scheduledFor, setScheduledFor] = useState(data.deletionScheduledFor);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const parsed = WorkspaceSettings.safeParse(draft);
  const errorFor = (field: "name" | "slug") => (parsed.success ? null : (parsed.error.issues.find((i) => i.path[0] === field)?.message ?? null));

  const savePrefs = useAction(onSavePreferences ?? (async () => {}), {
    optimistic: (next) => {
      const before = prefs;
      setPrefs(next);
      return () => setPrefs(before);
    },
  });
  const schedule = useAction(onScheduleDeletion ?? (async () => {}), {
    onSuccess: (result) => {
      setConfirmOpen(false);
      if (result) setScheduledFor(result.scheduledFor);
    },
  });
  const cancelDeletion = useAction(onCancelDeletion ?? (async () => {}), { onSuccess: () => setScheduledFor(null) });
  const actionError = savePrefs.error ?? schedule.error ?? cancelDeletion.error;
  const prefLabel = { agents: [t.prefAgents, t.prefAgentsHint], sso: [t.prefSso, t.prefSsoHint], digest: [t.prefDigest, t.prefDigestHint] } as const;

  return (
    <>
      {actionError ? (
        <p className="mt-6 text-destructive-foreground text-sm" role="alert">
          {actionError}
        </p>
      ) : null}
      <Section description={t.workspaceSectionDescription} title={t.workspaceSection}>
        <Rows>
          <Row help={t.logoHelp} label={t.logo}>
            <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-foreground font-semibold text-background text-xs">
              {initials(draft.name || "?")}
            </span>
          </Row>
          <Row htmlFor={`${ids}-name`} label={t.name} wide>
            <div className="w-full">
              <Input
                aria-describedby={errorFor("name") ? `${ids}-name-error` : undefined}
                aria-invalid={Boolean(errorFor("name")) || undefined}
                id={`${ids}-name`}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                value={draft.name}
              />
              <FieldError id={`${ids}-name-error`}>{errorFor("name")}</FieldError>
            </div>
          </Row>
          <Row help={t.urlHelp} htmlFor={`${ids}-slug`} label={t.url} wide>
            <div className="w-full">
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>{domain}/</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  aria-describedby={errorFor("slug") ? `${ids}-slug-error` : undefined}
                  aria-invalid={Boolean(errorFor("slug")) || undefined}
                  id={`${ids}-slug`}
                  onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                  value={draft.slug}
                />
              </InputGroup>
              <FieldError id={`${ids}-slug-error`}>{errorFor("slug")}</FieldError>
            </div>
          </Row>
          <Row help={t.regionHelp} label={t.region} wide>
            <Select items={data.regions} onValueChange={(v) => v && setDraft((d) => ({ ...d, region: v as string }))} value={draft.region}>
              <SelectTrigger aria-label={t.region} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {data.regions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
        </Rows>
      </Section>

      <Section description={t.preferencesDescription} title={t.preferences}>
        <Rows>
          {PREFS.map((key) => (
            <div className="flex items-center gap-4 px-4 py-3.5" key={key}>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Label className="cursor-pointer font-medium text-sm" htmlFor={`${ids}-${key}`}>
                  {prefLabel[key][0]}
                </Label>
                <span className="text-pretty text-muted-foreground text-xs">{prefLabel[key][1]}</span>
              </span>
              <Switch
                checked={prefs[key]}
                disabled={!onSavePreferences}
                id={`${ids}-${key}`}
                onCheckedChange={(v) => void savePrefs.run({ ...prefs, [key]: v })}
              />
            </div>
          ))}
        </Rows>
      </Section>

      {onScheduleDeletion ? (
        <Section title={t.dangerZone}>
          <Rows className="border-destructive/24">
            <Row
              help={
                <Swap id={scheduledFor ? "scheduled" : "idle"}>
                  {scheduledFor ? (
                    <span className="text-destructive-foreground">{interpolate(t.deleteScheduled, { date: format.date(scheduledFor, { month: "short", day: "numeric" }) })}</span>
                  ) : (
                    t.deleteHelp
                  )}
                </Swap>
              }
              label={t.deleteWorkspace}
            >
              {scheduledFor ? (
                onCancelDeletion ? (
                  <Button aria-busy={cancelDeletion.isPending()} className={press} disabled={cancelDeletion.isPending()} onClick={() => void cancelDeletion.run()} size="sm" variant="outline">
                    {t.cancelDeletion}
                  </Button>
                ) : null
              ) : (
                <Button
                  className={cn(press, "text-destructive-foreground")}
                  onClick={() => {
                    setTyped("");
                    setConfirmOpen(true);
                  }}
                  size="sm"
                  variant="destructive"
                >
                  {t.deleteEllipsis}
                </Button>
              )}
            </Row>
          </Rows>
        </Section>
      ) : null}

      <AlertDialog onOpenChange={(open) => !schedule.isPending() && setConfirmOpen(open)} open={confirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{interpolate(t.deleteTitle, { name: data.workspace.name })}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteDescription}</AlertDialogDescription>
            <div className="mt-2 flex flex-col gap-2">
              <Label htmlFor={`${ids}-confirm`}>{interpolate(t.typeToConfirm, { slug: data.workspace.slug })}</Label>
              <Input autoComplete="off" className="font-mono" id={`${ids}-confirm`} onChange={(e) => setTyped(e.target.value)} value={typed} />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={schedule.isPending()} render={<Button variant="ghost" />}>
              {t.cancel}
            </AlertDialogCancel>
            <Button
              aria-busy={schedule.isPending()}
              className="text-destructive-foreground"
              disabled={typed !== data.workspace.slug || schedule.isPending()}
              onClick={() => void schedule.run()}
              variant="destructive"
            >
              {schedule.isPending() ? <Spinner data-icon="inline-start" /> : null}
              {t.deleteWorkspace}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function RoleSelect({ member, onRole, t }: { member: PlansMember; onRole?: (role: MemberRole) => void; t: Messages }) {
  const label = (r: MemberRole) => (r === "member" ? t.memberRole : t[r]);
  if (member.role === "owner" || !onRole) return <span className="inline-flex h-7 items-center px-2.5 text-muted-foreground text-sm">{label(member.role)}</span>;
  return (
    <Select items={ASSIGNABLE.map((r) => ({ value: r, label: label(r) }))} onValueChange={(v) => v && onRole(v as MemberRole)} value={member.role}>
      <SelectTrigger aria-label={interpolate(t.roleFor, { name: member.name })} className="w-32 min-w-0" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false} className="w-60">
        {ASSIGNABLE.map((r) => (
          <SelectItem className="items-start py-1.5 [&>span:first-child]:mt-0.5" key={r} value={r}>
            <span className="flex flex-col">
              <span className="font-medium">{label(r)}</span>
              <span className="text-muted-foreground text-xs">{t[`${r}Hint`]}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MembersPanel({
  data,
  onInvite,
  onResendInvite,
  onChangeRole,
  onRemoveMember,
  t,
}: {
  data: SettingsAndPlansData;
  onInvite?: Action<InviteInput, PlansMember>;
  onResendInvite?: Action<string>;
  onChangeRole?: Action<{ memberId: string; role: MemberRole }>;
  onRemoveMember?: Action<string>;
  t: Messages;
}) {
  const format = useFormat();
  const { now } = useWirefront();
  const reduce = useCalm();
  const hintId = useId();
  const [members, setMembers] = useState(data.members);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteInput["role"]>("member");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [removing, setRemoving] = useState<PlansMember | null>(null);
  const full = members.length >= data.seatLimit;

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  const invite = useAction(onInvite ?? (async () => {}), {
    onSuccess: (created, input) => {
      if (created) setMembers((m) => [...m, created]);
      setNotice(interpolate(t.inviteSent, { email: input.email }));
      setEmail("");
    },
  });
  const resend = useAction(onResendInvite ?? (async () => {}), {
    onSuccess: (_, id) => {
      const m = members.find((x) => x.id === id);
      if (m) setNotice(interpolate(t.inviteResent, { email: m.email }));
    },
  });
  const changeRole = useAction(onChangeRole ?? (async () => {}), {
    optimistic: ({ memberId, role: next }) => {
      const before = members.find((m) => m.id === memberId)?.role;
      setMembers((all) => all.map((m) => (m.id === memberId ? { ...m, role: next } : m)));
      return () => setMembers((all) => all.map((m) => (m.id === memberId && before ? { ...m, role: before } : m)));
    },
  });
  const remove = useAction(onRemoveMember ?? (async () => {}), {
    onSuccess: (_, id) => {
      const target = members.find((m) => m.id === id);
      setRemoving(null);
      setMembers((all) => all.filter((m) => m.id !== id));
      if (target) setNotice(target.invited ? interpolate(t.inviteRevoked, { email: target.email }) : interpolate(t.removed, { name: target.name }));
    },
  });
  const actionError = invite.error ?? resend.error ?? changeRole.error ?? remove.error;

  const submit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    const parsed = InviteInput.safeParse({ email: address, role });
    if (!parsed.success) return setError(t.inviteInvalid);
    if (members.some((m) => m.email.toLowerCase() === address)) return setError(interpolate(t.inviteDuplicate, { email: address }));
    if (full) return setError(interpolate(t.inviteFull, { limit: data.seatLimit }));
    setError(null);
    setNotice(null);
    void invite.run(parsed.data);
  };

  const shown = error ?? actionError;
  const hint = shown
    ? { key: `e-${shown}`, tone: "text-destructive-foreground", text: shown }
    : notice
      ? { key: `n-${notice}`, tone: "text-success-foreground", text: notice }
      : { key: "idle", tone: "text-muted-foreground", text: t.inviteHint };
  const lastActive = (m: PlansMember) =>
    m.invited ? t.inviteSentShort : !m.lastActiveAt ? t.never : now().getTime() - Date.parse(m.lastActiveAt) < 5 * 60_000 ? t.now : format.relative(m.lastActiveAt);
  const roleLabel = (r: MemberRole) => (r === "member" ? t.memberRole : t[r]);

  return (
    <>
      {onInvite ? (
        <Section
          description={interpolate(t.seatsUsed, { used: members.length, limit: data.seatLimit })}
          title={t.invitePeople}
        >
          <Rows>
            <form className="flex flex-col gap-2 p-3 sm:flex-row" noValidate onSubmit={submit}>
              <Input
                aria-describedby={hintId}
                aria-invalid={Boolean(error) || undefined}
                aria-label={t.email}
                className="flex-1"
                disabled={invite.isPending()}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={t.emailPlaceholder}
                type="email"
                value={email}
              />
              <div className="flex gap-2">
                <Select items={ASSIGNABLE.map((r) => ({ value: r, label: roleLabel(r) }))} onValueChange={(v) => v && setRole(v as InviteInput["role"])} value={role}>
                  <SelectTrigger aria-label={t.roleForInvite} className="w-28 min-w-0">
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
                <Button aria-busy={invite.isPending()} className={cn(press, "flex-1 sm:flex-none")} disabled={invite.isPending()} type="submit">
                  {invite.isPending() ? <Spinner data-icon="inline-start" /> : <MailIcon />}
                  {t.invite}
                </Button>
              </div>
            </form>
          </Rows>
          <div aria-live="polite" className="mt-2 min-h-4 px-1 text-xs" id={hintId}>
            <Swap className={cn("text-pretty", hint.tone)} id={hint.key}>
              {hint.text}
            </Swap>
          </div>
        </Section>
      ) : null}

      <Section description={interpolate(t.peopleCount, { count: members.length })} title={t.membersTitle}>
        <Rows>
          <TableHeadRow className={memberGrid}>
            <span>{t.member}</span>
            <span>{t.role}</span>
            <span>{t.lastActive}</span>
            <span className="sr-only">{t.actions}</span>
          </TableHeadRow>
          <AnimatePresence initial={false}>
            {members.map((m) => (
              <motion.div
                animate={{ opacity: 1, height: "auto" }}
                className="overflow-hidden"
                exit={{ opacity: 0, height: 0 }}
                initial={reduce ? false : { opacity: 0, height: 0 }}
                key={m.id}
                transition={reduce ? { duration: 0 } : spring}
              >
                <div className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 sm:gap-x-4", memberGrid)}>
                  <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className={cn("bg-gradient-to-br font-medium text-white text-xs", hueFor(m.id))}>{initials(m.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="flex min-w-0 items-center gap-2 font-medium text-sm">
                        <span className="truncate">{m.name}</span>
                        {m.invited ? (
                          <Badge className="h-4.5 rounded-sm bg-info/8 px-1 text-[0.625rem] text-info-foreground dark:bg-info/16" variant="secondary">
                            {t.invited}
                          </Badge>
                        ) : null}
                      </p>
                      <p className="truncate text-muted-foreground text-xs">{m.email}</p>
                    </div>
                  </div>
                  <div className="col-start-1 row-start-2 ps-11 sm:col-start-2 sm:row-start-1 sm:ps-0">
                    <RoleSelect member={m} onRole={onChangeRole ? (next) => void changeRole.run({ memberId: m.id, role: next }, m.id) : undefined} t={t} />
                  </div>
                  <span className="col-start-2 row-start-2 truncate text-end text-muted-foreground text-xs sm:col-start-3 sm:row-start-1 sm:text-start sm:text-sm">
                    {lastActive(m)}
                  </span>
                  <div className="col-start-2 row-start-1 flex justify-end sm:col-start-4">
                    {m.role === "owner" ? (
                      <span aria-hidden className="size-8 sm:size-7" />
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button aria-label={interpolate(t.actionsFor, { name: m.name })} size="icon-sm" variant="ghost" />}>
                          {changeRole.isPending(m.id) || remove.isPending(m.id) ? <Spinner /> : <EllipsisIcon />}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {m.invited && onResendInvite ? <DropdownMenuItem onClick={() => void resend.run(m.id, m.id)}>{t.resendInvite}</DropdownMenuItem> : null}
                          <DropdownMenuItem
                            onClick={() =>
                              void navigator.clipboard?.writeText(m.email).then(() => setNotice(interpolate(t.copiedEmail, { email: m.email })))
                            }
                          >
                            <CopyIcon />
                            {t.copyEmail}
                          </DropdownMenuItem>
                          {onRemoveMember ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setRemoving(m)} variant="destructive">
                                <Trash2Icon />
                                {m.invited ? t.revokeInvite : t.removeFromWorkspace}
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </Rows>
      </Section>

      <AlertDialog onOpenChange={(open) => !open && !remove.isPending() && setRemoving(null)} open={Boolean(removing)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {removing?.invited ? interpolate(t.revokeInviteTitle, { email: removing.email }) : interpolate(t.removeTitle, { name: removing?.name ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>{removing?.invited ? t.revokeInviteDescription : t.removeDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending()} render={<Button variant="ghost" />}>
              {t.cancel}
            </AlertDialogCancel>
            <Button
              aria-busy={remove.isPending()}
              className="text-destructive-foreground"
              disabled={remove.isPending()}
              onClick={() => removing && void remove.run(removing.id, removing.id)}
              variant="destructive"
            >
              {remove.isPending() ? <Spinner data-icon="inline-start" /> : null}
              {removing?.invited ? t.revokeInvite : t.remove}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function KeysPanel({
  data,
  onCreateKey,
  onRevokeKey,
  t,
}: {
  data: SettingsAndPlansData;
  onCreateKey?: Action<CreateKeyInput, KeyWithSecret>;
  onRevokeKey?: Action<string>;
  t: Messages;
}) {
  const format = useFormat();
  const reduce = useCalm();
  const ids = useId();
  const [keys, setKeys] = useState(data.keys);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [scope, setScope] = useState<KeyScope>("read");
  const [fresh, setFresh] = useState<KeyWithSecret | null>(null);
  const [revoking, setRevoking] = useState<(typeof keys)[number] | null>(null);

  const create = useAction(onCreateKey ?? (async () => {}), {
    onSuccess: (created) => {
      if (!created) return;
      setFresh(created);
      setKeys((k) => [created.key, ...k]);
      setCreating(false);
      setName("");
      setScope("read");
    },
  });
  const revoke = useAction(onRevokeKey ?? (async () => {}), {
    onSuccess: (_, id) => {
      setRevoking(null);
      setKeys((all) => all.filter((k) => k.id !== id));
      if (fresh?.key.id === id) setFresh(null);
    },
  });
  const scopeLabel = (s: KeyScope) => (s === "read" ? t.read : s === "write" ? t.write : t.adminScope);
  const scopeHint = (s: KeyScope) => (s === "read" ? t.readHint : s === "write" ? t.writeHint : t.adminScopeHint);
  const scopeTone = (s: KeyScope) =>
    s === "admin" ? "bg-warning/8 text-warning-foreground dark:bg-warning/16" : s === "write" ? "bg-info/8 text-info-foreground dark:bg-info/16" : undefined;
  const actionError = create.error ?? revoke.error;

  return (
    <>
      <Section
        action={
          onCreateKey ? (
            <Button className={press} disabled={creating || Boolean(fresh)} onClick={() => setCreating(true)} size="sm">
              <PlusIcon />
              {t.createKey}
            </Button>
          ) : null
        }
        description={t.secretKeysDescription}
        title={t.secretKeys}
      >
        {actionError ? (
          <p className="mt-3 text-destructive-foreground text-sm" role="alert">
            {actionError}
          </p>
        ) : null}
        <Rows>
          <Collapse show={creating}>
            <form
              className="flex flex-col gap-4 bg-muted/30 p-4"
              onKeyDown={(e) => e.key === "Escape" && setCreating(false)}
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim()) void create.run({ name: name.trim(), scope });
              }}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${ids}-name`}>{t.keyName}</Label>
                <Input id={`${ids}-name`} onChange={(e) => setName(e.target.value)} placeholder={t.keyNamePlaceholder} value={name} />
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-medium text-sm" id={`${ids}-scope`}>
                  {t.scope}
                </span>
                <RadioGroup aria-labelledby={`${ids}-scope`} className="grid gap-2 sm:grid-cols-3" onValueChange={(v) => setScope(v as KeyScope)} value={scope}>
                  {KeyScope.options.map((s) => (
                    <OptionCard hint={scopeHint(s)} key={s} label={scopeLabel(s)} value={s} />
                  ))}
                </RadioGroup>
              </div>
              <div className="flex justify-end gap-2">
                <Button className={press} disabled={create.isPending()} onClick={() => setCreating(false)} size="sm" variant="ghost">
                  {t.cancel}
                </Button>
                <Button aria-busy={create.isPending()} className={press} disabled={!name.trim() || create.isPending()} size="sm" type="submit">
                  {create.isPending() ? <Spinner data-icon="inline-start" /> : null}
                  {t.createKey}
                </Button>
              </div>
            </form>
          </Collapse>
          <Collapse show={Boolean(fresh)}>
            {fresh ? (
              <div className="flex flex-col gap-3 bg-success/6 p-4">
                <p className="flex items-start gap-2 text-sm">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-success-foreground" />
                  <span className="text-pretty">{interpolate(t.keyReady, { name: fresh.key.name })}</span>
                </p>
                <div className="flex items-center gap-2 rounded-lg border bg-background p-1 ps-3">
                  <code className="min-w-0 flex-1 truncate font-mono text-xs">{fresh.secret}</code>
                  <CopyButton t={t} text={fresh.secret} />
                </div>
                <Button className={cn(press, "self-end")} onClick={() => setFresh(null)} size="sm">
                  {t.savedIt}
                </Button>
              </div>
            ) : null}
          </Collapse>
          <TableHeadRow className={keyGrid}>
            <span>{t.keyName}</span>
            <span>{t.scope}</span>
            <span>{t.lastActive}</span>
            <span className="sr-only">{t.actions}</span>
          </TableHeadRow>
          <AnimatePresence initial={false}>
            {keys.map((k) => {
              const used = k.lastUsedAt ? format.relative(k.lastUsedAt) : null;
              return (
                <motion.div
                  animate={{ opacity: 1, height: "auto" }}
                  className="overflow-hidden"
                  exit={{ opacity: 0, height: 0 }}
                  initial={reduce ? false : { opacity: 0, height: 0 }}
                  key={k.id}
                  transition={reduce ? { duration: 0 } : spring}
                >
                  <div className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-4 py-3 sm:gap-x-4", keyGrid)}>
                    <div className="col-start-1 row-start-1 min-w-0">
                      <p className="truncate font-medium text-sm">{k.name}</p>
                      <code className="block truncate font-mono text-muted-foreground text-xs">
                        {k.prefix}…{k.last4}
                      </code>
                    </div>
                    <div className="col-start-1 row-start-2 flex items-center gap-2 sm:col-start-2 sm:row-start-1">
                      <Badge className={cn(scopeTone(k.scope), "h-4.5 rounded-sm px-1 text-[0.625rem]")} variant="secondary">
                        {scopeLabel(k.scope)}
                      </Badge>
                      <span className="text-muted-foreground text-xs sm:hidden">{used ? interpolate(t.usedWhen, { when: used }) : t.neverUsed}</span>
                    </div>
                    <span className="hidden truncate text-muted-foreground text-sm sm:col-start-3 sm:row-start-1 sm:block">{used ?? t.never}</span>
                    <div className="col-start-2 row-start-1 flex justify-end sm:col-start-4">
                      {onRevokeKey ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button aria-label={interpolate(t.actionsFor, { name: k.name })} size="icon-sm" variant="ghost" />}>
                            {revoke.isPending(k.id) ? <Spinner /> : <EllipsisIcon />}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setRevoking(k)} variant="destructive">
                              <Trash2Icon />
                              {t.revoke}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {keys.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
              <KeyRoundIcon className="size-4 text-muted-foreground" />
              <p className="font-medium text-sm">{t.noKeys}</p>
              <p className="text-muted-foreground text-xs">{t.noKeysHint}</p>
            </div>
          ) : null}
        </Rows>
      </Section>

      <AlertDialog onOpenChange={(open) => !open && !revoke.isPending() && setRevoking(null)} open={Boolean(revoking)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{interpolate(t.revokeKeyTitle, { name: revoking?.name ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t.revokeKeyDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoke.isPending()} render={<Button variant="ghost" />}>
              {t.keepKey}
            </AlertDialogCancel>
            <Button
              aria-busy={revoke.isPending()}
              className="text-destructive-foreground"
              disabled={revoke.isPending()}
              onClick={() => revoking && void revoke.run(revoking.id, revoking.id)}
              variant="destructive"
            >
              {revoke.isPending() ? <Spinner data-icon="inline-start" /> : null}
              {t.revokeKey}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function UsageRow({ item }: { item: PlansUsage }) {
  const reduce = useCalm();
  const format = useFormat();
  const pct = Math.min(100, (item.used / item.limit) * 100);
  const projPct = item.projected ? Math.min(100, (item.projected / item.limit) * 100) : 0;
  const over = (item.projected ?? 0) > item.limit;
  const fmt = (n: number) => format.number(n, item.unit ? { minimumFractionDigits: 1, maximumFractionDigits: 1 } : { maximumFractionDigits: 0 });
  const fill = { duration: reduce ? 0 : 0.6, ease: easeOut };
  return (
    <div className="flex flex-col gap-2.5 px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium text-sm">{item.label}</span>
        <span className="text-sm tabular-nums">
          <RollingNumber format={fmt} value={item.used} />
          <span className="text-muted-foreground">
            {" "}
            / {format.number(item.limit)}
            {item.unit ? ` ${item.unit}` : ""}
          </span>
        </span>
      </div>
      <meter className="sr-only" max={item.limit} min={0} value={item.used}>
        {item.label}
      </meter>
      <div aria-hidden className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        {projPct > pct ? (
          <motion.div
            animate={{ scaleX: 1 }}
            className={cn("absolute inset-y-0 start-0 origin-left rounded-full", over ? "bg-warning/32" : "bg-foreground/12")}
            initial={false}
            style={{ width: `${projPct}%` }}
            transition={{ ...fill, delay: reduce ? 0 : 0.15 }}
          />
        ) : null}
        <motion.div
          animate={{ scaleX: 1 }}
          className={cn("absolute inset-y-0 start-0 origin-left rounded-full", pct >= 85 ? "bg-warning" : "bg-primary")}
          initial={false}
          style={{ width: `${pct}%` }}
          transition={fill}
        />
      </div>
    </div>
  );
}

function BillingPanel({
  data,
  onChangePlan,
  onRetryPayment,
  portalHref,
  t,
}: {
  data: SettingsAndPlansData;
  onChangePlan?: Action<string>;
  onRetryPayment?: Action<string>;
  portalHref?: string;
  t: Messages;
}) {
  const format = useFormat();
  const { now } = useWirefront();
  const pickerId = useId();
  const [planId, setPlanId] = useState(data.currentPlanId);
  const [picking, setPicking] = useState(false);
  const [choice, setChoice] = useState(data.currentPlanId);
  const [invoices, setInvoices] = useState(data.invoices);
  const [recovered, setRecovered] = useState<(typeof invoices)[number] | null>(null);
  const plan = data.plans.find((p) => p.id === planId) ?? data.plans[0];
  const failed = invoices.find((i) => i.status === "failed");
  const runs = data.usage.find((u) => u.projected !== undefined);
  const overRuns = runs?.projected ? Math.max(0, runs.projected - runs.limit) : 0;
  const money = (n: number, digits = 2) => format.money(n, data.currency, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const day = (iso: string, withYear = false) => format.date(iso, { month: "short", day: "numeric", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" });
  const daysLeft = Math.max(0, Math.ceil((Date.parse(data.renewsAt) - now().getTime()) / DAY));
  const seats = data.members.length;

  const switchPlan = useAction(onChangePlan ?? (async () => {}), {
    onSuccess: (_, id) => {
      setPlanId(id);
      setPicking(false);
    },
  });
  const retry = useAction(onRetryPayment ?? (async () => {}), {
    onSuccess: (_, id) => {
      const inv = invoices.find((i) => i.id === id);
      setInvoices((all) => all.map((i) => (i.id === id ? { ...i, status: "paid" } : i)));
      if (inv) setRecovered(inv);
    },
  });
  useEffect(() => {
    if (!recovered) return;
    const timer = setTimeout(() => setRecovered(null), 2800);
    return () => clearTimeout(timer);
  }, [recovered]);

  const banner = failed ? { key: "failed" as const, invoice: failed } : recovered ? { key: "recovered" as const, invoice: recovered } : null;
  const actionError = switchPlan.error ?? retry.error;
  if (!plan) return null;

  return (
    <>
      {actionError ? (
        <p className="mt-6 text-destructive-foreground text-sm" role="alert">
          {actionError}
        </p>
      ) : null}
      <Collapse show={Boolean(banner)}>
        {banner ? (
          <div className="pt-8">
            <Alert
              className={banner.key === "failed" ? undefined : "border-success/30 bg-success/8 text-success-foreground [&>svg]:text-success"}
              variant={banner.key === "failed" ? "destructive" : "default"}
            >
              {banner.key === "failed" ? <AlertTriangleIcon /> : <CheckIcon />}
              <AlertTitle>{banner.key === "failed" ? interpolate(t.paymentFailed, { date: day(banner.invoice.issuedAt) }) : t.paymentReceived}</AlertTitle>
              <AlertDescription>
                <p className="text-pretty">
                  {banner.key === "failed"
                    ? interpolate(t.paymentFailedDetail, { amount: money(banner.invoice.amount), last4: data.card?.last4 ?? "" })
                    : interpolate(t.paymentReceivedDetail, { number: banner.invoice.number, email: data.billingEmail ?? t.yourBillingEmail })}
                </p>
              </AlertDescription>
              {banner.key === "failed" && onRetryPayment ? (
                <AlertAction>
                  <Button aria-busy={retry.isPending()} className={press} disabled={retry.isPending()} onClick={() => void retry.run(banner.invoice.id)} size="sm" variant="outline">
                    {retry.isPending() ? <Spinner data-icon="inline-start" /> : null}
                    {t.retryPayment}
                  </Button>
                </AlertAction>
              ) : null}
            </Alert>
          </div>
        ) : null}
      </Collapse>

      <Section title={t.plan}>
        <Rows>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4">
            <div className="min-w-0 flex-1 basis-44">
              <p className="flex items-center gap-2">
                <span className="font-semibold text-base tracking-tight">{plan.name}</span>
                <Badge className="h-4.5 rounded-sm px-1 text-[0.625rem]" variant="secondary">
                  {t.current}
                </Badge>
              </p>
              <p className="mt-0.5 text-muted-foreground text-xs">{interpolate(t.perSeat, { price: money(plan.pricePerSeat, 0), blurb: plan.blurb })}</p>
            </div>
            {onChangePlan && !picking ? (
              <Button
                className={press}
                onClick={() => {
                  const next = data.plans[Math.min(data.plans.length - 1, data.plans.findIndex((p) => p.id === planId) + 1)];
                  setChoice(next?.id ?? planId);
                  setPicking(true);
                }}
                size="sm"
                variant="outline"
              >
                {t.changePlan}
              </Button>
            ) : null}
          </div>
          <Collapse show={picking}>
            <div className="flex flex-col gap-3 bg-muted/30 p-4">
              <RadioGroup aria-label={t.choosePlan} className="grid gap-2 sm:grid-cols-3" id={pickerId} onValueChange={(v) => setChoice(v as string)} value={choice}>
                {data.plans.map((p) => (
                  <OptionCard
                    extra={
                      <span className="font-medium text-sm tabular-nums">
                        {money(p.pricePerSeat, 0)}
                        <span className="font-normal text-muted-foreground text-xs">{t.seatSuffix}</span>
                      </span>
                    }
                    hint={p.blurb}
                    key={p.id}
                    label={
                      <>
                        {p.name}
                        {p.id === planId ? <span className="font-normal text-muted-foreground text-xs">{t.current}</span> : null}
                      </>
                    }
                    value={p.id}
                  />
                ))}
              </RadioGroup>
              <div className="flex justify-end gap-2">
                <Button className={press} disabled={switchPlan.isPending()} onClick={() => setPicking(false)} size="sm" variant="ghost">
                  {t.cancel}
                </Button>
                <Button
                  aria-busy={switchPlan.isPending()}
                  className={cn(press, "min-w-32")}
                  disabled={choice === planId || switchPlan.isPending()}
                  onClick={() => void switchPlan.run(choice)}
                  size="sm"
                >
                  {switchPlan.isPending() ? <Spinner data-icon="inline-start" /> : null}
                  {interpolate(t.switchTo, { plan: data.plans.find((p) => p.id === choice)?.name ?? "" })}
                </Button>
              </div>
            </div>
          </Collapse>
          <Row help={interpolate(t.nextInvoiceHelp, { seats, price: money(plan.pricePerSeat, 0), date: day(data.renewsAt) })} label={t.nextInvoice}>
            <span className="font-medium text-sm">
              <RollingNumber format={(n) => money(n)} value={plan.pricePerSeat * seats} />
            </span>
          </Row>
        </Rows>
      </Section>

      <Section description={interpolate(t.usageDescription, { date: day(data.renewsAt), days: daysLeft })} title={t.usageTitle}>
        <Rows>
          {data.usage.map((u) => (
            <UsageRow item={u} key={u.id} />
          ))}
          {runs?.projected !== undefined ? (
            <div className="grid grid-cols-2 divide-x bg-muted/30">
              <div className="px-4 py-3">
                <p className="text-muted-foreground text-xs">{interpolate(t.projectedBy, { date: day(data.renewsAt) })}</p>
                <p className="mt-0.5 font-medium text-sm tabular-nums">
                  {format.number(runs.projected)} <span className="font-normal text-muted-foreground text-xs">{t.runs}</span>
                </p>
              </div>
              <div className="px-4 py-3">
                <p className="text-muted-foreground text-xs">{t.estimatedOverage}</p>
                <p className={cn("mt-0.5 font-medium text-sm tabular-nums", overRuns > 0 && "text-warning-foreground")}>
                  {money((overRuns / 1000) * data.overagePer1k)}
                  <span className="font-normal text-muted-foreground text-xs">{interpolate(t.overageRate, { rate: money(data.overagePer1k, 0) })}</span>
                </p>
              </div>
            </div>
          ) : null}
        </Rows>
      </Section>

      <Section title={t.paymentMethod}>
        <Rows>
          {data.card ? (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex h-8 w-11 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                <CreditCardIcon className="size-4 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{interpolate(t.cardEnding, { brand: data.card.brand, last4: data.card.last4 })}</p>
                <p className="truncate text-muted-foreground text-xs">
                  {interpolate(t.cardExpires, { month: String(data.card.expMonth).padStart(2, "0"), year: String(data.card.expYear).slice(-2), holder: data.card.holder })}
                </p>
              </div>
              {portalHref ? (
                <WirefrontLink className={cn(buttonVariants({ variant: "outline", size: "sm" }), press)} href={portalHref}>
                  {t.replace}
                </WirefrontLink>
              ) : null}
            </div>
          ) : (
            <p className="px-4 py-3.5 text-muted-foreground text-sm">{t.noCard}</p>
          )}
          {data.billingEmail ? (
            <Row help={data.billingEmail} label={t.billingEmail}>
              {portalHref ? (
                <WirefrontLink className={cn(buttonVariants({ variant: "outline", size: "sm" }), press)} href={portalHref}>
                  {t.edit}
                </WirefrontLink>
              ) : null}
            </Row>
          ) : null}
        </Rows>
      </Section>

      <Section description={data.billingEmail ? interpolate(t.invoicesSentTo, { email: data.billingEmail }) : undefined} title={t.invoices}>
        <Rows>
          <TableHeadRow className="sm:grid-cols-[minmax(0,1fr)_7rem_4.5rem_5rem_2rem]">
            <span>{t.invoice}</span>
            <span>{t.date}</span>
            <span>{t.status}</span>
            <span className="text-end">{t.amount}</span>
            <span className="sr-only">{t.download}</span>
          </TableHeadRow>
          {invoices.length === 0 ? <p className="px-4 py-10 text-center text-muted-foreground text-xs">{interpolate(t.noInvoices, { date: day(data.renewsAt) })}</p> : null}
          {invoices.map((inv) => (
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_2rem] items-center gap-3 px-4 py-2.5 sm:grid-cols-[minmax(0,1fr)_7rem_4.5rem_5rem_2rem] sm:gap-4" key={inv.id}>
              <div className="min-w-0">
                <p className="truncate font-mono text-xs">{inv.number}</p>
                <p className="truncate text-muted-foreground text-xs sm:hidden">{day(inv.issuedAt, true)}</p>
              </div>
              <span className="hidden text-muted-foreground text-sm sm:block">{day(inv.issuedAt, true)}</span>
              <span>
                <Swap id={inv.status}>
                  <Badge className={INVOICE_TONE[inv.status]} variant="secondary">
                    {t[inv.status]}
                  </Badge>
                </Swap>
              </span>
              <span className="text-end text-sm tabular-nums">{money(inv.amount)}</span>
              {inv.url ? (
                <a
                  aria-label={interpolate(t.downloadInvoice, { number: inv.number })}
                  className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                  href={inv.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <DownloadIcon />
                </a>
              ) : (
                <span />
              )}
            </div>
          ))}
        </Rows>
      </Section>
    </>
  );
}

function SettingsAndPlansScreen({
  data,
  tab,
  domain,
  onSaveWorkspace,
  onSavePreferences,
  onScheduleDeletion,
  onCancelDeletion,
  onInvite,
  onResendInvite,
  onChangeRole,
  onRemoveMember,
  onCreateKey,
  onRevokeKey,
  onChangePlan,
  onRetryPayment,
  portalHref,
  className,
}: SettingsAndPlansProps) {
  const t = useMessages("settingsAndPlans", SETTINGS_AND_PLANS_MESSAGES);
  const reduce = useCalm();
  const [saved, setSaved] = useState(data.workspace);
  const [draft, setDraft] = useState(data.workspace);
  const [justSaved, setJustSaved] = useState(false);
  const [source, setSource] = useState(data);
  if (source !== data) {
    setSource(data);
    setSaved(data.workspace);
    setDraft(data.workspace);
  }
  const save = useAction(onSaveWorkspace ?? (async () => {}), {
    onSuccess: (_, next) => {
      setSaved(next);
      setJustSaved(true);
    },
  });
  useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => setJustSaved(false), 1600);
    return () => clearTimeout(timer);
  }, [justSaved]);

  const parsed = WorkspaceSettings.safeParse(draft);
  const blocker = parsed.success ? null : (parsed.error.issues[0]?.message ?? null);
  const dirty = draft.name !== saved.name || draft.slug !== saved.slug || draft.region !== saved.region;
  const barVisible = tab === "workspace" && Boolean(onSaveWorkspace) && (dirty || justSaved);
  const saving = save.isPending();

  return (
    <div className={cn("relative flex min-h-full flex-col", className)}>
      <div className="mx-auto w-full max-w-2xl flex-1 px-6 pt-10 pb-24 md:px-10">
        <Swap id={tab}>
          <h1 className="text-balance font-semibold text-2xl tracking-tight">{t[`${tab}Title`]}</h1>
          <p className="mt-1 text-pretty text-muted-foreground text-sm">{t[`${tab}Description`]}</p>
        </Swap>
        {tab === "workspace" ? (
          <WorkspacePanel
            data={data}
            domain={domain}
            draft={draft}
            onCancelDeletion={onCancelDeletion}
            onSavePreferences={onSavePreferences}
            onScheduleDeletion={onScheduleDeletion}
            setDraft={setDraft}
            t={t}
          />
        ) : null}
        {tab === "members" ? (
          <MembersPanel data={data} onChangeRole={onChangeRole} onInvite={onInvite} onRemoveMember={onRemoveMember} onResendInvite={onResendInvite} t={t} />
        ) : null}
        {tab === "keys" ? <KeysPanel data={data} onCreateKey={onCreateKey} onRevokeKey={onRevokeKey} t={t} /> : null}
        {tab === "billing" ? <BillingPanel data={data} onChangePlan={onChangePlan} onRetryPayment={onRetryPayment} portalHref={portalHref} t={t} /> : null}
        {save.error ? (
          <p className="mt-6 text-destructive-foreground text-sm" role="alert">
            {save.error}
          </p>
        ) : null}
      </div>
      <AnimatePresence>
        {barVisible ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="-mt-16 pointer-events-none sticky bottom-4 z-20 flex justify-center px-4 md:px-6"
            exit={{ opacity: 0, y: reduce ? 0 : 16 }}
            initial={{ opacity: 0, y: reduce ? 0 : 24 }}
            transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 480, damping: 34 }}
          >
            <div className="pointer-events-auto flex min-h-12 w-full max-w-xl items-center gap-2 rounded-xl border bg-popover py-2 ps-4 pe-2 shadow-lg/5">
              {justSaved && !dirty ? (
                <span aria-live="polite" className="flex min-h-8 flex-1 items-center gap-2 font-medium text-sm">
                  <CheckIcon className="size-4 text-success-foreground" />
                  {t.workspaceSaved}
                </span>
              ) : (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span aria-live="polite" className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium text-sm">
                      <span className="sm:hidden">{t.unsavedShort}</span>
                      <span className="hidden sm:inline">{t.unsavedLong}</span>
                    </span>
                    {blocker && !saving ? <span className="truncate text-warning-foreground text-xs">{blocker}</span> : null}
                  </span>
                  <Button className={press} disabled={saving} onClick={() => setDraft(saved)} size="sm" variant="ghost">
                    {t.discard}
                  </Button>
                  <Button aria-busy={saving} className={cn(press, "min-w-14")} disabled={Boolean(blocker) || saving} onClick={() => void save.run(draft)} size="sm">
                    {saving ? <Spinner data-icon="inline-start" /> : null}
                    {t.save}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function SettingsAndPlans(props: SettingsAndPlansProps) {
  return (
    <ScreenBoundary name="SettingsAndPlans">
      <SettingsAndPlansScreen {...props} />
    </ScreenBoundary>
  );
}
