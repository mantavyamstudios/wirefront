// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `delivery-tracker`).
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button, buttonVariants } from "@wirefront/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@wirefront/ui/dropdown-menu";
import { Input } from "@wirefront/ui/input";
import { cn } from "@wirefront/ui/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@wirefront/ui/sheet";
import { Textarea } from "@wirefront/ui/textarea";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
} from "@wirefront/ui/wirefront/provider";
import { type Action, fail } from "@wirefront/ui/wirefront/types";
import {
  BikeIcon,
  CheckIcon,
  ChevronLeftIcon,
  CircleHelpIcon,
  HouseIcon,
  MessageCircleIcon,
  MinusIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  SendIcon,
  StarIcon,
  StoreIcon,
  XCircleIcon,
} from "lucide-react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "motion/react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  DeliveryItem,
  DeliveryMessage,
  DeliveryOrder,
  DeliveryStatus,
  DeliveryTracking,
} from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("deliveryTracker.<key>"). */
export const DELIVERY_TRACKER_MESSAGES = {
  stage_confirmed: "Confirmed",
  stage_packed: "Packed",
  stage_on_the_way: "On the way",
  stage_delivered: "Delivered",
  backToOrders: "Back to orders",
  orderFrom: "Order from {store}",
  orderId: "#{id}",
  help: "Help",
  helpLabel: "Help with this order",
  messageName: "Message {name}",
  callName: "Call {name}",
  changeNote: "Change drop-off note",
  cancelOrder: "Cancel order",
  map: "Map: {location}",
  mapNoLocation: "Map of the delivery route",
  live: "Live",
  zoomIn: "Zoom in on courier",
  zoomOut: "Zoom out",
  deliveredAt: "Delivered at {time}",
  enjoy: "Enjoy your order",
  leftWithNote: "Left as you asked.",
  handedOver: "Handed over at the door.",
  arrivingBy: "Arriving by {time}",
  minutes: "{n} min",
  orderProgress: "Order progress",
  yourCourier: "Your courier",
  howWas: "How was {name}?",
  rateCourier: "Rate your courier",
  stars: "{n} stars",
  oneStar: "1 star",
  addTip: "Add a tip",
  tipLabel: "Tip",
  thanksTip: "Thanks. All {amount} goes to {name}.",
  thanksRating: "Thanks. {name} will see your rating.",
  dropOff: "Drop-off",
  editNote: "Edit note",
  noteForCourier: "Note for the courier",
  notePlaceholder: "Gate code, where to leave it…",
  cancel: "Cancel",
  saveNote: "Save note",
  quotedNote: "“{note}”",
  noNote: "No note for the courier.",
  yourOrder: "Your order",
  itemsMeta: "{count} items · {store}",
  qty: "{n}×",
  items: "Items",
  delivery: "Delivery",
  tipFor: "Tip for {name}",
  paid: "Paid",
  chatWith: "Chat with {name}",
  courierMeta: "Your courier · replies fast",
  done: "Done",
  privacy: "Messages go through the app. Your number stays private.",
  typing: "{name} is typing",
  send: "Send",
  map_harbor: "HARBOR ST",
  map_linden: "LINDEN AVE",
  map_alder: "ALDER ROW",
  map_quay: "QUAY RD",
  map_park: "FERNWOOD PARK",
  map_river: "Calder River",
};
type Messages = typeof DELIVERY_TRACKER_MESSAGES;

export interface DeliveryTrackerProps {
  order: DeliveryOrder;
  /** The live position and ETA; pass a new object whenever your feed updates. */
  tracking: DeliveryTracking;
  /** Your own map (Mapbox, Google Maps and so on) in place of the illustrated one. */
  mapSlot?: ReactNode;
  /** Chat with the courier; the chat is hidden unless onSendMessage is given. */
  messages?: DeliveryMessage[];
  courierTyping?: boolean;
  quickReplies?: string[];
  /** Tip amounts offered after delivery. */
  tipOptions?: number[];
  onSendMessage?: Action<{ text: string }, DeliveryMessage>;
  /** Saves the drop-off note; shows at once and is undone if this fails. Editing is hidden without it. */
  onUpdateNote?: Action<{ note: string }>;
  onRate?: Action<{ rating: number }>;
  onTip?: Action<{ amount: number | null }>;
  /** Shown in the help menu while the order can still be cancelled. */
  onCancelOrder?: () => void;
  onBack?: () => void;
  className?: string;
}

/** Stable empty default, so the render-time sync below does not loop. */
const NO_MESSAGES: DeliveryMessage[] = [];
const spring = {
  type: "spring",
  stiffness: 520,
  damping: 44,
  mass: 1,
} as const;
const easeOut = [0.23, 1, 0.32, 1] as const;
const press =
  "transition-[color,background-color,box-shadow,scale,opacity] duration-150 ease-out active:scale-[0.97]";
const STAGES: DeliveryStatus[] = [
  "confirmed",
  "packed",
  "on_the_way",
  "delivered",
];
const ZOOMS = [1, 1.5, 2.2];
const STARS = [1, 2, 3, 4, 5];
const DOTS = ["a", "b", "c"];
const W = 800;
const H = 600;
const ROUTE =
  "M180 500 H384 Q400 500 400 484 V376 Q400 360 416 360 H544 Q560 360 560 344 V236 Q560 220 576 220 H624 Q640 220 640 204 V150";
const START = { x: 180, y: 500 };
const END = { x: 640, y: 150 };
const XS = [0, 100, 240, 400, 560, 720, 800];
const YS = [0, 90, 220, 360, 500, 600];
const BUILDINGS = [
  [118, 108, 50, 38],
  [178, 108, 44, 60],
  [418, 108, 60, 44],
  [490, 108, 52, 30],
  [578, 238, 40, 40],
  [658, 238, 46, 30],
  [118, 378, 56, 46],
  [258, 378, 70, 36],
  [418, 378, 40, 50],
  [470, 378, 72, 30],
  [578, 378, 60, 44],
  [258, 518, 60, 40],
  [578, 518, 56, 44],
  [418, 518, 44, 50],
  [738, 108, 46, 70],
];
const TREES = [
  [282, 130],
  [310, 150],
  [350, 128],
  [336, 182],
  [270, 180],
  [372, 168],
];
const itemTile: Record<DeliveryItem["art"], string> = {
  bread: "bg-category-3/14",
  milk: "bg-category-1/12",
  fruit: "bg-category-7/14",
  flowers: "bg-category-4/12",
};
const noSend: Action<{ text: string }, DeliveryMessage> = async () => fail();

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

function ItemArt({ art }: { art: DeliveryItem["art"] }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg",
        itemTile[art]
      )}
    >
      <svg aria-hidden className="size-6" viewBox="0 0 32 32">
        {art === "bread" ? (
          <>
            <path
              className="fill-category-3"
              d="M5 18c0-6 5-10 11-10s11 4 11 10v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"
            />
            <path
              className="fill-none stroke-category-3/16"
              d="M11 13l2 3M16 12l1 3.5M21 13l-1 3"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
          </>
        ) : null}
        {art === "milk" ? (
          <>
            <path
              className="fill-white"
              d="M11 9h10v4l2 3v11a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1V16l2-3z"
            />
            <rect
              className="fill-category-1"
              height="5"
              rx="1"
              width="14"
              x="9"
              y="18"
            />
            <rect
              className="fill-category-1-strong/70"
              height="3"
              rx="0.5"
              width="10"
              x="11"
              y="5"
            />
          </>
        ) : null}
        {art === "fruit" ? (
          <>
            <circle className="fill-category-7" cx="12" cy="19" r="6.5" />
            <circle className="fill-category-7/60" cx="20.5" cy="17" r="6" />
            <path
              className="fill-category-2"
              d="M20 11c1-3 4-4 6-3-1 2-3 3.5-6 3z"
            />
          </>
        ) : null}
        {art === "flowers" ? (
          <>
            <path
              className="fill-none stroke-category-2"
              d="M16 28V15M16 22l-5-6M16 20l5-5"
              strokeLinecap="round"
              strokeWidth="1.6"
            />
            <circle className="fill-category-4" cx="16" cy="10" r="4" />
            <circle className="fill-category-4/60" cx="10" cy="14" r="3" />
            <circle className="fill-category-3/60" cx="22" cy="13" r="3" />
          </>
        ) : null}
      </svg>
    </span>
  );
}

function Tween({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const text = useTransform(mv, (n) => String(Math.round(n)));
  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.4, ease: easeOut });
    return () => controls.stop();
  }, [value, reduce, mv]);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

/** The illustrated city with the courier moving along a fixed route. */
function RouteMap({
  progress,
  delivered,
  label,
  t,
}: {
  progress: number;
  delivered: boolean;
  label: string;
  t: Messages;
}) {
  const reduce = useReducedMotion();
  const progressMv = useMotionValue(progress);
  const zoomMv = useMotionValue(1);
  const [zoomIdx, setZoomIdx] = useState(0);
  const routeRef = useRef<SVGPathElement>(null);
  const cameraRef = useRef<SVGGElement>(null);
  const courierRef = useRef<SVGGElement>(null);
  const startPin = useRef<SVGGElement>(null);
  const endPin = useRef<SVGGElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const renderScale = useRef(1);
  const measured = useRef(false);

  const draw = useCallback(() => {
    const path = routeRef.current;
    if (!path?.getTotalLength) return;
    const len = path.getTotalLength();
    const pt = path.getPointAtLength(
      len * Math.min(Math.max(progressMv.get(), 0), 1)
    );
    const z = zoomMv.get();
    const m = (1.1 / (z * renderScale.current)).toFixed(4);
    const tx = Math.min(0, Math.max(W - W * z, W / 2 - pt.x * z));
    const ty = Math.min(0, Math.max(H - H * z, H / 2 - pt.y * z));
    cameraRef.current?.setAttribute(
      "transform",
      `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${z.toFixed(4)})`
    );
    courierRef.current?.setAttribute(
      "transform",
      `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)}) scale(${m})`
    );
    startPin.current?.setAttribute(
      "transform",
      `translate(${START.x} ${START.y}) scale(${m})`
    );
    endPin.current?.setAttribute(
      "transform",
      `translate(${END.x} ${END.y}) scale(${m})`
    );
  }, [progressMv, zoomMv]);

  useMotionValueEvent(progressMv, "change", draw);
  useMotionValueEvent(zoomMv, "change", draw);
  useEffect(() => {
    const controls = animate(
      progressMv,
      progress,
      reduce ? { duration: 0 } : { duration: 0.9, ease: "linear" }
    );
    return () => controls.stop();
  }, [progress, progressMv, reduce]);
  useEffect(() => {
    const controls = animate(
      zoomMv,
      ZOOMS[zoomIdx] ?? 1,
      reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 34 }
    );
    return () => controls.stop();
  }, [zoomIdx, zoomMv, reduce]);
  useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width = W, height = H } = e?.contentRect ?? {};
      renderScale.current = Math.max(width / W, height / H) || 1;
      if (!measured.current) {
        measured.current = true;
        if (renderScale.current < 0.75) {
          zoomMv.set(ZOOMS[1] ?? 1);
          setZoomIdx(1);
        }
      }
      draw();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw, zoomMv]);

  return (
    <>
      <svg
        aria-label={label}
        className="absolute inset-0 size-full"
        preserveAspectRatio="xMidYMid slice"
        ref={svgRef}
        role="img"
        viewBox={`0 0 ${W} ${H}`}
      >
        <g ref={cameraRef}>
          <rect className="fill-muted" height={H} width={W} />
          {XS.slice(0, -1).flatMap((x0, i) =>
            YS.slice(0, -1).map((y0, j) => {
              const x1 = XS[i + 1] ?? W;
              const y1 = YS[j + 1] ?? H;
              const park = i === 2 && j === 1;
              return (
                <rect
                  className={
                    park ? "fill-category-2/18" : "fill-foreground/2.5"
                  }
                  height={y1 - y0 - 22}
                  key={`${x0}-${y0}`}
                  rx={park ? 14 : 5}
                  width={x1 - x0 - 22}
                  x={x0 + 11}
                  y={y0 + 11}
                />
              );
            })
          )}
          {BUILDINGS.map(([x, y, w, h]) => (
            <rect
              className="fill-foreground/4.5"
              height={h}
              key={`${x}-${y}`}
              rx={3}
              width={w}
              x={x}
              y={y}
            />
          ))}
          {TREES.map(([x, y]) => (
            <circle
              className="fill-category-2/30"
              cx={x}
              cy={y}
              key={`${x}-${y}`}
              r={9}
            />
          ))}
          <path
            className="fill-none stroke-category-1/21"
            d="M-20 310 C 120 270, 220 330, 360 296 S 600 262, 820 300"
            strokeLinecap="round"
            strokeWidth={34}
          />
          <g className="fill-none stroke-background" strokeLinecap="round">
            {XS.slice(1, -1).map((x) => (
              <line
                key={`v${x}`}
                strokeWidth={x === 400 || x === 560 ? 20 : 13}
                x1={x}
                x2={x}
                y1={-10}
                y2={H + 10}
              />
            ))}
            {YS.slice(1, -1).map((y) => (
              <line
                key={`h${y}`}
                strokeWidth={y === 500 || y === 360 || y === 220 ? 20 : 13}
                x1={-10}
                x2={W + 10}
                y1={y}
                y2={y}
              />
            ))}
            <line strokeWidth={11} x1={640} x2={640} y1={220} y2={128} />
            <g strokeWidth={6}>
              <line x1={484} x2={484} y1={90} y2={220} />
              <line x1={650} x2={650} y1={360} y2={500} />
              <line x1={200} x2={200} y1={360} y2={500} />
              <line x1={100} x2={240} y1={446} y2={446} />
              <line x1={560} x2={720} y1={160} y2={160} />
              <line x1={240} x2={400} y1={574} y2={574} />
            </g>
          </g>
          <g
            aria-hidden
            className="fill-muted-foreground font-medium"
            fontSize={11}
            letterSpacing={0.4}
          >
            <text x={18} y={492}>
              {t.map_harbor}
            </text>
            <text transform="translate(392 590) rotate(-90)">
              {t.map_linden}
            </text>
            <text x={436} y={212}>
              {t.map_alder}
            </text>
            <text x={420} y={352}>
              {t.map_quay}
            </text>
            <text
              className="fill-category-2-strong/70"
              fontSize={10}
              x={262}
              y={208}
            >
              {t.map_park}
            </text>
            <text
              className="fill-category-1-strong/60 italic"
              fontSize={11}
              x={60}
              y={296}
            >
              {t.map_river}
            </text>
          </g>
          <path
            className="fill-none stroke-background"
            d={ROUTE}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={13}
          />
          <path
            className="fill-none stroke-info"
            d={ROUTE}
            ref={routeRef}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={6}
          />
          <motion.path
            className="fill-none stroke-muted-foreground"
            d={ROUTE}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={6}
            style={{ pathLength: progressMv }}
          />
          <g ref={startPin} transform={`translate(${START.x} ${START.y})`}>
            <circle
              className="fill-card stroke-border"
              r={15}
              strokeWidth={1.5}
            />
            <StoreIcon
              className="text-foreground"
              height={14}
              width={14}
              x={-7}
              y={-7}
            />
          </g>
          <g ref={endPin} transform={`translate(${END.x} ${END.y})`}>
            {delivered ? null : (
              <motion.circle
                animate={{ scale: [1, 2], opacity: [0.35, 0] }}
                className="fill-foreground motion-reduce:hidden"
                r={16}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeOut",
                }}
              />
            )}
            <circle
              className="fill-foreground stroke-background"
              r={16}
              strokeWidth={3}
            />
            <HouseIcon
              className="text-background"
              height={15}
              width={15}
              x={-7.5}
              y={-7.5}
            />
          </g>
          <g ref={courierRef}>
            <circle className="fill-info/20" r={24} />
            <circle
              className="fill-info stroke-background"
              r={16}
              strokeWidth={3}
            />
            <BikeIcon
              className="text-white"
              height={16}
              width={16}
              x={-8}
              y={-8}
            />
          </g>
        </g>
      </svg>
      <div className="absolute inset-e-3 bottom-3 flex flex-col overflow-hidden rounded-xl border bg-popover shadow-xs/5">
        <button
          aria-label={t.zoomIn}
          className="flex size-9 cursor-pointer items-center justify-center text-foreground outline-none transition-colors hover:bg-accent focus-visible:bg-accent disabled:cursor-default disabled:opacity-40"
          disabled={zoomIdx === ZOOMS.length - 1}
          onClick={() => setZoomIdx((z) => Math.min(ZOOMS.length - 1, z + 1))}
          type="button"
        >
          <PlusIcon aria-hidden className="size-4" />
        </button>
        <span aria-hidden className="h-px bg-border" />
        <button
          aria-label={t.zoomOut}
          className="flex size-9 cursor-pointer items-center justify-center text-foreground outline-none transition-colors hover:bg-accent focus-visible:bg-accent disabled:cursor-default disabled:opacity-40"
          disabled={zoomIdx === 0}
          onClick={() => setZoomIdx((z) => Math.max(0, z - 1))}
          type="button"
        >
          <MinusIcon aria-hidden className="size-4" />
        </button>
      </div>
    </>
  );
}

function NoteEditor({
  initial,
  onSave,
  onCancel,
  t,
}: {
  initial: string;
  onSave: (note: string) => void;
  onCancel: () => void;
  t: Messages;
}) {
  const [draft, setDraft] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <motion.form
      animate={{ opacity: 1 }}
      className="mt-1.5 flex flex-col gap-2"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      key="edit"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft.trim());
      }}
      transition={{ duration: 0.15 }}
    >
      <Textarea
        aria-label={t.noteForCourier}
        maxLength={140}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
        placeholder={t.notePlaceholder}
        ref={ref}
        rows={2}
        value={draft}
      />
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} size="sm" variant="ghost">
          {t.cancel}
        </Button>
        <Button className={press} size="sm" type="submit">
          {t.saveNote}
        </Button>
      </div>
    </motion.form>
  );
}

function CourierChat({
  courierName,
  messages,
  typing,
  quickReplies,
  pending,
  error,
  onSend,
  onClose,
  t,
}: {
  courierName: string;
  messages: DeliveryMessage[];
  typing: boolean;
  quickReplies: string[];
  pending: boolean;
  error?: string;
  onSend: (text: string) => void;
  onClose: () => void;
  t: Messages;
}) {
  const reduce = useReducedMotion();
  const fmt = useFormat();
  const first = courierName.split(" ")[0] ?? courierName;
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const f = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(f);
  }, []);
  // Follow the newest message and the typing bubble.
  const followKey = `${messages.length}|${typing}`;
  const lastFollow = useRef("");
  useLayoutEffect(() => {
    if (lastFollow.current === followKey) return;
    lastFollow.current = followKey;
    const el = listRef.current;
    el?.scrollTo?.({
      top: el.scrollHeight,
      behavior: reduce ? "auto" : "smooth",
    });
  });
  const send = (raw: string) => {
    const v = raw.trim();
    if (!v || pending) return;
    onSend(v);
    setText("");
  };
  return (
    <>
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Avatar aria-hidden className="[--avatar-size:--spacing(8)]">
          <AvatarFallback className="bg-linear-to-br from-category-6/60 to-category-1 font-semibold text-white text-xs">
            {initials(courierName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <SheetTitle className="truncate font-medium text-sm">
            {interpolate(t.chatWith, { name: first })}
          </SheetTitle>
          <span className="text-muted-foreground text-xs">{t.courierMeta}</span>
        </div>
        <Button onClick={onClose} size="sm" variant="ghost">
          {t.done}
        </Button>
      </div>
      <div
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-4"
        ref={listRef}
      >
        <p className="mb-1 text-center text-muted-foreground text-xs">
          {t.privacy}
        </p>
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex max-w-[80%] flex-col gap-0.5",
                m.from === "me"
                  ? "items-end self-end"
                  : "items-start self-start"
              )}
              initial={
                reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }
              }
              key={m.id}
              style={{
                transformOrigin: m.from === "me" ? "100% 100%" : "0% 100%",
              }}
              transition={spring}
            >
              <span
                className={cn(
                  "text-pretty rounded-2xl px-3 py-2",
                  m.from === "me"
                    ? "rounded-ee-md bg-primary text-primary-foreground"
                    : "rounded-es-md bg-muted"
                )}
              >
                {m.text}
              </span>
              <span className="px-1 text-[11px] text-muted-foreground">
                {fmt.time(m.sentAt)}
              </span>
            </motion.div>
          ))}
          {typing ? (
            <motion.div
              animate={{ opacity: 1 }}
              className="flex h-9 w-14 items-center justify-center gap-1 self-start rounded-2xl rounded-es-md bg-muted"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key="typing"
              role="status"
            >
              <span className="sr-only">
                {interpolate(t.typing, { name: first })}
              </span>
              {DOTS.map((d, i) => (
                <motion.span
                  animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }}
                  aria-hidden
                  className="size-1.5 rounded-full bg-muted-foreground"
                  key={d}
                  transition={{
                    duration: 0.9,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.15,
                    ease: "linear",
                  }}
                />
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <div className="flex flex-col gap-2 border-t p-3">
        {error ? (
          <p className="text-destructive text-xs" role="alert">
            {error}
          </p>
        ) : null}
        {quickReplies.length ? (
          <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 scrollbar-none">
            {quickReplies.map((q) => (
              <button
                className={cn(
                  "h-8 shrink-0 cursor-pointer rounded-full border bg-background px-3 text-xs outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                  press
                )}
                disabled={pending}
                key={q}
                onClick={() => send(q)}
                type="button"
              >
                {q}
              </button>
            ))}
          </div>
        ) : null}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <Input
            aria-label={interpolate(t.messageName, { name: first })}
            className="flex-1"
            onChange={(e) => setText(e.target.value)}
            placeholder={interpolate(t.messageName, { name: first })}
            ref={inputRef}
            value={text}
          />
          <Button
            aria-label={t.send}
            className={press}
            disabled={!text.trim() || pending}
            size="icon"
            type="submit"
          >
            <SendIcon />
          </Button>
        </form>
      </div>
    </>
  );
}

function DeliveryTrackerScreen({
  order,
  tracking,
  mapSlot,
  messages: initialMessages = NO_MESSAGES,
  courierTyping = false,
  quickReplies = [],
  tipOptions = [],
  onSendMessage,
  onUpdateNote,
  onRate,
  onTip,
  onCancelOrder,
  onBack,
  className,
}: DeliveryTrackerProps) {
  const t = useMessages("deliveryTracker", DELIVERY_TRACKER_MESSAGES);
  const fmt = useFormat();
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const { courier, items, storeName } = order;
  const first = courier.name.split(" ")[0] ?? courier.name;
  const [note, setNote] = useState(order.note);
  const [syncedNote, setSyncedNote] = useState(order.note);
  if (syncedNote !== order.note) {
    setSyncedNote(order.note);
    setNote(order.note);
  }
  const [messages, setMessages] = useState(initialMessages);
  const [syncedMessages, setSyncedMessages] = useState(initialMessages);
  if (syncedMessages !== initialMessages) {
    setSyncedMessages(initialMessages);
    setMessages(initialMessages);
  }
  const [chat, setChat] = useState(false);
  const [rating, setRating] = useState(0);
  const [tip, setTip] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const chatBtnRef = useRef<HTMLButtonElement>(null);

  const delivered = tracking.status === "delivered";
  const stage = STAGES.indexOf(tracking.status);
  const arrival = fmt.time(tracking.arrivesAt);
  const money = (n: number) => fmt.money(n);
  const itemsTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const itemCount = items.reduce((s, i) => s + i.qty, 0);
  const cancellable = stage < STAGES.indexOf("on_the_way");

  const saveNote = useAction(onUpdateNote ?? (async () => {}), {
    optimistic: ({ note: next }) => {
      const before = note;
      setNote(next);
      return () => setNote(before);
    },
  });
  const rate = useAction(onRate ?? (async () => {}), {
    optimistic: ({ rating: n }) => {
      const before = rating;
      setRating(n);
      return () => setRating(before);
    },
  });
  const tipAction = useAction(onTip ?? (async () => {}), {
    optimistic: ({ amount }) => {
      const before = tip;
      setTip(amount);
      return () => setTip(before);
    },
  });
  const sendMessage = useAction(onSendMessage ?? noSend, {
    onSuccess: (m) =>
      setMessages((all) => [...all.filter((x) => x.id !== m.id), m]),
  });
  const startEdit = () => setEditing(true);
  const feedbackError = rate.error ?? tipAction.error;
  // Split the "{n} min" message around the number so the count can animate in place.
  const [minBefore = "", minAfter = ""] = interpolate(t.minutes, {
    n: "\u0000",
  }).split("\u0000");

  return (
    <div
      className={cn(
        "@container relative isolate flex h-svh w-full flex-col overflow-hidden bg-background text-foreground text-sm",
        className
      )}
    >
      <header className="flex h-14 shrink-0 items-center gap-2.5 border-b px-3 @3xl:px-5">
        {onBack ? (
          <Button
            aria-label={t.backToOrders}
            className={press}
            onClick={onBack}
            size="icon-sm"
            variant="ghost"
          >
            <ChevronLeftIcon className="rtl:-scale-x-100" />
          </Button>
        ) : (
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
          >
            <StoreIcon className="size-4" />
          </span>
        )}
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">
            {interpolate(t.orderFrom, { store: storeName })}
          </span>
          <span className="font-mono text-muted-foreground text-xs">
            {interpolate(t.orderId, { id: order.id })}
          </span>
        </div>
        {(onSendMessage || onUpdateNote || onCancelOrder) && !delivered ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label={t.helpLabel}
                  className={cn("ms-auto", press)}
                  size="sm"
                  variant="ghost"
                />
              }
            >
              <CircleHelpIcon />{" "}
              <span className="hidden @md:inline">{t.help}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              {onSendMessage ? (
                <DropdownMenuItem onClick={() => setChat(true)}>
                  <MessageCircleIcon />{" "}
                  {interpolate(t.messageName, { name: first })}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem render={<a href={`tel:${courier.phone}`} />}>
                <PhoneIcon /> {interpolate(t.callName, { name: first })}
              </DropdownMenuItem>
              {onUpdateNote ? (
                <DropdownMenuItem onClick={startEdit}>
                  <PencilIcon /> {t.changeNote}
                </DropdownMenuItem>
              ) : null}
              {onCancelOrder ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={!cancellable}
                    onClick={onCancelOrder}
                  >
                    <XCircleIcon /> {t.cancelOrder}
                    {cancellable ? null : (
                      <span className="ms-auto text-muted-foreground text-xs">
                        {t[`stage_${tracking.status}`]}
                      </span>
                    )}
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1 flex-col @3xl:flex-row">
        <div className="relative h-70 shrink-0 overflow-hidden bg-muted @3xl:h-auto @3xl:min-w-0 @3xl:flex-1">
          {mapSlot ?? (
            <RouteMap
              delivered={delivered}
              label={
                tracking.location
                  ? interpolate(t.map, { location: tracking.location })
                  : t.mapNoLocation
              }
              progress={tracking.progress}
              t={t}
            />
          )}
          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            <span className="flex h-7 items-center gap-2 rounded-full border bg-popover/90 px-2.5 text-xs shadow-xs/5 backdrop-blur-sm">
              <span aria-hidden className="relative flex size-2">
                {delivered ? null : (
                  <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-60 animation-duration-[1.6s] motion-reduce:hidden" />
                )}
                <span
                  className={cn(
                    "relative size-2 rounded-full",
                    delivered ? "bg-muted-foreground" : "bg-success"
                  )}
                />
              </span>
              {delivered ? t.stage_delivered : t.live}
            </span>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto border-t @3xl:w-95 @3xl:flex-none @3xl:border-s @3xl:border-t-0">
          <div className="flex flex-col divide-y">
            <section
              aria-live="polite"
              className="flex flex-col gap-4 px-5 py-5"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {delivered ? (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-1"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                    key="done"
                    transition={{ duration: 0.25, ease: easeOut }}
                  >
                    <span className="text-muted-foreground text-xs">
                      {interpolate(t.deliveredAt, { time: arrival })}
                    </span>
                    <span className="flex items-center gap-2 font-heading font-semibold text-3xl tracking-tight">
                      {t.enjoy}
                      <span
                        aria-hidden
                        className="flex size-6 items-center justify-center rounded-full bg-success text-white"
                      >
                        <CheckIcon className="size-4" />
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      {note ? t.leftWithNote : t.handedOver}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-1"
                    exit={{ opacity: 0, y: -6 }}
                    initial={{ opacity: 0 }}
                    key="eta"
                    transition={{ duration: 0.2, ease: easeOut }}
                  >
                    <span className="text-muted-foreground text-xs">
                      {interpolate(t.arrivingBy, { time: arrival })}
                    </span>
                    <span className="font-heading font-semibold text-3xl tracking-tight">
                      <span className="sr-only">
                        {interpolate(t.minutes, { n: tracking.etaMinutes })}
                      </span>
                      <span aria-hidden>
                        {minBefore}
                        <Tween value={tracking.etaMinutes} />
                        {minAfter}
                      </span>
                    </span>
                    {tracking.location ? (
                      <AnimatePresence initial={false} mode="popLayout">
                        <motion.span
                          animate={{ opacity: 1, filter: "blur(0px)" }}
                          className="text-muted-foreground"
                          exit={{ opacity: 0, filter: "blur(2px)" }}
                          initial={{ opacity: 0, filter: "blur(2px)" }}
                          key={tracking.location}
                          transition={{ duration: 0.2 }}
                        >
                          {tracking.location}
                        </motion.span>
                      </AnimatePresence>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
              <ol
                aria-label={t.orderProgress}
                className="grid grid-cols-4 gap-1"
              >
                {STAGES.map((s, i) => (
                  <li className="flex flex-col gap-2" key={s}>
                    <span
                      aria-hidden
                      className="relative h-1 overflow-hidden rounded-full bg-muted"
                    >
                      <motion.span
                        animate={{
                          scaleX:
                            i < stage
                              ? 1
                              : i === stage
                                ? delivered
                                  ? 1
                                  : 0.6
                                : 0,
                        }}
                        className={cn(
                          "absolute inset-0 origin-left rounded-full rtl:origin-right",
                          delivered ? "bg-success" : "bg-info"
                        )}
                        initial={false}
                        transition={
                          reduce
                            ? { duration: 0 }
                            : { duration: 0.4, ease: easeOut }
                        }
                      />
                    </span>
                    <span
                      aria-current={i === stage ? "step" : undefined}
                      className={cn(
                        "truncate text-xs",
                        i === stage
                          ? "font-medium text-foreground"
                          : i < stage
                            ? "text-foreground"
                            : "text-muted-foreground"
                      )}
                    >
                      {t[`stage_${s}`]}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section
              aria-label={t.yourCourier}
              className="flex flex-col gap-4 px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <Avatar aria-hidden className="[--avatar-size:--spacing(10)]">
                  <AvatarFallback className="bg-linear-to-br from-category-6/60 to-category-1 font-semibold text-white">
                    {initials(courier.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-medium">{courier.name}</span>
                  <span className="flex items-center gap-1 truncate text-muted-foreground text-xs">
                    <StarIcon
                      aria-hidden
                      className="size-3 fill-category-3/60 text-category-3"
                    />
                    <span className="text-foreground tabular-nums">
                      {fmt.number(courier.rating, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                    </span>
                    <span aria-hidden>·</span>
                    <span className="truncate">{courier.vehicle}</span>
                  </span>
                </div>
                <AnimatePresence initial={false}>
                  {delivered ? null : (
                    <motion.div
                      animate={{ opacity: 1 }}
                      className="flex shrink-0 gap-2"
                      exit={{ opacity: 0 }}
                      initial={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {onSendMessage ? (
                        <Button
                          aria-label={interpolate(t.messageName, {
                            name: first,
                          })}
                          className={cn("rounded-full", press)}
                          onClick={() => setChat(true)}
                          ref={chatBtnRef}
                          size="icon"
                          variant="outline"
                        >
                          <MessageCircleIcon />
                        </Button>
                      ) : null}
                      <a
                        aria-label={interpolate(t.callName, { name: first })}
                        className={cn(
                          buttonVariants({ size: "icon", variant: "outline" }),
                          "rounded-full",
                          press
                        )}
                        href={`tel:${courier.phone}`}
                      >
                        <PhoneIcon aria-hidden />
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <AnimatePresence initial={false}>
                {delivered && (onRate || (onTip && tipOptions.length)) ? (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-3 rounded-xl bg-muted/60 p-3"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                    key="rate"
                    transition={{ duration: 0.25, ease: easeOut, delay: 0.1 }}
                  >
                    {onRate ? (
                      <fieldset className="m-0 flex min-w-0 items-center justify-between gap-2 border-0 p-0">
                        <legend className="float-start font-medium">
                          {interpolate(t.howWas, { name: first })}
                        </legend>
                        <div className="-me-1.5 ms-auto flex">
                          {STARS.map((n) => (
                            <button
                              aria-label={
                                n === 1
                                  ? t.oneStar
                                  : interpolate(t.stars, { n })
                              }
                              aria-pressed={rating === n}
                              className={cn(
                                "flex size-8 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                press
                              )}
                              key={n}
                              onClick={() => rate.run({ rating: n })}
                              type="button"
                            >
                              <motion.span
                                animate={{ scale: rating >= n ? 1 : 0.9 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 600,
                                  damping: 20,
                                  delay: rating >= n ? (n - 1) * 0.03 : 0,
                                }}
                              >
                                <StarIcon
                                  aria-hidden
                                  className={cn(
                                    "size-5 transition-colors duration-150",
                                    rating >= n
                                      ? "fill-category-3/60 text-category-3"
                                      : "text-muted-foreground"
                                  )}
                                />
                              </motion.span>
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    ) : null}
                    {onTip && tipOptions.length ? (
                      <fieldset className="m-0 flex min-w-0 items-center gap-2 border-0 p-0">
                        <legend className="float-start text-muted-foreground text-xs">
                          {t.addTip}
                        </legend>
                        <div className="ms-auto flex gap-1.5">
                          {tipOptions.map((amt) => (
                            <button
                              aria-pressed={tip === amt}
                              className={cn(
                                "h-8 min-w-12 cursor-pointer rounded-full border px-3 font-medium text-xs tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                press,
                                tip === amt
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "bg-background hover:bg-accent"
                              )}
                              key={amt}
                              onClick={() =>
                                tipAction.run({
                                  amount: tip === amt ? null : amt,
                                })
                              }
                              type="button"
                            >
                              {fmt.money(amt, undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    ) : null}
                    <AnimatePresence initial={false}>
                      {feedbackError ? (
                        <p className="text-destructive text-xs" role="alert">
                          {feedbackError}
                        </p>
                      ) : rating > 0 || tip ? (
                        <motion.p
                          animate={{ opacity: 1, height: "auto" }}
                          className="overflow-hidden text-success-foreground text-xs"
                          exit={{ opacity: 0, height: 0 }}
                          initial={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: easeOut }}
                        >
                          {tip
                            ? interpolate(t.thanksTip, {
                                amount: money(tip),
                                name: first,
                              })
                            : interpolate(t.thanksRating, { name: first })}
                        </motion.p>
                      ) : null}
                    </AnimatePresence>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </section>

            <section
              aria-labelledby={`${uid}-drop`}
              className="flex flex-col gap-1.5 px-5 py-4"
            >
              <div className="flex h-6 items-center justify-between gap-2">
                <h3
                  className="text-muted-foreground text-xs"
                  id={`${uid}-drop`}
                >
                  {t.dropOff}
                </h3>
                {onUpdateNote && !editing && !delivered ? (
                  <Button
                    className={cn("-me-2", press)}
                    onClick={startEdit}
                    size="xs"
                    variant="ghost"
                  >
                    <PencilIcon /> {t.editNote}
                  </Button>
                ) : null}
              </div>
              <span className="flex items-center gap-2 font-medium">
                <HouseIcon
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <span className="truncate">{order.address}</span>
              </span>
              {saveNote.error ? (
                <p className="text-destructive text-xs" role="alert">
                  {saveNote.error}
                </p>
              ) : null}
              <AnimatePresence initial={false} mode="popLayout">
                {editing ? (
                  <NoteEditor
                    initial={note}
                    key="edit"
                    onCancel={() => setEditing(false)}
                    onSave={(next) => {
                      setEditing(false);
                      if (next !== note) saveNote.run({ note: next });
                    }}
                    t={t}
                  />
                ) : (
                  <motion.p
                    animate={{ opacity: 1 }}
                    className="text-pretty ps-6 text-muted-foreground"
                    initial={{ opacity: 0 }}
                    key="note"
                    transition={{ duration: 0.15 }}
                  >
                    {note ? interpolate(t.quotedNote, { note }) : t.noNote}
                  </motion.p>
                )}
              </AnimatePresence>
            </section>

            <section
              aria-labelledby={`${uid}-items`}
              className="flex flex-col px-5 py-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3
                  className="text-muted-foreground text-xs"
                  id={`${uid}-items`}
                >
                  {t.yourOrder}
                </h3>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {interpolate(t.itemsMeta, {
                    count: itemCount,
                    store: storeName,
                  })}
                </span>
              </div>
              <ul className="mt-3 flex flex-col gap-3">
                {items.map((i) => (
                  <li className="flex items-center gap-3" key={i.id}>
                    <ItemArt art={i.art} />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">
                        {i.qty > 1 ? (
                          <span className="me-1 text-muted-foreground tabular-nums">
                            {interpolate(t.qty, { n: i.qty })}
                          </span>
                        ) : null}
                        {i.name}
                      </span>
                      <span className="truncate text-muted-foreground text-xs">
                        {i.detail}
                      </span>
                    </div>
                    <span className="tabular-nums">
                      {money(i.price * i.qty)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 flex flex-col gap-1.5 border-t border-dashed pt-3 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t.items}</dt>
                  <dd className="tabular-nums">{money(itemsTotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t.delivery}</dt>
                  <dd className="tabular-nums">{money(order.deliveryFee)}</dd>
                </div>
                <AnimatePresence initial={false}>
                  {tip ? (
                    <motion.div
                      animate={{ opacity: 1, height: "auto" }}
                      className="overflow-hidden"
                      exit={{ opacity: 0, height: 0 }}
                      initial={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: easeOut }}
                    >
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">
                          {interpolate(t.tipFor, { name: first })}
                        </dt>
                        <dd className="tabular-nums">{money(tip)}</dd>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <div className="mt-1 flex justify-between font-medium text-sm">
                  <dt>{t.paid}</dt>
                  <dd className="tabular-nums">
                    {money(itemsTotal + order.deliveryFee + (tip ?? 0))}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </div>

      {onSendMessage ? (
        <Sheet
          onOpenChange={(open) => {
            setChat(open);
            if (!open) chatBtnRef.current?.focus();
          }}
          open={chat && !delivered}
        >
          <SheetContent
            className="w-full gap-0 p-0 sm:max-w-95"
            showCloseButton={false}
            side="right"
          >
            {chat ? (
              <CourierChat
                courierName={courier.name}
                error={sendMessage.error}
                messages={messages}
                onClose={() => {
                  setChat(false);
                  chatBtnRef.current?.focus();
                }}
                onSend={(text) => sendMessage.run({ text })}
                pending={sendMessage.isPending()}
                quickReplies={quickReplies}
                t={t}
                typing={courierTyping}
              />
            ) : null}
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}

export function DeliveryTracker(props: DeliveryTrackerProps) {
  return (
    <ScreenBoundary name="DeliveryTracker">
      <DeliveryTrackerScreen {...props} />
    </ScreenBoundary>
  );
}
