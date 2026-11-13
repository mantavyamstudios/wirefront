// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Button } from "@wirefront/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@wirefront/ui/dialog";
import { Input } from "@wirefront/ui/input";
import { cn } from "@wirefront/ui/lib/utils";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Spinner } from "@wirefront/ui/spinner";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { BuildingIcon, EyeIcon, GlobeIcon, LockIcon, PlusIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { CreateWorkspaceForm, type CreateWorkspaceInput, NAME_MAX_LENGTH, slugify, Visibility, type Workspace } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("createWorkspace.<key>"). */
export const CREATE_WORKSPACE_MESSAGES = {
  title: "Workspaces",
  trigger: "New workspace",
  dialogTitle: "Create a new workspace",
  dialogDescription: "You can change these later in settings.",
  name: "Workspace name",
  namePlaceholder: "e.g. Acme studios",
  nameCount: "{count} / {max}",
  url: "Workspace URL",
  slugPlaceholder: "your-workspace",
  checking: "checking",
  available: "available",
  taken: "taken",
  visibility: "Visibility",
  private: "Private",
  privateMeta: "Only invited members can join",
  team: "Team",
  teamMeta: "Anyone in @{domain} can request access",
  public: "Public",
  publicMeta: "Anyone with the link can join",
  step: "Step {current} of {total} · Workspace",
  cancel: "Cancel",
  create: "Create workspace",
};

export interface CreateWorkspaceProps {
  /**
   * Create the workspace. Receives the name, the URL slug made from it and the
   * visibility. Resolve with the workspace (or nothing); `fail(message, { name? })`
   * or throw to show what went wrong.
   */
  onCreate: Action<CreateWorkspaceInput, Workspace>;
  /** Called after it's created, e.g. to switch to it. */
  onCreated?: (workspace: Workspace | undefined) => void;
  /** Check whether a slug is free. The availability badge only shows when this is given. */
  checkSlug?: (slug: string) => Promise<boolean>;
  /** What comes before the slug in the workspace URL, e.g. "acme.dev/". */
  urlPrefix: string;
  /** Your company's email domain. The "Team" option only shows when this is given. */
  teamDomain?: string;
  /** Where this dialog sits in a longer setup, e.g. { current: 1, total: 3 }. Hidden when not given. */
  step?: { current: number; total: number };
  defaultName?: string;
  /** Open the dialog on first render. */
  defaultOpen?: boolean;
  className?: string;
}

type Availability = "idle" | "checking" | "available" | "taken";
const ICONS: Record<Visibility, typeof LockIcon> = { private: LockIcon, team: EyeIcon, public: GlobeIcon };
const label = "mb-1.5 block font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]";

function CreateWorkspaceScreen({
  onCreate,
  onCreated,
  checkSlug,
  urlPrefix,
  teamDomain,
  step,
  defaultName = "",
  defaultOpen,
  className,
}: CreateWorkspaceProps) {
  const t = useMessages("createWorkspace", CREATE_WORKSPACE_MESSAGES);
  const id = useId();
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [name, setName] = useState(defaultName);
  const [availability, setAvailability] = useState<Availability>("idle");
  const slug = slugify(name);
  const options = Visibility.options.filter((v) => v !== "team" || teamDomain);

  const [visibility, setVisibility] = useState<Visibility>(teamDomain ? "team" : "private");
  const form = useActionForm({
    schema: CreateWorkspaceForm.pick({ name: true }),
    action: ({ name: value }) => onCreate({ name: value, visibility, slug }),
    onSuccess: (workspace) => {
      setOpen(false);
      onCreated?.(workspace);
    },
  });

  // Ask the backend straight away for the starting name, then once typing
  // pauses; ignore answers for an older slug.
  const initialSlug = useState(() => slugify(defaultName))[0];
  useEffect(() => {
    if (!checkSlug || !slug) {
      setAvailability("idle");
      return;
    }
    let current = true;
    setAvailability("checking");
    const timer = setTimeout(() => {
      checkSlug(slug).then(
        (free) => current && setAvailability(free ? "available" : "taken"),
        () => current && setAvailability("idle"),
      );
    }, slug === initialSlug ? 0 : 300);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [checkSlug, slug, initialSlug]);

  const badge =
    availability === "idle" ? null : (
      <span
        className={cn(
          "mr-2 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px]",
          availability === "available" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
          availability === "taken" && "bg-destructive/10 text-destructive-foreground",
          availability === "checking" && "bg-muted text-muted-foreground",
        )}
      >
        <span className={cn("size-1 rounded-full", availability === "taken" ? "bg-destructive" : availability === "available" ? "bg-emerald-500" : "bg-muted-foreground")} />
        {t[availability]}
      </span>
    );

  return (
    <div className={cn("relative min-h-svh bg-background", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-8 sm:px-10 sm:py-10">
        <h1 className="font-heading text-2xl">{t.title}</h1>
        <Dialog
          onOpenChange={(next) => {
            if (form.pending) return;
            setOpen(next);
            if (!next) form.reset();
          }}
          open={open}
        >
          <DialogTrigger render={<Button />}>
            <PlusIcon />
            {t.trigger}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader className="flex-row items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06]">
                <BuildingIcon className="size-4 opacity-80" />
              </div>
              <div className="flex flex-col gap-0.5 text-left">
                <DialogTitle className="text-base">{t.dialogTitle}</DialogTitle>
                <DialogDescription className="text-xs">{t.dialogDescription}</DialogDescription>
              </div>
            </DialogHeader>

            <Form className="contents" noValidate {...form.formProps}>
              <div className="-mx-4 min-h-0 min-w-0 space-y-5 overflow-y-auto px-4">
                <Field.Root name="name">
                  <Field.Label className={label}>{t.name}</Field.Label>
                  <Input
                    defaultValue={defaultName}
                    maxLength={NAME_MAX_LENGTH}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.namePlaceholder}
                  />
                  <Field.Error className="mt-1.5 text-destructive-foreground text-xs" />
                  <div className="mt-1.5 text-muted-foreground text-xs tabular-nums">
                    {interpolate(t.nameCount, { count: name.length, max: NAME_MAX_LENGTH })}
                  </div>
                </Field.Root>

                <div>
                  <div className={label}>{t.url}</div>
                  <div className="flex h-10 min-w-0 items-center rounded-md border border-border bg-background pl-3">
                    <span className="shrink-0 text-muted-foreground text-sm">{urlPrefix}</span>
                    <code className="min-w-0 flex-1 truncate bg-transparent font-mono text-foreground text-sm">{slug || t.slugPlaceholder}</code>
                    <span aria-live="polite">{badge}</span>
                  </div>
                </div>

                <div>
                  <div className={label} id={`${id}-visibility`}>
                    {t.visibility}
                  </div>
                  <RadioGroup
                    aria-labelledby={`${id}-visibility`}
                    className="flex flex-col gap-2"
                    onValueChange={(value) => setVisibility(value as Visibility)}
                    value={visibility}
                  >
                    {options.map((option) => {
                      const Icon = ICONS[option];
                      return (
                      <Radio.Root
                        className="flex w-full cursor-pointer items-start gap-3 rounded-lg border border-border/60 px-3 py-2.5 text-left outline-none transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring data-checked:border-foreground/60 data-checked:bg-foreground/[0.04]"
                        key={option}
                        value={option}
                      >
                        <span className="mt-1 flex size-3.5 shrink-0 items-center justify-center rounded-full border border-border in-data-checked:border-foreground in-data-checked:bg-foreground in-data-checked:ring-2 in-data-checked:ring-foreground/20 in-data-checked:ring-offset-2 in-data-checked:ring-offset-background" />
                        <Icon aria-hidden className="mt-0.5 size-4 opacity-70" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm">{t[option]}</span>
                          <span className="block text-muted-foreground text-xs">
                            {interpolate(t[`${option}Meta`], { domain: teamDomain ?? "" })}
                          </span>
                        </span>
                      </Radio.Root>
                      );
                    })}
                  </RadioGroup>
                </div>

                {form.formError ? (
                  <p className="text-destructive-foreground text-xs" role="alert">
                    {form.formError}
                  </p>
                ) : null}
              </div>

              <DialogFooter className="sm:items-center">
                {step ? (
                  <span className="text-center text-muted-foreground text-xs sm:me-auto sm:text-left">{interpolate(t.step, step)}</span>
                ) : null}
                <DialogClose disabled={form.pending} render={<Button type="button" variant="ghost" />}>
                  {t.cancel}
                </DialogClose>
                <Button aria-busy={form.pending} disabled={form.pending || availability === "taken" || !slug} type="submit">
                  {form.pending ? <Spinner data-icon="inline-start" /> : null}
                  {t.create}
                </Button>
              </DialogFooter>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export function CreateWorkspace(props: CreateWorkspaceProps) {
  return (
    <ScreenBoundary name="CreateWorkspace">
      <CreateWorkspaceScreen {...props} />
    </ScreenBoundary>
  );
}
