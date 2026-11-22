// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { Textarea } from "@wirefront/ui/textarea";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import {
  interpolate,
  useFormat,
  useMessages,
  WirefrontLink,
} from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import {
  CornerUpLeftIcon,
  PaperclipIcon,
  ReplyIcon,
  StarIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ReplyInput, type Thread } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("emailThread.<key>"). */
export const EMAIL_THREAD_MESSAGES = {
  eyebrow: "Inbox · thread",
  star: "Star thread",
  messagesOne: "{count} message",
  messagesOther: "{count} messages",
  participantsOne: "{count} participant",
  participantsOther: "{count} participants",
  quoted: "Quoting: ",
  reply: "Reply",
  replyTo: "Reply to {names}…",
  saveDraft: "Save draft",
  draftSaved: "Draft saved",
  send: "Send reply",
  sent: "Reply sent",
  attachment: "{name} · {size}",
  errorTitle: "Couldn’t load the thread",
  retry: "Try again",
};

export interface EmailThreadProps {
  /** The thread. Leave it out while it loads. */
  thread?: Thread;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Star or unstar. It flips at once and flips back if this fails. Hidden without it. */
  onToggleStar?: Action<boolean>;
  /** Send a reply; the box clears when it succeeds. The composer is hidden without it. */
  onReply?: Action<ReplyInput>;
  /** Save the reply as a draft. Hidden without it. */
  onSaveDraft?: Action<{ body: string }>;
  className?: string;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function EmailThreadScreen({
  thread,
  status = "ready",
  error,
  onRetry,
  onToggleStar,
  onReply,
  onSaveDraft,
  className,
}: EmailThreadProps) {
  const t = useMessages("emailThread", EMAIL_THREAD_MESSAGES);
  const fmt = useFormat();
  const [starred, setStarred] = useState(Boolean(thread?.starred));
  useEffect(() => setStarred(Boolean(thread?.starred)), [thread?.starred]);
  const [notice, setNotice] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const star = useAction(onToggleStar ?? (async () => {}), {
    optimistic: (next) => {
      setStarred(next);
      return () => setStarred(!next);
    },
  });
  const form = useActionForm({
    schema: ReplyInput,
    action: onReply ?? (async () => {}),
    onSuccess: () => {
      formRef.current?.reset();
      setNotice(t.sent);
    },
  });
  const draft = useAction(onSaveDraft ?? (async () => {}), {
    onSuccess: () => setNotice(t.draftSaved),
  });
  const plural = (n: number, one: string, other: string) =>
    interpolate(n === 1 ? one : other, { count: fmt.number(n) });
  const size = (bytes: number) =>
    bytes >= 1_048_576
      ? fmt.number(bytes / 1_048_576, {
          style: "unit",
          unit: "megabyte",
          maximumFractionDigits: 1,
        })
      : fmt.number(Math.max(1, Math.round(bytes / 1024)), {
          style: "unit",
          unit: "kilobyte",
        });

  if (status === "error") {
    return (
      <div
        className={cn(
          "min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10",
          className
        )}
      >
        <div className="mx-auto max-w-3xl rounded-xl border border-border/60 py-12 text-center">
          <p className="font-medium">{t.errorTitle}</p>
          {error ? (
            <p className="mt-1 text-muted-foreground text-sm">{error}</p>
          ) : null}
          {onRetry ? (
            <Button
              className="mt-4"
              onClick={onRetry}
              size="sm"
              variant="outline"
            >
              {t.retry}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }
  if (!thread || status === "loading") {
    return (
      <div
        aria-busy="true"
        className={cn(
          "min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10",
          className
        )}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <Skeleton className="h-8 w-72 motion-reduce:animate-none" />
          <Skeleton className="h-96 w-full rounded-xl motion-reduce:animate-none" />
        </div>
      </div>
    );
  }

  const participants = [
    ...new Map(
      thread.messages.map((m) => [m.from.email, m.from.name])
    ).values(),
  ];

  return (
    <div
      className={cn(
        "min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10",
        className
      )}
    >
      <div className="mx-auto max-w-3xl">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          {t.eyebrow}
        </div>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h1 className="font-heading text-2xl leading-tight">
            {thread.subject}
          </h1>
          {onToggleStar ? (
            <button
              aria-label={t.star}
              aria-pressed={starred}
              className="-me-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-pressed:text-category-3-foreground pointer-coarse:size-10"
              onClick={() => void star.run(!starred)}
              type="button"
            >
              <StarIcon
                aria-hidden
                className={cn("size-4", starred && "fill-current")}
              />
            </button>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
          <span>
            {plural(thread.messages.length, t.messagesOne, t.messagesOther)}
          </span>
          <span aria-hidden>·</span>
          <span>
            {plural(
              participants.length,
              t.participantsOne,
              t.participantsOther
            )}
          </span>
          {thread.labels.map((l) => (
            <span
              className="rounded bg-foreground/6 px-1.5 py-0.5 normal-case tracking-normal"
              key={l}
            >
              {l}
            </span>
          ))}
        </div>
        {star.error ? (
          <p className="mt-2 text-destructive-foreground text-sm" role="alert">
            {star.error}
          </p>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-xl border border-border/60 bg-background/40">
          <ol className="relative divide-y divide-border/40">
            {thread.messages.map((m, i) => (
              // Phones: the avatar moves inline with the sender so the body gets the full width.
              <li
                className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-[40px_minmax(0,1fr)] sm:px-5 sm:py-5"
                key={m.id}
              >
                <Avatar aria-hidden className="mt-0.5 size-9 max-sm:hidden">
                  <AvatarFallback className="text-xs">
                    {initials(m.from.name)}
                  </AvatarFallback>
                </Avatar>
                <article className="min-w-0">
                  <header className="flex flex-wrap items-center gap-x-2 gap-y-0.5 sm:items-baseline">
                    <Avatar aria-hidden className="size-6 sm:hidden">
                      <AvatarFallback className="text-[10px]">
                        {initials(m.from.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{m.from.name}</span>
                    <span className="min-w-0 truncate text-muted-foreground text-xs max-sm:order-last max-sm:basis-full">
                      {m.from.email}
                    </span>
                    <time
                      className="ms-auto font-mono text-[10px] text-muted-foreground"
                      dateTime={m.at}
                    >
                      {fmt.date(m.at, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </header>
                  {m.quoted ? (
                    <blockquote className="mt-3 flex gap-3 wrap-break-word border-foreground/30 border-s-2 ps-3 text-muted-foreground text-sm italic">
                      <CornerUpLeftIcon
                        aria-hidden
                        className="mt-0.5 size-3 shrink-0 opacity-60"
                      />
                      <span>
                        <span className="sr-only">{t.quoted}</span>“{m.quoted}”
                      </span>
                    </blockquote>
                  ) : null}
                  <p className="mt-2 whitespace-pre-line text-foreground/90 text-sm leading-relaxed">
                    {m.body}
                  </p>
                  {m.attachments?.length ? (
                    <ul className="mt-3 flex flex-col gap-1.5">
                      {m.attachments.map((a) => {
                        const label = interpolate(t.attachment, {
                          name: a.name,
                          size: size(a.bytes),
                        });
                        const chip =
                          "inline-flex max-w-full items-center gap-2 rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-xs";
                        return (
                          <li key={a.id}>
                            {a.href ? (
                              <WirefrontLink
                                className={cn(
                                  chip,
                                  "outline-none hover:bg-foreground/3 focus-visible:ring-2 focus-visible:ring-ring"
                                )}
                                href={a.href}
                              >
                                <PaperclipIcon
                                  aria-hidden
                                  className="size-3 shrink-0 opacity-60"
                                />
                                <span className="min-w-0 truncate">
                                  {label}
                                </span>
                              </WirefrontLink>
                            ) : (
                              <span className={chip}>
                                <PaperclipIcon
                                  aria-hidden
                                  className="size-3 shrink-0 opacity-60"
                                />
                                <span className="min-w-0 truncate">
                                  {label}
                                </span>
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                  {onReply && i < thread.messages.length - 1 ? (
                    <div className="mt-2 -ms-2 flex items-center gap-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                      <button
                        className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 outline-none hover:bg-foreground/4 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10"
                        onClick={() => boxRef.current?.focus()}
                        type="button"
                      >
                        <ReplyIcon aria-hidden className="size-3" />
                        {t.reply}
                      </button>
                    </div>
                  ) : null}
                </article>
              </li>
            ))}
          </ol>

          {onReply ? (
            <Form
              className="border-border/60 border-t bg-background p-4"
              errors={form.formProps.errors}
              noValidate
              onFormSubmit={(values) => {
                setNotice(undefined);
                void form.submit(values);
              }}
              ref={formRef}
            >
              <Field.Root name="body">
                <Field.Label className="sr-only">{t.reply}</Field.Label>
                <Field.Control
                  render={
                    <Textarea
                      className="min-h-24"
                      placeholder={interpolate(t.replyTo, {
                        names: participants
                          .map((n) => n.split(" ")[0])
                          .join(", "),
                      })}
                      ref={boxRef}
                    />
                  }
                />
                <Field.Error className="mt-1 text-destructive-foreground text-xs" />
              </Field.Root>
              {form.formError || draft.error ? (
                <p
                  className="mt-2 text-destructive-foreground text-xs"
                  role="alert"
                >
                  {form.formError ?? draft.error}
                </p>
              ) : null}
              <div className="mt-2 flex items-center justify-between gap-2">
                <p aria-live="polite" className="text-muted-foreground text-xs">
                  {notice}
                </p>
                <div className="flex items-center gap-2">
                  {onSaveDraft ? (
                    <Button
                      disabled={draft.isPending() || form.pending}
                      onClick={() => {
                        setNotice(undefined);
                        void draft.run({ body: boxRef.current?.value ?? "" });
                      }}
                      type="button"
                      variant="ghost"
                    >
                      {t.saveDraft}
                    </Button>
                  ) : null}
                  <Button disabled={form.pending} type="submit">
                    {form.pending ? <Spinner /> : null}
                    {t.send}
                  </Button>
                </div>
              </div>
            </Form>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function EmailThread(props: EmailThreadProps) {
  return (
    <ScreenBoundary name="EmailThread">
      <EmailThreadScreen {...props} />
    </ScreenBoundary>
  );
}
