// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Button } from "@wirefront/ui/button";
import { Input } from "@wirefront/ui/input";
import { bumpParticleTypingImpulse, ParticleField, pulseParticleSubmitImpulse } from "@wirefront/ui/particle-field";
import { Spinner } from "@wirefront/ui/spinner";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { useRef, useState } from "react";
import { JoinWaitlistInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("waitlist.<key>"). */
export const WAITLIST_MESSAGES = {
  eyebrow: "Invite-only, for now",
  title: "This room’s full.",
  subtitle: "Join the waitlist and we’ll email you when there’s space.",
  email: "Email",
  emailPlaceholder: "you@example.com",
  join: "Join the waitlist",
  joined: "You’re on the list. We’ll write to {email}.",
};

export interface WaitlistProps {
  /** Add the email to the waitlist. It is already validated. Resolve with `fail(message)` or throw to show what went wrong. */
  onJoin: Action<JoinWaitlistInput>;
  /** The background illustration (any image URL). */
  illustration: string;
}

const shadow = { textShadow: "0 1px 16px rgba(0,0,0,0.7)" };

function WaitlistScreen({ onJoin, illustration }: WaitlistProps) {
  const t = useMessages("waitlist", WAITLIST_MESSAGES);
  const impulse = useRef(0);
  const [joined, setJoined] = useState<string>();
  const form = useActionForm({
    schema: JoinWaitlistInput,
    action: (input: JoinWaitlistInput) => {
      pulseParticleSubmitImpulse(impulse);
      return onJoin(input);
    },
    onSuccess: (_, input) => setJoined(input.email),
  });

  return (
    // min-h-dvh + in-flow copy: the page can grow (landscape phones, zoom)
    // instead of clipping. `w-full` avoids the scrollbar overflow of 100dvw.
    <div className="relative flex min-h-dvh w-full flex-col justify-end overflow-hidden bg-background">
      <div className="absolute inset-0">
        <ParticleField align="center" dotSize={0.95} renderScale={1} sampleStep={3} src={illustration} threshold={38} typingImpulseRef={impulse} />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(1200px 800px at 50% 55%, transparent 40%, color-mix(in srgb, var(--background) 85%, transparent) 95%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%]"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--background) 55%, transparent) 38%, color-mix(in srgb, var(--background) 88%, transparent) 70%, var(--background) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[32%]"
        style={{ background: "radial-gradient(420px 220px at 50% 78%, color-mix(in srgb, var(--background) 85%, transparent) 0%, transparent 70%)" }}
      />
      <div className="relative z-10 flex flex-col items-center gap-4 px-6 pt-[45svh] pb-[max(4rem,env(safe-area-inset-bottom))] text-center">
        <div className="pointer-events-none font-mono text-[11px] text-foreground/55 uppercase tracking-[0.3em]" style={shadow}>
          {t.eyebrow}
        </div>
        <h1 className="pointer-events-none max-w-xl font-heading text-3xl leading-tight md:text-4xl" style={{ textShadow: "0 1px 24px rgba(0,0,0,0.65)" }}>
          {t.title}
        </h1>
        <p className="pointer-events-none max-w-md text-foreground/70 text-sm leading-relaxed" style={shadow}>
          {t.subtitle}
        </p>
        {joined ? (
          <p className="mt-2 text-foreground text-sm" role="status">
            {interpolate(t.joined, { email: joined })}
          </p>
        ) : (
          <Form className="mt-2 flex w-full max-w-sm flex-col gap-2" noValidate onKeyDown={(e) => bumpParticleTypingImpulse(impulse, e)} {...form.formProps}>
            <Field.Root className="flex flex-col gap-1.5 text-start" name="email">
              <Field.Label className="sr-only">{t.email}</Field.Label>
              <div className="flex gap-2">
                <Input autoComplete="email" className="bg-background/70" inputMode="email" placeholder={t.emailPlaceholder} type="email" />
                <Button aria-busy={form.pending} className="shrink-0" disabled={form.pending} type="submit">
                  {form.pending ? <Spinner data-icon="inline-start" /> : null}
                  {t.join}
                </Button>
              </div>
              <Field.Error className="text-destructive-foreground text-xs" />
            </Field.Root>
            {form.formError ? (
              <p className="text-start text-destructive-foreground text-xs" role="alert">
                {form.formError}
              </p>
            ) : null}
          </Form>
        )}
      </div>
    </div>
  );
}

export function Waitlist(props: WaitlistProps) {
  return (
    <ScreenBoundary name="Waitlist">
      <WaitlistScreen {...props} />
    </ScreenBoundary>
  );
}
