// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button, buttonVariants } from "@wirefront/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@wirefront/ui/dialog";
import { cn } from "@wirefront/ui/lib/utils";
import { OTPField, OTPFieldInput, OTPFieldSeparator } from "@wirefront/ui/otp-field";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { CheckIcon, CopyIcon, ExternalLinkIcon, ShieldCheckIcon } from "lucide-react";
import { useId, useState } from "react";

import { type TotpEnrollment, VerifyTotpInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("twoFactorSetup.<key>"). */
export const TWO_FACTOR_SETUP_MESSAGES = {
  pageTitle: "Security · Profile",
  trigger: "Enable 2FA",
  step: "Step {current} of {total}",
  title: "Set up two-factor auth",
  qrAlt: "QR code for your authenticator app",
  scan: "Scan with Authenticator",
  instructionsPhone: "Open your authenticator app, or paste this setup key manually.",
  instructions: "Open your authenticator app and scan the code, or paste this secret manually.",
  instructionsNoQr: "Open your authenticator app and paste this setup key.",
  openApp: "Open authenticator app",
  copyKey: "Copy setup key",
  keyCopied: "Setup key copied",
  copyFailed: "Couldn’t copy. Select the key and copy it.",
  confirm: "Confirm with a 6-digit code",
  digit: "Digit {n} of {length}",
  recoveryCodes: "Recovery codes",
  download: "Download",
  recoveryHint: "Save these somewhere safe. Each code can be used once if you lose access.",
  recoveryFile: "Recovery codes for {account}",
  back: "Back",
  verify: "Verify and continue",
};

export interface TwoFactorSetupProps {
  /** From startTotpEnrollment. */
  enrollment: TotpEnrollment;
  /** Confirm the code (verifyTotp). Resolve to close; fail or throw to show why. */
  onVerify: Action<VerifyTotpInput>;
  /** Called once verified, e.g. to move to the next step. */
  onVerified?: () => void;
  /** Who the codes are for, used in the downloaded file, e.g. "you@example.com". */
  account: string;
  /** Where this sits in a longer setup. Hidden when not given. */
  step?: { current: number; total: number };
  /** Open the dialog on first render. */
  defaultOpen?: boolean;
  className?: string;
}

const CODE_LENGTH = 6;
const DIGITS = Array.from({ length: CODE_LENGTH }, (_, i) => `d${i}`);
const eyebrow = "font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]";

function TwoFactorSetupScreen({ enrollment, onVerify, onVerified, account, step, defaultOpen, className }: TwoFactorSetupProps) {
  const t = useMessages("twoFactorSetup", TWO_FACTOR_SETUP_MESSAGES);
  const id = useId();
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [code, setCode] = useState("");
  const [invalid, setInvalid] = useState<string>();
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const verify = useAction(onVerify, {
    onSuccess: () => {
      setOpen(false);
      onVerified?.();
    },
  });
  const grouped = enrollment.secret.match(/.{1,4}/g)?.join(" ") ?? enrollment.secret;
  const error = invalid ?? verify.error;

  const submit = () => {
    const parsed = VerifyTotpInput.safeParse({ code });
    if (!parsed.success) {
      setInvalid(parsed.error.issues[0]?.message);
      return;
    }
    void verify.run(parsed.data);
  };

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(enrollment.secret);
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
  };

  const download = () => {
    const text = `${interpolate(t.recoveryFile, { account })}\n\n${enrollment.recoveryCodes.join("\n")}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    // Real Dialog; bottom sheet with a scrolling body on phones. Scanning a
    // QR on the same phone is impossible, so phones get an "Open authenticator"
    // deep link and the setup key first; the QR shows from sm up.
    <div className={cn("relative min-h-svh bg-background", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-8 sm:px-10 sm:py-10">
        <h1 className="font-heading text-2xl">{t.pageTitle}</h1>
        <Dialog
          onOpenChange={(next) => {
            if (verify.isPending()) return;
            setOpen(next);
          }}
          open={open}
        >
          <DialogTrigger render={<Button variant="outline" />}>
            <ShieldCheckIcon />
            {t.trigger}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader className="flex-row items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-category-2/15 text-category-2-foreground">
                <ShieldCheckIcon aria-hidden className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 text-start">
                {step ? <div className={eyebrow}>{interpolate(t.step, step)}</div> : null}
                <DialogTitle className="text-base">{t.title}</DialogTitle>
              </div>
            </DialogHeader>

            <div className="-mx-4 min-h-0 min-w-0 overflow-y-auto px-4">
              <div className={cn("grid grid-cols-1 gap-5", enrollment.qrCodeUrl && "sm:grid-cols-[160px_minmax(0,1fr)]")}>
                {enrollment.qrCodeUrl ? (
                  <div className="hidden rounded-lg border border-border/60 bg-background p-3 sm:block">
                    <img alt={t.qrAlt} className="aspect-square w-full" src={enrollment.qrCodeUrl} />
                    <div className="mt-2 text-center font-mono text-[10px] text-muted-foreground">{t.scan}</div>
                  </div>
                ) : null}
                <div className="min-w-0">
                  <p className="text-sm leading-snug">
                    <span className="sm:hidden">{t.instructionsPhone}</span>
                    <span className="max-sm:hidden">{enrollment.qrCodeUrl ? t.instructions : t.instructionsNoQr}</span>
                  </p>
                  <a className={cn(buttonVariants(), "mt-3 w-full sm:hidden")} href={enrollment.otpauthUrl}>
                    <ExternalLinkIcon />
                    {t.openApp}
                  </a>
                  <div className="mt-3 flex items-center gap-2 rounded-md border border-border/60 bg-background py-1 ps-3 pe-1">
                    <code className="min-w-0 flex-1 break-all font-mono text-sm">{grouped}</code>
                    <button
                      aria-label={copy === "copied" ? t.keyCopied : t.copyKey}
                      className="grid size-8 shrink-0 place-items-center rounded text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground pointer-coarse:size-10"
                      onClick={() => void copyKey()}
                      type="button"
                    >
                      {copy === "copied" ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
                    </button>
                  </div>
                  {copy === "failed" ? (
                    <p className="mt-1 text-destructive-foreground text-xs" role="alert">
                      {t.copyFailed}
                    </p>
                  ) : null}

                  <div className="mt-5">
                    <label className={cn(eyebrow, "mb-2 block")} htmlFor={`${id}-code`}>
                      {t.confirm}
                    </label>
                    <OTPField
                      aria-describedby={error ? `${id}-error` : undefined}
                      id={`${id}-code`}
                      disabled={verify.isPending()}
                      length={CODE_LENGTH}
                      onValueChange={(value) => {
                        setCode(value);
                        setInvalid(undefined);
                      }}
                      value={code}
                    >
                      {DIGITS.map((key, i) => (
                        <span className="contents" key={key}>
                          {i === CODE_LENGTH / 2 && <OTPFieldSeparator />}
                          <OTPFieldInput aria-invalid={error ? true : undefined} aria-label={interpolate(t.digit, { n: i + 1, length: CODE_LENGTH })} />
                        </span>
                      ))}
                    </OTPField>
                    {error ? (
                      <p className="mt-2 text-destructive-foreground text-xs" id={`${id}-error`} role="alert">
                        {error}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {enrollment.recoveryCodes.length ? (
                <div className="mt-6 rounded-lg border border-border/60 bg-muted/20 p-3 sm:p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h2 className={eyebrow}>{t.recoveryCodes}</h2>
                    <button className={cn(eyebrow, "min-h-8 hover:text-foreground pointer-coarse:min-h-10")} onClick={download} type="button">
                      {t.download}
                    </button>
                  </div>
                  <ul className="grid grid-cols-2 gap-1.5 rounded-md border border-border/60 bg-background p-3 sm:grid-cols-4">
                    {enrollment.recoveryCodes.map((c) => (
                      <li key={c}>
                        <code className="block rounded bg-muted/60 px-1.5 py-1 text-center font-mono text-[11px]">{c}</code>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-muted-foreground text-xs">{t.recoveryHint}</p>
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <DialogClose disabled={verify.isPending()} render={<Button type="button" variant="ghost" />}>
                {t.back}
              </DialogClose>
              <Button aria-busy={verify.isPending()} disabled={verify.isPending()} onClick={submit} type="button">
                {verify.isPending() ? <Spinner data-icon="inline-start" /> : null}
                {t.verify}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export function TwoFactorSetup(props: TwoFactorSetupProps) {
  return (
    <ScreenBoundary name="TwoFactorSetup">
      <TwoFactorSetupScreen {...props} />
    </ScreenBoundary>
  );
}
