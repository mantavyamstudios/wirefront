// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
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
import { Label } from "@wirefront/ui/label";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  FingerprintIcon,
  LaptopIcon,
  LogOutIcon,
  MonitorIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SmartphoneIcon,
  TabletIcon,
  Trash2Icon,
  UsbIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";

import { ChangePasswordInput, type DeviceKind, type Passkey, type RecoveryCodes, type SecurityOverview, type Session } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("securitySettings.<key>"). */
export const SECURITY_SETTINGS_MESSAGES = {
  title: "Security",
  subtitle: "How you sign in, and where you’re signed in right now.",
  stepsAllDone: "All recommended steps done",
  stepsDone: "{done} of {total} recommended steps done",
  stepPasskey: "Add a passkey",
  stepTwoFactor: "Turn on two-factor",
  stepCodes: "Save your recovery codes",
  signInTitle: "Sign-in",
  signInDescription: "How you prove it’s you when a passkey isn’t handy.",
  password: "Password",
  passwordChanged: "Last changed {when}",
  passwordNever: "Not set",
  passwordJustChanged: "Changed just now",
  change: "Change",
  cancel: "Cancel",
  currentPassword: "Current password",
  newPassword: "New password",
  passwordHint: "Other sessions stay signed in. Sign them out below if you need to.",
  update: "Update",
  twoFactorTitle: "Two-factor authentication",
  twoFactorDescription: "A second check after your password, so a leaked password isn’t enough.",
  authenticator: "Authenticator app",
  enabled: "Enabled",
  off: "Off",
  authenticatorOn: "6-digit codes from an app on your phone. Added {date}.",
  authenticatorOff: "Use an app on your phone for 6-digit codes.",
  disable: "Disable",
  setUp: "Set up",
  disableTitle: "Turn off two-factor?",
  disableDetail: "Anyone with your password could sign in as you.",
  recoveryCodes: "Recovery codes",
  notSaved: "Not saved",
  codesLeft: "{left} of {total} left. Use one if you lose your phone.",
  codesUnavailable: "Available once two-factor is on.",
  regenerate: "Regenerate",
  regenerateCodes: "Regenerate codes",
  view: "View",
  hide: "Hide",
  regenerateTitle: "Make a new set?",
  regenerateDetail: "Your current codes stop working straight away.",
  codesNote: "Each code works once. Keep them somewhere other than this device.",
  used: "(used)",
  download: "Download",
  copy: "Copy",
  copied: "Copied",
  codesFile: "{product} recovery codes for {email}",
  passkeysTitle: "Passkeys",
  passkeysDescription: "Sign in with your fingerprint, face or a security key.",
  addPasskey: "Add passkey",
  columnName: "Name",
  columnAdded: "Added",
  columnLastUsed: "Last used",
  actions: "Actions",
  passkeyName: "Passkey name",
  optionsFor: "Options for {name}",
  rename: "Rename",
  remove: "Remove",
  removeTitle: "Remove {name}?",
  removeLast: "It’s your only passkey, so you’ll sign in with your password and a code.",
  removeOther: "You can still sign in with your other passkeys.",
  addedOn: "Added {date}",
  usedWhen: "Used {when}",
  notUsedYet: "Not used yet",
  notYet: "Not yet",
  waiting: "Waiting for your device…",
  waitingDetail: "Confirm on your device to create the passkey",
  noPasskeys: "No passkeys yet. Add one and skip the password next time.",
  sessionsTitle: "Sessions",
  sessionsDescription: "Where you’re signed in. Locations are approximate.",
  signOutOthers: "Sign out of all other sessions",
  columnDevice: "Device",
  columnLocation: "Location",
  columnLastActive: "Last active",
  browserOn: "{browser} on {os}",
  thisDevice: "This device",
  activeNow: "Active now",
  signOut: "Sign out",
  signOutSession: "Sign out {browser} on {os}",
  signOutOthersTitleOne: "Sign out of 1 other session?",
  signOutOthersTitle: "Sign out of {count} other sessions?",
  signOutOthersDetail: "They’ll need a passkey or password to get back in.",
  signOutCount: "Sign out {count}",
  onlyThisDevice: "You’re only signed in on this device.",
};

export interface SecuritySettingsProps {
  data: SecurityOverview;
  /** Change the password. Receives the current and new password (already validated). */
  onChangePassword: Action<ChangePasswordInput>;
  /** Where two-factor is set up (your enrolment flow). "Set up" is hidden when not given. */
  twoFactorSetupHref?: string;
  onDisableTwoFactor?: Action;
  /** Fetch the current recovery codes. "View" is hidden when not given. */
  onRevealRecoveryCodes?: Action<void, RecoveryCodes>;
  /** Replace the recovery codes with a new set. "Regenerate" is hidden when not given. */
  onRegenerateRecoveryCodes?: Action<void, RecoveryCodes>;
  /** Record that the user copied or downloaded their codes. */
  onRecoveryCodesSaved?: Action;
  /** Register a passkey: run navigator.credentials.create and send the result to your server, then resolve with the passkey. */
  onAddPasskey?: Action<void, Passkey>;
  onRenamePasskey?: Action<{ id: string; name: string }>;
  onRemovePasskey?: Action<string>;
  onSignOutSession?: Action<string>;
  onSignOutOtherSessions?: Action;
  /** Your product's name and the account's email, used in the downloaded codes file. */
  product: string;
  accountEmail: string;
  className?: string;
}

type Messages = typeof SECURITY_SETTINGS_MESSAGES;
const easeOut = [0.23, 1, 0.32, 1] as const;
const DEVICE_ICONS: Record<DeviceKind, ReactNode> = {
  laptop: <LaptopIcon />,
  desktop: <MonitorIcon />,
  phone: <SmartphoneIcon />,
  tablet: <TabletIcon />,
  key: <UsbIcon />,
};
const successBadge = "shrink-0 bg-success/8 text-success-foreground dark:bg-success/16";

function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return ref;
}

function SectionHeader({ title, description, action }: { title: string; description: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 className="font-medium text-sm">{title}</h2>
        <p className="text-pretty text-muted-foreground text-sm">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function Collapse({ open, children, reduce }: { open: boolean; children: ReactNode; reduce: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          animate={{ height: "auto", opacity: 1 }}
          className="overflow-hidden"
          exit={{ height: 0, opacity: 0 }}
          initial={{ height: 0, opacity: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.22, ease: easeOut }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ConfirmStrip({
  tone = "destructive",
  title,
  detail,
  confirmLabel,
  pending,
  onCancel,
  onConfirm,
  t,
}: {
  tone?: "destructive" | "default";
  title: string;
  detail: string;
  confirmLabel: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  t: Messages;
}) {
  const cancelRef = useFocusOnMount<HTMLButtonElement>();
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2.5 border-t px-4 py-3", tone === "destructive" ? "bg-destructive/4" : "bg-muted/40")} role="alert">
      <p className="min-w-0 flex-1 basis-56 text-pretty text-sm">
        <span className="font-medium">{title}</span> <span className="text-muted-foreground">{detail}</span>
      </p>
      <div className="flex gap-2">
        <Button disabled={pending} onClick={onCancel} ref={cancelRef} size="sm" variant="ghost">
          {t.cancel}
        </Button>
        <Button
          aria-busy={pending}
          className={tone === "destructive" ? "text-destructive-foreground" : undefined}
          disabled={pending}
          onClick={onConfirm}
          size="sm"
          variant={tone === "destructive" ? "destructive" : "default"}
        >
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}

function DeviceIcon({ kind }: { kind: DeviceKind }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground [&_svg]:size-4">{DEVICE_ICONS[kind]}</span>
  );
}

const RING_SEGMENTS = ["r1", "r2", "r3"];

function ProgressRing({ done, reduce }: { done: number; reduce: boolean }) {
  const steps = RING_SEGMENTS.length;
  const r = 8;
  const c = 2 * Math.PI * r;
  const gap = 3;
  const seg = c / steps - gap;
  const complete = done === steps;
  return (
    <svg aria-hidden className="-rotate-90 size-5 shrink-0" fill="none" viewBox="0 0 20 20">
      {RING_SEGMENTS.map((key, i) => (
        <motion.circle
          animate={{ opacity: i < done ? 1 : 0.18 }}
          className={cn("transition-[stroke] duration-300", i < done && complete ? "stroke-success" : "stroke-foreground")}
          cx="10"
          cy="10"
          initial={false}
          key={key}
          r={r}
          strokeDasharray={`${seg.toFixed(2)} ${(c - seg).toFixed(2)}`}
          strokeDashoffset={(-(i * (c / steps)) - gap / 2).toFixed(2)}
          strokeLinecap="round"
          strokeWidth="2.5"
          transition={reduce ? { duration: 0 } : { duration: 0.3, ease: easeOut }}
        />
      ))}
    </svg>
  );
}

function DrawnCheck({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={cn("size-3.5", className)} fill="none" viewBox="0 0 16 16">
      <motion.path
        animate={{ pathLength: 1 }}
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        initial={{ pathLength: 0 }}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        transition={{ duration: 0.3, ease: easeOut, delay: 0.05 }}
      />
    </svg>
  );
}

function PasswordRow({
  changedAt,
  onChangePassword,
  reduce,
  t,
}: {
  changedAt: string | null;
  onChangePassword: Action<ChangePasswordInput>;
  reduce: boolean;
  t: Messages;
}) {
  const format = useFormat();
  const [open, setOpen] = useState(false);
  const [updated, setUpdated] = useState(false);
  const form = useActionForm({
    schema: ChangePasswordInput,
    action: onChangePassword,
    onSuccess: () => {
      setOpen(false);
      setUpdated(true);
    },
  });
  const fieldError = "text-destructive-foreground text-xs";

  return (
    <div className="mt-3 overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-4 px-4 py-3.5">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-medium text-sm">{t.password}</span>
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            {updated ? <DrawnCheck className="text-success-foreground" /> : null}
            {updated ? t.passwordJustChanged : changedAt ? interpolate(t.passwordChanged, { when: format.relative(changedAt) }) : t.passwordNever}
          </span>
        </div>
        <Button
          onClick={() => {
            if (open) form.reset();
            setOpen((v) => !v);
          }}
          size="sm"
          variant="outline"
        >
          {open ? t.cancel : t.change}
        </Button>
      </div>
      <Collapse open={open} reduce={reduce}>
        <Form className="flex flex-col gap-3 border-t bg-muted/30 px-4 py-3.5" noValidate {...form.formProps}>
          <Field.Root className="flex flex-col gap-1.5" name="currentPassword">
            <Field.Label className="font-medium text-sm">{t.currentPassword}</Field.Label>
            <Input autoComplete="current-password" type="password" />
            <Field.Error className={fieldError} />
          </Field.Root>
          <Field.Root className="flex flex-col gap-1.5" name="newPassword">
            <Field.Label className="font-medium text-sm">{t.newPassword}</Field.Label>
            <div className="flex gap-2">
              <Input autoComplete="new-password" type="password" />
              <Button aria-busy={form.pending} disabled={form.pending} type="submit">
                {form.pending ? <Spinner data-icon="inline-start" /> : null}
                {t.update}
              </Button>
            </div>
            <Field.Error className={fieldError} />
            <Field.Description className="text-muted-foreground text-xs">{t.passwordHint}</Field.Description>
          </Field.Root>
          {form.formError ? (
            <p className={fieldError} role="alert">
              {form.formError}
            </p>
          ) : null}
        </Form>
      </Collapse>
    </div>
  );
}

function PasskeyRow({
  passkey,
  isLast,
  isNew,
  editing,
  confirming,
  pending,
  onRename,
  onStartRename,
  onCancelRename,
  onAskRemove,
  onCancelRemove,
  onRemove,
  canRename,
  canRemove,
  reduce,
  t,
}: {
  passkey: Passkey;
  isLast: boolean;
  isNew: boolean;
  editing: boolean;
  confirming: boolean;
  pending: boolean;
  onRename: (name: string) => void;
  onStartRename: () => void;
  onCancelRename: () => void;
  onAskRemove: () => void;
  onCancelRemove: () => void;
  onRemove: () => void;
  canRename: boolean;
  canRemove: boolean;
  reduce: boolean;
  t: Messages;
}) {
  const format = useFormat();
  const [draft, setDraft] = useState(passkey.name);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) return;
    setDraft(passkey.name);
    inputRef.current?.focus({ preventScroll: true });
    inputRef.current?.select();
  }, [editing, passkey.name]);

  const commit = () => {
    const name = draft.trim();
    if (name && name !== passkey.name) onRename(name);
    else onCancelRename();
  };
  const added = format.date(passkey.createdAt, { dateStyle: "medium" });
  const lastUsed = passkey.lastUsedAt ? format.relative(passkey.lastUsedAt) : null;

  return (
    <motion.li
      animate={{ opacity: 1, height: "auto" }}
      className="relative overflow-hidden border-t first:border-t-0"
      exit={{ opacity: 0, height: 0 }}
      initial={reduce ? false : { opacity: 0, height: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.24, ease: easeOut }}
    >
      {isNew && !reduce ? (
        <motion.span
          animate={{ opacity: 0 }}
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-success/8"
          initial={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
        />
      ) : null}
      <div className={cn("relative flex items-center gap-3 px-4 py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_7.5rem_7.5rem_2rem] sm:gap-4", pending && "opacity-60")}>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <DeviceIcon kind={passkey.kind} />
          <div className="flex min-w-0 flex-1 flex-col">
            {editing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  commit();
                }}
              >
                <Label className="sr-only" htmlFor={inputId}>
                  {t.passkeyName}
                </Label>
                <Input
                  id={inputId}
                  maxLength={40}
                  onBlur={commit}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      onCancelRename();
                    }
                  }}
                  ref={inputRef}
                  value={draft}
                />
              </form>
            ) : (
              <span className="truncate font-medium text-sm">{passkey.name}</span>
            )}
            <span className="truncate text-muted-foreground text-xs sm:hidden">
              {interpolate(t.addedOn, { date: added })} · {lastUsed ? interpolate(t.usedWhen, { when: lastUsed }) : t.notUsedYet}
            </span>
          </div>
        </div>
        <span className="hidden text-muted-foreground text-sm sm:block">{added}</span>
        <span className="hidden text-muted-foreground text-sm sm:block">{lastUsed ?? t.notYet}</span>
        {canRename || canRemove ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button aria-label={interpolate(t.optionsFor, { name: passkey.name })} className="shrink-0" size="icon-sm" variant="ghost" />}
            >
              {pending ? <Spinner /> : <MoreHorizontalIcon />}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canRename ? (
                <DropdownMenuItem onClick={onStartRename}>
                  <PencilIcon /> {t.rename}
                </DropdownMenuItem>
              ) : null}
              {canRename && canRemove ? <DropdownMenuSeparator /> : null}
              {canRemove ? (
                <DropdownMenuItem onClick={onAskRemove} variant="destructive">
                  <Trash2Icon /> {t.remove}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span />
        )}
      </div>
      <Collapse open={confirming} reduce={reduce}>
        <ConfirmStrip
          confirmLabel={t.remove}
          detail={isLast ? t.removeLast : t.removeOther}
          onCancel={onCancelRemove}
          onConfirm={onRemove}
          pending={pending}
          t={t}
          title={interpolate(t.removeTitle, { name: passkey.name })}
        />
      </Collapse>
    </motion.li>
  );
}

function PendingPasskeyRow({ reduce, t }: { reduce: boolean; t: Messages }) {
  return (
    <motion.li
      animate={{ opacity: 1, height: "auto" }}
      className="overflow-hidden border-t first:border-t-0"
      exit={{ opacity: 0, height: 0 }}
      initial={reduce ? false : { opacity: 0, height: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.24, ease: easeOut }}
    >
      <div className="flex items-center gap-3 px-4 py-3" role="status">
        <span className="relative flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background text-foreground">
          {!reduce ? (
            <motion.span
              animate={{ opacity: [0.6, 0], scale: [1, 1.45] }}
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-lg border border-foreground/30"
              transition={{ duration: 1.4, ease: "easeOut", repeat: Number.POSITIVE_INFINITY }}
            />
          ) : null}
          <FingerprintIcon className="size-4" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-medium text-sm">{t.waiting}</span>
          <span className="truncate text-muted-foreground text-xs">{t.waitingDetail}</span>
        </div>
      </div>
    </motion.li>
  );
}

function RecoveryCodesPanel({
  codes,
  copied,
  onCopy,
  onDownload,
  t,
}: {
  codes: RecoveryCodes;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
  t: Messages;
}) {
  return (
    <div className="border-t bg-muted/30 px-4 py-4">
      <ol className="grid max-w-md grid-cols-2 gap-x-6 gap-y-2 font-mono text-sm tabular-nums">
        {codes.map((c, i) => (
          <li className="flex items-baseline gap-3" key={c.code}>
            <span className="w-4 text-right text-muted-foreground text-xs">{i + 1}</span>
            <span className={cn(c.used && "text-muted-foreground line-through")}>{c.code}</span>
            {c.used ? <span className="sr-only">{t.used}</span> : null}
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <p className="min-w-0 flex-1 basis-48 text-pretty text-muted-foreground text-xs">{t.codesNote}</p>
        <div className="flex gap-2">
          <Button onClick={onDownload} size="sm" variant="ghost">
            <DownloadIcon /> {t.download}
          </Button>
          <Button className="min-w-22" onClick={onCopy} size="sm" variant="outline">
            {copied ? <DrawnCheck className="size-4 text-success-foreground" /> : <CopyIcon />}
            {copied ? t.copied : t.copy}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SessionRow({
  session,
  pending,
  onSignOut,
  reduce,
  t,
}: {
  session: Session;
  pending: boolean;
  onSignOut?: () => void;
  reduce: boolean;
  t: Messages;
}) {
  const format = useFormat();
  const when = session.current ? t.activeNow : format.relative(session.lastActiveAt);
  return (
    <motion.li
      animate={{ opacity: 1, x: 0, height: "auto" }}
      className="overflow-hidden border-t first:border-t-0"
      exit={{ opacity: 0, x: reduce ? 0 : 24, height: 0 }}
      initial={false}
      transition={reduce ? { duration: 0 } : { duration: 0.24, ease: easeOut }}
    >
      <div className={cn("flex items-center gap-3 px-4 py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_6.5rem_5.5rem_4.5rem] sm:gap-3", pending && "opacity-60")}>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <DeviceIcon kind={session.kind} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium text-sm">{interpolate(t.browserOn, { browser: session.browser, os: session.os })}</span>
              {session.current ? (
                <Badge className={successBadge} variant="secondary">
                  {t.thisDevice}
                </Badge>
              ) : null}
            </span>
            <span className="truncate text-muted-foreground text-xs sm:hidden">
              {session.location} · {when}
            </span>
          </div>
        </div>
        <span className="hidden truncate text-muted-foreground text-sm sm:block">{session.location}</span>
        <span className={cn("hidden text-sm sm:block", session.current ? "text-success-foreground" : "text-muted-foreground")}>{when}</span>
        <div className="flex shrink-0 justify-end">
          {!session.current && onSignOut ? (
            <Button
              aria-busy={pending}
              aria-label={interpolate(t.signOutSession, { browser: session.browser, os: session.os })}
              disabled={pending}
              onClick={onSignOut}
              size="sm"
              variant="ghost"
            >
              {pending ? <Spinner /> : <LogOutIcon className="sm:hidden" />}
              <span className="hidden sm:inline">{t.signOut}</span>
            </Button>
          ) : null}
        </div>
      </div>
    </motion.li>
  );
}

function SecuritySettingsScreen({
  data,
  onChangePassword,
  twoFactorSetupHref,
  onDisableTwoFactor,
  onRevealRecoveryCodes,
  onRegenerateRecoveryCodes,
  onRecoveryCodesSaved,
  onAddPasskey,
  onRenamePasskey,
  onRemovePasskey,
  onSignOutSession,
  onSignOutOtherSessions,
  product,
  accountEmail,
  className,
}: SecuritySettingsProps) {
  const t = useMessages("securitySettings", SECURITY_SETTINGS_MESSAGES);
  const format = useFormat();
  const reduce = Boolean(useReducedMotion());

  const [passkeys, setPasskeys] = useState(data.passkeys);
  const [sessions, setSessions] = useState(data.sessions);
  const [twoFactorOn, setTwoFactorOn] = useState(data.twoFactor.enabled);
  const [codesSaved, setCodesSaved] = useState(data.twoFactor.recoveryCodesSaved);
  const [codesLeft, setCodesLeft] = useState(data.twoFactor.recoveryCodesLeft);
  const [source, setSource] = useState(data);
  if (source !== data) {
    setSource(data);
    setPasskeys(data.passkeys);
    setSessions(data.sessions);
    setTwoFactorOn(data.twoFactor.enabled);
    setCodesSaved(data.twoFactor.recoveryCodesSaved);
    setCodesLeft(data.twoFactor.recoveryCodesLeft);
  }

  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [newId, setNewId] = useState<string | null>(null);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [codes, setCodes] = useState<RecoveryCodes | null>(null);
  const [codesOpen, setCodesOpen] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);

  const disable = useAction(onDisableTwoFactor ?? (async () => {}), {
    onSuccess: () => {
      setConfirmDisable(false);
      setCodesOpen(false);
      setConfirmRegen(false);
      setCodes(null);
      setTwoFactorOn(false);
    },
  });
  const reveal = useAction(onRevealRecoveryCodes ?? (async () => {}), {
    onSuccess: (list) => {
      setCodes(list ?? []);
      setCodesOpen(true);
    },
  });
  const regenerate = useAction(onRegenerateRecoveryCodes ?? (async () => {}), {
    onSuccess: (list) => {
      setConfirmRegen(false);
      setCodes(list ?? []);
      setCodesLeft((list ?? []).filter((c) => !c.used).length);
      setCodesSaved(false);
      setCopied(false);
      setCodesOpen(true);
    },
  });
  const markSaved = useAction(onRecoveryCodesSaved ?? (async () => {}), { onSuccess: () => setCodesSaved(true) });
  const addPasskey = useAction(onAddPasskey ?? (async () => {}), {
    onSuccess: (passkey) => {
      if (!passkey) return;
      setPasskeys((all) => [...all, passkey]);
      setNewId(passkey.id);
      setEditingId(passkey.id);
    },
  });
  const rename = useAction(onRenamePasskey ?? (async () => {}), {
    optimistic: ({ id, name }) => {
      const before = passkeys.find((p) => p.id === id)?.name;
      setPasskeys((all) => all.map((p) => (p.id === id ? { ...p, name } : p)));
      return () => setPasskeys((all) => all.map((p) => (p.id === id && before ? { ...p, name: before } : p)));
    },
  });
  const removePasskey = useAction(onRemovePasskey ?? (async () => {}), {
    onSuccess: (_, id) => {
      setConfirmingId(null);
      setPasskeys((all) => all.filter((p) => p.id !== id));
    },
  });
  const signOut = useAction(onSignOutSession ?? (async () => {}), { onSuccess: (_, id) => setSessions((all) => all.filter((s) => s.id !== id)) });
  const signOutOthers = useAction(onSignOutOtherSessions ?? (async () => {}), {
    onSuccess: () => {
      setConfirmAll(false);
      setSessions((all) => all.filter((s) => s.current));
    },
  });

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  const actionError =
    disable.error ?? reveal.error ?? regenerate.error ?? markSaved.error ?? addPasskey.error ?? rename.error ?? removePasskey.error ?? signOut.error ?? signOutOthers.error;
  const others = sessions.filter((s) => !s.current);
  const unusedCodes = (codes ?? []).filter((c) => !c.used).map((c) => c.code);
  const steps = [
    { done: passkeys.length > 0, hint: t.stepPasskey },
    { done: twoFactorOn, hint: t.stepTwoFactor },
    { done: twoFactorOn && codesSaved, hint: t.stepCodes },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const nextStep = steps.find((s) => !s.done);

  const copyCodes = () => {
    void navigator.clipboard?.writeText(unusedCodes.join("\n")).then(() => {
      setCopied(true);
      void markSaved.run();
    });
  };
  const downloadCodes = () => {
    const text = `${interpolate(t.codesFile, { product, email: accountEmail })}\n\n${unusedCodes.join("\n")}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${product.toLowerCase()}-recovery-codes.txt` });
    a.click();
    URL.revokeObjectURL(url);
    void markSaved.run();
  };
  const toggleCodes = () => {
    if (codesOpen) setCodesOpen(false);
    else if (codes) setCodesOpen(true);
    else void reveal.run();
  };
  const fixNext = () => {
    if (!passkeys.length && onAddPasskey) void addPasskey.run();
    else if (twoFactorOn && onRevealRecoveryCodes) toggleCodes();
  };

  return (
    <div className={cn("mx-auto w-full max-w-2xl px-6 py-10 md:px-10", className)}>
      <h1 className="font-semibold text-2xl tracking-tight">{t.title}</h1>
      <p className="mt-1 text-muted-foreground text-sm">{t.subtitle}</p>
      <div aria-live="polite" className="mt-4 flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <ProgressRing done={doneCount} reduce={reduce} />
        <span className="font-medium tabular-nums">
          {doneCount === steps.length ? t.stepsAllDone : interpolate(t.stepsDone, { done: doneCount, total: steps.length })}
        </span>
        {nextStep ? (
          <>
            <span aria-hidden className="text-muted-foreground max-sm:hidden">
              ·
            </span>
            {nextStep.hint === t.stepTwoFactor && twoFactorSetupHref ? (
              <WirefrontLink
                className="rounded-sm text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring max-sm:basis-full max-sm:ps-7"
                href={twoFactorSetupHref}
              >
                {nextStep.hint}
              </WirefrontLink>
            ) : (
              <button
                className="cursor-pointer rounded-sm text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring max-sm:basis-full max-sm:ps-7 max-sm:text-left"
                onClick={fixNext}
                type="button"
              >
                {nextStep.hint}
              </button>
            )}
          </>
        ) : null}
      </div>

      {actionError ? (
        <p className="mt-4 text-destructive-foreground text-sm" role="alert">
          {actionError}
        </p>
      ) : null}

      <section className="mt-10">
        <SectionHeader description={t.signInDescription} title={t.signInTitle} />
        <PasswordRow changedAt={data.passwordChangedAt} onChangePassword={onChangePassword} reduce={reduce} t={t} />
      </section>

      <section className="mt-10">
        <SectionHeader description={t.twoFactorDescription} title={t.twoFactorTitle} />
        <div className="mt-3 overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center gap-4 px-4 py-3.5">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-2">
                <span className="font-medium text-sm">{t.authenticator}</span>
                {twoFactorOn ? (
                  <Badge className={successBadge} variant="secondary">
                    {t.enabled}
                  </Badge>
                ) : (
                  <Badge variant="outline">{t.off}</Badge>
                )}
              </span>
              <span className="text-pretty text-muted-foreground text-xs">
                {twoFactorOn && data.twoFactor.enabledAt
                  ? interpolate(t.authenticatorOn, { date: format.date(data.twoFactor.enabledAt, { dateStyle: "medium" }) })
                  : t.authenticatorOff}
              </span>
            </div>
            {twoFactorOn ? (
              onDisableTwoFactor ? (
                <Button onClick={() => setConfirmDisable((v) => !v)} size="sm" variant="outline">
                  {t.disable}
                </Button>
              ) : null
            ) : twoFactorSetupHref ? (
              <WirefrontLink className={buttonVariants({ variant: "outline", size: "sm" })} href={twoFactorSetupHref}>
                {t.setUp}
              </WirefrontLink>
            ) : null}
          </div>
          <Collapse open={confirmDisable && twoFactorOn} reduce={reduce}>
            <ConfirmStrip
              confirmLabel={t.disable}
              detail={t.disableDetail}
              onCancel={() => setConfirmDisable(false)}
              onConfirm={() => void disable.run()}
              pending={disable.isPending()}
              t={t}
              title={t.disableTitle}
            />
          </Collapse>
          <div className={cn("flex items-center gap-4 border-t px-4 py-3.5 transition-opacity", !twoFactorOn && "opacity-60")}>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-2">
                <span className="font-medium text-sm">{t.recoveryCodes}</span>
                {twoFactorOn && !codesSaved ? (
                  <Badge className="bg-warning/8 text-warning-foreground dark:bg-warning/16" variant="secondary">
                    {t.notSaved}
                  </Badge>
                ) : null}
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {twoFactorOn ? interpolate(t.codesLeft, { left: codesLeft, total: data.twoFactor.recoveryCodesTotal }) : t.codesUnavailable}
              </span>
            </div>
            <div className="flex shrink-0 gap-2">
              {onRegenerateRecoveryCodes ? (
                <Button className="max-sm:hidden" disabled={!twoFactorOn} onClick={() => setConfirmRegen((v) => !v)} size="sm" variant="ghost">
                  {t.regenerate}
                </Button>
              ) : null}
              {onRevealRecoveryCodes ? (
                <Button aria-busy={reveal.isPending()} aria-expanded={codesOpen} disabled={!twoFactorOn || reveal.isPending()} onClick={toggleCodes} size="sm" variant="outline">
                  {reveal.isPending() ? <Spinner data-icon="inline-start" /> : null}
                  {codesOpen ? t.hide : t.view}
                </Button>
              ) : null}
            </div>
          </div>
          <Collapse open={confirmRegen && twoFactorOn} reduce={reduce}>
            <ConfirmStrip
              confirmLabel={t.regenerate}
              detail={t.regenerateDetail}
              onCancel={() => setConfirmRegen(false)}
              onConfirm={() => void regenerate.run()}
              pending={regenerate.isPending()}
              t={t}
              title={t.regenerateTitle}
              tone="default"
            />
          </Collapse>
          <Collapse open={codesOpen && twoFactorOn && codes !== null} reduce={reduce}>
            <RecoveryCodesPanel codes={codes ?? []} copied={copied} onCopy={copyCodes} onDownload={downloadCodes} t={t} />
            {onRegenerateRecoveryCodes ? (
              <div className="flex justify-end border-t px-4 py-2.5 sm:hidden">
                <Button onClick={() => setConfirmRegen(true)} size="sm" variant="ghost">
                  {t.regenerateCodes}
                </Button>
              </div>
            ) : null}
          </Collapse>
        </div>
      </section>

      <section className="mt-10">
        <SectionHeader
          action={
            onAddPasskey ? (
              <Button aria-busy={addPasskey.isPending()} disabled={addPasskey.isPending()} onClick={() => void addPasskey.run()} size="sm" variant="outline">
                <PlusIcon /> {t.addPasskey}
              </Button>
            ) : null
          }
          description={t.passkeysDescription}
          title={t.passkeysTitle}
        />
        <div className="mt-3 overflow-hidden rounded-xl border bg-card">
          <div className="hidden grid-cols-[minmax(0,1fr)_7.5rem_7.5rem_2rem] gap-4 border-b px-4 py-2.5 font-medium text-muted-foreground text-xs sm:grid">
            <span>{t.columnName}</span>
            <span>{t.columnAdded}</span>
            <span>{t.columnLastUsed}</span>
            <span className="sr-only">{t.actions}</span>
          </div>
          <ul aria-label={t.passkeysTitle}>
            <AnimatePresence initial={false}>
              {passkeys.map((p) => (
                <PasskeyRow
                  canRemove={Boolean(onRemovePasskey)}
                  canRename={Boolean(onRenamePasskey)}
                  confirming={confirmingId === p.id}
                  editing={editingId === p.id}
                  isLast={passkeys.length === 1}
                  isNew={newId === p.id}
                  key={p.id}
                  onAskRemove={() => {
                    setEditingId(null);
                    setConfirmingId(p.id);
                  }}
                  onCancelRemove={() => setConfirmingId(null)}
                  onCancelRename={() => setEditingId(null)}
                  onRemove={() => void removePasskey.run(p.id, p.id)}
                  onRename={(name) => {
                    setEditingId(null);
                    void rename.run({ id: p.id, name }, p.id);
                  }}
                  onStartRename={() => {
                    setConfirmingId(null);
                    setEditingId(p.id);
                  }}
                  passkey={p}
                  pending={rename.isPending(p.id) || removePasskey.isPending(p.id)}
                  reduce={reduce}
                  t={t}
                />
              ))}
              {addPasskey.isPending() ? <PendingPasskeyRow key="pending" reduce={reduce} t={t} /> : null}
            </AnimatePresence>
          </ul>
          <Collapse open={passkeys.length === 0 && !addPasskey.isPending()} reduce={reduce}>
            <p className="px-4 py-6 text-center text-muted-foreground text-sm">{t.noPasskeys}</p>
          </Collapse>
        </div>
      </section>

      <section className="mt-10">
        <SectionHeader
          action={
            onSignOutOtherSessions ? (
              <Button className="max-sm:hidden" disabled={others.length === 0} onClick={() => setConfirmAll((v) => !v)} size="sm" variant="outline">
                {t.signOutOthers}
              </Button>
            ) : null
          }
          description={t.sessionsDescription}
          title={t.sessionsTitle}
        />
        <div className="mt-3 overflow-hidden rounded-xl border bg-card">
          <div className="hidden grid-cols-[minmax(0,1fr)_6.5rem_5.5rem_4.5rem] gap-3 border-b px-4 py-2.5 font-medium text-muted-foreground text-xs sm:grid">
            <span>{t.columnDevice}</span>
            <span>{t.columnLocation}</span>
            <span>{t.columnLastActive}</span>
            <span className="sr-only">{t.actions}</span>
          </div>
          <ul aria-label={t.sessionsTitle}>
            <AnimatePresence initial={false}>
              {sessions.map((s) => (
                <SessionRow
                  key={s.id}
                  onSignOut={onSignOutSession ? () => void signOut.run(s.id, s.id) : undefined}
                  pending={signOut.isPending(s.id)}
                  reduce={reduce}
                  session={s}
                  t={t}
                />
              ))}
            </AnimatePresence>
          </ul>
          <Collapse open={confirmAll && others.length > 0} reduce={reduce}>
            <ConfirmStrip
              confirmLabel={interpolate(t.signOutCount, { count: others.length })}
              detail={t.signOutOthersDetail}
              onCancel={() => setConfirmAll(false)}
              onConfirm={() => void signOutOthers.run()}
              pending={signOutOthers.isPending()}
              t={t}
              title={others.length === 1 ? t.signOutOthersTitleOne : interpolate(t.signOutOthersTitle, { count: others.length })}
            />
          </Collapse>
          {onSignOutOtherSessions && others.length > 0 && !confirmAll ? (
            <div className="border-t px-4 py-2.5 sm:hidden">
              <Button className="w-full" onClick={() => setConfirmAll(true)} size="sm" variant="ghost">
                {t.signOutOthers}
              </Button>
            </div>
          ) : null}
          <Collapse open={others.length === 0} reduce={reduce}>
            <p className="flex items-center gap-2 border-t px-4 py-3 text-muted-foreground text-xs">
              <CheckIcon className="size-3.5 text-success-foreground" />
              {t.onlyThisDevice}
            </p>
          </Collapse>
        </div>
      </section>
    </div>
  );
}

export function SecuritySettings(props: SecuritySettingsProps) {
  return (
    <ScreenBoundary name="SecuritySettings">
      <SecuritySettingsScreen {...props} />
    </ScreenBoundary>
  );
}
