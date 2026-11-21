// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

/**
 * The split auth layout with a particle illustration: the figure and an
 * optional caption on the left (lg+), the page on the right. Forms inside can
 * nudge the particles while the user types with `useAuthTypingImpulse()` and
 * `bumpParticleTypingImpulse` from the particle field.
 *
 *   <IllustratedAuthLayout brand={<Logo />} caption={{ eyebrow: "Welcome", text: "…" }} illustration={src}>
 *     <SignInForm />
 *   </IllustratedAuthLayout>
 */
import { createContext, type ReactNode, type RefObject, useContext, useRef } from "react";

import { ParticleField } from "./particle-field";
import { AuthSplitLayout } from "./ui/auth-split-layout";

type ImpulseRef = RefObject<number>;
const TypingImpulseContext = createContext<ImpulseRef | null>(null);

/** The ref the particle field reads; bump it on key presses. Null outside the layout. */
export function useAuthTypingImpulse(): ImpulseRef | null {
  return useContext(TypingImpulseContext);
}

export interface IllustratedAuthLayoutProps {
  /** The page, on the right. */
  children: ReactNode;
  /** The image the particle field is drawn from (any URL or imported asset). */
  illustration: string;
  /** Your logo or name, top left of the illustration. */
  brand?: ReactNode;
  /** A short line over the illustration, bottom left. */
  caption?: { eyebrow?: string; text: string };
  /** Top-right controls, such as the app's theme toggle. */
  actions?: ReactNode;
}

export function IllustratedAuthLayout({ children, illustration, brand, caption, actions }: IllustratedAuthLayoutProps) {
  const typingImpulseRef = useRef(0);
  return (
    <TypingImpulseContext.Provider value={typingImpulseRef}>
      <AuthSplitLayout
        actions={actions}
        left={
          <>
            <ParticleField align="center" dotSize={1} renderScale={1} sampleStep={3} src={illustration} threshold={34} typingImpulseRef={typingImpulseRef} />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(900px 600px at 50% 50%, transparent 45%, color-mix(in srgb, var(--background) 88%, transparent) 92%)" }}
            />
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-12">
              <div className="pointer-events-auto">{brand}</div>
              {caption ? (
                <div className="max-w-md">
                  {caption.eyebrow ? <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.3em]">{caption.eyebrow}</div> : null}
                  <p className="mt-3 font-heading text-xl leading-snug md:text-2xl">{caption.text}</p>
                </div>
              ) : null}
            </div>
          </>
        }
        right={children}
        rightClassName="lg:w-[min(620px,55%)]"
      />
    </TypingImpulseContext.Provider>
  );
}
