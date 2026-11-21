// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { Input } from "@wirefront/ui/input";
import { cn } from "@wirefront/ui/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@wirefront/ui/select";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { Switch } from "@wirefront/ui/switch";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import { type Action, type AsyncStatus, fail } from "@wirefront/ui/wirefront/types";
import { AlertTriangleIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon, CopyIcon, KeyRoundIcon, PlusIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { AttributeMapping, type SsoConfig, type SsoProvider, type SsoTestResult } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("ssoSetup.<key>"). */
export const SSO_SETUP_MESSAGES = {
  eyebrow: "Settings · Authentication",
  title: "Single Sign-On",
  subtitle: "Let your team sign in through your identity provider.",
  chooseProvider: "Choose a provider",
  protocols: "SAML 2.0 · OIDC",
  stepOf: "Step {step} of {total}",
  setUp: "Set up",
  resume: "Resume setup",
  configuring: "Configuring · {provider}",
  application: "SAML application",
  stepCounter: "Step {step} / {total}",
  step: "Step",
  done: "done",
  stepSetup: "Application setup",
  stepSetupHint: "Endpoints",
  stepMapping: "Attribute mapping",
  stepMappingHint: "Claims",
  stepTest: "Test connection",
  stepTestHint: "Verify",
  stepEnforce: "Enforce SSO",
  stepEnforceHint: "Rollout",
  setupIntro: "Paste these endpoints into your {provider} SAML application. They identify {product} as the service provider.",
  acsUrl: "SSO URL (ACS)",
  audience: "Audience URI",
  copy: "Copy {label}",
  copied: "Copied {label}",
  setupTip: "Create a new SAML 2.0 app in {provider} and paste these into its single sign-on URL and audience URI fields. Use EmailAddress as the name ID format.",
  mappingIntro: "Map SAML assertion attributes from your IdP to {product} user fields. Email is required — everything else is optional.",
  idpAttribute: "IdP attribute",
  productField: "{product} field",
  fieldFor: "{product} field for {source}",
  newAttribute: "Attribute name",
  required: "Required",
  optional: "Optional",
  addMapping: "Add mapping",
  testIntro: "Trigger a test login against your IdP. We’ll show the attributes we received so you can confirm the mapping.",
  testHint: "Opens your IdP, then comes back here with the asserted attributes. Nothing is saved.",
  runTest: "Run test login",
  waiting: "Waiting for IdP…",
  testOk: "Test login successful",
  testMapped: "User attributes received from {provider}. Mapped {mapped} of {total} fields.",
  showAttributes: "Show received attributes",
  hideAttributes: "Hide received attributes",
  enforceIntro: "Once enforced, all members must authenticate through your IdP. Personal credentials stop working immediately.",
  oneWay: "This is a one-way switch",
  oneWayHint: "All members will be required to sign in via your IdP. Existing password sessions will be revoked. Service accounts and API tokens are unaffected.",
  requireSso: "Require SSO for all members",
  sessionsRevoked: "{count} active sessions will be revoked",
  enforced: "SSO is enforced",
  back: "Back",
  continue: "Continue",
  finalStep: "Final step",
  continueWhenReady: "Continue when ready",
  saveEnforce: "Save & enforce",
  errorTitle: "Couldn’t load SSO settings",
  retry: "Try again",
};

export interface SsoSetupProps {
  /** Identity providers you can connect. */
  providers?: SsoProvider[];
  /** The setup in progress. Leave it out while it loads. */
  config?: SsoConfig;
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Your product's name, used in the instructions. */
  product: string;
  /** Start or resume setting up a provider (receives its id). The cards' buttons only show with this. */
  onSelectProvider?: (id: string) => void;
  /** Save the attribute mapping; runs when leaving the mapping step. */
  onSaveMappings?: Action<AttributeMapping[]>;
  /** Run a test login; resolve with what the IdP asserted. The test step's button only shows with this. */
  onTest?: Action<void, SsoTestResult>;
  /** Require SSO for every member. "Save & enforce" only shows with this. */
  onEnforce?: Action;
  className?: string;
}

type StepKey = "setup" | "mapping" | "test" | "enforce";
const STEPS: StepKey[] = ["setup", "mapping", "test", "enforce"];
const STEP_TEXT: Record<StepKey, { title: keyof typeof SSO_SETUP_MESSAGES; hint: keyof typeof SSO_SETUP_MESSAGES; intro: keyof typeof SSO_SETUP_MESSAGES }> = {
  setup: { title: "stepSetup", hint: "stepSetupHint", intro: "setupIntro" },
  mapping: { title: "stepMapping", hint: "stepMappingHint", intro: "mappingIntro" },
  test: { title: "stepTest", hint: "stepTestHint", intro: "testIntro" },
  enforce: { title: "stepEnforce", hint: "stepEnforceHint", intro: "enforceIntro" },
};
const MappingList = AttributeMapping.array();
const fieldError = "text-destructive-foreground text-xs";
const eyebrow = "font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]";
const pad2 = (n: number) => String(n).padStart(2, "0");

function CopyRow({ label, value, t }: { label: string; value: string; t: typeof SSO_SETUP_MESSAGES }) {
  const [copied, setCopied] = useState(false);
  const copy = useAction(
    async () => {
      if (!navigator.clipboard) return fail("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
    },
    {
      onSuccess: () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      },
    },
  );
  return (
    <div>
      <div className={cn(eyebrow, "mb-1.5")}>{label}</div>
      <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-3 py-2">
        {/* Wraps on phones so the whole URL / ID can be checked before pasting. */}
        <code className="min-w-0 flex-1 break-all font-mono text-xs sm:truncate sm:break-normal">{value}</code>
        <button
          aria-label={interpolate(copied ? t.copied : t.copy, { label })}
          className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground outline-none hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-9"
          onClick={() => void copy.run()}
          type="button"
        >
          {copied ? <CheckIcon aria-hidden className="size-3.5 text-category-2-foreground" /> : <CopyIcon aria-hidden className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}

function SsoSetupScreen({ providers = [], config, status = "ready", error, onRetry, product, onSelectProvider, onSaveMappings, onTest, onEnforce, className }: SsoSetupProps) {
  const t = useMessages("ssoSetup", SSO_SETUP_MESSAGES);
  const id = useId();
  const provider = providers.find((p) => p.id === config?.providerId);
  const [step, setStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [mappings, setMappings] = useState<AttributeMapping[]>([]);
  const [mappingError, setMappingError] = useState<string>();
  const [result, setResult] = useState<SsoTestResult | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    if (!config) return;
    setMappings(config.mappings);
    const start = provider?.inProgressStep ?? 1;
    setStep(start);
    setMaxReached(start);
  }, [config, provider?.inProgressStep]);

  const saveMappings = useAction(onSaveMappings ?? (async () => {}), { onSuccess: () => goTo(step + 1) });
  const test = useAction(onTest ?? (async () => fail("")), { onSuccess: (r) => setResult(r) });
  const enforce = useAction(onEnforce ?? (async () => {}));

  const goTo = (next: number) => {
    setStep(next);
    setMaxReached((m) => Math.max(m, next));
  };
  const proceed = () => {
    if (STEPS[step - 1] === "mapping") {
      const parsed = MappingList.safeParse(mappings);
      if (!parsed.success) {
        setMappingError(parsed.error.issues[0]?.message);
        return;
      }
      setMappingError(undefined);
      if (onSaveMappings) {
        void saveMappings.run(parsed.data);
        return;
      }
    }
    goTo(step + 1);
  };

  const ready = status === "ready" && config;
  const key = STEPS[step - 1] ?? "setup";
  const providerName = provider?.name ?? "";
  const busy = saveMappings.isPending() || enforce.isPending();

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
        <h1 className="mt-1 font-heading text-3xl">{t.title}</h1>
        <p className="mt-1.5 text-muted-foreground text-sm">{t.subtitle}</p>

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
        ) : !ready ? (
          <div aria-busy="true" className="mt-8 flex flex-col gap-4">
            <Skeleton className="h-40 w-full rounded-xl motion-reduce:animate-none" />
            <Skeleton className="h-80 w-full rounded-xl motion-reduce:animate-none" />
          </div>
        ) : (
          <>
            <section aria-labelledby={`${id}-providers`} className="mt-8">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-medium text-sm" id={`${id}-providers`}>
                  {t.chooseProvider}
                </h2>
                <span className={eyebrow}>{t.protocols}</span>
              </div>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {providers.map((p) => (
                  <li className="group flex flex-col gap-3 rounded-xl border border-border/60 bg-background/40 p-4 transition-colors hover:border-foreground/30" key={p.id}>
                    <div className="flex items-start justify-between">
                      <div aria-hidden className="grid size-10 place-items-center rounded-lg bg-foreground font-medium text-background text-base">
                        {p.name[0]}
                      </div>
                      {p.inProgressStep ? (
                        <span className="inline-flex items-center gap-1 rounded bg-category-3/10 px-1.5 py-0.5 font-mono text-[9px] text-category-3-foreground uppercase tracking-[0.2em]">
                          <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-category-3 motion-reduce:animate-none" />
                          {interpolate(t.stepOf, { step: p.inProgressStep, total: STEPS.length })}
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{p.name}</h3>
                      <p className="mt-1 text-muted-foreground text-xs leading-relaxed">{p.description}</p>
                    </div>
                    {onSelectProvider ? (
                      <div className="mt-auto pt-1">
                        <Button className="w-full" onClick={() => onSelectProvider(p.id)} size="sm" type="button" variant="outline">
                          {p.inProgressStep ? t.resume : t.setUp} <span className="sr-only">{p.name}</span>
                        </Button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby={`${id}-wizard`} className="mt-10 overflow-hidden rounded-xl border border-border/70 bg-background/40">
              <div className="flex flex-wrap items-center justify-between gap-3 border-border/60 border-b px-4 py-4 sm:px-5">
                <div className="flex items-center gap-3">
                  <div aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground font-medium text-[13px] text-background">
                    {providerName[0]}
                  </div>
                  <div>
                    <div className={eyebrow}>{interpolate(t.configuring, { provider: providerName })}</div>
                    <h2 className="mt-0.5 font-heading text-base" id={`${id}-wizard`}>
                      {t.application}
                    </h2>
                  </div>
                </div>
                <div className={eyebrow}>{interpolate(t.stepCounter, { step: pad2(step), total: pad2(STEPS.length) })}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
                {/* Below md: a compact stepper that wraps, so every step stays visible. */}
                <ol className="flex flex-wrap gap-1 border-border/60 border-b px-3 py-2 md:flex-col md:flex-nowrap md:border-e md:border-b-0 md:py-5">
                  {STEPS.map((s, i) => {
                    const n = i + 1;
                    const isCurrent = n === step;
                    const isComplete = n < maxReached;
                    const reachable = n <= maxReached;
                    return (
                      <li className="shrink-0" key={s}>
                        <button
                          aria-current={isCurrent ? "step" : undefined}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-60 pointer-coarse:min-h-11",
                            isCurrent ? "bg-foreground/6" : "hover:bg-foreground/4",
                          )}
                          disabled={!reachable}
                          onClick={() => setStep(n)}
                          type="button"
                        >
                          <span
                            className={cn(
                              "grid size-6 shrink-0 place-items-center rounded-full font-mono text-[10px]",
                              isComplete ? "bg-category-2/15 text-category-2-foreground" : isCurrent ? "bg-foreground text-background" : "border border-border/70 text-muted-foreground",
                            )}
                          >
                            <span className="sr-only">{t.step}</span> {isComplete ? <CheckIcon aria-hidden className="size-3" /> : null}
                            <span className={cn(isComplete && "sr-only")}>{n}</span>
                            {isComplete ? <span className="sr-only">, {t.done}:</span> : null}
                          </span>{" "}
                          <span className={cn("min-w-0 flex-1", !isCurrent && "max-md:hidden")}>
                            <span className={cn("block truncate text-sm", isCurrent ? "font-medium text-foreground" : "text-foreground/85")}>{t[STEP_TEXT[s].title]}</span>
                            <span className="block font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] max-md:hidden">{t[STEP_TEXT[s].hint]}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>

                <div className="min-w-0 px-4 py-5 sm:px-6 sm:py-6">
                  <div className={eyebrow}>
                    {t.step} {pad2(step)}
                  </div>
                  <h3 className="mt-1 font-heading text-lg">{t[STEP_TEXT[key].title]}</h3>
                  <p className="mt-1 max-w-xl text-muted-foreground text-sm">{interpolate(t[STEP_TEXT[key].intro], { provider: providerName, product })}</p>

                  {key === "setup" ? (
                    <>
                      <div className="mt-6 flex flex-col gap-3">
                        <CopyRow label={t.acsUrl} t={t} value={config.acsUrl} />
                        <CopyRow label={t.audience} t={t} value={config.audienceUri} />
                      </div>
                      <div className="mt-5 flex items-start gap-3 rounded-md border border-border/60 bg-muted/30 px-4 py-3">
                        <KeyRoundIcon aria-hidden className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                        <p className="text-muted-foreground text-xs leading-relaxed">{interpolate(t.setupTip, { provider: providerName })}</p>
                      </div>
                    </>
                  ) : null}

                  {key === "mapping" ? (
                    <>
                      <div className="mt-6 overflow-hidden rounded-md border border-border/60">
                        <div aria-hidden className="hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-3 border-border/60 border-b bg-muted/30 px-4 py-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] sm:grid">
                          <span>{t.idpAttribute}</span>
                          <span className="w-4" />
                          <span>{interpolate(t.productField, { product })}</span>
                          <span className="w-16 text-end">{t.required}</span>
                        </div>
                        <ul>
                          {mappings.map((m) => (
                            <li
                              // Below sm: IdP attribute + required on line 1, the field select on line 2.
                              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-border/60 border-b px-4 py-2.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto]"
                              key={m.id}
                            >
                              {m.id.startsWith("new-") ? (
                                <Input
                                  aria-label={t.newAttribute}
                                  className="h-8 font-mono text-xs"
                                  onChange={(e) => setMappings((all) => all.map((x) => (x.id === m.id ? { ...x, source: e.target.value } : x)))}
                                  placeholder={t.newAttribute}
                                  value={m.source}
                                />
                              ) : (
                                <code className="truncate font-mono text-foreground/85 text-xs">{m.source}</code>
                              )}
                              <ChevronRightIcon aria-hidden className="size-3.5 text-muted-foreground max-sm:hidden rtl:rotate-180" />
                              <Select onValueChange={(v: unknown) => setMappings((all) => all.map((x) => (x.id === m.id ? { ...x, target: String(v) } : x)))} value={m.target}>
                                <SelectTrigger
                                  aria-label={interpolate(t.fieldFor, { product, source: m.source || t.newAttribute })}
                                  className="h-8 w-full text-xs max-sm:order-3 max-sm:col-span-2 pointer-coarse:h-10"
                                  size="sm"
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent align="start">
                                  {config.targetFields.map((f) => (
                                    <SelectItem key={f.value} value={f.value}>
                                      {f.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="text-end max-sm:order-2 max-sm:col-start-2 max-sm:row-start-1 sm:w-16">
                                <span className={cn("font-mono uppercase tracking-[0.2em]", m.required ? "text-[10px] text-muted-foreground" : "text-[9px] text-muted-foreground")}>{m.required ? t.required : t.optional}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button
                        className="mt-3 inline-flex items-center gap-1.5 rounded font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => {
                          setNewCount((n) => n + 1);
                          setMappings((all) => [...all, { id: `new-${newCount + 1}`, source: "", target: "ignore" }]);
                        }}
                        type="button"
                      >
                        <PlusIcon aria-hidden className="size-3" />
                        {t.addMapping}
                      </button>
                      {mappingError || saveMappings.error ? (
                        <p className={cn(fieldError, "mt-3")} role="alert">
                          {mappingError ?? saveMappings.error}
                        </p>
                      ) : null}
                    </>
                  ) : null}

                  {key === "test" ? (
                    result ? (
                      <div className="mt-6 rounded-md border border-category-2/30 bg-category-2/6 p-4" role="status">
                        <div className="flex items-start gap-3">
                          <div aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-category-2/20 text-category-2-foreground">
                            <CheckIcon className="size-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm">{t.testOk}</div>
                            <p className="mt-0.5 text-muted-foreground text-xs">{interpolate(t.testMapped, { provider: providerName, mapped: result.mapped, total: result.total })}</p>
                            <button
                              aria-expanded={showJson}
                              className="mt-3 inline-flex items-center gap-1.5 rounded font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                              onClick={() => setShowJson((v) => !v)}
                              type="button"
                            >
                              <ChevronDownIcon aria-hidden className={cn("size-3 transition-transform", !showJson && "-rotate-90")} />
                              {showJson ? t.hideAttributes : t.showAttributes}
                            </button>
                            {showJson ? (
                              <pre className="mt-3 overflow-x-auto rounded-md border border-border/60 bg-background p-3 font-mono text-[11px] text-foreground/85 leading-relaxed">{JSON.stringify(result.attributes, null, 2)}</pre>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 rounded-md border border-border/70 border-dashed bg-background/30 p-6 text-center">
                        <p className="text-muted-foreground text-xs">{t.testHint}</p>
                        {onTest ? (
                          <Button aria-busy={test.isPending()} className="mt-4" disabled={test.isPending()} onClick={() => void test.run()} type="button">
                            {test.isPending() ? <Spinner data-icon="inline-start" /> : null}
                            {test.isPending() ? t.waiting : t.runTest}
                          </Button>
                        ) : null}
                        {test.error ? (
                          <p className={cn(fieldError, "mt-3")} role="alert">
                            {test.error}
                          </p>
                        ) : null}
                      </div>
                    )
                  ) : null}

                  {key === "enforce" ? (
                    config.enforced ? (
                      <p className="mt-6 flex items-center gap-2 font-medium text-category-2-foreground text-sm" role="status">
                        <CheckIcon aria-hidden className="size-4" />
                        {t.enforced}
                      </p>
                    ) : (
                      <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/6 p-4">
                        <div className="flex items-start gap-3">
                          <div aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-destructive/15 text-destructive-foreground">
                            <AlertTriangleIcon className="size-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm">{t.oneWay}</div>
                            <p className="mt-1 text-muted-foreground text-xs leading-relaxed">{t.oneWayHint}</p>
                            <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background px-3 py-2.5">
                              <label className="min-w-0 cursor-pointer" htmlFor={`${id}-enforce`}>
                                <span className="block text-sm">{t.requireSso}</span>
                                <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{interpolate(t.sessionsRevoked, { count: config.activeSessions })}</span>
                              </label>
                              <Switch checked={confirmed} id={`${id}-enforce`} onCheckedChange={setConfirmed} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  ) : null}
                  {enforce.error ? (
                    <p className={cn(fieldError, "mt-3")} role="alert">
                      {enforce.error}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-border/60 border-t bg-muted/20 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
                <Button disabled={step === 1 || busy} onClick={() => setStep(step - 1)} type="button" variant="ghost">
                  {t.back}
                </Button>
                <div className="flex items-center gap-2">
                  <span className={cn(eyebrow, "max-sm:hidden")}>{step === STEPS.length ? t.finalStep : t.continueWhenReady}</span>
                  {step < STEPS.length ? (
                    <Button aria-busy={saveMappings.isPending()} disabled={busy} onClick={proceed} type="button">
                      {saveMappings.isPending() ? <Spinner data-icon="inline-start" /> : null}
                      {t.continue}
                    </Button>
                  ) : onEnforce && !config.enforced ? (
                    <Button aria-busy={enforce.isPending()} disabled={!confirmed || busy} onClick={() => void enforce.run()} type="button">
                      {enforce.isPending() ? <Spinner data-icon="inline-start" /> : null}
                      {t.saveEnforce}
                    </Button>
                  ) : null}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export function SsoSetup(props: SsoSetupProps) {
  return (
    <ScreenBoundary name="SsoSetup">
      <SsoSetupScreen {...props} />
    </ScreenBoundary>
  );
}
