// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `checkout`).
"use client";

import { Button } from "@wirefront/ui/button";
import { Checkbox } from "@wirefront/ui/checkbox";
import { Input } from "@wirefront/ui/input";
import { Label } from "@wirefront/ui/label";
import { cn } from "@wirefront/ui/lib/utils";
import { RadioGroup, RadioGroupItem } from "@wirefront/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@wirefront/ui/select";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import { type Action, fail } from "@wirefront/ui/wirefront/types";
import { CheckIcon, ChevronDownIcon, LockIcon, MinusIcon, NfcIcon, PackageIcon, PlusIcon, RabbitIcon, TagIcon, TruckIcon, Undo2Icon, XIcon, ZapIcon } from "lucide-react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { type ComponentProps, type ReactNode, type SubmitEvent, useEffect, useId, useRef, useState } from "react";
import type { CheckoutArt, CheckoutCountry, CheckoutItem, CheckoutShipping, PlaceOrder, Promo } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("checkout.<key>"). */
export const CHECKOUT_MESSAGES = {
  step_0: "Contact",
  step_1: "Shipping address",
  step_2: "Delivery",
  step_3: "Payment",
  emailRequired: "Enter your email so we can send the receipt.",
  emailInvalid: "That email looks incomplete.",
  required: "Required",
  streetRequired: "Enter a street address.",
  pickRegion: "Pick a {region}.",
  cardRequired: "Enter a card number.",
  cardInvalid: "That number doesn’t look right.",
  expiryFormat: "Use MM / YY",
  expired: "This card has expired.",
  cvcFormat: "3 or 4 digits",
  optional: "Optional",
  email: "Email",
  emailPlaceholder: "you@example.com",
  newsletter: "Send me the occasional note about new pieces",
  toShipping: "Continue to shipping",
  country: "Country",
  firstName: "First name",
  lastName: "Last name",
  address: "Address",
  addressPlaceholder: "Street and number",
  address2: "Apartment, suite",
  city: "City",
  select: "Select",
  toDelivery: "Continue to delivery",
  deliverySpeed: "Delivery speed",
  free: "Free",
  toPayment: "Continue to payment",
  testMode: "Test mode",
  testHint: "No real charge. Use any future date and any CVC.",
  fillTestCard: "Fill test card",
  cardNumber: "Card number",
  cardPlaceholder: "1234 1234 1234 1234",
  expiry: "Expiry",
  expiryPlaceholder: "MM / YY",
  cvc: "CVC",
  cvcPlaceholder: "123",
  nameOnCard: "Name on card",
  sameBilling: "Billing address is the same as shipping",
  pay: "Pay {amount}",
  payLabel: "Pay",
  fewer: "One fewer {name}",
  more: "One more {name}",
  removeCode: "Remove code {code}",
  percentOff: "{percent} off your order",
  discountCode: "Discount code",
  apply: "Apply",
  subtotal: "Subtotal · {count} items",
  discount: "Discount",
  minus: "−{amount}",
  shipping: "Shipping",
  nextStep: "Next step",
  tax: "Estimated tax",
  total: "Total",
  returns: "Free returns within 30 days of delivery.",
  secure: "Secure checkout",
  showSummary: "Show order summary",
  hideSummary: "Hide order summary",
  checkout: "Checkout",
  stepOf: "Step {n} of 4 · {name}",
  edit: "Edit",
  edit_0: "Edit contact",
  edit_1: "Edit shipping address",
  edit_2: "Edit delivery",
  edit_3: "Edit payment",
  encrypted: "Payments are encrypted and processed securely.",
  orderSummary: "Order summary",
  shipSummary: "{label} · {price} · {eta}",
  cardEnding: "Card ending {last4}",
  cardHolder: "Card holder",
  yourName: "Your name",
  expires: "Expires",
  orderNo: "Order {orderNo}",
  thanks: "Thank you, it’s on its way soon",
  receiptTo: "A receipt is heading to {email}. We’ll send tracking as soon as your parcel leaves the workshop.",
  paid: "Paid",
  paidSummary: "{amount} · {method}",
  shippingTo: "Shipping to",
  whatNext: "What happens next",
  placed: "Order placed",
  justNow: "Just now",
  packed: "Packed at the workshop",
  packedMeta: "Usually within a day",
  handed: "Handed to the courier",
  handedMeta: "Tracking link by email",
  delivered: "Delivered",
  expected: "Expected {eta}",
  trackOrder: "Track order",
  newCheckout: "Start a new checkout",
  paidWith: "Paid with your saved method",
};
type Messages = typeof CHECKOUT_MESSAGES;
type Step = 0 | 1 | 2 | 3;
type Values = { email: string; news: boolean; first: string; last: string; line1: string; line2: string; city: string; country: string; region: string; postcode: string; shipping: string; card: string; expiry: string; cvc: string; holder: string; sameBilling: boolean };
type Errors = Partial<Record<keyof Values, string>>;

export interface CheckoutProps {
  storeName: string;
  items: CheckoutItem[];
  shippingOptions: CheckoutShipping[];
  countries: CheckoutCountry[];
  /** Estimated tax on the discounted subtotal, e.g. 0.0825. */
  taxRate: number;
  /**
   * Your payment provider's hosted card fields (Stripe Elements, Adyen and so on). When given it
   * replaces the built-in card fields, so card numbers never pass through your own server.
   */
  paymentSlot?: ReactNode;
  /** Shows a test-mode banner with a button that fills this card number. */
  testCard?: string;
  /** Places the order and returns its number. The pay button is disabled without it. */
  onPlaceOrder?: Action<PlaceOrder, { orderNo: string }>;
  /** Checks a discount code. The code field is hidden without it. */
  onApplyPromo?: Action<{ code: string }, Promo>;
  /** Changes an item's quantity; shows at once and is undone if this fails. Steppers are hidden without it. */
  onUpdateQuantity?: Action<{ itemId: string; qty: number }>;
  onTrackOrder?: (orderNo: string) => void;
  className?: string;
}

const easeOut = [0.23, 1, 0.32, 1] as const;
const press = "transition-[color,background-color,box-shadow,scale,opacity] duration-150 ease-out active:scale-[0.97]";
const STEPS: Step[] = [0, 1, 2, 3];
const CARD_GROUPS = [0, 4, 8, 12];
const MUG_DOTS = [
  [17, 24],
  [24, 29],
  [28, 22],
  [20, 34],
  [29, 34],
  [15, 30],
];
const artTile: Record<CheckoutArt, string> = { mug: "bg-category-3/14", tote: "bg-category-2-strong/14", candle: "bg-category-4/12", notebook: "bg-category-1/12" };
const noOrder: Action<PlaceOrder, { orderNo: string }> = async () => fail();
const noPromo: Action<{ code: string }, Promo> = async () => fail();

const digits = (s: string) => s.replace(/\D/g, "");
const formatCard = (s: string) =>
  digits(s)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
const formatExpiry = (s: string, prev: string) => {
  const d = digits(s).slice(0, 4);
  if (s.length < prev.length && prev.endsWith(" / ") && d.length <= 2) return d.slice(0, 1);
  if (d.length >= 3) return `${d.slice(0, 2)} / ${d.slice(2)}`;
  if (d.length === 2) return `${d} / `;
  return d;
};
function luhn(num: string) {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = Number(num[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return num.length >= 13 && sum % 10 === 0;
}

function validate(step: Step, v: Values, countries: CheckoutCountry[], today: { year: number; month: number }, cardFields: boolean, t: Messages): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!v.email.trim()) e.email = t.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = t.emailInvalid;
  }
  if (step === 1) {
    const c = countries.find((x) => x.code === v.country);
    if (!v.first.trim()) e.first = t.required;
    if (!v.last.trim()) e.last = t.required;
    if (!v.line1.trim()) e.line1 = t.streetRequired;
    if (!v.city.trim()) e.city = t.required;
    if (c?.regions && !v.region) e.region = interpolate(t.pickRegion, { region: (c.regionLabel ?? "").toLowerCase() });
    if (!v.postcode.trim()) e.postcode = t.required;
    else if (c && !new RegExp(c.postPattern).test(v.postcode.trim())) e.postcode = c.postHint;
  }
  if (step === 3 && cardFields) {
    const d = digits(v.card);
    if (!d) e.card = t.cardRequired;
    else if (!luhn(d)) e.card = t.cardInvalid;
    const [mm, yy] = v.expiry.split(" / ").map(Number);
    if (!v.expiry) e.expiry = t.required;
    else if (!mm || mm > 12 || !yy || v.expiry.length < 7) e.expiry = t.expiryFormat;
    else if (2000 + yy < today.year || (2000 + yy === today.year && mm < today.month)) e.expiry = t.expired;
    if (!/^\d{3,4}$/.test(v.cvc)) e.cvc = t.cvcFormat;
    if (!v.holder.trim()) e.holder = t.required;
  }
  return e;
}

function Tween({ value, format }: { value: number; format: (n: number) => string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const text = useTransform(mv, format);
  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { type: "spring", stiffness: 200, damping: 30 });
    return () => controls.stop();
  }, [value, reduce, mv]);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

function ProductArt({ art, className }: { art: CheckoutArt; className?: string }) {
  return (
    <span aria-hidden className={cn("flex items-center justify-center overflow-hidden rounded-xl", artTile[art], className)}>
      <svg aria-hidden className="size-[80%]" viewBox="0 0 48 48">
        {art === "mug" ? (
          <>
            <path className="fill-none stroke-category-3-strong/70" d="M33 20h3.5a4.5 4.5 0 0 1 0 9H33" strokeWidth="3" />
            <path className="fill-category-3/8 stroke-category-3-strong/30 dark:stroke-transparent" d="M12 15h22v19a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6z" strokeWidth="1.25" />
            <path className="fill-category-3-strong/15" d="M12 15h22v4H12z" />
            {MUG_DOTS.map(([x, y]) => (
              <circle className="fill-category-3-strong/40" cx={x} cy={y} key={`${x}-${y}`} r="0.9" />
            ))}
          </>
        ) : null}
        {art === "tote" ? (
          <>
            <path className="fill-none stroke-category-2-strong/60" d="M18 18v-4a6 6 0 0 1 12 0v4" strokeWidth="2.5" />
            <path className="fill-category-2-strong" d="M11 18h26l-2 22H13z" />
            <path className="fill-category-2-strong/25" d="M11 18h26l-.3 3H11.3z" />
            <rect className="fill-category-3/11" height="5" rx="1" width="9" x="19.5" y="27" />
          </>
        ) : null}
        {art === "candle" ? (
          <>
            <path className="fill-category-3/60" d="M24 8c2.5 3 3 5 0 8-3-3-2.5-5 0-8z" />
            <rect className="fill-category-4-strong/60" height="4" rx="0.5" width="1.5" x="23.25" y="15" />
            <rect className="fill-category-4/20" height="22" rx="5" width="22" x="13" y="18" />
            <rect className="fill-category-4-strong/20" height="2" width="22" x="13" y="22" />
            <rect className="fill-white/80 dark:fill-white/70" height="8" rx="1" width="12" x="18" y="27" />
          </>
        ) : null}
        {art === "notebook" ? (
          <>
            <rect className="fill-category-1-strong" height="30" rx="2" width="22" x="13" y="9" />
            <rect className="fill-category-1-strong/30" height="30" width="3" x="13" y="9" />
            <rect className="fill-white/80" height="5" rx="1" width="10" x="20" y="16" />
          </>
        ) : null}
      </svg>
    </span>
  );
}

function FieldNote({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  return (
    <AnimatePresence initial={false} mode="popLayout">
      {error ? (
        <motion.p animate={{ opacity: 1, y: 0 }} className="text-destructive-foreground text-xs" exit={{ opacity: 0 }} id={`${id}-err`} initial={{ opacity: 0, y: -2 }} key="err" transition={{ duration: 0.15, ease: easeOut }}>
          {error}
        </motion.p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs" id={`${id}-hint`} key="hint">
          {hint}
        </p>
      ) : null}
    </AnimatePresence>
  );
}

function TextField({ id, label, error, hint, optional, mono, className, ...props }: { id: string; label: string; error?: string; hint?: string; optional?: string; mono?: boolean; className?: string } & Omit<ComponentProps<typeof Input>, "id" | "className">) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {optional ? <span className="font-normal text-muted-foreground">{optional}</span> : null}
      </Label>
      <Input aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} aria-invalid={error ? true : undefined} className={cn(mono && "font-mono tabular-nums")} id={id} {...props} />
      <FieldNote error={error} hint={hint} id={id} />
    </div>
  );
}

function StepButton({ children }: { children: ReactNode }) {
  return (
    <Button className={cn("h-10 w-full text-sm sm:h-10", press)} size="lg" type="submit">
      {children}
    </Button>
  );
}

function CardPreview({ number, holder, expiry, cvc, flipped, t }: { number: string; holder: string; expiry: string; cvc: string; flipped: boolean; t: Messages }) {
  const reduce = useReducedMotion();
  const d = digits(number).padEnd(16, "•");
  return (
    <div aria-hidden className="mx-auto w-full max-w-[260px] [perspective:900px] @lg:mt-6" dir="ltr">
      <motion.div animate={{ rotateY: flipped && !reduce ? 180 : 0 }} className="relative aspect-[1.586] w-full" initial={false} style={{ transformStyle: "preserve-3d" }} transition={{ duration: 0.45, ease: [0.645, 0.045, 0.355, 1] }}>
        <div className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-xl bg-linear-to-br from-muted-foreground via-muted-foreground to-muted-foreground p-4 text-white shadow-lg/16 ring-1 ring-white/10" style={{ backfaceVisibility: "hidden" }}>
          <span className="pointer-events-none absolute -end-12 -top-16 size-44 rounded-full bg-white/6" />
          <div className="relative flex items-center justify-between">
            <span className="h-6 w-8 rounded-md bg-gradient-to-br from-category-3/20 to-category-3/60 ring-1 ring-black/10" />
            <NfcIcon className="size-5 opacity-80" />
          </div>
          <div className="relative flex justify-between font-mono text-[15px] tabular-nums tracking-wider">
            {CARD_GROUPS.map((start) => (
              <span key={start}>{d.slice(start, start + 4)}</span>
            ))}
          </div>
          <div className="relative flex items-end justify-between gap-3 text-[10px] uppercase tracking-wider">
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="opacity-60">{t.cardHolder}</span>
              <span className="truncate font-medium text-xs normal-case tracking-normal">{holder || t.yourName}</span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-0.5">
              <span className="opacity-60">{t.expires}</span>
              <span className="font-medium font-mono text-xs tracking-normal">{expiry || t.expiryPlaceholder}</span>
            </span>
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col overflow-hidden rounded-xl bg-linear-to-br from-muted-foreground to-muted-foreground pt-5 text-white shadow-lg/16 ring-1 ring-white/10" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <span className="h-9 w-full bg-black/70" />
          <div className="mt-4 flex items-center gap-2 px-4">
            <span className="h-7 flex-1 rounded-sm bg-white/85" />
            <span className="flex h-7 w-12 items-center justify-center rounded-sm bg-white font-mono text-category-8-foreground text-sm tabular-nums">{cvc || "•••"}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Placed({ orderNo, email, eta, address, paid, onReset, onTrack, t }: { orderNo: string; email: string; eta: string; address: string; paid: string; onReset: () => void; onTrack?: () => void; t: Messages }) {
  const reduce = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  const rise = (i: number) => ({ initial: reduce ? { opacity: 0 } : { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: easeOut, delay: 0.25 + i * 0.04 } });
  const next = [
    { title: t.placed, meta: t.justNow, done: true },
    { title: t.packed, meta: t.packedMeta, done: false },
    { title: t.handed, meta: t.handedMeta, done: false },
    { title: t.delivered, meta: interpolate(t.expected, { eta }), done: false },
  ];
  return (
    <motion.div animate={{ opacity: 1 }} className="flex flex-col items-start gap-5 pt-4 @3xl:pt-10" initial={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <motion.span animate={{ scale: 1, opacity: 1 }} aria-hidden className="flex size-14 items-center justify-center rounded-full bg-success text-white" initial={reduce ? { opacity: 0 } : { scale: 0.85, opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 24 }}>
        <svg aria-hidden className="size-7" fill="none" viewBox="0 0 24 24">
          <motion.path animate={{ pathLength: 1 }} d="M5.5 12.5 10 17 18.5 7.5" initial={{ pathLength: reduce ? 1 : 0 }} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} transition={{ duration: 0.3, ease: easeOut, delay: 0.15 }} />
        </svg>
      </motion.span>
      <motion.div className="flex flex-col gap-1" {...rise(0)}>
        <p className="font-mono text-muted-foreground text-xs">{interpolate(t.orderNo, { orderNo })}</p>
        <h2 className="text-balance font-heading font-semibold text-2xl tracking-tight outline-none" ref={headingRef} tabIndex={-1}>
          {t.thanks}
        </h2>
        <p className="text-pretty text-muted-foreground">{interpolate(t.receiptTo, { email })}</p>
      </motion.div>
      <motion.dl className="grid w-full gap-px overflow-hidden rounded-xl border bg-border @md:grid-cols-2" {...rise(1)}>
        <div className="flex flex-col gap-1 bg-card p-4">
          <dt className="text-muted-foreground text-xs">{t.paid}</dt>
          <dd className="font-medium tabular-nums">{paid}</dd>
        </div>
        <div className="flex min-w-0 flex-col gap-1 bg-card p-4">
          <dt className="text-muted-foreground text-xs">{t.shippingTo}</dt>
          <dd className="text-pretty font-medium">{address}</dd>
        </div>
      </motion.dl>
      <motion.ol aria-label={t.whatNext} className="flex w-full flex-col" {...rise(2)}>
        {next.map((step, i) => (
          <li className="relative flex gap-3 pb-4 last:pb-0" key={step.title}>
            {i < next.length - 1 ? <span aria-hidden className="absolute start-[7px] top-5 bottom-0 w-px bg-border" /> : null}
            <span aria-hidden className={cn("relative mt-0.5 flex size-[15px] shrink-0 items-center justify-center rounded-full", step.done ? "bg-success text-white" : "border-2 border-border bg-background")}>
              {step.done ? <CheckIcon className="size-2.5" strokeWidth={3} /> : null}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className={cn("font-medium", !step.done && "text-muted-foreground")}>{step.title}</span>
              <span className="text-muted-foreground text-xs">{step.meta}</span>
            </span>
          </li>
        ))}
      </motion.ol>
      <motion.div className="flex w-full flex-col gap-2 @md:flex-row" {...rise(3)}>
        {onTrack ? (
          <Button className={cn("@md:flex-none", press)} onClick={onTrack} size="lg">
            <TruckIcon /> {t.trackOrder}
          </Button>
        ) : null}
        <Button className={press} onClick={onReset} size="lg" variant={onTrack ? "outline" : "default"}>
          {t.newCheckout}
        </Button>
      </motion.div>
    </motion.div>
  );
}

function CheckoutScreen({ storeName, items: initialItems, shippingOptions, countries, taxRate, paymentSlot, testCard, onPlaceOrder, onApplyPromo, onUpdateQuantity, onTrackOrder, className }: CheckoutProps) {
  const t = useMessages("checkout", CHECKOUT_MESSAGES);
  const fmt = useFormat();
  const { now, timeZone, currency } = useWirefront();
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const money = (n: number) => fmt.money(n);
  const [items, setItems] = useState(initialItems);
  const [syncedItems, setSyncedItems] = useState(initialItems);
  if (syncedItems !== initialItems) {
    setSyncedItems(initialItems);
    setItems(initialItems);
  }
  const [open, setOpen] = useState<Step>(0);
  const [done, setDone] = useState<Step[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [submittedSteps, setSubmittedSteps] = useState<Step[]>([]);
  const [order, setOrder] = useState<{ orderNo: string; total: number } | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [flip, setFlip] = useState(false);
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState<Promo | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const cardFields = !paymentSlot;
  const [v, setV] = useState<Values>({ email: "", news: true, first: "", last: "", line1: "", line2: "", city: "", country: countries[0]?.code ?? "", region: "", postcode: "", shipping: shippingOptions[0]?.id ?? "", card: "", expiry: "", cvc: "", holder: "", sameBilling: true });

  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit" }).format(now()).split("-").map(Number);
  const today = { year: parts[0] ?? 2000, month: parts[1] ?? 1 };
  const check = (step: Step, values: Values) => validate(step, values, countries, today, cardFields, t);
  const set = <K extends keyof Values>(k: K, value: Values[K]) => {
    const next = { ...v, [k]: value };
    setV(next);
    if (submittedSteps.includes(open)) setErrors(check(open, next));
  };

  const country = countries.find((c) => c.code === v.country) ?? countries[0];
  const ship = shippingOptions.find((s) => s.id === v.shipping);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = applied ? subtotal * applied.percentOff : 0;
  const shippingCost = done.includes(2) || open >= 2 ? (ship?.price ?? 0) : null;
  const tax = (subtotal - discount) * taxRate;
  const total = subtotal - discount + (shippingCost ?? 0) + tax;
  const count = items.reduce((s, i) => s + i.qty, 0);

  const qty = useAction(onUpdateQuantity ?? (async () => {}), {
    optimistic: ({ itemId, qty: n }) => {
      const before = items.find((i) => i.id === itemId)?.qty ?? n;
      const setQty = (q: number) => setItems((all) => all.map((x) => (x.id === itemId ? { ...x, qty: q } : x)));
      setQty(n);
      return () => setQty(before);
    },
  });
  const promoCheck = useAction(onApplyPromo ?? noPromo, {
    onSuccess: (p) => {
      setApplied(p);
      setPromo("");
    },
  });
  const place = useAction(onPlaceOrder ?? noOrder, { onSuccess: (r) => setOrder({ orderNo: r.orderNo, total }) });
  const paying = place.isPending();

  const focusFirstError = (errs: Errors) => {
    const first = Object.keys(errs)[0];
    if (!first) return;
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[id="${uid}-${first}"]`)?.focus());
  };
  const submitStep = (step: Step) => (e: SubmitEvent) => {
    e.preventDefault();
    const errs = check(step, v);
    setSubmittedSteps((s) => (s.includes(step) ? s : [...s, step]));
    setErrors(errs);
    if (Object.keys(errs).length) {
      focusFirstError(errs);
      return;
    }
    setDone((d) => (d.includes(step) ? d : [...d, step]));
    if (step < 3) {
      setOpen(STEPS.find((s) => s > step && !done.includes(s)) ?? ((step + 1) as Step));
      setErrors({});
      return;
    }
    if (!onPlaceOrder) return;
    place.run({ email: v.email.trim(), newsletter: v.news, address: { first: v.first.trim(), last: v.last.trim(), line1: v.line1.trim(), line2: v.line2.trim(), city: v.city.trim(), country: v.country, region: v.region, postcode: v.postcode.trim().toUpperCase() }, shippingId: v.shipping, promoCode: applied?.code, sameBilling: v.sameBilling, card: cardFields ? { number: digits(v.card), expiry: v.expiry, cvc: v.cvc, holder: v.holder.trim() } : undefined });
  };

  const reset = () => {
    setOrder(null);
    setOpen(0);
    setDone([]);
    setSubmittedSteps([]);
    setErrors({});
    setV((cur) => ({ ...cur, card: "", expiry: "", cvc: "", holder: "" }));
  };

  const addressLine = `${v.first} ${v.last}, ${v.line1}${v.line2 ? `, ${v.line2}` : ""}, ${v.city}${v.region ? `, ${v.region}` : ""} ${v.postcode.toUpperCase()}`;
  const paidWith = cardFields ? interpolate(t.cardEnding, { last4: digits(v.card).slice(-4) }) : t.paidWith;
  const summaryLine = (step: Step) => {
    if (step === 0) return v.email;
    if (step === 1) return addressLine;
    if (step === 2) return ship ? interpolate(t.shipSummary, { label: ship.label, price: ship.price ? money(ship.price) : t.free, eta: ship.eta }) : "";
    return paidWith;
  };

  const sectionBody = (step: Step) => {
    if (step === 0)
      return (
        <form className="flex flex-col gap-4" noValidate onSubmit={submitStep(0)}>
          <TextField autoComplete="email" error={errors.email} id={`${uid}-email`} inputMode="email" label={t.email} onChange={(e) => set("email", e.target.value)} placeholder={t.emailPlaceholder} type="email" value={v.email} />
          <Label className="font-normal">
            <Checkbox checked={v.news} onCheckedChange={(c) => set("news", Boolean(c))} />
            {t.newsletter}
          </Label>
          <StepButton>{t.toShipping}</StepButton>
        </form>
      );
    if (step === 1)
      return (
        <form className="grid grid-cols-2 gap-x-3 gap-y-4" noValidate onSubmit={submitStep(1)}>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-country`}>{t.country}</Label>
            <Select
              items={countries.map((c) => ({ value: c.code, label: c.name }))}
              onValueChange={(val) => {
                if (!val) return;
                setV((cur) => ({ ...cur, country: val as string, region: "", postcode: "" }));
                setErrors((e) => ({ ...e, region: undefined, postcode: undefined }));
              }}
              value={v.country}
            >
              <SelectTrigger id={`${uid}-country`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {countries.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TextField autoComplete="given-name" error={errors.first} id={`${uid}-first`} label={t.firstName} onChange={(e) => set("first", e.target.value)} value={v.first} />
          <TextField autoComplete="family-name" error={errors.last} id={`${uid}-last`} label={t.lastName} onChange={(e) => set("last", e.target.value)} value={v.last} />
          <TextField autoComplete="address-line1" className="col-span-2" error={errors.line1} id={`${uid}-line1`} label={t.address} onChange={(e) => set("line1", e.target.value)} placeholder={t.addressPlaceholder} value={v.line1} />
          <TextField autoComplete="address-line2" className="col-span-2" id={`${uid}-line2`} label={t.address2} onChange={(e) => set("line2", e.target.value)} optional={t.optional} value={v.line2} />
          <TextField autoComplete="address-level2" className={cn(country?.regions ? "col-span-2 @md:col-span-1" : "col-span-1")} error={errors.city} id={`${uid}-city`} label={t.city} onChange={(e) => set("city", e.target.value)} value={v.city} />
          {country?.regions ? (
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor={`${uid}-region`}>{country.regionLabel}</Label>
              <Select items={country.regions.map((r) => ({ value: r, label: r }))} onValueChange={(val) => set("region", (val as string) ?? "")} value={v.region || null}>
                <SelectTrigger aria-describedby={errors.region ? `${uid}-region-err` : undefined} aria-invalid={errors.region ? true : undefined} className="min-w-0" id={`${uid}-region`}>
                  <SelectValue placeholder={t.select} />
                </SelectTrigger>
                <SelectContent align="start">
                  {country.regions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldNote error={errors.region} id={`${uid}-region`} />
            </div>
          ) : null}
          <TextField autoComplete="postal-code" error={errors.postcode} id={`${uid}-postcode`} label={country?.postLabel ?? ""} onChange={(e) => set("postcode", e.target.value)} value={v.postcode} />
          <div className="col-span-2">
            <StepButton>{t.toDelivery}</StepButton>
          </div>
        </form>
      );
    if (step === 2)
      return (
        <form className="flex flex-col gap-4" noValidate onSubmit={submitStep(2)}>
          <RadioGroup aria-label={t.deliverySpeed} className="gap-2" onValueChange={(val) => set("shipping", val as string)} value={v.shipping}>
            {shippingOptions.map((s) => {
              const Icon = s.icon === "next" ? ZapIcon : s.icon === "express" ? RabbitIcon : TruckIcon;
              const on = v.shipping === s.id;
              return (
                <Label className={cn("relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 font-normal transition-[border-color,background-color,box-shadow] duration-150", on ? "border-foreground/40 bg-accent/40 ring-1 ring-foreground/10" : "hover:bg-accent/40")} key={s.id}>
                  <RadioGroupItem value={s.id} />
                  <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="font-medium">{s.label}</span>
                    <span className="truncate text-muted-foreground text-xs">{s.eta}</span>
                  </span>
                  <span className={cn("font-medium tabular-nums", !s.price && "text-success-foreground")}>{s.price ? money(s.price) : t.free}</span>
                </Label>
              );
            })}
          </RadioGroup>
          <StepButton>{t.toPayment}</StepButton>
        </form>
      );
    return (
      <form aria-busy={paying} noValidate onSubmit={submitStep(3)}>
        <fieldset className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0" disabled={paying}>
          {testCard && cardFields ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-warning/30 border-dashed bg-warning/6 px-3 py-2 text-xs dark:bg-warning/10">
              <span className="font-medium text-warning-foreground">{t.testMode}</span>
              <span className="text-muted-foreground">{t.testHint}</span>
              <button
                className={cn("relative ms-auto cursor-pointer rounded-md font-medium underline-offset-2 outline-none after:absolute after:-inset-2 after:content-[''] hover:underline focus-visible:ring-2 focus-visible:ring-ring", press)}
                onClick={() => {
                  const yy = String((today.year + 3) % 100).padStart(2, "0");
                  const next = { ...v, card: formatCard(testCard), expiry: `08 / ${yy}`, cvc: "123", holder: v.holder || `${v.first} ${v.last}`.trim() };
                  setV(next);
                  if (submittedSteps.includes(3)) setErrors(check(3, next));
                }}
                type="button"
              >
                {t.fillTestCard}
              </button>
            </div>
          ) : null}

          {cardFields ? (
            <div className="grid gap-4 @lg:grid-cols-[minmax(0,1fr)_200px] @lg:items-start">
              <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                <TextField autoComplete="cc-number" className="col-span-2" error={errors.card} id={`${uid}-card`} inputMode="numeric" label={t.cardNumber} mono onChange={(e) => set("card", formatCard(e.target.value))} placeholder={t.cardPlaceholder} value={v.card} />
                <TextField autoComplete="cc-exp" error={errors.expiry} id={`${uid}-expiry`} inputMode="numeric" label={t.expiry} mono onChange={(e) => set("expiry", formatExpiry(e.target.value, v.expiry))} placeholder={t.expiryPlaceholder} value={v.expiry} />
                <TextField autoComplete="cc-csc" error={errors.cvc} id={`${uid}-cvc`} inputMode="numeric" label={t.cvc} mono onBlur={() => setFlip(false)} onChange={(e) => set("cvc", digits(e.target.value).slice(0, 4))} onFocus={() => setFlip(true)} placeholder={t.cvcPlaceholder} value={v.cvc} />
                <TextField autoComplete="cc-name" className="col-span-2" error={errors.holder} id={`${uid}-holder`} label={t.nameOnCard} onChange={(e) => set("holder", e.target.value)} value={v.holder} />
              </div>
              <CardPreview cvc={v.cvc} expiry={v.expiry} flipped={flip} holder={v.holder} number={v.card} t={t} />
            </div>
          ) : (
            paymentSlot
          )}

          <Label className="font-normal">
            <Checkbox checked={v.sameBilling} onCheckedChange={(c) => set("sameBilling", Boolean(c))} />
            {t.sameBilling}
          </Label>
          {place.error ? (
            <p className="text-destructive text-xs" role="alert">
              {place.error}
            </p>
          ) : null}
          <Button aria-busy={paying} className={cn("h-10 w-full text-sm sm:h-10", press)} disabled={paying || !onPlaceOrder} size="lg" type="submit">
            {paying ? <Spinner data-icon="inline-start" /> : <LockIcon />}
            <span className="sr-only">{interpolate(t.pay, { amount: money(total) })}</span>
            <span aria-hidden className="flex items-center gap-1">
              {t.payLabel} <Tween format={money} value={total} />
            </span>
          </Button>
        </fieldset>
      </form>
    );
  };

  const summary = (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-4">
        <AnimatePresence initial={false}>
          {items.map((i) => (
            <motion.li animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-3" exit={{ opacity: 0, height: 0 }} key={i.id} transition={{ duration: 0.2, ease: easeOut }}>
              <ProductArt art={i.art} className="size-16 shrink-0 border border-border/60" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate font-medium">{i.name}</span>
                <span className="truncate text-muted-foreground text-xs">{i.variant}</span>
                {onUpdateQuantity ? (
                  <div className="flex items-center gap-1">
                    <Button aria-label={interpolate(t.fewer, { name: i.name })} className={press} disabled={i.qty <= 1 || paying || Boolean(order)} onClick={() => qty.run({ itemId: i.id, qty: i.qty - 1 }, i.id)} size="icon-xs" variant="outline">
                      <MinusIcon />
                    </Button>
                    <span className="w-6 text-center text-xs tabular-nums">{i.qty}</span>
                    <Button aria-label={interpolate(t.more, { name: i.name })} className={press} disabled={i.qty >= 9 || paying || Boolean(order)} onClick={() => qty.run({ itemId: i.id, qty: i.qty + 1 }, i.id)} size="icon-xs" variant="outline">
                      <PlusIcon />
                    </Button>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs tabular-nums">× {i.qty}</span>
                )}
              </div>
              <span className="self-start font-medium tabular-nums">{money(i.price * i.qty)}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {qty.error ? (
        <p className="text-destructive text-xs" role="alert">
          {qty.error}
        </p>
      ) : null}

      {onApplyPromo ? (
        <div className="flex flex-col gap-1.5">
          <AnimatePresence initial={false} mode="popLayout">
            {applied ? (
              <motion.div animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2" exit={{ opacity: 0, scale: 0.97 }} initial={{ opacity: 0, scale: 0.97 }} key="applied" transition={{ duration: 0.18, ease: easeOut }}>
                <span className="flex h-7 items-center gap-1.5 rounded-lg bg-success/10 ps-2 pe-1 font-medium font-mono text-success-foreground text-xs dark:bg-success/16">
                  <TagIcon aria-hidden className="size-3.5" />
                  {applied.code}
                  <button aria-label={interpolate(t.removeCode, { code: applied.code })} className="relative flex size-5 cursor-pointer items-center justify-center rounded-md outline-none after:absolute after:-inset-1.5 after:content-[''] hover:bg-success/16 focus-visible:ring-2 focus-visible:ring-ring" disabled={paying || Boolean(order)} onClick={() => setApplied(null)} type="button">
                    <XIcon aria-hidden className="size-3" />
                  </button>
                </span>
                <span className="text-muted-foreground text-xs">{interpolate(t.percentOff, { percent: fmt.number(applied.percentOff, { style: "percent" }) })}</span>
              </motion.div>
            ) : (
              <motion.form
                animate={{ opacity: 1 }}
                className="flex gap-2"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                key="field"
                onSubmit={(e) => {
                  e.preventDefault();
                  const code = promo.trim().toUpperCase();
                  if (code) promoCheck.run({ code });
                }}
                transition={{ duration: 0.15 }}
              >
                <Input aria-describedby={promoCheck.error ? `${uid}-promo-err` : undefined} aria-invalid={promoCheck.error ? true : undefined} aria-label={t.discountCode} className="flex-1 uppercase placeholder:normal-case" onChange={(e) => setPromo(e.target.value)} placeholder={t.discountCode} value={promo} />
                <Button className={press} disabled={!promo.trim() || promoCheck.isPending()} type="submit" variant="outline">
                  {t.apply}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
          {promoCheck.error && !applied ? (
            <p className="text-destructive-foreground text-xs" id={`${uid}-promo-err`} role="alert">
              {promoCheck.error}
            </p>
          ) : null}
        </div>
      ) : null}

      <dl className="flex flex-col gap-2 border-t pt-4">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{interpolate(t.subtotal, { count })}</dt>
          <dd className="tabular-nums">
            <Tween format={money} value={subtotal} />
          </dd>
        </div>
        <AnimatePresence initial={false}>
          {discount > 0 ? (
            <motion.div animate={{ opacity: 1, height: "auto" }} className="overflow-hidden" exit={{ opacity: 0, height: 0 }} initial={{ opacity: 0, height: 0 }} transition={reduce ? { duration: 0 } : { duration: 0.2, ease: easeOut }}>
              <div className="flex justify-between gap-3 text-success-foreground">
                <dt>{t.discount}</dt>
                <dd className="tabular-nums">
                  <Tween format={(n) => interpolate(t.minus, { amount: money(n) })} value={discount} />
                </dd>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{t.shipping}</dt>
          <dd className={cn("tabular-nums", shippingCost === null && "text-muted-foreground")}>{shippingCost === null ? t.nextStep : shippingCost === 0 ? t.free : <Tween format={money} value={shippingCost} />}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{t.tax}</dt>
          <dd className="tabular-nums">
            <Tween format={money} value={tax} />
          </dd>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-3 border-t pt-4">
          <dt className="font-medium">{t.total}</dt>
          <dd className="font-heading font-semibold text-xl tracking-tight">
            <span className="me-1.5 font-normal font-sans text-muted-foreground text-xs">{currency}</span>
            <Tween format={money} value={total} />
          </dd>
        </div>
      </dl>
      <p className="flex items-center gap-2 text-muted-foreground text-xs">
        <Undo2Icon aria-hidden className="size-3.5" /> {t.returns}
      </p>
    </div>
  );

  return (
    <div className={cn("@container relative isolate flex h-svh w-full flex-col overflow-hidden bg-background text-foreground text-sm", className)}>
      <header className="flex h-14 shrink-0 border-b">
        <div className="flex min-w-0 flex-1 basis-0 items-center">
          <div className="mx-auto flex w-full max-w-[600px] items-center gap-2.5 px-4 @3xl:px-10 @4xl:me-0">
            <span aria-hidden className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <svg aria-hidden className="size-3.5" fill="none" viewBox="0 0 16 16">
                <path d="M3 13V7.5L8 3l5 4.5V13" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
                <path d="M6.5 13v-2.5a1.5 1.5 0 0 1 3 0V13" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </span>
            <span className="font-heading font-semibold">{storeName}</span>
            <span className="ms-auto flex items-center gap-1.5 text-muted-foreground text-xs @4xl:hidden">
              <LockIcon aria-hidden className="size-3.5" /> {t.secure}
            </span>
          </div>
        </div>
        <div className="hidden min-w-0 flex-1 basis-0 items-center border-s bg-muted/40 @4xl:flex">
          <div className="flex w-full max-w-[440px] items-center px-10">
            <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <LockIcon aria-hidden className="size-3.5" /> {t.secure}
            </span>
          </div>
        </div>
      </header>

      <div className="shrink-0 border-b bg-muted/40 @4xl:hidden">
        <button aria-controls={`${uid}-summary`} aria-expanded={summaryOpen} className="flex h-12 w-full cursor-pointer items-center gap-2 px-4 text-start outline-none focus-visible:bg-accent" onClick={() => setSummaryOpen((o) => !o)} type="button">
          <PackageIcon aria-hidden className="size-4 text-muted-foreground" />
          <span className="flex-1">{summaryOpen ? t.hideSummary : t.showSummary}</span>
          <motion.span animate={{ rotate: summaryOpen ? 180 : 0 }} aria-hidden transition={{ duration: 0.2, ease: easeOut }}>
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          </motion.span>
          <span className="font-medium">
            <Tween format={money} value={total} />
          </span>
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1">
        <AnimatePresence initial={false}>
          {summaryOpen ? (
            <>
              <motion.div animate={{ opacity: 1 }} aria-hidden className="absolute inset-0 z-20 bg-black/24 @4xl:hidden" exit={{ opacity: 0 }} initial={{ opacity: 0 }} onClick={() => setSummaryOpen(false)} transition={{ duration: 0.2 }} />
              <motion.div animate={{ clipPath: "inset(0 0 0% 0)" }} className="absolute inset-x-0 top-0 z-30 max-h-full overflow-y-auto border-b bg-background p-4 shadow-lg/5 @4xl:hidden" exit={{ clipPath: "inset(0 0 100% 0)" }} id={`${uid}-summary`} initial={{ clipPath: "inset(0 0 100% 0)" }} transition={reduce ? { duration: 0 } : { duration: 0.28, ease: easeOut }}>
                {summary}
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>

        <div className="min-w-0 flex-1 basis-0 overflow-y-auto" ref={formRef}>
          <div className="mx-auto flex max-w-[600px] flex-col gap-3 px-4 py-6 @3xl:px-10 @3xl:py-10 @4xl:me-0">
            <AnimatePresence initial={false} mode="wait">
              {order ? (
                <Placed address={addressLine} email={v.email} eta={ship?.eta ?? ""} key="placed" onReset={reset} onTrack={onTrackOrder ? () => onTrackOrder(order.orderNo) : undefined} orderNo={order.orderNo} paid={interpolate(t.paidSummary, { amount: money(order.total), method: paidWith })} t={t} />
              ) : (
                <motion.div className="flex flex-col gap-3" exit={{ opacity: 0, y: -8 }} key="form" transition={{ duration: 0.18, ease: easeOut }}>
                  <div className="mb-3 flex flex-col gap-1">
                    <h2 className="text-balance font-heading font-semibold text-2xl tracking-tight">{t.checkout}</h2>
                    <p className="text-muted-foreground tabular-nums">{interpolate(t.stepOf, { n: open + 1, name: t[`step_${open}`] })}</p>
                  </div>
                  <div className="divide-y overflow-hidden rounded-xl border bg-card shadow-xs/5">
                    {STEPS.map((s) => {
                      const isOpen = open === s;
                      const isDone = done.includes(s) && !isOpen;
                      return (
                        <section aria-labelledby={`${uid}-h${s}`} className={cn("transition-[opacity] duration-200", !isOpen && !isDone && "text-muted-foreground")} key={s}>
                          <div className="flex items-center gap-3 p-4">
                            <span aria-hidden className={cn("flex size-6 shrink-0 items-center justify-center rounded-full font-medium text-xs tabular-nums transition-colors duration-200", isDone ? "bg-primary text-primary-foreground" : isOpen ? "border border-foreground/72 text-foreground" : "border text-muted-foreground")}>
                              <AnimatePresence initial={false} mode="popLayout">
                                {isDone ? (
                                  <motion.span animate={{ opacity: 1, scale: 1 }} initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }} key="check" transition={{ duration: 0.18, ease: easeOut }}>
                                    <CheckIcon className="size-3.5" />
                                  </motion.span>
                                ) : (
                                  <motion.span animate={{ opacity: 1 }} initial={{ opacity: 0 }} key="n">
                                    {s + 1}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </span>
                            <div className="flex min-w-0 flex-1 flex-col">
                              <h3 className="font-medium" id={`${uid}-h${s}`}>
                                {t[`step_${s}`]}
                              </h3>
                              {isDone ? <p className="truncate text-muted-foreground text-xs">{summaryLine(s)}</p> : null}
                            </div>
                            {isDone && !paying ? (
                              <Button
                                aria-label={t[`edit_${s}`]}
                                className={press}
                                onClick={() => {
                                  setOpen(s);
                                  setErrors({});
                                }}
                                size="sm"
                                variant="ghost"
                              >
                                {t.edit}
                              </Button>
                            ) : null}
                          </div>
                          <AnimatePresence initial={false}>
                            {isOpen ? (
                              <motion.div animate={{ height: "auto", opacity: 1 }} className="overflow-hidden" exit={{ height: 0, opacity: 0 }} initial={{ height: 0, opacity: 0 }} transition={reduce ? { duration: 0 } : { duration: 0.26, ease: easeOut }}>
                                <div className="px-4 pt-0 pb-4">{sectionBody(s)}</div>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </section>
                      );
                    })}
                  </div>
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
                    <LockIcon aria-hidden className="size-3" /> {t.encrypted}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <aside aria-label={t.orderSummary} className="hidden min-w-0 flex-1 basis-0 overflow-y-auto border-s bg-muted/40 @4xl:block">
          <div className="w-full max-w-[440px] px-10 py-10">
            <h2 className="mb-5 font-medium">{t.orderSummary}</h2>
            {summary}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function Checkout(props: CheckoutProps) {
  return (
    <ScreenBoundary name="Checkout">
      <CheckoutScreen {...props} />
    </ScreenBoundary>
  );
}
