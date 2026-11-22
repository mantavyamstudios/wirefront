// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `money`).
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@wirefront/ui/input-group";
import { cn } from "@wirefront/ui/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@wirefront/ui/sheet";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
  useWirefront,
} from "@wirefront/ui/wirefront/provider";
import { type Action, fail } from "@wirefront/ui/wirefront/types";
import {
  ArrowDownLeftIcon,
  CheckIcon,
  CreditCardIcon,
  GoalIcon,
  HomeIcon,
  LayoutGridIcon,
  type LucideIcon,
  MenuIcon,
  PiggyBankIcon,
  ReceiptTextIcon,
  RepeatIcon,
  SearchIcon,
  ShoppingBagIcon,
  ShoppingBasketIcon,
  TicketIcon,
  TramFrontIcon,
  UtensilsIcon,
  WalletIcon,
  XIcon,
} from "lucide-react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import {
  type PointerEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  MoneyAccount,
  MoneyBill,
  MoneyBudget,
  MoneyCategory,
  MoneyTransaction,
} from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("money.<key>"). */
export const MONEY_MESSAGES = {
  cat_groceries: "Groceries",
  cat_dining: "Eating out",
  cat_transport: "Transport",
  cat_shopping: "Shopping",
  cat_home: "Home & bills",
  cat_fun: "Going out",
  cat_income: "Income",
  view_overview: "Overview",
  view_transactions: "Transactions",
  view_bills: "Bills",
  view_budgets: "Budgets",
  main: "Main",
  accounts: "Accounts",
  masked: "•• {mask}",
  navigation: "Navigation",
  openNavigation: "Open navigation",
  closeNavigation: "Close navigation",
  crumb: "/ {view}",
  allAccounts: "All accounts",
  balance: "Balance",
  account: "Account",
  totalBalance: "Total balance",
  cardBalance: "Card balance",
  accountBalance: "{name} balance",
  in30Days: "in 30 days",
  chartLabel: "Balance over the last 30 days",
  today: "Today",
  yesterday: "Yesterday",
  spendingIn: "Spending in {month}",
  tapToFilter: "Tap a category to filter",
  spent: "Spent",
  removeFilter: "Remove {category} filter",
  searchTransactions: "Search transactions",
  searchMerchants: "Search merchants",
  nothingMatches: "Nothing matches",
  nothingHint: "Try another merchant, or clear the filter.",
  clearSearch: "Clear search",
  txMeta: "{category} · {account} · {time}",
  daysToGo: "{n} days to go",
  evenPace: "Where you’d be at an even pace",
  upcomingBills: "Upcoming bills",
  due: "{amount} due",
  allPaid: "All paid",
  paidToday: "Paid today",
  dueToday: "Due today",
  tomorrow: "Tomorrow",
  inDays: "In {n} days",
  autopay: "Autopay",
  pay: "Pay",
  payName: "Pay {name}",
  paid: "Paid",
  paidName: "{name} paid",
  morning: "Morning, {name}",
  afternoon: "Afternoon, {name}",
  evening: "Evening, {name}",
  billsDueOne: "1 bill due in the next two weeks.",
  billsDue: "{n} bills due in the next two weeks.",
  nothingToPay: "Nothing left to pay this cycle.",
  txCountOne: "1 transaction",
  txCount: "{n} transactions",
  onAccount: " on {name}.",
  acrossAll: " across all accounts.",
  overviewLead:
    "{days} days left in {month}. You’ve spent {spent} and brought in {income}.",
  of: " of {limit}",
  overBy: ", {amount} over",
  leftBy: ", {amount} left",
  overBudget: "{amount} over budget",
  leftFast: "{amount} left · spending fast",
  left: "{amount} left",
};
type Messages = typeof MONEY_MESSAGES;
type MoneyView = "overview" | "transactions" | "bills" | "budgets";

export interface MoneyProps {
  productName: string;
  user: { name: string; plan?: string };
  accounts: MoneyAccount[];
  /** Newest first. */
  transactions: MoneyTransaction[];
  bills: MoneyBill[];
  budgets: MoneyBudget[];
  /** Pays a bill and returns the payment, which is added to the list and taken off its account. Pay buttons are hidden without it. */
  onPayBill?: Action<{ billId: string }, MoneyTransaction>;
  className?: string;
}

const spring = {
  type: "spring",
  stiffness: 520,
  damping: 46,
  mass: 1,
} as const;
const roll = { type: "spring", stiffness: 210, damping: 30, mass: 1 } as const;
const easeOut = [0.23, 1, 0.32, 1] as const;
const press =
  "transition-[color,background-color,box-shadow,scale,opacity] duration-150 ease-out active:scale-[0.97]";
const card = "rounded-2xl border bg-card shadow-xs/5";
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const DOTS = ["a", "b", "c"];
const VIEWS: MoneyView[] = ["overview", "transactions", "bills", "budgets"];
const SPEND_CATEGORIES: MoneyCategory[] = [
  "groceries",
  "dining",
  "transport",
  "shopping",
  "home",
  "fun",
];
const viewIcon: Record<MoneyView, LucideIcon> = {
  overview: LayoutGridIcon,
  transactions: ReceiptTextIcon,
  bills: RepeatIcon,
  budgets: GoalIcon,
};
const categoryStyle: Record<
  MoneyCategory,
  { icon: LucideIcon; tile: string; dot: string; stroke: string }
> = {
  groceries: {
    icon: ShoppingBasketIcon,
    tile: "bg-category-6/12 text-category-6-foreground",
    dot: "bg-category-6",
    stroke: "stroke-category-6",
  },
  dining: {
    icon: UtensilsIcon,
    tile: "bg-category-7/12 text-category-7-foreground",
    dot: "bg-category-7",
    stroke: "stroke-category-7",
  },
  transport: {
    icon: TramFrontIcon,
    tile: "bg-category-1/12 text-category-1-foreground",
    dot: "bg-category-1",
    stroke: "stroke-category-1",
  },
  shopping: {
    icon: ShoppingBagIcon,
    tile: "bg-category-5/12 text-category-5-foreground",
    dot: "bg-category-5",
    stroke: "stroke-category-5",
  },
  home: {
    icon: HomeIcon,
    tile: "bg-category-3/14 text-category-3-foreground",
    dot: "bg-category-3",
    stroke: "stroke-category-3",
  },
  fun: {
    icon: TicketIcon,
    tile: "bg-category-4/12 text-category-4-foreground",
    dot: "bg-category-4",
    stroke: "stroke-category-4",
  },
  income: {
    icon: ArrowDownLeftIcon,
    tile: "bg-success/12 text-success-foreground dark:bg-success/16",
    dot: "bg-success",
    stroke: "stroke-success",
  },
};
const accountIcons: Record<MoneyAccount["kind"], LucideIcon> = {
  checking: WalletIcon,
  savings: PiggyBankIcon,
  credit: CreditCardIcon,
};
const noPay: Action<{ billId: string }, MoneyTransaction> = async () => fail();

function initials(name: string) {
  const words = name
    .replace(/[^A-Za-zÀ-ÿ\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const [a, b] = words;
  return (
    a && b ? (a[0] ?? "") + (b[0] ?? "") : (a ?? "?").slice(0, 2)
  ).toUpperCase();
}
/** Whole days from one YYYY-MM-DD date to another. */
const daysBetween = (from: string, to: string) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000
  );

/** Money and dates in the provider's locale, currency and time zone. */
function useMoneyFormat() {
  const fmt = useFormat();
  const { timeZone } = useWirefront();
  return useMemo(
    () => ({
      money: (n: number) => fmt.money(n),
      money0: (n: number) =>
        fmt.money(Math.round(n), undefined, { maximumFractionDigits: 0 }),
      signed: (n: number) => `${n >= 0 ? "+" : "−"}${fmt.money(Math.abs(n))}`,
      /** YYYY-MM-DD for an instant, in the provider's time zone. */
      dayOf: (value: Date | string) =>
        new Intl.DateTimeFormat("en-CA", {
          timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(value)),
      /** Formats a YYYY-MM-DD calendar date without shifting it across time zones. */
      calendar: (day: string, options: Intl.DateTimeFormatOptions) =>
        fmt.date(`${day}T12:00:00Z`, { ...options, timeZone: "UTC" }),
    }),
    [fmt, timeZone]
  );
}

function Odometer({
  value,
  format,
}: {
  value: number;
  format: (n: number) => string;
}) {
  const text = format(value);
  const chars = text.split("");
  return (
    <span className="inline-flex items-center tabular-nums leading-none">
      <span className="sr-only">{text}</span>
      {chars.map((ch, i) => {
        const place = chars.length - i;
        return /\d/.test(ch) ? (
          <Digit digit={Number(ch)} key={`d${place}`} />
        ) : (
          <span
            aria-hidden
            className="flex h-[1.15em] items-center"
            key={`c${place}${ch}`}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}

function Digit({ digit }: { digit: number }) {
  const reduce = useReducedMotion();
  return (
    <span
      aria-hidden
      className="relative inline-flex h-[1.15em] items-center overflow-hidden mask-[linear-gradient(transparent,black_18%,black_82%,transparent)]"
    >
      <span className="invisible">{DIGITS[0]}</span>
      <motion.span
        animate={{ y: `${-digit * 1.15}em` }}
        className="absolute inset-x-0 top-0 flex flex-col items-center"
        initial={false}
        transition={reduce ? { duration: 0 } : roll}
      >
        {DIGITS.map((d) => (
          <span className="flex h-[1.15em] items-center" key={d}>
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

function Tween({
  value,
  format,
}: {
  value: number;
  format: (n: number) => string;
}) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const text = useTransform(mv, format);
  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      type: "spring",
      stiffness: 160,
      damping: 26,
    });
    return () => controls.stop();
  }, [value, reduce, mv]);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

function MerchantTile({
  merchant,
  category,
}: {
  merchant: string;
  category: MoneyCategory;
}) {
  const c = categoryStyle[category];
  const Icon = c.icon;
  return (
    <span aria-hidden className="relative shrink-0">
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-xl font-semibold text-[11px] tracking-wide",
          c.tile
        )}
      >
        {initials(merchant)}
      </span>
      <span className="absolute -inset-e-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-card text-muted-foreground ring-2 ring-card">
        <Icon className="size-2.5" />
      </span>
    </span>
  );
}

function PayButton({
  state,
  onPay,
  name,
  t,
}: {
  state?: "paying" | "paid";
  onPay: () => void;
  name: string;
  t: Messages;
}) {
  const reduce = useReducedMotion();
  return (
    <button
      aria-label={
        state === "paid"
          ? interpolate(t.paidName, { name })
          : interpolate(t.payName, { name })
      }
      className={cn(
        "relative -my-1 flex h-6 min-w-12 cursor-pointer items-center justify-center overflow-hidden rounded-full px-2 font-medium text-xs outline-none after:absolute after:-inset-x-1 after:-inset-y-2 after:content-[''] focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default",
        press,
        state === "paid"
          ? "text-success-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      )}
      disabled={Boolean(state)}
      onClick={onPay}
      type="button"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          className="flex items-center gap-1"
          exit={
            reduce ? { opacity: 0 } : { opacity: 0, y: -6, filter: "blur(2px)" }
          }
          initial={
            reduce ? { opacity: 0 } : { opacity: 0, y: 6, filter: "blur(2px)" }
          }
          key={state ?? "idle"}
          transition={{ duration: 0.18, ease: easeOut }}
        >
          {state === "paid" ? (
            <>
              <CheckIcon aria-hidden className="size-3" /> {t.paid}
            </>
          ) : state === "paying" ? (
            <span aria-hidden className="flex gap-0.5">
              {DOTS.map((d, i) => (
                <motion.span
                  animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }}
                  className="size-1 rounded-full bg-current"
                  key={d}
                  transition={{
                    duration: 0.8,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.12,
                    ease: "linear",
                  }}
                />
              ))}
            </span>
          ) : (
            t.pay
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

function BalanceChart({
  series,
  today,
  t,
}: {
  series: number[];
  today: string;
  t: Messages;
}) {
  const reduce = useReducedMotion();
  const mf = useMoneyFormat();
  const gid = `bal-${useId().replace(/:/g, "")}`;
  const [hover, setHover] = useState<number | null>(null);
  const W = 600;
  const H = 120;
  const pad = 10;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const last = Math.max(1, series.length - 1);
  const x = (i: number) => (i / last) * W;
  const y = (v: number) => pad + (1 - (v - min) / span) * (H - pad - 30);
  const line = series
    .map((v, i) => {
      const px = x(i).toFixed(1);
      const py = y(v).toFixed(1);
      if (!i) return `M${px} ${py}`;
      const cx = ((x(i - 1) + x(i)) / 2).toFixed(1);
      return `C${cx} ${y(series[i - 1] ?? v).toFixed(1)} ${cx} ${py} ${px} ${py}`;
    })
    .join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * last);
    setHover(Math.max(0, Math.min(last, i)));
  };
  const dateFor = (i: number) =>
    mf.calendar(
      new Date(Date.parse(`${today}T12:00:00Z`) - (last - i) * 86_400_000)
        .toISOString()
        .slice(0, 10),
      { month: "short", day: "numeric" }
    );
  const morph = reduce ? { duration: 0 } : { duration: 0.45, ease: easeOut };
  const hi = hover;
  const hiValue = hi === null ? undefined : series[hi];

  return (
    <div className="relative mt-4 h-36 text-foreground">
      <svg
        aria-label={t.chartLabel}
        className="absolute inset-0 size-full touch-pan-y overflow-visible"
        onPointerLeave={() => setHover(null)}
        onPointerMove={onMove}
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${W} ${H}`}
      >
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          animate={{ d: area }}
          fill={`url(#${gid})`}
          initial={false}
          transition={morph}
        />
        <motion.path
          animate={{ d: line }}
          fill="none"
          initial={false}
          stroke="currentColor"
          strokeLinejoin="round"
          strokeOpacity={0.8}
          strokeWidth={1.75}
          transition={morph}
          vectorEffect="non-scaling-stroke"
        />
        {hi !== null ? (
          <line
            stroke="currentColor"
            strokeDasharray="3 3"
            strokeOpacity={0.3}
            vectorEffect="non-scaling-stroke"
            x1={x(hi)}
            x2={x(hi)}
            y1={0}
            y2={H}
          />
        ) : null}
      </svg>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-4 bottom-2 flex justify-between text-[11px] text-muted-foreground tabular-nums @lg:inset-x-5"
      >
        <span>{dateFor(0)}</span>
        <span>{dateFor(Math.floor(last / 2))}</span>
        <span>{t.today}</span>
      </div>
      {hi !== null && hiValue !== undefined ? (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-2 ring-card"
            style={{
              left: `${(hi / last) * 100}%`,
              top: `${(y(hiValue) / H) * 100}%`,
            }}
          />
          <span
            className="pointer-events-none absolute top-1 rounded-md border bg-popover px-2 py-1 text-xs shadow-xs/5"
            style={{
              left: `clamp(0.5rem, calc(${(hi / last) * 100}% - 3.5rem), calc(100% - 7.5rem))`,
            }}
          >
            <span className="text-muted-foreground">{dateFor(hi)}</span>{" "}
            <span className="font-medium tabular-nums">
              {mf.money(hiValue)}
            </span>
          </span>
        </>
      ) : null}
    </div>
  );
}

function Donut({
  parts,
  total,
  focus,
  onFocus,
  t,
}: {
  parts: { cat: MoneyCategory; value: number }[];
  total: number;
  focus: MoneyCategory | null;
  onFocus: (c: MoneyCategory | null) => void;
  t: Messages;
}) {
  const reduce = useReducedMotion();
  const mf = useMoneyFormat();
  const gap = 1.4;
  let start = 0;
  const focused = parts.find((p) => p.cat === focus);
  return (
    <div className="relative size-40 shrink-0">
      <svg aria-hidden className="size-full -rotate-90" viewBox="0 0 120 120">
        <circle
          className="stroke-muted"
          cx="60"
          cy="60"
          fill="none"
          r="48"
          strokeWidth="14"
        />
        {parts.map((p) => {
          const pct = (p.value / (total || 1)) * 100;
          const dash = Math.max(pct - gap, 0.5);
          const offset = -start;
          start += pct;
          return (
            <motion.circle
              animate={{
                strokeDasharray: `${dash} ${100 - dash}`,
                strokeDashoffset: offset,
                opacity: !focus || focus === p.cat ? 1 : 0.3,
              }}
              className={categoryStyle[p.cat].stroke}
              cx="60"
              cy="60"
              fill="none"
              initial={false}
              key={p.cat}
              onPointerEnter={() => onFocus(p.cat)}
              onPointerLeave={() => onFocus(null)}
              pathLength={100}
              r="48"
              strokeWidth="14"
              style={{ pointerEvents: "stroke" }}
              transition={
                reduce ? { duration: 0 } : { duration: 0.35, ease: easeOut }
              }
            />
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-muted-foreground text-xs">
          {focused ? t[`cat_${focused.cat}`] : t.spent}
        </span>
        <span className="font-heading font-semibold text-lg tracking-tight">
          <Tween format={mf.money0} value={focused ? focused.value : total} />
        </span>
      </div>
    </div>
  );
}

function BudgetRow({
  category,
  spent,
  limit,
  pace,
  onPick,
  t,
}: {
  category: MoneyCategory;
  spent: number;
  limit: number;
  pace: number;
  onPick: () => void;
  t: Messages;
}) {
  const reduce = useReducedMotion();
  const mf = useMoneyFormat();
  const c = categoryStyle[category];
  const ratio = limit ? spent / limit : 0;
  const over = ratio > 1;
  const ahead = !over && ratio > pace + 0.08;
  const left = limit - spent;
  return (
    <button
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 text-start outline-none hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring",
        press
      )}
      onClick={onPick}
      type="button"
    >
      <span
        aria-hidden
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          c.tile
        )}
      >
        <c.icon className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-medium">{t[`cat_${category}`]}</span>
          <span className="shrink-0 text-xs tabular-nums">
            <span className="font-medium text-foreground">
              <Tween format={mf.money0} value={spent} />
            </span>
            <span className="text-muted-foreground">
              {interpolate(t.of, { limit: mf.money0(limit) })}
            </span>
            <span className="sr-only">
              {over
                ? interpolate(t.overBy, { amount: mf.money0(-left) })
                : interpolate(t.leftBy, { amount: mf.money0(left) })}
            </span>
          </span>
        </span>
        <span className="relative h-1.5 rounded-full bg-muted">
          <motion.span
            animate={{ scaleX: Math.min(ratio, 1) }}
            className={cn(
              "absolute inset-0 origin-left rounded-full rtl:origin-right",
              over ? "bg-destructive" : ahead ? "bg-warning" : c.dot
            )}
            initial={false}
            transition={
              reduce
                ? { duration: 0 }
                : { type: "spring", stiffness: 160, damping: 26 }
            }
          />
          <span
            aria-hidden
            className="absolute -top-1 -bottom-1 w-px bg-foreground/40"
            style={{ insetInlineStart: `${pace * 100}%` }}
          />
        </span>
        <span
          className={cn(
            "text-xs tabular-nums",
            over
              ? "text-destructive-foreground"
              : ahead
                ? "text-warning-foreground"
                : "text-muted-foreground"
          )}
        >
          {over
            ? interpolate(t.overBudget, { amount: mf.money0(-left) })
            : ahead
              ? interpolate(t.leftFast, { amount: mf.money0(left) })
              : interpolate(t.left, { amount: mf.money0(left) })}
        </span>
      </span>
    </button>
  );
}

function MoneyScreen({
  productName,
  user,
  accounts: initialAccounts,
  transactions: initialTransactions,
  bills,
  budgets,
  onPayBill,
  className,
}: MoneyProps) {
  const t = useMessages("money", MONEY_MESSAGES);
  const fmt = useFormat();
  const mf = useMoneyFormat();
  const { now, timeZone } = useWirefront();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [synced, setSynced] = useState({
    initialAccounts,
    initialTransactions,
  });
  if (
    synced.initialAccounts !== initialAccounts ||
    synced.initialTransactions !== initialTransactions
  ) {
    setSynced({ initialAccounts, initialTransactions });
    setAccounts(initialAccounts);
    setTransactions(initialTransactions);
  }
  const [accountId, setAccountId] = useState<string>("all");
  const [focusCat, setFocusCat] = useState<MoneyCategory | null>(null);
  const [filterCat, setFilterCat] = useState<MoneyCategory | null>(null);
  const [query, setQuery] = useState("");
  const [paid, setPaid] = useState<Record<string, true>>({});
  const [drawer, setDrawer] = useState(false);
  const [view, setView] = useState<MoneyView>("overview");
  const [switched, setSwitched] = useState(false);
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const listRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const nowDate = now();
  const today = mf.dayOf(nowDate);
  const [year, monthNum, dayNum] = today.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const month = today.slice(0, 7);
  const monthName = mf.calendar(today, { month: "long" });
  const monthEnd = new Date(Date.UTC(year, monthNum, 0)).getUTCDate();
  const daysLeft = monthEnd - dayNum;
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hourCycle: "h23",
    }).format(nowDate)
  );
  const firstName = user.name.split(" ")[0] ?? user.name;
  const greeting = interpolate(
    hour < 12 ? t.morning : hour < 17 ? t.afternoon : t.evening,
    { name: firstName }
  );

  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const selected = accounts.find((a) => a.id === accountId);
  const shown = selected ? selected.balance : total;
  const series = useMemo(() => {
    // Each account's history ends at its current balance, so a payment moves today's point.
    const per = accounts.map((a) => {
      const h = a.history?.length ? [...a.history] : [a.balance, a.balance];
      h[h.length - 1] = a.balance;
      return h;
    });
    if (selected) return per[accounts.indexOf(selected)] ?? [];
    const len = Math.max(0, ...per.map((p) => p.length));
    return Array.from({ length: len }, (_, i) =>
      per.reduce((s, p) => s + (p[i - (len - p.length)] ?? p[0] ?? 0), 0)
    );
  }, [accounts, selected]);
  const since = shown - (series[0] ?? shown);

  const monthTx = transactions.filter((x) =>
    mf.dayOf(x.postedAt).startsWith(month)
  );
  const spendBy = (cat: MoneyCategory) =>
    monthTx
      .filter((x) => x.category === cat && x.amount < 0)
      .reduce((s, x) => s - x.amount, 0);
  const spendCats = SPEND_CATEGORIES.map((c) => ({ cat: c, value: spendBy(c) }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
  const spent = spendCats.reduce((s, c) => s + c.value, 0);
  const income = monthTx
    .filter((x) => x.amount > 0)
    .reduce((s, x) => s + x.amount, 0);

  const isPaid = (b: MoneyBill) => Boolean(b.paid || paid[b.id]);
  const openBills = bills.filter((b) => !isPaid(b));
  const dueTotal = openBills.reduce((s, b) => s + b.amount, 0);
  const pay = useAction(onPayBill ?? noPay, {
    onSuccess: (payment, { billId }) => {
      setPaid((p) => ({ ...p, [billId]: true }));
      setAccounts((all) =>
        all.map((a) =>
          a.id === payment.accountId
            ? { ...a, balance: a.balance + payment.amount }
            : a
        )
      );
      setTransactions((all) => [
        payment,
        ...all.filter((x) => x.id !== payment.id),
      ]);
    },
  });

  const q = query.trim().toLowerCase();
  const visibleTx = transactions.filter(
    (x) =>
      (!filterCat || x.category === filterCat) &&
      (!selected || x.accountId === selected.id) &&
      (!q ||
        x.merchant.toLowerCase().includes(q) ||
        t[`cat_${x.category}`].toLowerCase().includes(q))
  );
  const groups: { date: string; items: MoneyTransaction[] }[] = [];
  for (const x of visibleTx) {
    const day = mf.dayOf(x.postedAt);
    const g = groups.at(-1);
    if (g && g.date === day) g.items.push(x);
    else groups.push({ date: day, items: [x] });
  }
  const dayLabel = (day: string) => {
    const d = daysBetween(day, today);
    return d === 0
      ? t.today
      : d === 1
        ? t.yesterday
        : mf.calendar(day, {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
  };

  const scrollTo = (el: HTMLElement | null) => {
    const root = scrollRef.current;
    if (!root || !el) return;
    const top =
      el.getBoundingClientRect().top -
      root.getBoundingClientRect().top +
      root.scrollTop -
      16;
    root.scrollTo?.({ top, behavior: reduce ? "auto" : "smooth" });
  };
  const go = (next: MoneyView) => {
    setDrawer(false);
    if (next === view) {
      scrollRef.current?.scrollTo?.({
        top: 0,
        behavior: reduce ? "auto" : "smooth",
      });
      return;
    }
    setSwitched(true);
    setView(next);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };
  const pickCategory = (cat: MoneyCategory) => {
    setFilterCat((c) => (c === cat && view !== "budgets" ? null : cat));
    if (view === "budgets") {
      setSwitched(true);
      setView("transactions");
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    } else if (view === "overview") scrollTo(listRef.current);
  };

  const sidebar = (where: "rail" | "drawer") => (
    <div className="flex h-full flex-col gap-6 p-3">
      <div className="flex items-center gap-2.5 px-1.5 pt-1">
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
        >
          <PiggyBankIcon className="size-4" />
        </span>
        <span className="font-heading font-semibold">{productName}</span>
      </div>
      <nav aria-label={t.main} className="isolate flex flex-col gap-0.5">
        {VIEWS.map((v) => {
          const active = v === view;
          const Icon = viewIcon[v];
          const badge = v === "bills" ? openBills.length : 0;
          return (
            <button
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-8 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4 [&_svg]:opacity-80",
                press,
                active
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
              key={v}
              onClick={() => go(v)}
              type="button"
            >
              {active ? (
                <motion.span
                  className="absolute inset-0 -z-10 rounded-lg bg-accent"
                  layoutId={`${uid}-${where}-nav`}
                  transition={reduce ? { duration: 0 } : spring}
                />
              ) : null}
              <Icon aria-hidden />
              <span className="flex-1">{t[`view_${v}`]}</span>
              {badge ? (
                <Badge
                  className="h-4.5 rounded-sm px-1 text-[0.625rem] tabular-nums"
                  variant="secondary"
                >
                  {badge}
                </Badge>
              ) : null}
            </button>
          );
        })}
      </nav>
      <div className="isolate flex flex-col gap-1">
        <span className="px-2.5 font-medium text-muted-foreground text-xs">
          {t.accounts}
        </span>
        {accounts.map((a) => {
          const Icon = accountIcons[a.kind];
          const active = a.id === accountId;
          return (
            <button
              aria-pressed={active}
              className={cn(
                "relative flex h-11 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring",
                press,
                !active && "hover:bg-accent/60"
              )}
              key={a.id}
              onClick={() => {
                setAccountId(active ? "all" : a.id);
                setDrawer(false);
              }}
              type="button"
            >
              {active ? (
                <motion.span
                  className="absolute inset-0 -z-10 rounded-lg bg-accent"
                  layoutId={`${uid}-${where}-account`}
                  transition={reduce ? { duration: 0 } : spring}
                />
              ) : null}
              <Icon
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className={cn("truncate", active && "font-medium")}>
                  {a.name}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {interpolate(t.masked, { mask: a.mask })}
                </span>
              </span>
              <span
                className={cn(
                  "text-xs",
                  a.balance < 0 ? "text-muted-foreground" : "text-foreground"
                )}
              >
                <Tween format={mf.money} value={a.balance} />
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-auto flex items-center gap-2.5 rounded-xl border bg-card p-2.5">
        <Avatar aria-hidden className="[--avatar-size:--spacing(7)]">
          <AvatarFallback className="bg-category-6/20">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-xs">{user.name}</span>
          {user.plan ? (
            <span className="text-muted-foreground text-xs">{user.plan}</span>
          ) : null}
        </div>
      </div>
    </div>
  );

  const pills = [
    { id: "all", name: t.allAccounts },
    ...accounts.map((a) => ({ id: a.id, name: a.name })),
  ];

  const balanceSection = (
    <section
      aria-label={t.balance}
      className={cn(card, "order-1 overflow-hidden")}
    >
      <div className="flex flex-col gap-4 p-4 pb-0 @lg:p-5 @lg:pb-0">
        <fieldset className="-mx-4 isolate m-0 flex min-w-0 gap-1 overflow-x-auto border-0 p-0 px-4 scrollbar-none @lg:-mx-5 @lg:px-5">
          <legend className="sr-only">{t.account}</legend>
          {pills.map((p) => {
            const active = p.id === accountId;
            return (
              <button
                aria-pressed={active}
                className={cn(
                  "relative h-7 shrink-0 cursor-pointer rounded-full px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  press,
                  active
                    ? "font-medium text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                key={p.id}
                onClick={() => setAccountId(p.id)}
                type="button"
              >
                {active ? (
                  <motion.span
                    className="absolute inset-0 -z-10 rounded-full bg-primary"
                    layoutId={`${uid}-pill`}
                    transition={reduce ? { duration: 0 } : spring}
                  />
                ) : null}
                {p.name}
              </button>
            );
          })}
        </fieldset>
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">
              {selected
                ? selected.kind === "credit"
                  ? t.cardBalance
                  : interpolate(t.accountBalance, { name: selected.name })
                : t.totalBalance}
            </span>
            <span className="font-heading font-semibold text-[2.5rem] tracking-tight @lg:text-5xl">
              <Odometer format={mf.money} value={shown} />
            </span>
          </div>
          <Badge
            className={cn(
              since >= 0
                ? "bg-success/8 text-success-foreground dark:bg-success/16"
                : "bg-destructive/8 text-destructive-foreground dark:bg-destructive/16",
              "mb-1.5 h-6 px-2.5 text-sm"
            )}
            variant="secondary"
          >
            <Tween format={mf.signed} value={since} />
            <span className="font-normal">{t.in30Days}</span>
          </Badge>
        </div>
      </div>
      {series.length > 1 ? (
        <BalanceChart series={series} t={t} today={today} />
      ) : null}
    </section>
  );

  const spendingSection = (
    <section
      aria-labelledby={`${uid}-spend`}
      className={cn(card, "order-4 p-4 @lg:p-5")}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-medium" id={`${uid}-spend`}>
          {interpolate(t.spendingIn, { month: monthName })}
        </h3>
        <span className="text-muted-foreground text-xs">{t.tapToFilter}</span>
      </div>
      <div className="mt-4 flex flex-col items-center gap-5 @lg:flex-row @lg:items-center @lg:gap-6">
        <Donut
          focus={focusCat ?? filterCat}
          onFocus={setFocusCat}
          parts={spendCats}
          t={t}
          total={spent}
        />
        <ul className="flex w-full min-w-0 flex-1 flex-col gap-0.5">
          {spendCats.map((s) => {
            const active = filterCat === s.cat;
            return (
              <li key={s.cat}>
                <button
                  aria-pressed={active}
                  className={cn(
                    "flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    press,
                    active ? "bg-accent" : "hover:bg-accent/60"
                  )}
                  onBlur={() => setFocusCat(null)}
                  onClick={() => pickCategory(s.cat)}
                  onFocus={() => setFocusCat(s.cat)}
                  onPointerEnter={() => setFocusCat(s.cat)}
                  onPointerLeave={() => setFocusCat(null)}
                  type="button"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      categoryStyle[s.cat].dot
                    )}
                  />
                  <span className="flex-1 truncate">{t[`cat_${s.cat}`]}</span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {fmt.number(spent ? s.value / spent : 0, {
                      style: "percent",
                    })}
                  </span>
                  <span className="w-19 text-end font-medium tabular-nums">
                    <Tween format={mf.money} value={s.value} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );

  const txSection = (
    <section
      aria-labelledby={`${uid}-tx`}
      className={cn(card, "order-5 overflow-hidden")}
      ref={listRef}
    >
      <div className="flex flex-col gap-3 border-b p-4 @lg:flex-row @lg:items-center @lg:px-5">
        <div className="flex flex-1 items-center gap-2">
          <h3 className="font-medium" id={`${uid}-tx`}>
            {t.view_transactions}
          </h3>
          <AnimatePresence initial={false}>
            {filterCat ? (
              <motion.button
                animate={{ opacity: 1, scale: 1 }}
                aria-label={interpolate(t.removeFilter, {
                  category: t[`cat_${filterCat}`],
                })}
                className={cn(
                  "relative flex h-6 cursor-pointer items-center gap-1.5 rounded-full border bg-background ps-2 pe-1.5 text-xs outline-none after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-[''] focus-visible:ring-2 focus-visible:ring-ring",
                  press
                )}
                exit={{ opacity: 0, scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.95 }}
                onClick={() => setFilterCat(null)}
                transition={{ duration: 0.15, ease: easeOut }}
                type="button"
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 rounded-full",
                    categoryStyle[filterCat].dot
                  )}
                />
                {t[`cat_${filterCat}`]}
                <XIcon aria-hidden className="size-3 text-muted-foreground" />
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>
        <InputGroup className="@lg:w-56">
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            aria-label={t.searchTransactions}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchMerchants}
            type="search"
            value={query}
          />
        </InputGroup>
      </div>
      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <span
            aria-hidden
            className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <SearchIcon className="size-4" />
          </span>
          <p className="font-medium">{t.nothingMatches}</p>
          <p className="text-muted-foreground">{t.nothingHint}</p>
          <Button
            className={cn("mt-1", press)}
            onClick={() => {
              setQuery("");
              setFilterCat(null);
            }}
            size="sm"
            variant="outline"
          >
            {t.clearSearch}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col pb-2">
          {groups.map((g) => {
            const net = g.items.reduce((s, x) => s + x.amount, 0);
            return (
              <div key={g.date}>
                <div className="flex items-center justify-between px-4 pt-4 pb-1.5 text-muted-foreground text-xs @lg:px-5">
                  <span className="font-medium">{dayLabel(g.date)}</span>
                  <span className="tabular-nums">{mf.signed(net)}</span>
                </div>
                <ul>
                  <AnimatePresence initial={false}>
                    {g.items.map((x) => {
                      const acct = accounts.find((a) => a.id === x.accountId);
                      return (
                        <motion.li
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 px-4 py-2 @lg:px-5"
                          initial={
                            reduce ? { opacity: 0 } : { opacity: 0, y: -8 }
                          }
                          key={x.id}
                          layout={reduce ? false : "position"}
                          transition={spring}
                        >
                          <MerchantTile
                            category={x.category}
                            merchant={x.merchant}
                          />
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate font-medium">
                              {x.merchant}
                            </span>
                            <span className="truncate text-muted-foreground text-xs">
                              {interpolate(t.txMeta, {
                                category: t[`cat_${x.category}`],
                                account: acct?.name ?? "",
                                time: fmt.time(x.postedAt),
                              })}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 font-medium tabular-nums",
                              x.amount > 0 && "text-success-foreground"
                            )}
                          >
                            {mf.signed(x.amount)}
                          </span>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  const budgetsSection = (
    <section
      aria-labelledby={`${uid}-budgets`}
      className={cn(card, "order-2 p-4 @lg:p-5")}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-medium" id={`${uid}-budgets`}>
          {t.view_budgets}
        </h3>
        <span className="text-muted-foreground text-xs">
          {interpolate(t.daysToGo, { n: daysLeft })}
        </span>
      </div>
      <ul className="-mx-2 mt-2 flex flex-col">
        {budgets.map((b) => (
          <li key={b.category}>
            <BudgetRow
              category={b.category}
              limit={b.limit}
              onPick={() => pickCategory(b.category)}
              pace={(monthEnd - daysLeft) / monthEnd}
              spent={spendBy(b.category)}
              t={t}
            />
          </li>
        ))}
      </ul>
      <p className="mt-2 flex items-center gap-1.5 text-muted-foreground text-xs">
        <span aria-hidden className="h-2.5 w-px bg-foreground/40" />
        {t.evenPace}
      </p>
    </section>
  );

  const billsSection = (
    <section
      aria-labelledby={`${uid}-bills`}
      className={cn(card, "order-3 overflow-hidden")}
    >
      <div className="flex items-baseline justify-between gap-3 p-4 pb-2 @lg:px-5 @lg:pt-5">
        <h3 className="font-medium" id={`${uid}-bills`}>
          {t.upcomingBills}
        </h3>
        <span className="text-muted-foreground text-xs">
          {openBills.length
            ? interpolate(t.due, { amount: mf.money(dueTotal) })
            : t.allPaid}
        </span>
      </div>
      {pay.error ? (
        <p className="px-4 pb-2 text-destructive text-xs @lg:px-5" role="alert">
          {pay.error}
        </p>
      ) : null}
      <ul className="flex flex-col pb-2">
        {bills.map((b) => {
          const done = isPaid(b);
          const state = done
            ? "paid"
            : pay.isPending(b.id)
              ? "paying"
              : undefined;
          const d = daysBetween(today, b.due);
          return (
            <li
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 transition-opacity duration-200 @lg:px-5",
                done && "opacity-60"
              )}
              key={b.id}
            >
              <span
                aria-hidden
                className="flex w-10 shrink-0 flex-col items-center rounded-lg border bg-background py-1 leading-none"
              >
                <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
                  {mf.calendar(b.due, { month: "short" })}
                </span>
                <span className="mt-1 font-semibold tabular-nums">
                  {mf.calendar(b.due, { day: "numeric" })}
                </span>
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{b.name}</span>
                <span className="flex items-center gap-1 truncate text-muted-foreground text-xs">
                  <span
                    className={cn(d <= 2 && !done && "text-warning-foreground")}
                  >
                    {done
                      ? t.paidToday
                      : d <= 0
                        ? t.dueToday
                        : d === 1
                          ? t.tomorrow
                          : interpolate(t.inDays, { n: d })}
                  </span>
                  {b.autopay && !done ? (
                    <>
                      <span aria-hidden>·</span>
                      <RepeatIcon aria-hidden className="size-3" /> {t.autopay}
                    </>
                  ) : null}
                </span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="font-medium tabular-nums">
                  {mf.money(b.amount)}
                </span>
                {onPayBill ? (
                  <PayButton
                    name={b.name}
                    onPay={() => pay.run({ billId: b.id }, b.id)}
                    state={state}
                    t={t}
                  />
                ) : done ? (
                  <span className="font-medium text-success-foreground text-xs">
                    {t.paid}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );

  const lead =
    view === "bills"
      ? openBills.length === 1
        ? t.billsDueOne
        : openBills.length
          ? interpolate(t.billsDue, { n: openBills.length })
          : t.nothingToPay
      : view === "transactions"
        ? `${visibleTx.length === 1 ? t.txCountOne : interpolate(t.txCount, { n: visibleTx.length })}${selected ? interpolate(t.onAccount, { name: selected.name }) : t.acrossAll}`
        : null;
  const [leadBefore = "", leadMiddle = "", leadAfter = ""] = interpolate(
    t.overviewLead,
    { days: daysLeft, month: monthName, spent: "\u0000", income: "\u0000" }
  ).split("\u0000");

  return (
    <div
      className={cn(
        "@container relative isolate flex h-svh w-full overflow-hidden bg-background text-foreground text-sm",
        className
      )}
    >
      <aside className="hidden w-60 shrink-0 border-e bg-muted/40 @4xl:block">
        {sidebar("rail")}
      </aside>

      <Sheet onOpenChange={setDrawer} open={drawer}>
        <SheetContent
          className="w-72 max-w-[85%] gap-0 p-0"
          showCloseButton={false}
          side="left"
        >
          <SheetTitle className="sr-only">{t.navigation}</SheetTitle>
          <Button
            aria-label={t.closeNavigation}
            className="absolute inset-e-3 top-3"
            onClick={() => setDrawer(false)}
            size="icon-sm"
            variant="ghost"
          >
            <XIcon />
          </Button>
          {sidebar("drawer")}
        </SheetContent>
      </Sheet>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3 @4xl:hidden">
          <Button
            aria-label={t.openNavigation}
            onClick={() => setDrawer(true)}
            size="icon-sm"
            variant="ghost"
          >
            <MenuIcon />
          </Button>
          <span className="font-heading font-semibold">{productName}</span>
          <span className="truncate text-muted-foreground">
            {interpolate(t.crumb, { view: t[`view_${view}`] })}
          </span>
          <Avatar aria-hidden className="ms-auto [--avatar-size:--spacing(7)]">
            <AvatarFallback className="bg-category-6/20 text-xs">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto" ref={scrollRef}>
          <motion.div
            animate={{ opacity: 1 }}
            className="flex flex-col gap-5 px-4 pt-5 pb-10 @4xl:px-6 @4xl:pt-6"
            initial={switched && !reduce ? { opacity: 0 } : false}
            key={view}
            transition={{ duration: 0.15, ease: easeOut }}
          >
            <div className="flex flex-col gap-1">
              <h2 className="text-balance font-heading font-semibold text-xl tracking-tight">
                {view === "overview" ? greeting : t[`view_${view}`]}
              </h2>
              <p className="text-pretty text-muted-foreground">
                {lead ?? (
                  <>
                    {leadBefore}
                    <span className="text-foreground">
                      <Tween format={mf.money0} value={spent} />
                    </span>
                    {leadMiddle}
                    <span className="text-foreground">
                      <Tween format={mf.money0} value={income} />
                    </span>
                    {leadAfter}
                  </>
                )}
              </p>
            </div>

            {view === "overview" ? (
              <div className="flex flex-col gap-4 @5xl:grid @5xl:grid-cols-[minmax(0,1fr)_minmax(0,320px)] @5xl:items-start @5xl:gap-5">
                <div className="contents @5xl:flex @5xl:flex-col @5xl:gap-5">
                  {balanceSection}
                  {spendingSection}
                  {txSection}
                </div>
                <div className="contents @5xl:flex @5xl:flex-col @5xl:gap-5">
                  {budgetsSection}
                  {billsSection}
                </div>
              </div>
            ) : view === "transactions" ? (
              <div className="flex max-w-3xl flex-col gap-4">{txSection}</div>
            ) : view === "bills" ? (
              <div className="flex max-w-xl flex-col gap-4">{billsSection}</div>
            ) : (
              <div className="flex max-w-3xl flex-col gap-4">
                {budgetsSection}
                {spendingSection}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function Money(props: MoneyProps) {
  return (
    <ScreenBoundary name="Money">
      <MoneyScreen {...props} />
    </ScreenBoundary>
  );
}
