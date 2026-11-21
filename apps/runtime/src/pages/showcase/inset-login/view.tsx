// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Button, buttonVariants } from "@wirefront/ui/button";
import { Input } from "@wirefront/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@wirefront/ui/input-group";
import { cn } from "@wirefront/ui/lib/utils";
import { Separator } from "@wirefront/ui/separator";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import { useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ChevronLeftIcon, EyeIcon, EyeOffIcon, MailIcon, ShuffleIcon } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { SignInInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("insetSignIn.<key>"). */
export const INSET_SIGN_IN_MESSAGES = {
  back: "Back",
  palette: "Background colours:",
  title: "Welcome back",
  subtitle: "Sign in to your account to continue.",
  lastUsed: "Last used",
  magicLink: "Sign in with Magic Link",
  or: "Or",
  email: "Email",
  emailPlaceholder: "Enter your email",
  password: "Password",
  showPassword: "Show password",
  hidePassword: "Hide password",
  submit: "Sign in",
  noAccount: "Don’t have an account?",
  signUp: "Sign up",
  forgotPassword: "Forgot password?",
};

export interface InsetSignInProvider {
  id: string;
  name: string;
  icon?: ReactNode;
}

export interface InsetSignInProps {
  /**
   * Sign in with email and password. The values are already validated.
   * Resolve on success; resolve with `fail(message, { email?, password? })`
   * or throw to show what went wrong.
   */
  onSignIn: Action<SignInInput>;
  /** Called after a successful sign-in, e.g. to navigate into the app. */
  onSuccess?: () => void;
  /** OAuth providers above the form. Needs `onProvider`. */
  providers?: InsetSignInProvider[];
  /** Start signing in with a provider (receives its id). Usually redirects. */
  onProvider?: Action<string>;
  /** The provider this device last signed in with; it gets a "Last used" tag. */
  lastUsedProvider?: string;
  /** Where "Sign in with Magic Link" goes. Hidden when not given. */
  magicLinkHref?: string;
  /** Where "Forgot password?" goes. Hidden when not given. */
  forgotPasswordHref?: string;
  /** Where "Sign up" goes. Hidden when not given. */
  signUpHref?: string;
  /** Where "Back" on the artwork goes, e.g. your marketing site. Hidden when not given. */
  backHref?: string;
  /** The headline over the artwork (lg+). */
  headline?: ReactNode;
  /** A line under the headline. */
  tagline?: string;
  /** Your logo. */
  logo?: ReactNode;
}

type Rgb = [number, number, number];
type Colors = [Rgb, Rgb, Rgb, Rgb];

/** The mesh's colour sets, in the order the palette button steps through. */
const PALETTE_NAMES = ["Slate", "Aurora", "Sunset", "Forest", "Plum", "Cyber", "Ember", "Ice"] as const;
type PaletteName = (typeof PALETTE_NAMES)[number];

const PALETTES: Record<PaletteName, Colors> = {
  Slate: [
    [0.04, 0.04, 0.07],
    [0.13, 0.13, 0.17],
    [0.22, 0.22, 0.30],
    [0.06, 0.06, 0.10],
  ],
  Aurora: [
    [0.05, 0.08, 0.16],
    [0.10, 0.32, 0.48],
    [0.42, 0.20, 0.58],
    [0.06, 0.10, 0.18],
  ],
  Sunset: [
    [0.10, 0.05, 0.10],
    [0.62, 0.22, 0.28],
    [0.50, 0.38, 0.20],
    [0.18, 0.05, 0.12],
  ],
  Forest: [
    [0.04, 0.09, 0.07],
    [0.08, 0.32, 0.26],
    [0.10, 0.20, 0.32],
    [0.05, 0.11, 0.10],
  ],
  Plum: [
    [0.10, 0.05, 0.14],
    [0.50, 0.16, 0.50],
    [0.26, 0.10, 0.42],
    [0.08, 0.04, 0.12],
  ],
  Cyber: [
    [0.04, 0.06, 0.12],
    [0.06, 0.42, 0.52],
    [0.55, 0.10, 0.38],
    [0.05, 0.05, 0.12],
  ],
  Ember: [
    [0.10, 0.04, 0.04],
    [0.62, 0.26, 0.10],
    [0.45, 0.10, 0.10],
    [0.10, 0.05, 0.05],
  ],
  Ice: [
    [0.05, 0.07, 0.12],
    [0.20, 0.32, 0.55],
    [0.32, 0.42, 0.58],
    [0.07, 0.09, 0.16],
  ],
};

const VERT_SRC = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAG_SRC = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  uv.y = 1.0 - uv.y;
  float t = u_time * 0.00015;

  vec2 p0 = vec2(0.30 + sin(t * 0.70) * 0.25, 0.25 + cos(t * 0.60) * 0.20);
  vec2 p1 = vec2(0.75 + cos(t * 0.50) * 0.20, 0.70 + sin(t * 0.80) * 0.20);
  vec2 p2 = vec2(0.50 + sin(t * 0.40 + 1.0) * 0.30, 0.50 + cos(t * 0.70) * 0.25);
  vec2 p3 = vec2(0.20 + cos(t * 0.55) * 0.20, 0.85 + sin(t * 0.45) * 0.15);

  float r = 0.55;
  float d0 = pow(1.0 - smoothstep(0.0, r, distance(uv, p0)), 1.4);
  float d1 = pow(1.0 - smoothstep(0.0, r, distance(uv, p1)), 1.4);
  float d2 = pow(1.0 - smoothstep(0.0, r, distance(uv, p2)), 1.4);
  float d3 = pow(1.0 - smoothstep(0.0, r, distance(uv, p3)), 1.4);

  float total = d0 + d1 + d2 + d3 + 0.0001;
  vec3 col = (u_c0 * d0 + u_c1 * d1 + u_c2 * d2 + u_c3 * d3) / total;

  // grain
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - 0.5) * 0.025;

  gl_FragColor = vec4(col, 1.0);
}`;

/**
 * Draws the mesh on `canvas` until the returned cleanup runs. Colours ease
 * from `current` toward `target`; `kick` restarts a paused loop.
 */
function runMesh(canvas: HTMLCanvasElement, targetRef: { current: Colors }, currentRef: { current: Colors }, kickRef: { current: () => void }): (() => void) | undefined {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
  if (!gl) return undefined;

  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type);
    if (!sh) return null;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  };

  const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
  if (!vs || !fs) return undefined;

  const prog = gl.createProgram();
  if (!prog) return undefined;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return undefined;
  // WebGL's useProgram is not a React hook; calling it through a bound alias
  // keeps Biome's hook rule (useHookAtTopLevel) from mistaking it for one.
  const activateProgram = gl.useProgram.bind(gl);
  activateProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const posLoc = gl.getAttribLocation(prog, "a_position");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "u_resolution");
  const uTime = gl.getUniformLocation(prog, "u_time");
  const uC0 = gl.getUniformLocation(prog, "u_c0");
  const uC1 = gl.getUniformLocation(prog, "u_c1");
  const uC2 = gl.getUniformLocation(prog, "u_c2");
  const uC3 = gl.getUniformLocation(prog, "u_c3");

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  };

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // Only animate while visible (the panel is `hidden` below lg) and the tab
  // is in the foreground. Reduced motion freezes the flow and stops the loop
  // once a palette transition has settled.
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let raf = 0;
  let running = false;
  let inView = true;
  const shouldRun = () => inView && document.visibilityState === "visible";
  const startLoop = () => {
    if (running || !shouldRun()) return;
    running = true;
    raf = requestAnimationFrame(tick);
  };
  kickRef.current = startLoop;

  const start = performance.now();
  const tick = (now: number) => {
    if (!shouldRun()) {
      running = false;
      return;
    }
    const reduced = reducedMotion.matches;
    const t = reduced ? 0 : now - start;
    // ease current toward target (~600ms feel)
    const k = 0.06;
    let delta = 0;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        const d = targetRef.current[i][j] - currentRef.current[i][j];
        currentRef.current[i][j] += d * k;
        delta = Math.max(delta, Math.abs(d));
      }
    }
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    const c = currentRef.current;
    gl.uniform3f(uC0, c[0][0], c[0][1], c[0][2]);
    gl.uniform3f(uC1, c[1][0], c[1][1], c[1][2]);
    gl.uniform3f(uC2, c[2][0], c[2][1], c[2][2]);
    gl.uniform3f(uC3, c[3][0], c[3][1], c[3][2]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (reduced && delta < 0.001) {
      running = false;
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver((entries) => {
    inView = entries.some((e) => e.isIntersecting);
    startLoop();
  });
  io.observe(canvas);
  const onWake = () => startLoop();
  document.addEventListener("visibilitychange", onWake);
  reducedMotion.addEventListener("change", onWake);
  startLoop();

  return () => {
    cancelAnimationFrame(raf);
    running = false;
    kickRef.current = () => {};
    io.disconnect();
    document.removeEventListener("visibilitychange", onWake);
    reducedMotion.removeEventListener("change", onWake);
    ro.disconnect();
    gl.deleteProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.deleteBuffer(buf);
  };
}

function MeshShader({ colors }: { colors: Colors }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef(colors);
  const currentRef = useRef(colors.map((c) => [...c]) as Colors);
  // Lets a palette change wake the loop if it has paused.
  const kickRef = useRef<() => void>(() => {});

  useEffect(() => {
    targetRef.current = colors;
    kickRef.current();
  }, [colors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return runMesh(canvas, targetRef, currentRef, kickRef);
  }, []);

  return <canvas aria-hidden className="absolute inset-0 block h-full w-full" ref={canvasRef} />;
}

const fieldError = "text-destructive-foreground text-xs";
const textShadow = { textShadow: "0 1px 16px rgba(0,0,0,0.55)" };

function ArtPanel({ backHref, headline, tagline, t }: Pick<InsetSignInProps, "backHref" | "headline" | "tagline"> & { t: typeof INSET_SIGN_IN_MESSAGES }) {
  const [palette, setPalette] = useState<PaletteName>("Aurora");
  const nextPalette = () => setPalette((current) => PALETTE_NAMES[(PALETTE_NAMES.indexOf(current) + 1) % PALETTE_NAMES.length] ?? current);
  return (
    <div className="relative hidden overflow-hidden bg-[#0a0a0c] lg:block">
      <MeshShader colors={PALETTES[palette]} />
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 80% at 50% 50%, transparent 35%, rgba(0,0,0,0.55) 100%)" }} />
      <div className="relative flex h-full flex-col justify-between p-12">
        <div className="flex items-start justify-between">
          {backHref ? (
            <WirefrontLink
              className="inline-flex w-fit items-center gap-1.5 rounded-md bg-black/20 px-2 py-1 font-mono text-[11px] text-white/65 uppercase tracking-[0.2em] backdrop-blur-sm transition-colors hover:text-white"
              href={backHref}
            >
              <ChevronLeftIcon aria-hidden className="size-3.5 rtl:rotate-180" />
              {t.back}
            </WirefrontLink>
          ) : (
            <span />
          )}
          <button
            className="group inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5 text-white/75 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-black/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            onClick={nextPalette}
            type="button"
          >
            <ShuffleIcon aria-hidden className="size-3.5 transition-transform group-hover:rotate-12" />
            <span className="sr-only">{t.palette}</span>{" "}
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">{palette}</span>
          </button>
        </div>
        {headline || tagline ? (
          <div className="max-w-md">
            {headline ? (
              <h2 className="font-heading font-semibold text-3xl text-white leading-tight md:text-4xl" style={{ textShadow: "0 1px 24px rgba(0,0,0,0.55)" }}>
                {headline}
              </h2>
            ) : null}
            {tagline ? (
              <p className="mt-5 max-w-sm text-sm text-white/65 leading-relaxed" style={textShadow}>
                {tagline}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InsetSignInScreen({ onSignIn, onSuccess, providers = [], onProvider, lastUsedProvider, magicLinkHref, forgotPasswordHref, signUpHref, backHref, headline, tagline, logo }: InsetSignInProps) {
  const t = useMessages("insetSignIn", INSET_SIGN_IN_MESSAGES);
  const [reveal, setReveal] = useState(false);
  const form = useActionForm({ schema: SignInInput, action: onSignIn, onSuccess: () => onSuccess?.() });
  const provider = useAction(onProvider ?? (async () => {}));
  const shown = onProvider ? providers : [];
  const hasAlternatives = shown.length > 0 || Boolean(magicLinkHref);

  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(60% 50% at 10% 10%, color-mix(in srgb, var(--primary) 10%, transparent), transparent 65%)",
            "radial-gradient(50% 50% at 90% 100%, color-mix(in srgb, var(--foreground) 6%, transparent), transparent 65%)",
          ].join(", "),
        }}
      />
      {/* Edge-to-edge on phones; the inset frame appears from sm up. */}
      <div className="relative mx-auto flex min-h-svh max-w-360 items-stretch sm:p-4 md:p-10 lg:p-16">
        <div className="relative grid w-full grid-cols-1 overflow-hidden bg-card sm:rounded-3xl sm:border sm:border-border sm:shadow-2xl sm:shadow-foreground/10 lg:grid-cols-[1fr_minmax(440px,560px)]">
          <ArtPanel backHref={backHref} headline={headline} t={t} tagline={tagline} />
          <div className="relative flex flex-col overflow-y-auto bg-card text-foreground lg:min-h-170">
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-10 sm:px-6 lg:py-14">
              {logo ? <div className="flex items-center justify-center">{logo}</div> : null}
              <div className={cn("flex flex-col gap-1.5", logo && "mt-12")}>
                <h1 className="font-heading font-semibold text-2xl tracking-tight">{t.title}</h1>
                <p className="text-muted-foreground text-sm">{t.subtitle}</p>
              </div>

              {shown.length ? (
                <div className={cn("mt-6 grid gap-2.5", shown.length > 1 && "grid-cols-2")}>
                  {shown.map((p) => (
                    <div className="relative" key={p.id}>
                      {p.id === lastUsedProvider ? (
                        <span
                          aria-hidden
                          className="-top-2 absolute inset-e-2 z-10 whitespace-nowrap rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground uppercase tracking-[0.15em]"
                        >
                          {t.lastUsed}
                        </span>
                      ) : null}
                      <Button aria-busy={provider.isPending(p.id)} className="w-full" disabled={provider.isPending()} onClick={() => void provider.run(p.id, p.id)} size="lg" type="button" variant="outline">
                        <span className="size-4 shrink-0 [&_svg]:size-4">{provider.isPending(p.id) ? <Spinner /> : p.icon}</span>
                        <span className="truncate whitespace-nowrap">{p.name}</span>
                        {p.id === lastUsedProvider ? <span className="sr-only">, {t.lastUsed}</span> : null}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
              {provider.error ? (
                <p className={cn(fieldError, "mt-3")} role="alert">
                  {provider.error}
                </p>
              ) : null}
              {magicLinkHref ? (
                <WirefrontLink className={cn(buttonVariants({ size: "lg", variant: "outline" }), shown.length ? "mt-2.5" : "mt-6", "w-full")} href={magicLinkHref}>
                  <MailIcon />
                  {t.magicLink}
                </WirefrontLink>
              ) : null}
              {hasAlternatives ? (
                <div className="my-6 flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-[11px] text-muted-foreground">{t.or}</span>
                  <Separator className="flex-1" />
                </div>
              ) : (
                <div className="mt-6" />
              )}

              <Form className="flex flex-col gap-4" noValidate {...form.formProps}>
                <Field.Root className="flex flex-col gap-2" name="email">
                  <Field.Label className="font-medium text-sm leading-none">{t.email}</Field.Label>
                  <Input autoComplete="email" inputMode="email" placeholder={t.emailPlaceholder} type="email" />
                  <Field.Error className={fieldError} />
                </Field.Root>
                <Field.Root className="flex flex-col gap-2" name="password">
                  <Field.Label className="font-medium text-sm leading-none">{t.password}</Field.Label>
                  <InputGroup>
                    <InputGroupInput autoComplete="current-password" placeholder="••••••••" type={reveal ? "text" : "password"} />
                    <InputGroupAddon align="inline-end">
                      <button
                        aria-label={reveal ? t.hidePassword : t.showPassword}
                        aria-pressed={reveal}
                        className="cursor-pointer rounded p-1 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:p-2"
                        onClick={() => setReveal((v) => !v)}
                        type="button"
                      >
                        {reveal ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                      </button>
                    </InputGroupAddon>
                  </InputGroup>
                  <Field.Error className={fieldError} />
                </Field.Root>
                {form.formError ? (
                  <p className={fieldError} role="alert">
                    {form.formError}
                  </p>
                ) : null}
                <Button aria-busy={form.pending} className="mt-2" disabled={form.pending} size="lg" type="submit">
                  {form.pending ? <Spinner data-icon="inline-start" /> : null}
                  {t.submit}
                </Button>
              </Form>

              {signUpHref || forgotPasswordHref ? (
                <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 text-sm">
                  {signUpHref ? (
                    <p className="whitespace-nowrap text-muted-foreground">
                      {t.noAccount}{" "}
                      <WirefrontLink className="text-foreground underline underline-offset-4" href={signUpHref}>
                        {t.signUp}
                      </WirefrontLink>
                    </p>
                  ) : null}
                  {forgotPasswordHref ? (
                    <WirefrontLink className="whitespace-nowrap text-muted-foreground hover:text-foreground hover:underline" href={forgotPasswordHref}>
                      {t.forgotPassword}
                    </WirefrontLink>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InsetSignIn(props: InsetSignInProps) {
  return (
    <ScreenBoundary name="InsetSignIn">
      <InsetSignInScreen {...props} />
    </ScreenBoundary>
  );
}
