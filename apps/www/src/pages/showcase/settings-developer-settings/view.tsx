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
import { Button } from "@wirefront/ui/button";
import { Checkbox } from "@wirefront/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@wirefront/ui/dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@wirefront/ui/select";
import { Spinner } from "@wirefront/ui/spinner";
import { Switch } from "@wirefront/ui/switch";
import { useAction } from "@wirefront/ui/wirefront/action";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  CheckIcon,
  ClockIcon,
  CopyIcon,
  EllipsisIcon,
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
  RefreshCwIcon,
  RotateCwIcon,
  SendIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useId, useState } from "react";

import {
  CreateKeyInput,
  type Delivery,
  type DevApiKey,
  type DeveloperData,
  type Endpoint,
  EndpointInput,
  type EventGroup,
  type KeyWithSecret,
  type ScopeResource,
} from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("developerSettings.<key>"). */
export const DEVELOPER_SETTINGS_MESSAGES = {
  title: "API keys & webhooks",
  subtitle: "Authenticate scripts against the {product} API, and hear about changes as they happen.",
  keysTitle: "API keys",
  keysDescription: "Send a key as a bearer token, from servers only.",
  createKey: "Create key",
  columnName: "Name",
  columnScopes: "Scopes",
  columnExpires: "Expires",
  actions: "Actions",
  used: "used {when}",
  neverUsed: "never used",
  expires: "Expires",
  never: "Never",
  expiresIn: "Expires in {days} days",
  none: "None",
  actionsFor: "Actions for {name}",
  rollKey: "Roll key",
  revokeKey: "Revoke key",
  noKeys: "No API keys",
  noKeysHint: "Create one for CI, scripts or anything server-side.",
  webhooksTitle: "Webhooks",
  webhooksDescription: "{product} posts signed events to these URLs.",
  addEndpoint: "Add endpoint",
  eventOne: "1 event",
  eventOther: "{count} events",
  failing: "{count} failing",
  paused: "Paused",
  healthy: "Healthy",
  sendTo: "Send events to {host}",
  editEvents: "Edit events",
  sendTestEvent: "Send test event",
  deleteEndpoint: "Delete endpoint",
  noEndpoints: "No endpoints",
  noEndpointsHint: "Add one to hear about deploys, domains and members.",
  settingsFor: "Settings for",
  signingSecret: "Signing secret",
  secretHint: "Verify the signature header with it.",
  secretRolled: "Rolled just now. The old one works for 24 more hours.",
  revealSecret: "Reveal secret",
  hideSecret: "Hide secret",
  copySecret: "Copy secret",
  roll: "Roll",
  events: "Events",
  eventsSummary: "{count} of {total} · {first}",
  andMore: " and {count} more",
  edit: "Edit",
  recentDeliveries: "Recent deliveries",
  retryFailed: "Retry failed",
  sendTest: "Send test",
  columnEvent: "Event",
  columnStatus: "Status",
  columnLatency: "Latency",
  columnTime: "Time",
  retry: "Retry",
  timeout: "timeout",
  noDeliveries: "Nothing sent yet. Send a test event to check it answers.",
  saveKeyTitle: "Save your key",
  saveKeyDescription: "{name} is ready. This is the only time the full key is shown.",
  copy: "Copy",
  copied: "Copied",
  storeIt: "Store it in your secret manager now. If it’s lost, roll the key to get a new one.",
  done: "Done",
  savedIt: "I’ve saved it",
  createKeyTitle: "Create API key",
  createKeyDescription: "Keys act as the workspace, not as you. Give each one only what it needs.",
  name: "Name",
  namePlaceholder: "Release pipeline",
  scopes: "Scopes",
  read: "read",
  write: "write",
  writeIncludesRead: "Write includes read.",
  expiry: "Expiry",
  days7: "7 days",
  days30: "30 days",
  days90: "90 days",
  days365: "1 year",
  days0: "No expiry",
  stopsOn: "Stops working on {date}.",
  noExpiryWarning: "Keys that never expire are easy to forget about.",
  cancel: "Cancel",
  addEndpointDescription: "{product} sends a signed POST to this URL for each event you pick.",
  endpointUrl: "Endpoint URL",
  urlPlaceholder: "https://example.com/webhooks",
  saveEvents: "Save events",
  revokeTitle: "Revoke {name}?",
  revokeDescription: "Anything using …{last4} stops working straight away. This can’t be undone.",
  deleteTitle: "Delete this endpoint?",
  deleteDescription: "{url} stops receiving events, and its delivery history goes with it.",
};

export interface DeveloperSettingsProps {
  data: DeveloperData;
  /** Your product's name, used in the copy. */
  product: string;
  /** Create a key; resolve with it and its secret (shown once). "Create key" is hidden when not given. */
  onCreateKey?: Action<CreateKeyInput, KeyWithSecret>;
  onRollKey?: Action<string, KeyWithSecret>;
  onRevokeKey?: Action<string>;
  onCreateEndpoint?: Action<EndpointInput, Endpoint>;
  onUpdateEndpoint?: Action<{ id: string; events?: string[]; paused?: boolean }>;
  onDeleteEndpoint?: Action<string>;
  /** Fetch an endpoint's signing secret when the user reveals or copies it. */
  onRevealSecret?: Action<string, { secret: string }>;
  onRollSecret?: Action<string, { secret: string }>;
  onSendTest?: Action<string, Delivery>;
  onRetryDeliveries?: Action<{ endpointId: string; deliveryIds: string[] }, Delivery[]>;
  className?: string;
}

type Messages = typeof DEVELOPER_SETTINGS_MESSAGES;
const easeOut = [0.23, 1, 0.32, 1] as const;
const press = "transition-[color,background-color,box-shadow,scale] duration-150 ease-out active:scale-[0.97]";
const EXPIRY_DAYS = [7, 30, 90, 365, 0] as const;
const DAY = 86_400_000;

const isOk = (status: Delivery["status"]) => typeof status === "number" && status < 300;
const hostOf = (url: string) => url.replace(/^https?:\/\//, "").split("/")[0] ?? url;
const formatLatency = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`);

function useCopy() {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);
  return { copied, copy: (text: string) => void navigator.clipboard?.writeText(text).then(() => setCopied(true)) };
}

function SwapIcon({ on, onIcon, offIcon }: { on: boolean; onIcon: ReactNode; offIcon: ReactNode }) {
  return (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.span
        animate={{ opacity: 1, scale: 1 }}
        className="flex"
        exit={{ opacity: 0, scale: 0.8 }}
        initial={{ opacity: 0, scale: 0.8 }}
        key={on ? "on" : "off"}
        transition={{ duration: 0.15, ease: easeOut }}
      >
        {on ? onIcon : offIcon}
      </motion.span>
    </AnimatePresence>
  );
}

function SectionHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h2 className="font-medium text-sm">{title}</h2>
        <p className="text-pretty text-muted-foreground text-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}

function ScopeChips({ scopes, t }: { scopes: string[]; t: Messages }) {
  const chip = "inline-flex h-5 items-center rounded-md bg-muted px-1.5 font-mono text-[11px] text-foreground";
  if (scopes.length === 0) return <span className="text-muted-foreground text-sm">{t.none}</span>;
  return (
    <span className="flex min-w-0 items-center gap-1">
      <span className={cn(chip, "truncate")}>{scopes[0]}</span>
      {scopes.length > 1 ? <span className={cn(chip, "shrink-0 text-muted-foreground")}>+{scopes.length - 1}</span> : null}
    </span>
  );
}

function Expiry({ apiKey, t }: { apiKey: DevApiKey; t: Messages }) {
  const format = useFormat();
  const { now } = useWirefront();
  if (!apiKey.expiresAt) return <span className="text-muted-foreground">{t.never}</span>;
  const daysLeft = Math.ceil((Date.parse(apiKey.expiresAt) - now().getTime()) / DAY);
  const soon = daysLeft < 14;
  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", soon ? "text-destructive-foreground" : "text-muted-foreground")}>
      {format.date(apiKey.expiresAt, { dateStyle: "medium" })}
      {soon ? <ClockIcon aria-label={interpolate(t.expiresIn, { days: daysLeft })} className="size-3.5" /> : null}
    </span>
  );
}

function StatusCode({ status, busy, reduce, t }: { status: Delivery["status"]; busy: boolean; reduce: boolean; t: Messages }) {
  const ok = isOk(status);
  return (
    <span
      className={cn(
        "relative inline-flex h-5 w-[3.75rem] items-center justify-center overflow-hidden rounded-md px-1.5 font-medium font-mono text-[11px] tabular-nums transition-colors duration-200",
        busy ? "bg-muted text-muted-foreground" : ok ? "bg-success/10 text-success-foreground dark:bg-success/16" : "bg-destructive/8 text-destructive-foreground dark:bg-destructive/16",
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center"
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          key={busy ? "busy" : String(status)}
          transition={{ duration: 0.2, ease: easeOut }}
        >
          {busy ? <Spinner className="size-3" /> : status === "timeout" ? t.timeout : status}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function SecretReveal({ name, secret, onDone, t }: { name: string; secret: string; onDone: () => void; t: Messages }) {
  const { copied, copy } = useCopy();
  const [everCopied, setEverCopied] = useState(false);
  return (
    <>
      <DialogHeader>
        <DialogTitle>{t.saveKeyTitle}</DialogTitle>
        <DialogDescription>{interpolate(t.saveKeyDescription, { name })}</DialogDescription>
      </DialogHeader>
      <div className="-mx-4 flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto px-4">
        <div
          className={cn(
            "relative flex items-center gap-2 overflow-hidden rounded-lg border bg-muted/50 py-1.5 ps-3 pe-1.5 transition-colors duration-300",
            copied && "border-success/40 bg-success/6",
          )}
        >
          <code className="relative min-w-0 flex-1 break-all font-mono text-xs leading-5">{secret}</code>
          <Button
            className={cn("relative shrink-0", press)}
            onClick={() => {
              copy(secret);
              setEverCopied(true);
            }}
            size="sm"
            variant="outline"
          >
            <SwapIcon offIcon={<CopyIcon />} on={copied} onIcon={<CheckIcon className="text-success-foreground" />} />
            {copied ? t.copied : t.copy}
          </Button>
        </div>
        <p className="flex items-start gap-2 text-pretty text-muted-foreground text-xs">
          <TriangleAlertIcon className="mt-px size-3.5 shrink-0 text-warning-foreground" />
          {t.storeIt}
        </p>
      </div>
      <DialogFooter>
        <Button className={press} onClick={onDone} variant={everCopied ? "default" : "outline"}>
          {everCopied ? t.done : t.savedIt}
        </Button>
      </DialogFooter>
    </>
  );
}

function CreateKeyForm({
  resources,
  onCreate,
  onCreated,
  t,
}: {
  resources: ScopeResource[];
  onCreate: Action<CreateKeyInput, KeyWithSecret>;
  onCreated: (created: KeyWithSecret) => void;
  t: Messages;
}) {
  const id = useId();
  const format = useFormat();
  const { now } = useWirefront();
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["read:projects", "read:deployments"]);
  const [days, setDays] = useState<CreateKeyInput["expiresInDays"]>(90);
  const [invalid, setInvalid] = useState<string>();
  const create = useAction(onCreate, { onSuccess: (created) => created && onCreated(created) });

  const setAccess = (resource: string, kind: "read" | "write", on: boolean) =>
    setScopes((all) => {
      const read = `read:${resource}`;
      const write = `write:${resource}`;
      const rest = all.filter((s) => s !== read && s !== write);
      if (kind === "write") return on ? [...rest, write, read] : [...rest, read];
      if (!on) return rest;
      return all.includes(write) ? [...rest, write, read] : [...rest, read];
    });

  const submit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    const ordered = [...scopes.filter((s) => s.startsWith("write")), ...scopes.filter((s) => s.startsWith("read"))];
    const parsed = CreateKeyInput.safeParse({ name, scopes: ordered, expiresInDays: days });
    if (!parsed.success) {
      setInvalid(parsed.error.issues[0]?.message);
      return;
    }
    setInvalid(undefined);
    void create.run(parsed.data);
  };
  const error = invalid ?? create.error;

  return (
    <form className="contents" noValidate onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>{t.createKeyTitle}</DialogTitle>
        <DialogDescription>{t.createKeyDescription}</DialogDescription>
      </DialogHeader>
      <div className="-mx-4 flex min-h-0 min-w-0 flex-col gap-5 overflow-y-auto px-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-name`}>{t.name}</Label>
          <Input id={`${id}-name`} onChange={(e) => setName(e.target.value)} placeholder={t.namePlaceholder} value={name} />
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-medium text-sm">{t.scopes}</legend>
          <div className="divide-y rounded-lg border">
            {resources.map((r) => {
              const read = scopes.includes(`read:${r.id}`);
              const write = scopes.includes(`write:${r.id}`);
              return (
                <div className="flex items-center gap-3 px-3 py-2" key={r.id}>
                  <span className="min-w-0 flex-1 truncate text-sm">{r.name}</span>
                  <span className="flex items-center gap-1.5">
                    <Checkbox
                      aria-label={`${r.name}: ${t.read}`}
                      checked={read}
                      id={`${id}-${r.id}-read`}
                      onCheckedChange={(on) => setAccess(r.id, "read", Boolean(on))}
                    />
                    <Label className="cursor-pointer font-mono font-normal text-muted-foreground text-xs" htmlFor={`${id}-${r.id}-read`}>
                      {t.read}
                    </Label>
                  </span>
                  <span className={cn("flex w-14 items-center gap-1.5", r.readOnly && "opacity-40")}>
                    <Checkbox
                      aria-label={`${r.name}: ${t.write}`}
                      checked={write}
                      disabled={r.readOnly}
                      id={`${id}-${r.id}-write`}
                      onCheckedChange={(on) => setAccess(r.id, "write", Boolean(on))}
                    />
                    <Label className="cursor-pointer font-mono font-normal text-muted-foreground text-xs" htmlFor={`${id}-${r.id}-write`}>
                      {t.write}
                    </Label>
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-muted-foreground text-xs">{t.writeIncludesRead}</p>
        </fieldset>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-expiry`}>{t.expires}</Label>
          <Select
            items={EXPIRY_DAYS.map((d) => ({ value: String(d), label: t[`days${d}`] }))}
            onValueChange={(v) => v && setDays(Number(v) as CreateKeyInput["expiresInDays"])}
            value={String(days)}
          >
            <SelectTrigger aria-label={t.expiry} id={`${id}-expiry`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {EXPIRY_DAYS.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {t[`days${d}`]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className={cn("text-xs tabular-nums", days === 0 ? "text-warning-foreground" : "text-muted-foreground")}>
            {days === 0 ? t.noExpiryWarning : interpolate(t.stopsOn, { date: format.date(now().getTime() + days * DAY, { dateStyle: "medium" }) })}
          </p>
        </div>
        {error ? (
          <p className="text-destructive-foreground text-xs" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <DialogFooter>
        <DialogClose disabled={create.isPending()} render={<Button variant="ghost" />}>
          {t.cancel}
        </DialogClose>
        <Button aria-busy={create.isPending()} className={press} disabled={!name.trim() || scopes.length === 0 || create.isPending()} type="submit">
          {create.isPending() ? <Spinner data-icon="inline-start" /> : null}
          {t.createKey}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EventsForm({
  groups,
  initial,
  url,
  onSave,
  t,
  product,
}: {
  groups: EventGroup[];
  initial: string[];
  url?: string;
  onSave: (events: string[], url: string) => Promise<unknown>;
  t: Messages;
  product: string;
}) {
  const id = useId();
  const [selected, setSelected] = useState(initial);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const adding = url === undefined;

  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    let target = url ?? "";
    if (adding) {
      const parsed = EndpointInput.shape.url.safeParse(value.trim());
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? null);
        return;
      }
      target = parsed.data;
    }
    setPending(true);
    await onSave(selected, target);
    setPending(false);
  };

  return (
    <form className="contents" noValidate onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>{adding ? t.addEndpoint : t.events}</DialogTitle>
        <DialogDescription>
          {adding ? interpolate(t.addEndpointDescription, { product }) : <span className="break-all font-mono text-xs">{url}</span>}
        </DialogDescription>
      </DialogHeader>
      <div className="-mx-4 flex min-h-0 min-w-0 flex-col gap-5 overflow-y-auto px-4">
        {adding ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-url`}>{t.endpointUrl}</Label>
            <Input
              aria-describedby={error ? `${id}-error` : undefined}
              aria-invalid={error ? true : undefined}
              id={`${id}-url`}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder={t.urlPlaceholder}
              type="url"
              value={value}
            />
            {error ? (
              <p className="text-destructive-foreground text-xs" id={`${id}-error`}>
                {error}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-col gap-4">
          {groups.map((g) => {
            const ids = g.events.map((e) => e.id);
            const count = ids.filter((e) => selected.includes(e)).length;
            return (
              <div className="flex flex-col gap-2" key={g.id}>
                <span className="flex w-fit items-center gap-2">
                  <Checkbox
                    checked={count === ids.length}
                    id={`${id}-${g.id}`}
                    indeterminate={count > 0 && count < ids.length}
                    onCheckedChange={(on) => setSelected((s) => (on ? Array.from(new Set([...s, ...ids])) : s.filter((e) => !ids.includes(e))))}
                  />
                  <Label className="cursor-pointer font-medium text-sm" htmlFor={`${id}-${g.id}`}>
                    {g.name}
                  </Label>
                </span>
                <div className="grid gap-x-4 gap-y-1.5 ps-6 sm:grid-cols-2">
                  {g.events.map((ev) => (
                    <span className="flex items-start gap-2" key={ev.id}>
                      <Checkbox
                        checked={selected.includes(ev.id)}
                        className="mt-0.5"
                        id={`${id}-${ev.id}`}
                        onCheckedChange={(on) => setSelected((s) => (on ? [...s, ev.id] : s.filter((e) => e !== ev.id)))}
                      />
                      <Label className="flex min-w-0 cursor-pointer flex-col items-start gap-0 font-normal" htmlFor={`${id}-${ev.id}`}>
                        <span className="truncate font-mono text-xs">{ev.id}</span>
                        <span className="text-muted-foreground text-xs">{ev.hint}</span>
                      </Label>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <DialogFooter>
        <DialogClose disabled={pending} render={<Button variant="ghost" />}>
          {t.cancel}
        </DialogClose>
        <Button aria-busy={pending} className={press} disabled={selected.length === 0 || pending} type="submit">
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {adding ? t.addEndpoint : t.saveEvents}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeveloperSettingsScreen({
  data,
  product,
  onCreateKey,
  onRollKey,
  onRevokeKey,
  onCreateEndpoint,
  onUpdateEndpoint,
  onDeleteEndpoint,
  onRevealSecret,
  onRollSecret,
  onSendTest,
  onRetryDeliveries,
  className,
}: DeveloperSettingsProps) {
  const t = useMessages("developerSettings", DEVELOPER_SETTINGS_MESSAGES);
  const format = useFormat();
  const reduce = Boolean(useReducedMotion());
  const [keys, setKeys] = useState(data.keys);
  const [endpoints, setEndpoints] = useState(data.endpoints);
  const [source, setSource] = useState(data);
  if (source !== data) {
    setSource(data);
    setKeys(data.keys);
    setEndpoints(data.endpoints);
  }
  const [selectedId, setSelectedId] = useState(data.endpoints[0]?.id ?? "");
  const [creatingKey, setCreatingKey] = useState(false);
  const [revealedKey, setRevealedKey] = useState<KeyWithSecret | null>(null);
  const [eventsDialog, setEventsDialog] = useState<{ endpointId?: string; key: number } | null>(null);
  const [revoking, setRevoking] = useState<DevApiKey | null>(null);
  const [deleting, setDeleting] = useState<Endpoint | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [rolled, setRolled] = useState<string | null>(null);
  const [busy, setBusy] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const secretCopy = useCopy();

  useEffect(() => {
    if (!fresh) return;
    const timer = setTimeout(() => setFresh(null), 2400);
    return () => clearTimeout(timer);
  }, [fresh]);

  const endpoint = endpoints.find((e) => e.id === selectedId) ?? endpoints[0];
  const statusOf = (e: Endpoint) => (e.paused ? "paused" : e.deliveries.some((d) => !isOk(d.status)) ? "failing" : "active");
  const patchEndpoint = (eid: string, fn: (e: Endpoint) => Endpoint) => setEndpoints((all) => all.map((e) => (e.id === eid ? fn(e) : e)));
  const totalEvents = data.eventGroups.reduce((n, g) => n + g.events.length, 0);

  const rollKey = useAction(onRollKey ?? (async () => {}), {
    onSuccess: (created) => {
      if (!created) return;
      setKeys((all) => all.map((k) => (k.id === created.key.id ? created.key : k)));
      setRevealedKey(created);
      setFresh(created.key.id);
    },
  });
  const revokeKey = useAction(onRevokeKey ?? (async () => {}), {
    onSuccess: (_, kid) => {
      setRevoking(null);
      setKeys((all) => all.filter((k) => k.id !== kid));
    },
  });
  const updateEndpoint = useAction(onUpdateEndpoint ?? (async () => {}), {
    optimistic: (patch) => {
      const before = endpoints.find((e) => e.id === patch.id);
      patchEndpoint(patch.id, (e) => ({ ...e, ...(patch.events ? { events: patch.events } : {}), ...(patch.paused !== undefined ? { paused: patch.paused } : {}) }));
      return () => before && patchEndpoint(patch.id, () => before);
    },
  });
  const deleteEndpoint = useAction(onDeleteEndpoint ?? (async () => {}), {
    onSuccess: (_, eid) => {
      setDeleting(null);
      const next = endpoints.find((e) => e.id !== eid);
      setEndpoints((all) => all.filter((e) => e.id !== eid));
      if (selectedId === eid && next) setSelectedId(next.id);
    },
  });
  const revealSecret = useAction(onRevealSecret ?? (async () => {}), {
    onSuccess: (result, eid) => result && setSecrets((s) => ({ ...s, [eid]: result.secret })),
  });
  const rollSecret = useAction(onRollSecret ?? (async () => {}), {
    onSuccess: (result, eid) => {
      if (!result) return;
      setSecrets((s) => ({ ...s, [eid]: result.secret }));
      setRolled(eid);
      setRevealed(true);
    },
  });
  const merge = (eid: string, results: Delivery[]) =>
    patchEndpoint(eid, (e) => {
      const byId = new Map(results.map((d) => [d.id, d]));
      const updated = e.deliveries.map((d) => byId.get(d.id) ?? d);
      const added = results.filter((d) => !e.deliveries.some((x) => x.id === d.id));
      return { ...e, deliveries: [...added, ...updated] };
    });
  const sendTest = useAction(onSendTest ?? (async () => {}), { onSuccess: (delivery, eid) => delivery && merge(eid, [delivery]) });
  const retry = async (endpointId: string, deliveryIds: string[]) => {
    if (!onRetryDeliveries || deliveryIds.length === 0) return;
    setBusy((b) => [...b, ...deliveryIds]);
    const settled = await retryAction.run({ endpointId, deliveryIds });
    setBusy((b) => b.filter((x) => !deliveryIds.includes(x)));
    if (settled.ok && settled.data) merge(endpointId, settled.data);
  };
  const retryAction = useAction(onRetryDeliveries ?? (async () => {}));

  const actionError =
    error ?? rollKey.error ?? revokeKey.error ?? updateEndpoint.error ?? deleteEndpoint.error ?? revealSecret.error ?? rollSecret.error ?? sendTest.error ?? retryAction.error;
  const fade = reduce ? { duration: 0 } : { duration: 0.22, ease: easeOut };
  const failed = endpoint ? endpoint.deliveries.filter((d) => !isOk(d.status)) : [];
  const eventsTarget = eventsDialog?.endpointId ? endpoints.find((e) => e.id === eventsDialog.endpointId) : undefined;
  const secret = endpoint ? secrets[endpoint.id] : undefined;
  const canEditEvents = Boolean(onUpdateEndpoint);

  const saveEvents = async (events: string[], url: string) => {
    setError(undefined);
    if (eventsTarget) {
      const result = await updateEndpoint.run({ id: eventsTarget.id, events });
      if (result.ok) setEventsDialog(null);
      return;
    }
    if (!onCreateEndpoint) return;
    const result = await createEndpoint.run({ url, events });
    if (result.ok) setEventsDialog(null);
  };
  const createEndpoint = useAction(onCreateEndpoint ?? (async () => {}), {
    onSuccess: (created) => {
      if (!created) return;
      setEndpoints((all) => [...all, created]);
      setSelectedId(created.id);
      setRevealed(false);
    },
    onError: (message) => setError(message),
  });

  const toggleReveal = () => {
    if (!endpoint) return;
    if (!revealed && !secret) void revealSecret.run(endpoint.id, endpoint.id);
    setRevealed((r) => !r);
  };
  const copySecret = async () => {
    if (!endpoint) return;
    if (secret) return secretCopy.copy(secret);
    const result = await revealSecret.run(endpoint.id, endpoint.id);
    if (result.ok && result.data) secretCopy.copy(result.data.secret);
  };

  return (
    <div className={cn("mx-auto w-full max-w-2xl px-6 py-10 md:px-10", className)}>
      <h1 className="font-semibold text-2xl tracking-tight">{t.title}</h1>
      <p className="mt-1 text-muted-foreground text-sm">{interpolate(t.subtitle, { product })}</p>

      {actionError ? (
        <p className="mt-4 text-destructive-foreground text-sm" role="alert">
          {actionError}
        </p>
      ) : null}

      <section className="mt-10">
        <SectionHeader
          action={
            onCreateKey ? (
              <Button className={cn("shrink-0 self-start sm:self-auto", press)} onClick={() => setCreatingKey(true)} size="sm">
                <PlusIcon />
                {t.createKey}
              </Button>
            ) : null
          }
          description={t.keysDescription}
          title={t.keysTitle}
        />
        <div className="mt-3 overflow-hidden rounded-xl border bg-card">
          <div className="hidden grid-cols-[minmax(0,1fr)_10rem_7.5rem_2rem] items-center gap-3 border-b px-4 py-2.5 font-medium text-muted-foreground text-xs sm:grid">
            <span>{t.columnName}</span>
            <span>{t.columnScopes}</span>
            <span>{t.columnExpires}</span>
            <span className="sr-only">{t.actions}</span>
          </div>
          <ul>
            <AnimatePresence initial={false}>
              {keys.map((k) => (
                <motion.li
                  animate={{ opacity: 1, height: "auto" }}
                  className={cn("overflow-hidden border-b transition-colors duration-700 last:border-b-0", fresh === k.id && "bg-success/6")}
                  exit={{ opacity: 0, height: 0 }}
                  initial={false}
                  key={k.id}
                  transition={fade}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_10rem_7.5rem_2rem]">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-sm">{k.name}</p>
                      <p className="truncate text-muted-foreground text-xs">
                        <span className="font-mono">
                          {k.prefix}…{k.last4}
                        </span>
                        <span aria-hidden> · </span>
                        {k.lastUsedAt ? interpolate(t.used, { when: format.relative(k.lastUsedAt) }) : t.neverUsed}
                      </p>
                    </div>
                    <div className="col-span-2 row-start-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:contents sm:text-sm">
                      <ScopeChips scopes={k.scopes} t={t} />
                      <span className="sm:hidden">
                        <span className="text-muted-foreground">{t.expires} </span>
                        <Expiry apiKey={k} t={t} />
                      </span>
                      <span className="hidden sm:inline">
                        <Expiry apiKey={k} t={t} />
                      </span>
                    </div>
                    {onRollKey || onRevokeKey ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              aria-label={interpolate(t.actionsFor, { name: k.name })}
                              className={cn("col-start-2 row-start-1 justify-self-end sm:col-start-auto sm:row-start-auto", press)}
                              size="icon-sm"
                              variant="ghost"
                            />
                          }
                        >
                          {rollKey.isPending(k.id) ? <Spinner /> : <EllipsisIcon />}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {onRollKey ? (
                            <DropdownMenuItem onClick={() => void rollKey.run(k.id, k.id)}>
                              <RefreshCwIcon />
                              {t.rollKey}
                            </DropdownMenuItem>
                          ) : null}
                          {onRollKey && onRevokeKey ? <DropdownMenuSeparator /> : null}
                          {onRevokeKey ? (
                            <DropdownMenuItem onClick={() => setRevoking(k)} variant="destructive">
                              <Trash2Icon />
                              {t.revokeKey}
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span />
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          {keys.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
              <p className="font-medium text-sm">{t.noKeys}</p>
              <p className="text-muted-foreground text-xs">{t.noKeysHint}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-10">
        <SectionHeader
          action={
            onCreateEndpoint ? (
              <Button
                className={cn("shrink-0 self-start sm:self-auto", press)}
                onClick={() => setEventsDialog({ key: (eventsDialog?.key ?? 0) + 1 })}
                size="sm"
                variant="outline"
              >
                <PlusIcon />
                {t.addEndpoint}
              </Button>
            ) : null
          }
          description={interpolate(t.webhooksDescription, { product })}
          title={t.webhooksTitle}
        />
        <div className="mt-3 overflow-hidden rounded-xl border bg-card">
          <ul>
            <AnimatePresence initial={false}>
              {endpoints.map((e) => {
                const s = statusOf(e);
                const active = e.id === endpoint?.id;
                const failing = e.deliveries.filter((d) => !isOk(d.status)).length;
                return (
                  <motion.li
                    animate={{ opacity: 1, height: "auto" }}
                    className="relative overflow-hidden border-b last:border-b-0"
                    exit={{ opacity: 0, height: 0 }}
                    initial={false}
                    key={e.id}
                    transition={fade}
                  >
                    <div className={cn("flex items-center gap-3 py-3 ps-4 pe-3 transition-colors duration-150", active ? "bg-accent/50" : "hover:bg-accent/30")}>
                      <button
                        aria-current={active ? "true" : undefined}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
                        onClick={() => {
                          setSelectedId(e.id);
                          setRevealed(false);
                        }}
                        type="button"
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            s === "active" && "bg-success",
                            s === "failing" && "bg-destructive",
                            s === "paused" && "bg-muted-foreground/40",
                          )}
                        />
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate font-mono text-[13px]">{e.url.replace(/^https:\/\//, "")}</span>
                          <span className={cn("text-xs", s === "failing" ? "text-destructive-foreground" : "text-muted-foreground")}>
                            {e.events.length === 1 ? t.eventOne : interpolate(t.eventOther, { count: e.events.length })} ·{" "}
                            {s === "failing" ? interpolate(t.failing, { count: failing }) : s === "paused" ? t.paused : t.healthy}
                          </span>
                        </span>
                      </button>
                      {onUpdateEndpoint ? (
                        <Switch
                          aria-label={interpolate(t.sendTo, { host: hostOf(e.url) })}
                          checked={!e.paused}
                          className="relative"
                          onCheckedChange={(on) => void updateEndpoint.run({ id: e.id, paused: !on }, e.id)}
                        />
                      ) : null}
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button aria-label={interpolate(t.actionsFor, { name: hostOf(e.url) })} className={cn("relative", press)} size="icon-sm" variant="ghost" />}
                        >
                          <EllipsisIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {canEditEvents ? (
                            <DropdownMenuItem onClick={() => setEventsDialog({ endpointId: e.id, key: (eventsDialog?.key ?? 0) + 1 })}>
                              <CheckIcon />
                              {t.editEvents}
                            </DropdownMenuItem>
                          ) : null}
                          {onSendTest ? (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedId(e.id);
                                void sendTest.run(e.id, e.id);
                              }}
                            >
                              <SendIcon />
                              {t.sendTestEvent}
                            </DropdownMenuItem>
                          ) : null}
                          {onDeleteEndpoint ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleting(e)} variant="destructive">
                                <Trash2Icon />
                                {t.deleteEndpoint}
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
          {endpoints.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
              <p className="font-medium text-sm">{t.noEndpoints}</p>
              <p className="text-muted-foreground text-xs">{t.noEndpointsHint}</p>
            </div>
          ) : null}
        </div>

        {endpoint ? (
          <>
            <h3 className="mt-6 truncate font-medium text-muted-foreground text-xs">
              {t.settingsFor} <span className="font-mono">{hostOf(endpoint.url)}</span>
            </h3>
            <div className="mt-2 divide-y rounded-xl border bg-card">
              <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{t.signingSecret}</p>
                  <p className="text-muted-foreground text-xs">{rolled === endpoint.id ? t.secretRolled : t.secretHint}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {onRevealSecret ? (
                    <div className="flex min-w-0 flex-1 items-center rounded-lg border bg-muted/50 py-0.5 ps-2.5 pe-0.5 sm:w-56 sm:flex-none">
                      <code className="min-w-0 flex-1 truncate font-mono text-xs">{revealed && secret ? secret : "•".repeat(16)}</code>
                      <Button
                        aria-busy={revealSecret.isPending(endpoint.id)}
                        aria-label={revealed ? t.hideSecret : t.revealSecret}
                        aria-pressed={revealed}
                        className={press}
                        onClick={toggleReveal}
                        size="icon-xs"
                        variant="ghost"
                      >
                        <SwapIcon offIcon={<EyeIcon />} on={revealed} onIcon={<EyeOffIcon />} />
                      </Button>
                      <Button aria-label={t.copySecret} className={press} onClick={() => void copySecret()} size="icon-xs" variant="ghost">
                        <SwapIcon offIcon={<CopyIcon />} on={secretCopy.copied} onIcon={<CheckIcon className="text-success-foreground" />} />
                      </Button>
                    </div>
                  ) : null}
                  {onRollSecret ? (
                    <Button
                      aria-busy={rollSecret.isPending(endpoint.id)}
                      className={press}
                      disabled={rollSecret.isPending(endpoint.id)}
                      onClick={() => void rollSecret.run(endpoint.id, endpoint.id)}
                      size="sm"
                      variant="outline"
                    >
                      {rollSecret.isPending(endpoint.id) ? <Spinner data-icon="inline-start" /> : null}
                      {t.roll}
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-4 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{t.events}</p>
                  <p className="truncate text-muted-foreground text-xs tabular-nums">
                    {interpolate(t.eventsSummary, { count: endpoint.events.length, total: totalEvents, first: endpoint.events.slice(0, 2).join(", ") })}
                    {endpoint.events.length > 2 ? interpolate(t.andMore, { count: endpoint.events.length - 2 }) : null}
                  </p>
                </div>
                {canEditEvents ? (
                  <Button className={press} onClick={() => setEventsDialog({ endpointId: endpoint.id, key: (eventsDialog?.key ?? 0) + 1 })} size="sm" variant="outline">
                    {t.edit}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <h3 className="font-medium text-muted-foreground text-xs">{t.recentDeliveries}</h3>
              <div className="-me-2 flex items-center gap-1">
                {onRetryDeliveries && failed.length > 1 ? (
                  <Button
                    className={press}
                    disabled={failed.every((d) => busy.includes(d.id))}
                    onClick={() =>
                      void retry(
                        endpoint.id,
                        failed.filter((d) => !busy.includes(d.id)).map((d) => d.id),
                      )
                    }
                    size="xs"
                    variant="ghost"
                  >
                    <RotateCwIcon />
                    {t.retryFailed}
                  </Button>
                ) : null}
                {onSendTest ? (
                  <Button aria-busy={sendTest.isPending(endpoint.id)} className={press} disabled={sendTest.isPending(endpoint.id)} onClick={() => void sendTest.run(endpoint.id, endpoint.id)} size="xs" variant="ghost">
                    {sendTest.isPending(endpoint.id) ? <Spinner /> : <SendIcon />}
                    {t.sendTest}
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="mt-2 overflow-hidden rounded-xl border bg-card">
              <div className="hidden grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_6rem_4.5rem] items-center gap-3 border-b px-4 py-2.5 font-medium text-muted-foreground text-xs sm:grid">
                <span>{t.columnEvent}</span>
                <span>{t.columnStatus}</span>
                <span className="text-right">{t.columnLatency}</span>
                <span className="text-right">{t.columnTime}</span>
                <span className="sr-only">{t.actions}</span>
              </div>
              <ul>
                <AnimatePresence initial={false}>
                  {endpoint.deliveries.map((d) => {
                    const ok = isOk(d.status);
                    const isBusy = busy.includes(d.id);
                    const when = format.relative(d.at);
                    return (
                      <motion.li
                        animate={{ opacity: 1, height: "auto" }}
                        className="overflow-hidden border-b last:border-b-0"
                        exit={{ opacity: 0, height: 0 }}
                        initial={false}
                        key={d.id}
                        transition={fade}
                      >
                        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 px-4 py-2.5 sm:grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_6rem_4.5rem]">
                          <span className="col-start-2 row-start-1 truncate font-mono text-[13px] sm:col-start-auto">{d.event}</span>
                          <span className="col-start-1 row-span-2 row-start-1 sm:col-start-auto sm:row-span-1 sm:row-start-auto">
                            <StatusCode busy={isBusy} reduce={reduce} status={d.status} t={t} />
                          </span>
                          <span
                            className={cn(
                              "col-start-2 row-start-2 font-mono text-muted-foreground text-xs tabular-nums sm:col-start-auto sm:row-start-auto sm:text-right",
                              !isBusy && d.latencyMs >= 1000 && "text-warning-foreground",
                            )}
                          >
                            {isBusy ? "…" : formatLatency(d.latencyMs)}
                            <span className="font-sans text-muted-foreground sm:hidden"> · {when}</span>
                          </span>
                          <span className="hidden text-right text-muted-foreground text-sm sm:block">{when}</span>
                          <span className="col-start-3 row-span-2 row-start-1 flex justify-end sm:col-start-auto sm:row-span-1 sm:row-start-auto">
                            {!ok && onRetryDeliveries ? (
                              <Button className={press} disabled={isBusy} onClick={() => void retry(endpoint.id, [d.id])} size="xs" variant="outline">
                                <RotateCwIcon />
                                {t.retry}
                              </Button>
                            ) : null}
                          </span>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
              {endpoint.deliveries.length === 0 ? <p className="px-4 py-8 text-center text-muted-foreground text-sm">{t.noDeliveries}</p> : null}
            </div>
          </>
        ) : null}
      </section>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setCreatingKey(false);
            setRevealedKey(null);
          }
        }}
        open={creatingKey || revealedKey !== null}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={!revealedKey}>
          {revealedKey ? (
            <SecretReveal
              key={revealedKey.secret}
              name={revealedKey.key.name}
              onDone={() => {
                setRevealedKey(null);
                setCreatingKey(false);
              }}
              secret={revealedKey.secret}
              t={t}
            />
          ) : onCreateKey ? (
            <CreateKeyForm
              onCreate={onCreateKey}
              onCreated={(created) => {
                setKeys((all) => [created.key, ...all]);
                setFresh(created.key.id);
                setRevealedKey(created);
              }}
              resources={data.resources}
              t={t}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={(open) => !open && setEventsDialog(null)} open={eventsDialog !== null}>
        <DialogContent className="sm:max-w-lg">
          {eventsDialog ? (
            <EventsForm
              groups={data.eventGroups}
              initial={eventsTarget?.events ?? ["deployment.failed"]}
              key={eventsDialog.key}
              onSave={saveEvents}
              product={product}
              t={t}
              url={eventsTarget?.url}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={(open) => !open && !revokeKey.isPending() && setRevoking(null)} open={revoking !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{interpolate(t.revokeTitle, { name: revoking?.name ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{interpolate(t.revokeDescription, { last4: revoking?.last4 ?? "" })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeKey.isPending()} render={<Button variant="ghost" />}>
              {t.cancel}
            </AlertDialogCancel>
            <Button
              aria-busy={revokeKey.isPending()}
              className="text-destructive-foreground"
              disabled={revokeKey.isPending()}
              onClick={() => revoking && void revokeKey.run(revoking.id, revoking.id)}
              variant="destructive"
            >
              {revokeKey.isPending() ? <Spinner data-icon="inline-start" /> : null}
              {t.revokeKey}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog onOpenChange={(open) => !open && !deleteEndpoint.isPending() && setDeleting(null)} open={deleting !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription className="break-all">{interpolate(t.deleteDescription, { url: deleting?.url ?? "" })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteEndpoint.isPending()} render={<Button variant="ghost" />}>
              {t.cancel}
            </AlertDialogCancel>
            <Button
              aria-busy={deleteEndpoint.isPending()}
              className="text-destructive-foreground"
              disabled={deleteEndpoint.isPending()}
              onClick={() => deleting && void deleteEndpoint.run(deleting.id, deleting.id)}
              variant="destructive"
            >
              {deleteEndpoint.isPending() ? <Spinner data-icon="inline-start" /> : null}
              {t.deleteEndpoint}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function DeveloperSettings(props: DeveloperSettingsProps) {
  return (
    <ScreenBoundary name="DeveloperSettings">
      <DeveloperSettingsScreen {...props} />
    </ScreenBoundary>
  );
}
