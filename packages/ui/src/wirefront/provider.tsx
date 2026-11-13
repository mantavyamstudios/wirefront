// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

/**
 * WirefrontProvider adapts every Wirefront screen to the builder's app in one
 * place: their router's link, their toast, locale and time zone, copy
 * overrides, permissions and colour scheme. Screens never import a router,
 * toast library or i18n library themselves.
 *
 * Every setting is optional and every hook works without a provider, so a
 * screen renders out of the box and the builder adds the provider when they
 * wire it up:
 *
 *   <WirefrontProvider link={NextLink} toast={toast} locale="en-IN" timeZone="Asia/Kolkata" currency="INR">
 *     <App />
 *   </WirefrontProvider>
 */
import {
  type AnchorHTMLAttributes,
  type ComponentType,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type LinkComponent = ComponentType<AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>;

export interface ToastInput {
  title: string;
  description?: string;
  variant?: "default" | "success" | "error";
}

export interface WirefrontConfig {
  /** The app's link component (Next.js Link, TanStack Router Link, …). Defaults to <a>. */
  link?: LinkComponent;
  /** Show a toast with the app's toast system. Defaults to doing nothing. */
  toast?: (toast: ToastInput) => void;
  /** BCP 47 locale for dates and numbers. Defaults to "en-US". */
  locale?: string;
  /**
   * IANA time zone for dates. Defaults to "UTC", so the server and the
   * browser format the same text (no hydration mismatch); set the user's zone.
   */
  timeZone?: string;
  /** ISO 4217 currency for money. Defaults to "USD". */
  currency?: string;
  /** Copy overrides, keyed "<screen>.<key>", e.g. { "membersTable.invite": "Add people" }. */
  messages?: Record<string, string>;
  /** Permission check. Screens hide or disable what's not allowed. Defaults to allowing everything. */
  can?: (action: string, resource?: string) => boolean;
  /** Current time, for relative dates. Defaults to the system clock. */
  now?: () => Date;
  /**
   * The app's colour scheme. When unset, screens follow the `dark` class on
   * <html> (the convention of shadcn/ui, next-themes and Tailwind).
   */
  colorScheme?: "light" | "dark";
  /**
   * Report a screen that crashed while rendering (send it to Sentry, your logs, …). The screen shows a
   * retry fallback instead of taking the page down; React still logs the error to the console.
   */
  onError?: (error: Error, info: { screen: string; componentStack?: string }) => void;
}

const Context = createContext<WirefrontConfig>({});

export function WirefrontProvider({ children, ...config }: WirefrontConfig & { children: ReactNode }) {
  // Nested providers inherit and override their parent's settings.
  const parent = useContext(Context);
  return <Context.Provider value={{ ...parent, ...config }}>{children}</Context.Provider>;
}

export const DEFAULTS = {
  locale: "en-US",
  timeZone: "UTC",
  currency: "USD",
} as const;

// Module-level, so the defaults keep the same identity across renders and
// effects that depend on them don't re-run (or loop) every render.
const systemNow = () => new Date();
const noToast = () => {};
const allowAll = () => true;

/** The provider's settings with defaults applied. */
export function useWirefront() {
  const config = useContext(Context);
  return {
    ...config,
    locale: config.locale ?? DEFAULTS.locale,
    timeZone: config.timeZone ?? DEFAULTS.timeZone,
    currency: config.currency ?? DEFAULTS.currency,
    toast: config.toast ?? noToast,
    can: config.can ?? allowAll,
    now: config.now ?? systemNow,
  };
}

/** The app's link, or a plain <a> when none is configured. */
export function WirefrontLink(props: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const { link: Link } = useContext(Context);
  return Link ? <Link {...props} /> : <a {...props} />;
}

/** Locale- and time-zone-aware formatters from the provider. */
export function useFormat() {
  const { locale, timeZone, currency, now } = useWirefront();
  return useMemo(() => {
    const number = (value: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale, options).format(value);
    const money = (value: number, code: string = currency, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(locale, { style: "currency", currency: code, ...options }).format(value);
    const date = (value: Date | string | number, options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) =>
      new Intl.DateTimeFormat(locale, { timeZone, ...options }).format(new Date(value));
    const time = (value: Date | string | number, options: Intl.DateTimeFormatOptions = { timeStyle: "short" }) =>
      new Intl.DateTimeFormat(locale, { timeZone, ...options }).format(new Date(value));
    const relative = (value: Date | string | number) => {
      const seconds = Math.round((new Date(value).getTime() - now().getTime()) / 1000);
      const units: [Intl.RelativeTimeFormatUnit, number][] = [
        ["year", 31_536_000],
        ["month", 2_592_000],
        ["week", 604_800],
        ["day", 86_400],
        ["hour", 3_600],
        ["minute", 60],
      ];
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
      for (const [unit, size] of units) if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
      return rtf.format(seconds, "second");
    };
    return { number, money, date, time, relative };
  }, [locale, timeZone, currency, now]);
}

/** Replace {name} placeholders. */
export function interpolate(template: string, values: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/**
 * A screen's copy, with the builder's overrides applied. Pass the screen's
 * English defaults and its namespace; overrides are keyed "<namespace>.<key>".
 */
export function useMessages<Messages extends Record<string, string>>(namespace: string, defaults: Messages): Messages {
  const { messages } = useContext(Context);
  return useMemo(() => {
    if (!messages) return defaults;
    const out = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof Messages & string)[]) {
      const override = messages[`${namespace}.${key}`];
      if (override !== undefined) out[key] = override as Messages[typeof key];
    }
    return out;
  }, [messages, namespace, defaults]);
}

/** The permission check from the provider (allows everything by default). */
export function useCan() {
  return useWirefront().can;
}

/**
 * The colour scheme: the provider's `colorScheme`, or else the `dark` class on
 * <html>, followed live. Renders "light" on the server and the first client
 * render, so hydration always matches, then updates.
 */
export function useColorScheme(): "light" | "dark" {
  const { colorScheme } = useContext(Context);
  const [fromClass, setFromClass] = useState<"light" | "dark">("light");
  useEffect(() => {
    if (colorScheme) return;
    const root = document.documentElement;
    const read = () => setFromClass(root.classList.contains("dark") ? "dark" : "light");
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [colorScheme]);
  return colorScheme ?? fromClass;
}
