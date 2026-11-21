"use client";

/*
 * Tap sound for the preview controls: a synthesized "goo drop" (Web Audio, no
 * audio files). Ported from devl.dev (src/lib/sound.ts), MIT © 2026 Sean
 * Brydon; see LICENSE.md.
 */
import { useSyncExternalStore } from "react";

const KEY = "eup:sound";
const listeners = new Set<() => void>();
let context: AudioContext | null = null;

const read = () => {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
};

export const setSoundEnabled = (enabled: boolean) => {
  try {
    localStorage.setItem(KEY, enabled ? "on" : "off");
  } catch {
    // Storage blocked: the choice lasts for this page only.
  }
  for (const listener of listeners) {
    listener();
  }
};

export const useSoundEnabled = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    read,
    () => false
  );

const drop = (
  ctx: AudioContext,
  at: number,
  from: number,
  to: number,
  length: number,
  peak: number
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = "sine";
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + length);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(filter).connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + length + 0.02);
};

const resumeAudio = async (audio: AudioContext) => {
  try {
    await audio.resume();
  } catch (error) {
    console.warn(
      "[sound] couldn't resume audio; this click plays silently",
      error
    );
  }
};

export const playTap = () => {
  if (typeof window === "undefined" || !read()) {
    return;
  }
  context ??= new AudioContext();
  if (context.state === "suspended") {
    resumeAudio(context);
  }
  const now = context.currentTime;
  const base = 420;
  drop(context, now, base * 1.35, base * 0.7, 0.09, 0.07);
  drop(context, now + 0.035, base * 2.1, base * 1.5, 0.05, 0.025);
};

/**
 * `onClickCapture` for a group of controls: taps on any enabled button, link
 * or tab inside play the sound. Controls marked `data-no-tap-sound` (the
 * sound toggle itself) are skipped.
 */
export const playTapOnControl = (event: React.MouseEvent) => {
  const control = (event.target as Element).closest<HTMLElement>(
    "button, a, [role=tab]"
  );
  if (
    !control ||
    Object.hasOwn(control.dataset, "noTapSound") ||
    control.matches(":disabled, [aria-disabled=true]")
  ) {
    return;
  }
  playTap();
};
