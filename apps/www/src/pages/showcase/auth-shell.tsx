// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import type { ReactNode, RefObject } from "react";
import { createContext, useContext, useRef } from "react";
import { ParticleField } from "@wirefront/ui/particle-field";
import { AuthSplitLayout } from "@wirefront/ui/auth-split-layout";

type ImpulseRef = RefObject<number>;
const TypingImpulseContext = createContext<ImpulseRef | null>(null);

export function useAuthTypingImpulse(): ImpulseRef {
  const ctx = useContext(TypingImpulseContext);
  if (!ctx) throw new Error("useAuthTypingImpulse outside <AuthShell>");
  return ctx;
}

type Variant = "welcome" | "request-access" | "onboarding";

export function AuthShell({
  children,
  illustration,
  variant = "welcome",
}: {
  children: ReactNode;
  /** Image the particle field is drawn from (any URL or imported asset). */
  illustration: string;
  variant?: Variant;
}) {
  const typingImpulseRef = useRef(0);
  return (
    <TypingImpulseContext.Provider value={typingImpulseRef}>
      <AuthSplitLayout
        rightClassName="lg:w-[min(620px,55%)]"
        left={
          <>
            <ParticleField
              src={illustration}
              sampleStep={3}
              threshold={34}
              dotSize={1}
              renderScale={1}
              align="center"
              typingImpulseRef={typingImpulseRef}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(900px 600px at 50% 50%, transparent 45%, color-mix(in srgb, var(--background) 88%, transparent) 92%)",
              }}
            />
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-12">
              <div className="pointer-events-auto flex items-center gap-2 font-mono text-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-foreground" />
                <span className="tracking-[0.2em] uppercase">Wirefront</span>
              </div>
              {variant === "request-access" ? (
                <div className="max-w-md">
                  <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.3em]">
                    Quiet onboarding
                  </div>
                  <p className="mt-3 font-heading text-xl leading-snug md:text-2xl">
                    A waitlist screen with a particle figure and a single soft
                    CTA — for invite-only entry points.
                  </p>
                </div>
              ) : variant === "onboarding" ? (
                <div className="max-w-md">
                  <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.3em]">
                    First steps
                  </div>
                  <p className="mt-3 font-heading text-xl leading-snug md:text-2xl">
                    A guided multi-step setup, paced so each screen carries one
                    decision at a time.
                  </p>
                </div>
              ) : (
                <div className="max-w-md">
                  <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.3em]">
                    Sign-in design
                  </div>
                  <p className="mt-3 font-heading text-xl leading-snug md:text-2xl">
                    Split layout with a particle field on the left and a single
                    centered form on the right.
                  </p>
                </div>
              )}
            </div>
          </>
        }
        right={children}
      />
    </TypingImpulseContext.Provider>
  );
}
