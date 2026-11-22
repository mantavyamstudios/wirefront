// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Button } from "@wirefront/ui/button";
import {
  IllustratedAuthLayout,
  useAuthTypingImpulse,
} from "@wirefront/ui/illustrated-auth-layout";
import { Input } from "@wirefront/ui/input";
import {
  bumpParticleTypingImpulse,
  pulseParticleSubmitImpulse,
} from "@wirefront/ui/particle-field";
import { Separator } from "@wirefront/ui/separator";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { type ReactNode, useState } from "react";
import { MagicLinkInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("particleSignIn.<key>"). */
export const PARTICLE_SIGN_IN_MESSAGES = {
  eyebrow: "Welcome back",
  title: "Enter your orbit",
  subtitle: "Sign in to continue.",
  email: "Email",
  emailPlaceholder: "you@example.com",
  submit: "Send sign-in link",
  sent: "Link sent to {email}. Open your inbox to continue.",
  or: "or",
  continueWith: "Continue with {name}",
};

export interface ParticleSignInProvider {
  id: string;
  name: string;
  icon?: ReactNode;
}

export interface ParticleSignInProps {
  /**
   * Email a one-time sign-in link. The email is already validated. Resolve on
   * success; resolve with `fail(message)` or throw to show what went wrong.
   */
  onMagicLink: Action<MagicLinkInput>;
  /** OAuth providers to offer under the form. Needs `onProvider`. */
  providers?: ParticleSignInProvider[];
  /** Start signing in with a provider (receives its id). Usually redirects. */
  onProvider?: Action<string>;
  /** Called once the link is sent, e.g. to show your check-email page. */
  onSent?: (input: MagicLinkInput) => void;
  /** Prefill the email field. */
  defaultEmail?: string;
  /** The left-hand illustration (any image URL). */
  illustration: string;
  /** Your logo or name: over the illustration, and top left on small screens. */
  brand?: ReactNode;
  caption?: { eyebrow?: string; text: string };
  /** Top-right controls, such as a theme toggle. */
  actions?: ReactNode;
}

function ParticleSignInScreen({
  onMagicLink,
  providers = [],
  onProvider,
  onSent,
  defaultEmail,
  illustration,
  brand,
  caption,
  actions,
}: ParticleSignInProps) {
  return (
    <IllustratedAuthLayout
      actions={actions}
      brand={brand}
      caption={caption}
      illustration={illustration}
    >
      {brand ? (
        <div className="absolute inset-s-4 top-4 flex max-w-[calc(100%-5rem)] items-center sm:inset-s-6 sm:top-6 lg:hidden">
          {brand}
        </div>
      ) : null}
      <SignInForm
        defaultEmail={defaultEmail}
        onMagicLink={onMagicLink}
        onProvider={onProvider}
        onSent={onSent}
        providers={providers}
      />
    </IllustratedAuthLayout>
  );
}

function SignInForm({
  onMagicLink,
  providers,
  onProvider,
  onSent,
  defaultEmail,
}: Pick<
  ParticleSignInProps,
  "onMagicLink" | "onProvider" | "onSent" | "defaultEmail"
> & { providers: ParticleSignInProvider[] }) {
  const t = useMessages("particleSignIn", PARTICLE_SIGN_IN_MESSAGES);
  const impulse = useAuthTypingImpulse();
  const [sentTo, setSentTo] = useState<string>();
  const form = useActionForm({
    schema: MagicLinkInput,
    action: (input: MagicLinkInput) => {
      if (impulse) pulseParticleSubmitImpulse(impulse);
      return onMagicLink(input);
    },
    onSuccess: (_, input) => {
      setSentTo(input.email);
      onSent?.(input);
    },
  });
  const provider = useAction(onProvider ?? (async () => {}));
  const shown = onProvider ? providers : [];

  return (
    <div className="w-full max-w-lg">
      <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.3em]">
        {t.eyebrow}
      </div>
      <h1 className="mt-2 font-heading text-3xl leading-tight">{t.title}</h1>
      <p className="mt-2 text-muted-foreground text-sm">{t.subtitle}</p>

      <Form
        className="mt-8 flex flex-col gap-4"
        noValidate
        onKeyDown={(e) => impulse && bumpParticleTypingImpulse(impulse, e)}
        {...form.formProps}
      >
        <Field.Root className="flex flex-col gap-1.5" name="email">
          <Field.Label className="font-medium text-sm leading-none">
            {t.email}
          </Field.Label>
          <Input
            autoComplete="email"
            defaultValue={defaultEmail}
            inputMode="email"
            placeholder={t.emailPlaceholder}
            type="email"
          />
          <Field.Error className="text-destructive-foreground text-xs" />
        </Field.Root>
        <Button
          aria-busy={form.pending}
          className="mt-2"
          disabled={form.pending}
          size="lg"
          type="submit"
        >
          {form.pending ? <Spinner data-icon="inline-start" /> : null}
          {t.submit}
        </Button>
      </Form>

      <div aria-live="polite">
        {form.formError ? (
          <p className="mt-4 text-destructive-foreground text-sm" role="alert">
            {form.formError}
          </p>
        ) : sentTo ? (
          <p
            className="mt-4 rounded-lg border border-border/70 bg-background/40 px-3 py-2 text-muted-foreground text-sm"
            role="status"
          >
            {interpolate(t.sent, { email: sentTo })}
          </p>
        ) : null}
      </div>

      {shown.length ? (
        <>
          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
              {t.or}
            </span>
            <Separator className="flex-1" />
          </div>
          <div className="flex flex-col gap-2">
            {shown.map((p) => (
              <Button
                aria-busy={provider.isPending(p.id)}
                disabled={provider.isPending()}
                key={p.id}
                onClick={() => void provider.run(p.id, p.id)}
                size="lg"
                type="button"
                variant="outline"
              >
                {provider.isPending(p.id) ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  p.icon
                )}
                {interpolate(t.continueWith, { name: p.name })}
              </Button>
            ))}
          </div>
          {provider.error ? (
            <p
              className="mt-3 text-destructive-foreground text-sm"
              role="alert"
            >
              {provider.error}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function ParticleSignIn(props: ParticleSignInProps) {
  return (
    <ScreenBoundary name="ParticleSignIn">
      <ParticleSignInScreen {...props} />
    </ScreenBoundary>
  );
}
