// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@wirefront/ui/card";
import { cn } from "@wirefront/ui/lib/utils";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ShieldCheckIcon } from "lucide-react";
import { useState } from "react";

import type { CardBrand, SavedCard } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("paymentMethods.<key>"). */
export const PAYMENT_METHODS_MESSAGES = {
  title: "Payment methods",
  description: "Used for subscriptions and team seats.",
  primaryCard: "Primary card",
  cardholder: "Cardholder",
  expires: "Exp",
  onFile: "On file ({count})",
  cardEnding: "{brand} ending {last4}",
  expiry: "Exp {date}",
  primary: "Primary",
  makePrimary: "Make primary",
  makePrimaryLabel: "Make primary: card ending {last4}",
  add: "Add new card",
  secured: "Secured by {processor} · we never store your CVC.",
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  discover: "Discover",
  other: "Card",
};

export interface PaymentMethodsProps {
  cards: SavedCard[];
  /** Make a card primary (makePrimary). Applied at once and rolled back if it fails. Hidden without it. */
  onMakePrimary?: Action<string>;
  /** Open your processor's add-card form. Hidden without it. */
  onAddCard?: () => void;
  /** Who handles the cards, for the reassurance line. Hidden without it. */
  processor?: string;
  className?: string;
}

const ART: Record<CardBrand, string> = {
  visa: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #312e81 100%)",
  mastercard: "linear-gradient(135deg, #1f2937 0%, #7c2d12 60%, #be185d 100%)",
  amex: "linear-gradient(135deg, #064e3b 0%, #0f766e 60%, #0891b2 100%)",
  discover: "linear-gradient(135deg, #1c1917 0%, #9a3412 60%, #ea580c 100%)",
  other: "linear-gradient(135deg, #18181b 0%, #3f3f46 60%, #52525b 100%)",
};

function PaymentMethodsScreen({ cards, onMakePrimary, onAddCard, processor, className }: PaymentMethodsProps) {
  const t = useMessages("paymentMethods", PAYMENT_METHODS_MESSAGES);
  const [primaryId, setPrimaryId] = useState(() => cards.find((c) => c.primary)?.id);
  const makePrimary = useAction(onMakePrimary ?? (async () => {}), {
    optimistic: (id) => {
      const before = primaryId;
      setPrimaryId(id);
      return () => setPrimaryId(before);
    },
  });
  const primary = cards.find((c) => c.id === primaryId) ?? cards[0];
  const expiry = (c: SavedCard) => `${String(c.expMonth).padStart(2, "0")}/${String(c.expYear).slice(-2)}`;

  return (
    <div className={cn("min-h-svh bg-background px-4 py-8 sm:px-6 sm:py-16", className)}>
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <h1 className="font-heading text-xl">{t.title}</h1>
          <p className="text-muted-foreground text-sm">{t.description}</p>
        </header>

        <Card>
          {primary ? (
            <CardHeader>
              {/* Decorative card art; the list below carries the same details as text. */}
              <div aria-hidden className="relative aspect-[1.586/1] max-h-52 w-full overflow-hidden rounded-xl text-white shadow-md" style={{ background: ART[primary.brand] }}>
                <div
                  className="absolute inset-0 opacity-30"
                  style={{ backgroundImage: "radial-gradient(80% 60% at 0% 0%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(60% 60% at 100% 100%, rgba(0,0,0,0.4), transparent 60%)" }}
                />
                <div className="relative flex h-full flex-col justify-between p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-80">{t.primaryCard}</div>
                      <div className="size-7 rounded-md bg-category-3/28 shadow-inner" />
                    </div>
                    <div className="rounded-md bg-white/15 px-2 py-1 font-heading font-semibold text-[11px] text-white uppercase tracking-wider backdrop-blur">{t[primary.brand]}</div>
                  </div>
                  <div>
                    <div className="font-mono text-lg tracking-[0.2em]">•••• •••• •••• {primary.last4}</div>
                    <div className="mt-2 flex items-end justify-between font-mono text-[10px] uppercase tracking-widest opacity-90">
                      <div>
                        <div className="opacity-60">{t.cardholder}</div>
                        <div>{primary.holder}</div>
                      </div>
                      <div>
                        <div className="opacity-60">{t.expires}</div>
                        <div>{expiry(primary)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          ) : null}
          <CardContent className="pt-2">
            <CardTitle className="font-heading text-base">
              <h2>{interpolate(t.onFile, { count: cards.length })}</h2>
            </CardTitle>
            {makePrimary.error ? (
              <p className="mt-2 text-destructive-foreground text-sm" role="alert">
                {makePrimary.error}
              </p>
            ) : null}
            <ul className="mt-3 flex flex-col divide-y divide-border">
              {cards.map((c) => (
                <li className="flex items-center gap-3 py-2 first:pt-0 last:pb-0" key={c.id}>
                  <div aria-hidden className="flex h-6 min-w-10 items-center justify-center rounded-md border border-border bg-card px-2 font-heading font-semibold text-[10px] text-foreground/80 uppercase tracking-wider">
                    {t[c.brand]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="whitespace-nowrap font-mono text-foreground text-sm">
                      <span aria-hidden>•••• {c.last4}</span>
                      <span className="sr-only">{interpolate(t.cardEnding, { brand: t[c.brand], last4: c.last4 })}</span>
                    </div>
                    <div className="text-muted-foreground text-xs">{interpolate(t.expiry, { date: expiry(c) })}</div>
                  </div>
                  {primaryId === c.id ? (
                    <Badge className="font-mono text-[10px] uppercase" variant="secondary">
                      {t.primary}
                    </Badge>
                  ) : onMakePrimary ? (
                    <Button
                      aria-label={interpolate(t.makePrimaryLabel, { last4: c.last4 })}
                      disabled={makePrimary.isPending()}
                      onClick={() => void makePrimary.run(c.id)}
                      size="xs"
                      variant="ghost"
                    >
                      {t.makePrimary}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
          {onAddCard || processor ? (
            <CardFooter className="flex-col items-stretch gap-2 border-t">
              {onAddCard ? (
                <Button className="w-full" onClick={onAddCard}>
                  {t.add}
                </Button>
              ) : null}
              {processor ? (
                <p className="inline-flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
                  <ShieldCheckIcon aria-hidden className="size-3.5" />
                  {interpolate(t.secured, { processor })}
                </p>
              ) : null}
            </CardFooter>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

export function PaymentMethods(props: PaymentMethodsProps) {
  return (
    <ScreenBoundary name="PaymentMethods">
      <PaymentMethodsScreen {...props} />
    </ScreenBoundary>
  );
}
