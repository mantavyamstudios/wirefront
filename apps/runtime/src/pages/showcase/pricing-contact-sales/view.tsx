// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Button } from "@wirefront/ui/button";
import { Input } from "@wirefront/ui/input";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { Textarea } from "@wirefront/ui/textarea";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import { useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { CheckIcon, MailCheckIcon, ShieldCheckIcon } from "lucide-react";
import { useId, useState } from "react";

import { SalesInquiry, type SeatRange } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("contactSales.<key>"). */
export const CONTACT_SALES_MESSAGES = {
  eyebrow: "Enterprise",
  title: "Built for the procurement people.",
  description:
    "For organisations with compliance, identity, and procurement requirements. We’ll work through your security questionnaire and DPA on the same call.",
  formTitle: "Talk to us.",
  formDescription: "Reply within one business day.",
  name: "Name",
  namePlaceholder: "Ada Lovelace",
  company: "Company",
  companyPlaceholder: "Acme inc.",
  email: "Work email",
  emailPlaceholder: "you@company.com",
  seats: "Estimated seats",
  "50-100": "50–100",
  "100-500": "100–500",
  "500-1000": "500–1000",
  "1000+": "1000+",
  message: "What are you looking for?",
  messagePlaceholder: "Compliance constraints, timeline, or anything else.",
  submit: "Request a call",
  privacy: "We don’t share your details with anyone.",
  sentTitle: "Thanks — we’ll be in touch.",
  sentDescription:
    "Someone from our team will email you within one business day.",
  customers: "Customers",
};

export interface ContactSalesProps {
  /** Send the inquiry (requestCall). Return fieldErrors to show them on the fields. */
  onSubmit: Action<SalesInquiry>;
  /** What enterprise includes. */
  features: string[];
  /** Customer names shown as a quiet proof row. Hidden when empty. */
  customers?: string[];
  className?: string;
}

const RANGES: SeatRange[] = ["50-100", "100-500", "500-1000", "1000+"];
const fieldError = "text-destructive-foreground text-xs";

function ContactSalesScreen({
  onSubmit,
  features,
  customers = [],
  className,
}: ContactSalesProps) {
  const t = useMessages("contactSales", CONTACT_SALES_MESSAGES);
  const id = useId();
  const [sent, setSent] = useState(false);
  const [seats, setSeats] = useState<SeatRange>("50-100");
  const form = useActionForm({
    schema: SalesInquiry,
    action: onSubmit,
    onSuccess: () => setSent(true),
  });

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      {/* Phones: short pitch → form → proof points, so the form is reachable
          without scrolling past the whole value prop. lg: pitch + proof on the
          left, form on the right spanning both rows. */}
      <div className="mx-auto grid min-h-svh max-w-6xl grid-cols-1 lg:grid-cols-[1.1fr_1fr] lg:grid-rows-[1fr_auto]">
        <section className="flex flex-col justify-end border-border/60 px-4 pt-10 pb-6 sm:px-8 lg:border-e lg:pt-16 lg:pb-0">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/40 px-2.5 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
            <ShieldCheckIcon aria-hidden className="size-3" />
            {t.eyebrow}
          </div>
          <h1 className="mt-4 text-balance font-heading text-3xl tracking-tight sm:text-4xl md:text-5xl">
            {t.title}
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground text-sm leading-relaxed">
            {t.description}
          </p>
        </section>

        <section className="flex flex-col justify-center px-4 pb-10 sm:px-8 lg:row-span-2 lg:py-16">
          {sent ? (
            <div
              aria-live="polite"
              className="rounded-2xl border border-border/60 bg-background/40 p-6 text-center"
            >
              <MailCheckIcon
                aria-hidden
                className="mx-auto size-6 text-success-foreground"
              />
              <h2 className="mt-3 font-heading text-xl">{t.sentTitle}</h2>
              <p className="mt-1 text-muted-foreground text-sm">
                {t.sentDescription}
              </p>
            </div>
          ) : (
            <Form
              className="rounded-2xl border border-border/60 bg-background/40 p-5 sm:p-6"
              errors={form.formProps.errors}
              noValidate
              onFormSubmit={(values) => void form.submit({ ...values, seats })}
            >
              <h2 className="font-heading text-xl">{t.formTitle}</h2>
              <p className="mt-1 text-muted-foreground text-sm">
                {t.formDescription}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field.Root className="flex flex-col gap-1.5" name="name">
                  <Field.Label className="font-medium text-sm leading-none">
                    {t.name}
                  </Field.Label>
                  <Input autoComplete="name" placeholder={t.namePlaceholder} />
                  <Field.Error className={fieldError} />
                </Field.Root>
                <Field.Root className="flex flex-col gap-1.5" name="company">
                  <Field.Label className="font-medium text-sm leading-none">
                    {t.company}
                  </Field.Label>
                  <Input
                    autoComplete="organization"
                    placeholder={t.companyPlaceholder}
                  />
                  <Field.Error className={fieldError} />
                </Field.Root>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field.Root className="flex flex-col gap-1.5" name="email">
                  <Field.Label className="font-medium text-sm leading-none">
                    {t.email}
                  </Field.Label>
                  <Input
                    autoComplete="email"
                    inputMode="email"
                    placeholder={t.emailPlaceholder}
                    type="email"
                  />
                  <Field.Error className={fieldError} />
                </Field.Root>
                <div className="flex flex-col gap-1.5">
                  <label
                    className="font-medium text-sm leading-none"
                    htmlFor={`${id}-seats`}
                  >
                    {t.seats}
                  </label>
                  <div className="relative">
                    <select
                      className="h-9 w-full appearance-none rounded-lg border border-input bg-background ps-3 pe-9 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm pointer-coarse:h-10"
                      id={`${id}-seats`}
                      onChange={(e) => setSeats(e.target.value as SeatRange)}
                      value={seats}
                    >
                      {RANGES.map((r) => (
                        <option key={r} value={r}>
                          {t[r]}
                        </option>
                      ))}
                    </select>
                    <svg
                      aria-hidden
                      className="pointer-events-none absolute inset-e-3 top-1/2 size-3.5 -translate-y-1/2 opacity-60"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 16 16"
                    >
                      <polyline points="4 6 8 10 12 6" />
                    </svg>
                  </div>
                </div>
              </div>

              <Field.Root className="mt-3 flex flex-col gap-1.5" name="message">
                <Field.Label className="font-medium text-sm leading-none">
                  {t.message}
                </Field.Label>
                <Field.Control
                  render={
                    <Textarea placeholder={t.messagePlaceholder} rows={4} />
                  }
                />
                <Field.Error className={fieldError} />
              </Field.Root>

              {form.formError ? (
                <p
                  className="mt-3 text-destructive-foreground text-sm"
                  role="alert"
                >
                  {form.formError}
                </p>
              ) : null}

              <Button
                aria-busy={form.pending}
                className="mt-5 w-full"
                disabled={form.pending}
                size="lg"
                type="submit"
              >
                {form.pending ? <Spinner data-icon="inline-start" /> : null}
                {t.submit}
              </Button>
              <p className="mt-2 text-center text-muted-foreground text-xs">
                {t.privacy}
              </p>
            </Form>
          )}
        </section>

        <section className="flex flex-col justify-start border-border/60 px-4 pb-12 sm:px-8 lg:border-e lg:pb-16">
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:mt-8">
            {features.map((f) => (
              <li className="flex items-start gap-2 text-sm" key={f}>
                <CheckIcon
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-foreground"
                />
                {f}
              </li>
            ))}
          </ul>
          {customers.length ? (
            <ul
              aria-label={t.customers}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-border/60 border-t pt-6"
            >
              {customers.map((c) => (
                <li
                  className="font-medium text-muted-foreground text-sm tracking-wide"
                  key={c}
                >
                  {c}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export function ContactSales(props: ContactSalesProps) {
  return (
    <ScreenBoundary name="ContactSales">
      <ContactSalesScreen {...props} />
    </ScreenBoundary>
  );
}
