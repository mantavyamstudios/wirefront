// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Button, buttonVariants } from "@wirefront/ui/button";
import { IllustratedAuthLayout, useAuthTypingImpulse } from "@wirefront/ui/illustrated-auth-layout";
import { Input } from "@wirefront/ui/input";
import { cn } from "@wirefront/ui/lib/utils";
import { bumpParticleTypingImpulse, pulseParticleSubmitImpulse } from "@wirefront/ui/particle-field";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { type SubmitEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { CreateWorkspaceInput, InviteEmail, type InviteTeammatesInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("workspaceOnboarding.<key>"). */
export const WORKSPACE_ONBOARDING_MESSAGES = {
  step: "Step {step} / {total}",
  nameEyebrow: "Name your workspace",
  nameTitle: "What are we calling it?",
  nameHint: "You can change this later in settings.",
  nameLabel: "Workspace name",
  namePlaceholder: "Acme inc.",
  continue: "Continue",
  inviteEyebrow: "Bring people with you",
  inviteTitle: "Invite teammates",
  inviteHint: "Optional — you can add anyone later.",
  inviteLabel: "Teammate’s email",
  invitePlaceholder: "colleague@example.com",
  add: "Add",
  remove: "Remove",
  removeName: "Remove {email}",
  noInvites: "No invites yet. Add a few or skip — totally fine.",
  back: "Back",
  skip: "Skip for now",
  sendOne: "Send 1 invite",
  sendMany: "Send {count} invites",
  readyEyebrow: "You’re set",
  readyTitle: "Welcome to {workspace}.",
  readyQuiet: "Quiet for now — when you’re ready, invite people from settings.",
  readyOne: "We’ve sent 1 invite. It’ll show up here once accepted.",
  readyMany: "We’ve sent {count} invites. They’ll show up here once accepted.",
  workspace: "Workspace",
  members: "Members",
  plan: "Plan",
  enter: "Take me in",
};

export interface WorkspaceOnboardingProps {
  /** Create the workspace. The name is already validated. Resolve with `fail(message)` or throw to show what went wrong. */
  onCreateWorkspace: Action<CreateWorkspaceInput>;
  /** Invite the listed people. The invite step only shows when this is given. */
  onInvite?: Action<InviteTeammatesInput>;
  /** Where "Take me in" goes. */
  enterHref: string;
  /** The plan the new workspace starts on, shown on the last step. */
  plan?: string;
  /** The left-hand illustration (any image URL). */
  illustration: string;
  brand?: ReactNode;
  caption?: { eyebrow?: string; text: string };
  /** Top-right controls, such as a theme toggle. */
  actions?: ReactNode;
}

const eyebrow = "mt-8 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.3em]";
const error = "text-destructive-foreground text-xs";

function OnboardingFlow({ onCreateWorkspace, onInvite, enterHref, plan }: Pick<WorkspaceOnboardingProps, "onCreateWorkspace" | "onInvite" | "enterHref" | "plan">) {
  const t = useMessages("workspaceOnboarding", WORKSPACE_ONBOARDING_MESSAGES);
  const impulse = useAuthTypingImpulse();
  const rootRef = useRef<HTMLDivElement>(null);
  const steps = onInvite ? 3 : 2;
  const [step, setStep] = useState(0);
  const [workspace, setWorkspace] = useState("");
  const [invitees, setInvitees] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState<string>();
  const [sent, setSent] = useState(0);

  // Typing nudges the particles.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !impulse) return;
    const onKey = (e: KeyboardEvent) => bumpParticleTypingImpulse(impulse, e);
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [impulse]);

  const next = () => {
    if (impulse) pulseParticleSubmitImpulse(impulse);
    setStep((s) => Math.min(s + 1, steps - 1));
  };
  const create = useActionForm({
    schema: CreateWorkspaceInput,
    action: onCreateWorkspace,
    onSuccess: (_, input) => {
      setWorkspace(input.name);
      next();
    },
  });
  const invite = useAction(onInvite ?? (async () => {}), {
    onSuccess: () => {
      setSent(invitees.length);
      next();
    },
  });

  const add = (e: SubmitEvent) => {
    e.preventDefault();
    const email = draft.trim().toLowerCase();
    if (!email) return;
    const parsed = InviteEmail.safeParse(email);
    if (!parsed.success) {
      setDraftError(parsed.error.issues[0]?.message);
      return;
    }
    setDraftError(undefined);
    setInvitees((prev) => (prev.includes(email) ? prev : [...prev, email]));
    setDraft("");
  };

  const ready = step === steps - 1;
  return (
    <div className="w-full max-w-lg" ref={rootRef}>
      <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.3em]">
        <span>{interpolate(t.step, { step: String(step + 1).padStart(2, "0"), total: steps })}</span>
        <div aria-hidden className="ms-2 flex items-center gap-1.5">
          {Array.from({ length: steps }, (_, i) => `dot-${i}`).map((key, i) => (
            <span className={cn("h-1.5 rounded-full transition-all", i === step ? "w-5 bg-foreground" : i < step ? "w-1.5 bg-foreground/70" : "w-1.5 bg-foreground/20")} key={key} />
          ))}
        </div>
      </div>

      {step === 0 ? (
        <>
          <div className={eyebrow}>{t.nameEyebrow}</div>
          <h1 className="mt-2 font-heading text-3xl leading-tight">{t.nameTitle}</h1>
          <p className="mt-2 text-muted-foreground text-sm">{t.nameHint}</p>
          <Form className="mt-8 flex flex-col gap-4" noValidate {...create.formProps}>
            <Field.Root className="flex flex-col gap-1.5" name="name">
              <Field.Label className="font-medium text-sm leading-none">{t.nameLabel}</Field.Label>
              <Input autoComplete="organization" defaultValue={workspace} placeholder={t.namePlaceholder} />
              <Field.Error className={error} />
            </Field.Root>
            {create.formError ? (
              <p className={error} role="alert">
                {create.formError}
              </p>
            ) : null}
            <Button aria-busy={create.pending} className="mt-2" disabled={create.pending} size="lg" type="submit">
              {create.pending ? <Spinner data-icon="inline-start" /> : null}
              {t.continue}
            </Button>
          </Form>
        </>
      ) : null}

      {step === 1 && onInvite ? (
        <>
          <div className={eyebrow}>{t.inviteEyebrow}</div>
          <h1 className="mt-2 font-heading text-3xl leading-tight">{t.inviteTitle}</h1>
          <p className="mt-2 text-muted-foreground text-sm">{t.inviteHint}</p>
          <form className="mt-8 flex flex-col gap-1.5" noValidate onSubmit={add}>
            <label className="sr-only" htmlFor="onboarding-invite">
              {t.inviteLabel}
            </label>
            <div className="flex gap-2">
              <Input
                aria-describedby={draftError ? "onboarding-invite-error" : undefined}
                aria-invalid={draftError ? true : undefined}
                autoComplete="off"
                id="onboarding-invite"
                inputMode="email"
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t.invitePlaceholder}
                type="email"
                value={draft}
              />
              <Button className="shrink-0" type="submit" variant="outline">
                {t.add}
              </Button>
            </div>
            {draftError ? (
              <p className={error} id="onboarding-invite-error">
                {draftError}
              </p>
            ) : null}
          </form>

          {invitees.length > 0 ? (
            <ul className="mt-5 flex flex-col gap-1.5">
              {invitees.map((email) => (
                <li className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-background/40 py-1 ps-3 pe-1 text-sm" key={email}>
                  <span className="truncate text-foreground/85">{email}</span>
                  <button
                    className="min-h-8 shrink-0 px-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] transition-colors hover:text-foreground pointer-coarse:min-h-11"
                    onClick={() => setInvitees((prev) => prev.filter((e) => e !== email))}
                    type="button"
                  >
                    {t.remove}
                    <span className="sr-only">, {email}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-md border border-border/70 border-dashed bg-background/30 px-3 py-6 text-center text-muted-foreground text-xs">{t.noInvites}</div>
          )}

          {invite.error ? (
            <p className={cn(error, "mt-4")} role="alert">
              {invite.error}
            </p>
          ) : null}
          <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button onClick={() => setStep(0)} type="button" variant="ghost">
              {t.back}
            </Button>
            <Button
              aria-busy={invite.isPending()}
              className="max-sm:w-full"
              disabled={invite.isPending()}
              onClick={() => (invitees.length ? void invite.run({ emails: invitees }) : next())}
              size="lg"
              type="button"
            >
              {invite.isPending() ? <Spinner data-icon="inline-start" /> : null}
              {invitees.length === 0 ? t.skip : invitees.length === 1 ? t.sendOne : interpolate(t.sendMany, { count: invitees.length })}
            </Button>
          </div>
        </>
      ) : null}

      {ready && step > 0 ? (
        <>
          <div className={eyebrow}>{t.readyEyebrow}</div>
          <h1 className="mt-2 font-heading text-3xl leading-tight">{interpolate(t.readyTitle, { workspace })}</h1>
          <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{sent === 0 ? t.readyQuiet : sent === 1 ? t.readyOne : interpolate(t.readyMany, { count: sent })}</p>
          <dl className="mt-8 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
            <Fact label={t.workspace} value={workspace} />
            <Fact label={t.members} value={String(sent + 1)} />
            {plan ? <Fact label={t.plan} value={plan} /> : null}
          </dl>
          <WirefrontLink className={cn(buttonVariants({ size: "lg" }), "mt-8 w-full")} href={enterHref}>
            {t.enter}
          </WirefrontLink>
        </>
      ) : null}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-background/40 px-3 py-3">
      <dt className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{label}</dt>
      <dd className="mt-1 truncate font-heading text-sm">{value}</dd>
    </div>
  );
}

function WorkspaceOnboardingScreen({ illustration, brand, caption, actions, ...flow }: WorkspaceOnboardingProps) {
  return (
    <IllustratedAuthLayout actions={actions} brand={brand} caption={caption} illustration={illustration}>
      <OnboardingFlow {...flow} />
    </IllustratedAuthLayout>
  );
}

export function WorkspaceOnboarding(props: WorkspaceOnboardingProps) {
  return (
    <ScreenBoundary name="WorkspaceOnboarding">
      <WorkspaceOnboardingScreen {...props} />
    </ScreenBoundary>
  );
}
