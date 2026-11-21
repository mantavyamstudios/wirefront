// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Button } from "@wirefront/ui/button";
import { Checkbox } from "@wirefront/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@wirefront/ui/dialog";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { Textarea } from "@wirefront/ui/textarea";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { BugIcon, HeartIcon, ImageIcon, LightbulbIcon, type LucideIcon, XIcon } from "lucide-react";
import { useId, useRef, useState } from "react";

import { FeedbackInput, type FeedbackKind } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("sendFeedback.<key>"). */
export const SEND_FEEDBACK_MESSAGES = {
  pageTitle: "Project board",
  trigger: "Send feedback",
  title: "Send us feedback",
  description: "Goes to the product team. Replies within 1 business day.",
  kind: "Feedback type",
  bug: "Something’s broken",
  bugHint: "An error, glitch, or unexpected behaviour.",
  bugPlaceholder: "What did you do? What did you see? What did you expect?",
  idea: "I have an idea",
  ideaHint: "Something that would make {product} better.",
  ideaPlaceholder: "What would change? Who would it help?",
  praise: "Praise",
  praiseHint: "Something that delighted you. We share these on Mondays.",
  praisePlaceholder: "What worked well? Anyone we should call out?",
  message: "Your feedback",
  attach: "Attach screenshot",
  removeScreenshot: "Remove {name}",
  includeLogs: "Include console logs",
  cancel: "Cancel",
  send: "Send feedback",
};

/** What "Send feedback" hands to `onSend`: the form, plus the screenshot when one is attached. */
export type FeedbackSubmission = FeedbackInput & { screenshot?: File };

export interface SendFeedbackProps {
  /** Send it (sendFeedback). Resolve to close the dialog; fail or throw to show why. */
  onSend: Action<FeedbackSubmission>;
  /** Your product's name, for the "idea" hint. */
  product: string;
  /** Offer a screenshot attachment. */
  allowScreenshot?: boolean;
  /** Offer "Include console logs". */
  allowLogs?: boolean;
  defaultKind?: FeedbackKind;
  /** Open the dialog on first render. */
  defaultOpen?: boolean;
  className?: string;
}

const KINDS: Record<FeedbackKind, LucideIcon> = { bug: BugIcon, idea: LightbulbIcon, praise: HeartIcon };

function SendFeedbackScreen({ onSend, product, allowScreenshot = true, allowLogs = true, defaultKind = "idea", defaultOpen, className }: SendFeedbackProps) {
  const t = useMessages("sendFeedback", SEND_FEEDBACK_MESSAGES);
  const id = useId();
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [kind, setKind] = useState<FeedbackKind>(defaultKind);
  const [includeLogs, setIncludeLogs] = useState(true);
  const [screenshot, setScreenshot] = useState<File>();
  const fileInput = useRef<HTMLInputElement>(null);
  const reset = () => {
    setKind(defaultKind);
    setIncludeLogs(true);
    setScreenshot(undefined);
  };
  const form = useActionForm({
    schema: FeedbackInput,
    action: (input) => onSend({ ...input, screenshot }),
    onSuccess: () => {
      setOpen(false);
      reset();
    },
  });
  const hint = { bug: t.bugHint, idea: interpolate(t.ideaHint, { product }), praise: t.praiseHint }[kind];
  const placeholder = { bug: t.bugPlaceholder, idea: t.ideaPlaceholder, praise: t.praisePlaceholder }[kind];

  return (
    // Real Dialog (focus trap, Esc, scroll lock); bottom sheet on phones.
    <div className={cn("relative min-h-svh bg-background", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-8 sm:px-10 sm:py-10">
        <h1 className="font-heading text-2xl">{t.pageTitle}</h1>
        <Dialog
          onOpenChange={(next) => {
            if (form.pending) return;
            setOpen(next);
            if (!next) form.reset();
          }}
          open={open}
        >
          <DialogTrigger render={<Button variant="outline" />}>{t.trigger}</DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <Form className="contents" errors={form.formProps.errors} noValidate onFormSubmit={(values) => void form.submit({ ...values, kind, includeLogs })}>
              <DialogHeader>
                <DialogTitle className="text-base">{t.title}</DialogTitle>
                <DialogDescription>{t.description}</DialogDescription>
              </DialogHeader>

              <div className="-mx-4 min-h-0 min-w-0 space-y-4 overflow-y-auto px-4">
                <RadioGroup aria-describedby={`${id}-hint`} aria-label={t.kind} className="grid grid-cols-3 gap-2" onValueChange={(v) => setKind(v as FeedbackKind)} value={kind}>
                  {(Object.keys(KINDS) as FeedbackKind[]).map((k) => {
                    const Icon = KINDS[k];
                    return (
                      <Radio.Root
                        className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-border/60 px-2 py-3 text-center outline-none transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring data-checked:border-foreground/60 data-checked:bg-foreground/5 sm:px-3"
                        key={k}
                        value={k}
                      >
                        <Icon aria-hidden className="size-4 opacity-80" />
                        <span className="text-[12px] leading-tight">{t[k]}</span>
                      </Radio.Root>
                    );
                  })}
                </RadioGroup>

                <p className="text-muted-foreground text-xs" id={`${id}-hint`}>
                  {hint}
                </p>

                <Field.Root className="flex flex-col gap-1.5" name="message">
                  <Field.Label className="sr-only">{t.message}</Field.Label>
                  <Field.Control render={<Textarea className="min-h-32" placeholder={placeholder} />} />
                  <Field.Error className="text-destructive-foreground text-xs" />
                </Field.Root>

                {allowScreenshot ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      accept="image/*"
                      aria-label={t.attach}
                      className="sr-only"
                      onChange={(e) => {
                        setScreenshot(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                      ref={fileInput}
                      tabIndex={-1}
                      type="file"
                    />
                    {screenshot ? (
                      <span className="inline-flex max-w-full items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs">
                        <ImageIcon aria-hidden className="size-3.5 shrink-0 opacity-70" />
                        <span className="truncate">{screenshot.name}</span>
                        <button
                          aria-label={interpolate(t.removeScreenshot, { name: screenshot.name })}
                          className="-me-1 inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground pointer-coarse:size-9"
                          onClick={() => setScreenshot(undefined)}
                          type="button"
                        >
                          <XIcon className="size-3" />
                        </button>
                      </span>
                    ) : (
                      <button
                        className="inline-flex items-center gap-2 rounded-md border border-border/70 border-dashed bg-background px-3 py-2 text-muted-foreground text-xs hover:border-foreground/40 hover:text-foreground pointer-coarse:min-h-11"
                        onClick={() => fileInput.current?.click()}
                        type="button"
                      >
                        <ImageIcon aria-hidden className="size-3.5" />
                        {t.attach}
                      </button>
                    )}
                  </div>
                ) : null}

                {allowLogs ? (
                  <div className="flex items-center gap-2 pointer-coarse:min-h-11">
                    <Checkbox checked={includeLogs} id={`${id}-logs`} onCheckedChange={setIncludeLogs} />
                    <label className="cursor-pointer text-muted-foreground text-xs" htmlFor={`${id}-logs`}>
                      {t.includeLogs}
                    </label>
                  </div>
                ) : null}

                {form.formError ? (
                  <p className="text-destructive-foreground text-sm" role="alert">
                    {form.formError}
                  </p>
                ) : null}
              </div>

              <DialogFooter>
                <DialogClose disabled={form.pending} render={<Button type="button" variant="ghost" />}>
                  {t.cancel}
                </DialogClose>
                <Button aria-busy={form.pending} disabled={form.pending} type="submit">
                  {form.pending ? <Spinner data-icon="inline-start" /> : null}
                  {t.send}
                </Button>
              </DialogFooter>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export function SendFeedback(props: SendFeedbackProps) {
  return (
    <ScreenBoundary name="SendFeedback">
      <SendFeedbackScreen {...props} />
    </ScreenBoundary>
  );
}
