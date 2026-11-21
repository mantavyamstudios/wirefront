// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `profile`).
"use client";

import {
  ArrowLeftIcon,
  BadgeCheckIcon,
  BarChart2Icon,
  BellIcon,
  BellRingIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
  HeartIcon,
  LinkIcon,
  MapPinIcon,
  MessageCircleIcon,
  PinIcon,
  Repeat2Icon,
  ShareIcon,
  XIcon,
} from "lucide-react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { Fragment, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { cn } from "@wirefront/ui/lib/utils";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger } from "@wirefront/ui/dropdown-menu";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import type { SocialArt as ProfileArt, SocialHue as ProfileHue, SocialPost as ProfilePost, SocialStreak, SocialSuggestion as ProfileSuggestion, SocialUser as ProfileUser } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("socialProfile.<key>"). */
export const SOCIAL_PROFILE_MESSAGES = {
  back: "Back",
  postsCount: "{count} posts",
  follow: "Follow",
  following: "Following",
  unfollow: "Unfollow",
  followName: "Follow {name}",
  unfollowName: "Unfollow {name}",
  notifyOn: "Get notified when {name} posts",
  notifyOff: "Turn off notifications from {name}",
  moreFor: "More options for @{handle}",
  copyProfile: "Copy link to profile",
  profileCopied: "Profile link copied",
  mute: "Mute @{handle}",
  verified: "Verified",
  handle: "@{handle}",
  followsYou: "Follows you",
  muted: "Muted",
  joined: "Joined {date}",
  followingCount: "Following",
  followersCount: "Followers",
  mutualsOne: "Followed by {a}",
  mutualsTwo: "Followed by {a}, {b}",
  mutualsMore: "Followed by {a}, {b} and {count} others",
  sections: "Profile sections",
  posts: "Posts",
  replies: "Replies",
  media: "Media",
  openMedia: "Open {caption}",
  openImage: "Open image: {caption}",
  youMightLike: "You might like",
  streakProgress: "{done} / {total}",
  footer: "Footer",
  pinned: "Pinned",
  replyingTo: "Replying to",
  repliesCount: "{count} replies",
  viewsCount: "{count} views",
  repost: "Repost",
  undoRepost: "Undo repost",
  like: "Like",
  unlike: "Unlike",
  bookmark: "Bookmark",
  removeBookmark: "Remove bookmark",
  copyPost: "Copy link to post",
  postCopied: "Link copied",
  close: "Close",
  previous: "Previous",
  next: "Next",
  position: "{n} of {total}",
};

type Messages = typeof SOCIAL_PROFILE_MESSAGES;

export interface SocialProfileProps {
  user: ProfileUser;
  posts: ProfilePost[];
  replies: ProfilePost[];
  media: ProfileArt[];
  suggestions?: ProfileSuggestion[];
  /** Names of people the viewer follows who follow them. */
  mutuals?: string[];
  /** Whether the viewer follows them, gets their notifications, and has muted them. */
  following?: boolean;
  notify?: boolean;
  muted?: boolean;
  /** A habit tracker shown in the sidebar. Hidden when not given. */
  streak?: SocialStreak;
  /** The profile's shareable URL, for "Copy link". */
  profileUrl: string;
  /** A post's shareable URL. */
  postUrl: (id: string) => string;
  footerLinks?: { label: string; href: string }[];
  copyright?: string;
  /** Each change shows at once and reverts if its action fails. Controls are local-only without them. */
  onToggleFollow?: Action<boolean>;
  onToggleNotify?: Action<boolean>;
  onToggleMute?: Action<boolean>;
  onReact?: Action<{ id: string; kind: "like" | "repost" | "bookmark"; on: boolean }>;
  onFollowSuggestion?: Action<{ handle: string; following: boolean }>;
  onBack?: () => void;
  className?: string;
}

const spring = { type: "spring", stiffness: 520, damping: 44, mass: 1 } as const;
const easeOut = [0.23, 1, 0.32, 1] as const;
const press = "transition-[color,background-color,box-shadow,scale,opacity] duration-150 ease-out active:scale-[0.97]";

const hues: Record<ProfileHue, { art: string; avatar: string }> = {
  amber: { art: "from-category-3/20 via-category-3/35 to-category-7/60", avatar: "from-category-3/35 to-category-7" },
  rose: { art: "from-category-4/20 via-category-4/35 to-category-4", avatar: "from-category-4/35 to-category-4" },
  violet: { art: "from-category-5/35 via-category-5/60 to-category-8", avatar: "from-category-5/60 to-category-8" },
  teal: { art: "from-category-6/20 via-category-6/35 to-category-2", avatar: "from-category-6/35 to-category-2" },
  sky: { art: "from-category-1/20 via-category-1/35 to-category-1", avatar: "from-category-1/35 to-category-1" },
  orange: { art: "from-category-7/20 via-category-7/35 to-category-4/60", avatar: "from-category-7/35 to-category-4" },
  emerald: { art: "from-category-2/20 via-category-2/35 to-category-6", avatar: "from-category-2/35 to-category-6" },
  indigo: { art: "from-category-8/35 via-category-8/60 to-category-5-strong", avatar: "from-category-8/60 to-category-5-strong" },
  fuchsia: { art: "from-category-5/20 via-category-5/35 to-category-5", avatar: "from-category-5/35 to-category-5" },
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Counts in the viewer's locale, compact from ten thousand. */
function useCompact() {
  const fmt = useFormat();
  return (n: number) => fmt.number(n, { notation: n >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 });
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
    const controls = animate(mv, value, { type: "spring", stiffness: 220, damping: 30 });
    return () => controls.stop();
  }, [value, reduce, mv]);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

function Count({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const compact = useCompact();
  const prev = useRef(value);
  const dir = value >= prev.current ? 1 : -1;
  useEffect(() => {
    prev.current = value;
  }, [value]);
  return (
    <span className="relative inline-flex h-4 min-w-[1ch] overflow-hidden tabular-nums">
      <AnimatePresence custom={dir} initial={false} mode="popLayout">
        <motion.span
          animate={{ y: 0, opacity: 1 }}
          custom={dir}
          exit={reduce ? { opacity: 0 } : { y: dir * -12, opacity: 0 }}
          initial={reduce ? { opacity: 0 } : { y: dir * 12, opacity: 0 }}
          key={value}
          transition={{ duration: 0.18, ease: easeOut }}
        >
          {compact(value)}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Art({ art, className, large }: { art: ProfileArt; className?: string; large?: boolean }) {
  const scene = !art.glyph;
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-linear-to-br text-white",
        hues[art.hue].art,
        className,
      )}
    >
      {scene ? (
        <>
          <span
            className={cn(
              "absolute top-[28%] left-1/2 aspect-square w-[26%] -translate-x-1/2 rounded-full",
              art.hue === "indigo" ? "bg-category-3/11 shadow-[0_0_40px_10px] shadow-category-3/4" : "bg-category-3/12 shadow-[0_0_60px_20px] shadow-category-3/5",
            )}
          />
          <svg aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[46%] w-full" preserveAspectRatio="none" viewBox="0 0 100 40">
            <path className="fill-black/15" d="M0 18 L12 12 L22 16 L34 6 L46 14 L58 9 L70 15 L82 8 L100 14 V40 H0Z" />
            <path className="fill-black/25" d="M0 26 Q20 18 40 24 T80 22 T100 24 V40 H0Z" />
          </svg>
          <span className="absolute inset-0 border-[6px] border-black/10" />
        </>
      ) : (
        <>
          <span className="absolute -top-1/4 -inset-s-1/4 size-3/4 rounded-full bg-white/20 blur-2xl" />
          <span
            className={cn(
              "relative font-heading font-semibold leading-none drop-shadow-sm",
              large ? "text-[min(40cqw,14rem)]" : "text-[min(52cqw,9rem)]",
            )}
          >
            {art.glyph}
          </span>
        </>
      )}
    </span>
  );
}

function RichText({ text }: { text: string }) {
  let offset = 0;
  const parts = text
    .split(/([@#][\w.]+\w)/g)
    .filter(Boolean)
    .map((p) => {
    const at = offset;
    offset += p.length;
    return { at, p };
  });
  return (
    <>
      {parts.map(({ at, p }) =>
        /^[@#]/.test(p) ? (
          <span className="text-info-foreground" key={at}>
            {p}
          </span>
        ) : (
          <Fragment key={at}>{p}</Fragment>
        ),
      )}
    </>
  );
}

function SocialProfileScreen({
  className,
  user,
  posts: initialPosts,
  replies: initialReplies,
  media,
  suggestions = [],
  mutuals = [],
  following: initiallyFollowing = false,
  notify = false,
  muted: initiallyMuted = false,
  streak,
  profileUrl,
  postUrl,
  footerLinks = [],
  copyright,
  onToggleFollow,
  onToggleNotify,
  onToggleMute,
  onReact,
  onFollowSuggestion,
  onBack,
}: SocialProfileProps) {
  const t = useMessages("socialProfile", SOCIAL_PROFILE_MESSAGES);
  const fmt = useFormat();
  const reduce = useReducedMotion();
  const uid = useId().replace(/[^\w-]/g, "");
  const [following, setFollowing] = useState(initiallyFollowing);
  const [bell, setBell] = useState(notify);
  const [tab, setTab] = useState<"posts" | "replies" | "media">("posts");
  const [posts, setPosts] = useState(initialPosts);
  const [replies, setReplies] = useState(initialReplies);
  useEffect(() => setPosts(initialPosts), [initialPosts]);
  useEffect(() => setReplies(initialReplies), [initialReplies]);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [muted, setMuted] = useState(initiallyMuted);
  const flipper = (set: (v: boolean) => void) => ({
    optimistic: (next: boolean) => {
      set(next);
      return () => set(!next);
    },
  });
  const followAction = useAction(onToggleFollow ?? (async () => {}), flipper(setFollowing));
  const notifyAction = useAction(onToggleNotify ?? (async () => {}), flipper(setBell));
  const muteAction = useAction(onToggleMute ?? (async () => {}), flipper(setMuted));
  const suggestAction = useAction(onFollowSuggestion ?? (async () => {}), {
    optimistic: ({ handle, following: on }) => {
      const set = (v: boolean) => setSuggested((all) => (v ? [...all, handle] : all.filter((h) => h !== handle)));
      set(on);
      return () => set(!on);
    },
  });
  const reactAction = useAction(onReact ?? (async () => {}), {
    optimistic: ({ id, kind, on }) => {
      const apply = (v: boolean) => {
        const fn = (all: ProfilePost[]) =>
          all.map((p) => {
            if (p.id !== id) return p;
            if (kind === "like") return { ...p, liked: v, likes: p.likes + (v === Boolean(p.liked) ? 0 : v ? 1 : -1) };
            if (kind === "repost") return { ...p, reposted: v, reposts: p.reposts + (v === Boolean(p.reposted) ? 0 : v ? 1 : -1) };
            return { ...p, bookmarked: v };
          });
        setPosts(fn);
        setReplies(fn);
      };
      apply(on);
      return () => apply(!on);
    },
  });
  const actionError = followAction.error ?? notifyAction.error ?? muteAction.error ?? suggestAction.error ?? reactAction.error;
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);
  const copyProfileLink = () => {
    navigator.clipboard?.writeText(profileUrl).catch(() => {});
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1600);
  };
  const scrollRef = useRef<HTMLDivElement>(null);
  // Sticky elements report their stuck position, so a plain marker above the tabs is measured instead.
  const tabsRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const barBg = useTransform(scrollY, [96, 150], [0, 1]);
  const [compactBar, setCompactBar] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setCompactBar(y > 150));

  const followers = user.followers + (following && !initiallyFollowing ? 1 : 0) - (!following && initiallyFollowing ? 1 : 0);

  const react = (post: ProfilePost, kind: "like" | "repost" | "bookmark") =>
    void reactAction.run({ id: post.id, kind, on: !(kind === "like" ? post.liked : kind === "repost" ? post.reposted : post.bookmarked) }, `${post.id}:${kind}`);
  const toggleFollow = () => {
    if (following && bell) void notifyAction.run(false);
    void followAction.run(!following);
  };

  const switchTab = (t: typeof tab) => {
    setTab(t);
    const el = scrollRef.current;
    const tabs = tabsRef.current;
    if (el && tabs && el.scrollTop > tabs.offsetTop - 56) el.scrollTo({ top: tabs.offsetTop - 56 });
  };

  const mutualText =
    mutuals.length === 0
      ? null
      : mutuals.length === 1
        ? interpolate(t.mutualsOne, { a: mutuals[0] ?? "" })
        : mutuals.length === 2
          ? interpolate(t.mutualsTwo, { a: mutuals[0] ?? "", b: mutuals[1] ?? "" })
          : interpolate(t.mutualsMore, { a: mutuals[0] ?? "", b: mutuals[1] ?? "", count: mutuals.length - 2 });
  const streakCells = (streak?.days ?? []).map((state, n) => ({ key: `day-${n}`, state }));

  return (
    <div
      className={cn(
        "@container relative isolate flex h-190 w-full overflow-hidden bg-background text-foreground text-sm",
        className,
      )}
    >
      <div className="relative min-w-0 flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="mx-auto flex max-w-250 justify-center gap-6">
          <main className="relative w-full max-w-150 min-w-0 @3xl:border-x">
            <div className="sticky top-0 z-20 flex h-14 items-center gap-3 px-3">
              <motion.span aria-hidden className="absolute inset-0 -z-10 border-b bg-background/85 backdrop-blur-md" style={{ opacity: barBg }} />
              {onBack && (
                <Button
                  aria-label={t.back}
                  className={cn(
                    "transition-colors",
                    compactBar ? "" : "bg-black/30 text-white backdrop-blur-sm hover:bg-black/40",
                  )}
                  onClick={onBack}
                  size="icon-sm"
                  variant="ghost"
                >
                  <ArrowLeftIcon />
                </Button>
              )}
              <motion.div className="flex min-w-0 flex-col" style={{ opacity: barBg }}>
                <span className="truncate font-heading font-semibold">{user.name}</span>
                <span className="text-muted-foreground text-xs tabular-nums">{interpolate(t.postsCount, { count: fmt.number(user.posts) })}</span>
              </motion.div>
              <AnimatePresence>
                {compactBar && (
                  <motion.div
                    animate={{ opacity: 1, scale: 1 }}
                    className="ms-auto"
                    exit={{ opacity: 0, scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: easeOut }}
                  >
                    <Button aria-pressed={following} className={press} onClick={toggleFollow} size="sm" variant={following ? "outline" : "default"}>
                      {following ? t.following : t.follow}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Cover />

            <div className="flex flex-col gap-3 px-4 pb-4">
              <div className="flex items-end justify-between gap-3">
                <span className="-mt-12 rounded-full bg-background p-1 @3xl:-mt-14">
                  <Avatar className="[--avatar-size:--spacing(22)] @3xl:[--avatar-size:--spacing(26)]">
                    <AvatarFallback
                      className={cn("bg-linear-to-br font-heading font-semibold text-2xl text-white @3xl:text-3xl", hues.violet.avatar)}
                    >
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </span>
                <div className="flex items-center gap-2 pb-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          aria-label={interpolate(t.moreFor, { handle: user.handle })}
                          className={cn("size-9 rounded-full before:rounded-full sm:size-9", press)}
                          size="icon"
                          variant="outline"
                        />
                      }
                    >
                      <AnimatePresence initial={false} mode="popLayout">
                        <motion.span
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex"
                          exit={{ opacity: 0, scale: 0.8 }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          key={copied ? "copied" : "more"}
                          transition={{ duration: 0.15, ease: easeOut }}
                        >
                          {copied ? <CheckIcon className="text-success-foreground" /> : <EllipsisIcon />}
                        </motion.span>
                      </AnimatePresence>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={copyProfileLink}>
                        <LinkIcon /> {t.copyProfile}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem checked={muted} onCheckedChange={(v) => void muteAction.run(Boolean(v))}>
                        {interpolate(t.mute, { handle: user.handle })}
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <FollowButton bell={bell} following={following} name={user.name} onBell={() => void notifyAction.run(!bell)} onToggle={toggleFollow} t={t} />
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <h2 className="flex items-center gap-1.5 font-heading font-semibold text-xl tracking-tight">
                  {user.name}
                  {user.verified && (
                    <>
                      <BadgeCheckIcon aria-hidden className="size-5 fill-info text-background" />
                      <span className="sr-only">{t.verified}</span>
                    </>
                  )}
                </h2>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{interpolate(t.handle, { handle: user.handle })}</span>
                  {user.followsYou && (
                    <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-[11px] text-muted-foreground">{t.followsYou}</span>
                  )}
                  {muted && (
                    <span className="rounded-md bg-warning/12 px-1.5 py-0.5 font-medium text-[11px] text-warning-foreground">{t.muted}</span>
                  )}
                  <span aria-live="polite" className="sr-only">
                    {copied ? t.profileCopied : ""}
                  </span>
                </div>
              </div>

              <p className="text-pretty leading-relaxed">
                <RichText text={user.bio} />
              </p>

              <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-muted-foreground">
                {user.location ? (
                  <li className="flex items-center gap-1.5">
                    <MapPinIcon aria-hidden className="size-4" />
                    {user.location}
                  </li>
                ) : null}
                {user.website ? (
                  <li className="flex items-center gap-1.5">
                    <LinkIcon aria-hidden className="size-4" />
                    <a className="rounded-sm text-info-foreground underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring" href={`https://${user.website}`} rel="noreferrer" target="_blank">
                      {user.website}
                    </a>
                  </li>
                ) : null}
                <li className="flex items-center gap-1.5">
                  <CalendarDaysIcon aria-hidden className="size-4" />
                  {interpolate(t.joined, { date: fmt.date(`${user.joinedAt}T00:00:00Z`, { month: "long", year: "numeric", timeZone: "UTC" }) })}
                </li>
              </ul>

              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  <span className="font-medium tabular-nums">{fmt.number(user.following)}</span> <span className="text-muted-foreground">{t.followingCount}</span>
                </span>
                <span>
                  <span className="font-medium">
                    <Tween format={(n) => fmt.number(Math.round(n))} value={followers} />
                  </span>{" "}
                  <span className="text-muted-foreground">{t.followersCount}</span>
                </span>
              </div>

              {mutualText && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <span aria-hidden className="flex -space-x-1.5">
                    {mutuals.slice(0, 3).map((m, i) => (
                      <Avatar className="ring-2 ring-background [--avatar-size:--spacing(5)]" key={m}>
                        <AvatarFallback
                          className={cn("bg-linear-to-br font-semibold text-[10px] text-white", hues[(["teal", "sky", "rose"] as const)[i % 3]].avatar)}
                        >
                          {m[0]}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </span>
                  <span className="truncate">{mutualText}</span>
                </div>
              )}
            </div>

            <div aria-hidden ref={tabsRef} />
            <div className="sticky top-14 z-10 border-b bg-background">
              <div aria-label={t.sections} className="flex" role="tablist">
                {(
                  [
                    ["posts", t.posts],
                    ["replies", t.replies],
                    ["media", t.media],
                  ] as const
                ).map(([value, label]) => {
                  const on = tab === value;
                  return (
                    <button
                      aria-controls={`${uid}-panel`}
                      aria-selected={on}
                      className={cn(
                        "relative flex h-12 flex-1 cursor-pointer items-center justify-center outline-none transition-colors hover:bg-accent/60 focus-visible:bg-accent",
                        on ? "font-medium text-foreground" : "text-muted-foreground",
                      )}
                      id={`${uid}-tab-${value}`}
                      key={value}
                      onClick={() => switchTab(value)}
                      onKeyDown={(e) => {
                        const order = ["posts", "replies", "media"] as const;
                        const i = order.indexOf(value);
                        const next = e.key === "ArrowRight" ? order[(i + 1) % 3] : e.key === "ArrowLeft" ? order[(i + 2) % 3] : null;
                        if (next) {
                          e.preventDefault();
                          switchTab(next);
                          document.getElementById(`${uid}-tab-${next}`)?.focus();
                        }
                      }}
                      role="tab"
                      tabIndex={on ? 0 : -1}
                      type="button"
                    >
                      {label}
                      {on && (
                        <motion.span
                          className="absolute bottom-0 left-1/2 h-0.75 w-12 -translate-x-1/2 rounded-full bg-foreground"
                          layoutId={`${uid}-tab`}
                          transition={reduce ? { duration: 0 } : spring}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div aria-labelledby={`${uid}-tab-${tab}`} className="min-h-164" id={`${uid}-panel`} role="tabpanel">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                  key={tab}
                  transition={{ duration: 0.12 }}
                >
                  {tab === "posts" && (
                    <ul className="divide-y">
                      {posts.map((p) => (
                        <PostItem
                          key={p.id}
                          onReact={(kind) => react(p, kind)}
                          onOpenMedia={(art) => {
                            const i = media.findIndex((m) => m.caption === art.caption);
                            if (i >= 0) setLightbox(i);
                          }}
                          post={p}
                          postUrl={postUrl(p.id)}
                          t={t}
                          user={user}
                        />
                      ))}
                    </ul>
                  )}
                  {tab === "replies" && (
                    <ul className="divide-y">
                      {replies.map((p) => (
                        <PostItem key={p.id} onReact={(kind) => react(p, kind)} post={p} postUrl={postUrl(p.id)} t={t} user={user} />
                      ))}
                    </ul>
                  )}
                  {tab === "media" && (
                    <ul className="grid grid-cols-3 gap-1 p-1">
                      {media.map((m, i) => (
                        <li className="@container" key={m.caption}>
                          <button
                            aria-label={interpolate(t.openMedia, { caption: m.caption })}
                            className={cn(
                              "group/media relative block aspect-square w-full cursor-pointer overflow-hidden rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                              press,
                            )}
                            onClick={() => setLightbox(i)}
                            type="button"
                          >
                            <Art art={m} className="size-full transition-transform duration-300 ease-out [@media(hover:hover)]:group-hover/media:scale-[1.03]" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          <aside className="sticky top-0 hidden w-75 shrink-0 flex-col gap-4 self-start py-4 @5xl:flex">
            <section aria-labelledby={`${uid}-sugg`} className="rounded-2xl border bg-card p-4 shadow-xs/5">
              <h3 className="font-heading font-semibold" id={`${uid}-sugg`}>
                {t.youMightLike}
              </h3>
              <ul className="mt-3 flex flex-col gap-3">
                {suggestions.map((s) => {
                  const on = suggested.includes(s.handle);
                  const toggleSuggestion = () => void suggestAction.run({ handle: s.handle, following: !on }, s.handle);
                  return (
                    <li className="flex items-center gap-3" key={s.handle}>
                      <Avatar aria-hidden className="[--avatar-size:--spacing(9)]">
                        <AvatarFallback className={cn("bg-linear-to-br font-semibold text-white text-xs", hues[s.hue].avatar)}>
                          {initials(s.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">{s.name}</span>
                        <span className="truncate text-muted-foreground text-xs">{s.note}</span>
                      </div>
                      <Button
                        aria-pressed={on}
                        className={cn("min-w-22", press)}
                        onClick={toggleSuggestion}
                        size="sm"
                        variant={on ? "ghost" : "outline"}
                      >
                        {on ? t.following : t.follow}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </section>
            {streak ? (
              <section aria-labelledby={`${uid}-alpha`} className="rounded-2xl border bg-card p-4 shadow-xs/5">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-heading font-semibold" id={`${uid}-alpha`}>
                    {streak.title}
                  </h3>
                  <span className="text-muted-foreground text-xs tabular-nums">{interpolate(t.streakProgress, { done: streak.done, total: streak.total })}</span>
                </div>
                <div aria-hidden className="mt-3 grid grid-cols-15 gap-0.75">
                  {streakCells.map((c) => (
                    <span
                      className={cn(
                        "aspect-square rounded-[calc(var(--radius)*0.2)]",
                        c.state === "future" ? "bg-muted" : c.state === "today" ? "bg-category-3/60 ring-2 ring-category-3/18" : c.state === "skipped" ? "bg-muted" : "bg-category-5/80",
                      )}
                      key={c.key}
                    />
                  ))}
                </div>
                {streak.note ? <p className="mt-3 text-muted-foreground text-xs">{streak.note}</p> : null}
              </section>
            ) : null}
            {footerLinks.length || copyright ? (
              <nav aria-label={t.footer} className="flex flex-wrap gap-x-3 gap-y-1 px-4 text-muted-foreground text-xs">
                {footerLinks.map((l) => (
                  <WirefrontLink className="rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring" href={l.href} key={l.href}>
                    {l.label}
                  </WirefrontLink>
                ))}
                {copyright ? <span>{copyright}</span> : null}
              </nav>
            ) : null}
          </aside>
        </div>
      </div>

      {actionError ? (
        <p className="absolute inset-x-4 bottom-4 z-40 rounded-lg border bg-popover px-3 py-2 text-destructive-foreground text-sm shadow-lg" role="alert">
          {actionError}
        </p>
      ) : null}
      <Lightbox index={lightbox} items={media} onChange={setLightbox} onClose={() => setLightbox(null)} t={t} />
    </div>
  );
}

const COVER_LINES = Array.from({ length: 9 }, (_, i) => i);

function Cover() {
  return (
    <div aria-hidden className="relative -mt-14 h-42 overflow-hidden @3xl:h-50">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 90% at 10% 15%, var(--category-3) 0%, transparent 60%), radial-gradient(45% 80% at 88% 0%, var(--category-4) 0%, transparent 65%), radial-gradient(70% 90% at 62% 115%, var(--category-5) 0%, transparent 60%), linear-gradient(120deg, var(--category-7), var(--category-4) 50%, var(--category-5))",
        }}
      />
      <svg aria-hidden="true" className="absolute inset-0 size-full opacity-30 mix-blend-soft-light" preserveAspectRatio="none" viewBox="0 0 600 200">
        {COVER_LINES.map((i) => (
          <path
            d={`M-20 ${40 + i * 18} C 120 ${10 + i * 20}, 260 ${90 + i * 14}, 420 ${40 + i * 18} S 640 ${20 + i * 16}, 640 ${30 + i * 18}`}
            fill="none"
            key={i}
            stroke="white"
            strokeWidth="1.2"
          />
        ))}
      </svg>
      <div className="absolute inset-0 dark:bg-black/15" />
    </div>
  );
}

function FollowButton({
  following,
  bell,
  name,
  onToggle,
  onBell,
  t,
}: {
  t: Messages;
  following: boolean;
  bell: boolean;
  name: string;
  onToggle: () => void;
  onBell: () => void;
}) {
  const reduce = useReducedMotion();
  const filterId = `follow-goo-${useId().replace(/:/g, "")}`;
  const [hover, setHover] = useState(false);
  const pillW = following ? 112 : 92;
  const total = following ? pillW + 44 : pillW;
  const move = reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 30, mass: 0.9 } as const;
  const label = following ? (hover ? t.unfollow : t.following) : t.follow;

  return (
    <motion.div
      animate={{ width: total }}
      className="relative h-9 shrink-0"
      initial={false}
      style={{
        // Opaque colours only: an alpha fill would fringe through the goo threshold.
        ["--goo" as string]: following
          ? "color-mix(in srgb, var(--foreground) 10%, var(--background))"
          : "var(--primary)",
      }}
      transition={move}
    >
      <svg aria-hidden className="absolute size-0">
        <filter colorInterpolationFilters="sRGB" height="200%" id={filterId} width="160%" x="-30%" y="-50%">
          <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="5" />
          <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -12" />
        </filter>
      </svg>
      <span aria-hidden className="absolute inset-0" style={{ filter: `url(#${filterId})` }}>
        <motion.span
          animate={{ width: pillW }}
          className="absolute inset-y-0 inset-e-0 rounded-full bg-(--goo) transition-[background-color] duration-200"
          initial={false}
          transition={move}
        />
        <motion.span
          animate={{ scale: following ? 1 : 0.6 }}
          className="absolute top-0 inset-s-0 size-9 rounded-full bg-(--goo) transition-[background-color] duration-200"
          initial={false}
          transition={move}
        />
      </span>

      <AnimatePresence initial={false}>
        {following && (
          <motion.button
            animate={{ opacity: 1 }}
            aria-label={interpolate(bell ? t.notifyOff : t.notifyOn, { name })}
            aria-pressed={bell}
            className={cn(
              "absolute top-0 inset-s-0 flex size-9 cursor-pointer items-center justify-center rounded-full text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              press,
            )}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            initial={{ opacity: 0 }}
            onClick={onBell}
            transition={{ duration: 0.15, delay: reduce ? 0 : 0.14 }}
            type="button"
          >
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                animate={{ rotate: 0, opacity: 1 }}
                initial={reduce ? { opacity: 0 } : { rotate: bell ? -18 : 0, opacity: 0 }}
                key={bell ? "on" : "off"}
                transition={{ type: "spring", stiffness: 500, damping: 14 }}
              >
                {bell ? <BellRingIcon className="size-4" /> : <BellIcon className="size-4" />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>

      <motion.button
        animate={{ width: pillW }}
        aria-label={interpolate(following ? t.unfollowName : t.followName, { name })}
        aria-pressed={following}
        className={cn(
          "absolute top-0 inset-e-0 flex h-9 cursor-pointer items-center justify-center rounded-full font-medium outline-none transition-[color,scale] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97]",
          following ? (hover ? "text-destructive-foreground" : "text-foreground") : "text-primary-foreground",
        )}
        onBlur={() => setHover(false)}
        onClick={() => {
          onToggle();
          setHover(false);
        }}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
        onPointerLeave={() => setHover(false)}
        initial={false}
        transition={move}
        type="button"
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, filter: "blur(2px)" }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, filter: "blur(2px)" }}
            key={label}
            transition={{ duration: 0.16, ease: easeOut }}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}

function PostItem({
  post,
  user,
  onReact,
  onOpenMedia,
  postUrl,
  t,
}: {
  post: ProfilePost;
  user: ProfileUser;
  onReact: (kind: "like" | "repost" | "bookmark") => void;
  onOpenMedia?: (art: ProfileArt) => void;
  postUrl: string;
  t: Messages;
}) {
  const fmt = useFormat();
  const { now } = useWirefront();
  const compact = useCompact();
  const reposted = Boolean(post.reposted);
  const saved = Boolean(post.bookmarked);
  const age = now().getTime() - new Date(post.at).getTime();
  const when = age < 86_400_000 ? fmt.relative(post.at) : fmt.date(post.at, { month: "short", day: "numeric" });

  const header = (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="truncate font-medium">{user.name}</span>
      {user.verified && (
        <>
          <BadgeCheckIcon aria-hidden className="size-4 shrink-0 fill-info text-background" />
          <span className="sr-only">{t.verified}</span>
        </>
      )}
      <span className="truncate text-muted-foreground">{interpolate(t.handle, { handle: user.handle })}</span>
      <span aria-hidden className="text-muted-foreground">
        ·
      </span>
      <time className="shrink-0 text-muted-foreground" dateTime={post.at}>
        {when}
      </time>
    </div>
  );

  return (
    <li className="flex flex-col gap-2 px-4 py-3.5">
      {post.pinned && (
        <span className="flex items-center gap-1.5 ps-8 font-medium text-muted-foreground text-xs">
          <PinIcon aria-hidden className="size-3.5" /> {t.pinned}
        </span>
      )}
      {post.replyTo && (
        <div className="relative flex gap-3">
          <span aria-hidden className="absolute top-11 -bottom-3.5 inset-s-4.75 w-0.5 rounded-full bg-border" />
          <Avatar aria-hidden className="[--avatar-size:--spacing(10)]">
            <AvatarFallback className={cn("bg-linear-to-br font-semibold text-white text-xs", hues[post.replyTo.hue].avatar)}>
              {initials(post.replyTo.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate font-medium">{post.replyTo.name}</span>
              <span className="truncate text-muted-foreground">{interpolate(t.handle, { handle: post.replyTo.handle })}</span>
            </div>
            <p className="text-pretty">{post.replyTo.text}</p>
          </div>
        </div>
      )}
      <article className="flex gap-3">
        <Avatar aria-hidden className="[--avatar-size:--spacing(10)]">
          <AvatarFallback className={cn("bg-linear-to-br font-heading font-semibold text-white text-xs", hues.violet.avatar)}>
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {header}
          {post.replyTo && (
            <span className="-mt-0.5 text-muted-foreground text-xs">
              {t.replyingTo} <span className="text-info-foreground">{interpolate(t.handle, { handle: post.replyTo.handle })}</span>
            </span>
          )}
          <p className="text-pretty leading-relaxed">
            <RichText text={post.text} />
          </p>
          {post.media && post.media.length > 0 && (
            <div className={cn("mt-1.5 grid gap-1 overflow-hidden rounded-2xl border", post.media.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
              {post.media.map((m) => (
                <button
                  aria-label={interpolate(t.openImage, { caption: m.caption })}
                  className={cn(
                    "@container block cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    post.media && post.media.length > 1 ? "aspect-4/5" : "aspect-16/10",
                  )}
                  disabled={!m.glyph || !onOpenMedia}
                  key={m.caption}
                  onClick={() => onOpenMedia?.(m)}
                  type="button"
                >
                  <Art art={m} className="size-full" />
                </button>
              ))}
            </div>
          )}
          {post.link && (
            <a
              className={cn(
                "mt-1.5 flex overflow-hidden rounded-2xl border outline-none transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring",
              )}
              href={`https://${post.link.domain}`}
              rel="noreferrer"
              target="_blank"
            >
              <span aria-hidden className={cn("flex w-24 shrink-0 items-end gap-0.5 bg-linear-to-br p-2.5 @md:w-32", hues[post.link.hue].art)}>
                {["bg-category-3/12", "bg-category-7", "bg-category-4-strong", "bg-category-6-strong", "bg-category-8-strong"].map((c) => (
                  <span className={cn("h-7 flex-1 rounded-sm ring-1 ring-black/10", c)} key={c} />
                ))}
              </span>
              <span className="flex min-w-0 flex-col justify-center gap-0.5 px-3 py-3">
                <span className="truncate text-muted-foreground text-xs">{post.link.domain}</span>
                <span className="line-clamp-2 font-medium">{post.link.title}</span>
              </span>
            </a>
          )}
          <div className="-ms-2 mt-1 flex items-center justify-between text-muted-foreground">
            <Stat icon={<MessageCircleIcon />} label={interpolate(t.repliesCount, { count: fmt.number(post.replies) })}>
              {compact(post.replies)}
            </Stat>
            <PostAction
              active={reposted}
              activeClass="text-category-2-foreground"
              icon={<Repeat2Icon />}
              label={reposted ? t.undoRepost : t.repost}
              onClick={() => onReact("repost")}
            >
              <Count value={post.reposts} />
            </PostAction>
            <LikeAction count={post.likes} liked={Boolean(post.liked)} onClick={() => onReact("like")} t={t} />
            <Stat icon={<BarChart2Icon />} label={interpolate(t.viewsCount, { count: post.views })}>
              {post.views}
            </Stat>
            <div className="flex">
              <PostAction
                active={saved}
                activeClass="text-info-foreground"
                icon={<BookmarkIcon className={cn(saved && "fill-current")} />}
                label={saved ? t.removeBookmark : t.bookmark}
                onClick={() => onReact("bookmark")}
              />
              <ShareAction t={t} url={postUrl} />
            </div>
          </div>
        </div>
      </article>
    </li>
  );
}

function Stat({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <span aria-label={label} className="flex h-8 items-center gap-1.5 px-2 text-xs tabular-nums [&_svg]:size-4" role="img">
      {icon}
      <span aria-hidden>{children}</span>
    </span>
  );
}

function ShareAction({ url, t }: { url: string; t: Messages }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return (
    <PostAction
      active={copied}
      activeClass="text-success-foreground"
      icon={
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            animate={{ opacity: 1, scale: 1 }}
            className="flex"
            exit={{ opacity: 0, scale: 0.8 }}
            initial={{ opacity: 0, scale: 0.8 }}
            key={copied ? "done" : "share"}
            transition={{ duration: 0.15, ease: easeOut }}
          >
            {copied ? <CheckIcon /> : <ShareIcon />}
          </motion.span>
        </AnimatePresence>
      }
      label={copied ? t.postCopied : t.copyPost}
      toggle={false}
      onClick={() => {
        navigator.clipboard?.writeText(url).catch(() => {});
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1600);
      }}
    />
  );
}

function PostAction({
  icon,
  label,
  children,
  active,
  activeClass,
  onClick,
  toggle = true,
}: {
  icon: ReactNode;
  label: string;
  children?: ReactNode;
  active?: boolean;
  activeClass?: string;
  onClick?: () => void;
  toggle?: boolean;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={toggle && onClick && active !== undefined ? active : undefined}
      className={cn(
        "flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2 text-xs outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4",
        press,
        active && activeClass,
      )}
      onClick={onClick}
      type="button"
    >
      {icon}
      {children}
    </button>
  );
}

function LikeAction({ liked, count, onClick, t }: { liked: boolean; count: number; onClick: () => void; t: Messages }) {
  const reduce = useReducedMotion();
  const [pop, setPop] = useState(0);
  return (
    <button
      aria-label={liked ? t.unlike : t.like}
      aria-pressed={liked}
      className={cn(
        "group/like flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2 text-xs outline-none hover:bg-category-4/10 hover:text-category-4-foreground focus-visible:ring-2 focus-visible:ring-ring",
        press,
        liked && "text-category-4-foreground",
      )}
      onClick={() => {
        if (!liked && !reduce) setPop((p) => p + 1);
        onClick();
      }}
      type="button"
    >
      <span className="relative flex size-4 items-center justify-center">
        <motion.span
          animate={pop ? { scale: [1, 1.3, 1] } : undefined}
          key={pop}
          transition={{ duration: 0.32, times: [0, 0.4, 1], ease: easeOut }}
        >
          <HeartIcon className={cn("size-4 transition-[fill] duration-150", liked && "fill-current")} />
        </motion.span>
        {pop > 0 && (
          <motion.span
            animate={{ scale: 1.9, opacity: 0 }}
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-category-4"
            initial={{ scale: 0.6, opacity: 0.8 }}
            key={`ring-${pop}`}
            transition={{ duration: 0.4, ease: easeOut }}
          />
        )}
      </span>
      <Count value={count} />
    </button>
  );
}

function Lightbox({
  items,
  index,
  onChange,
  onClose,
  t,
}: {
  items: ProfileArt[];
  index: number | null;
  onChange: (i: number) => void;
  onClose: () => void;
  t: Messages;
}) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = index !== null;
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);
  const item = index !== null ? items[index] : null;
  const go = (d: number) => index !== null && onChange((index + d + items.length) % items.length);
  // Escape closes and the arrows step while the viewer is open.
  const keys = useRef({ go, onClose });
  keys.current = { go, onClose };
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") keys.current.onClose();
      if (e.key === "ArrowRight") keys.current.go(1);
      if (e.key === "ArrowLeft") keys.current.go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <AnimatePresence>
      {open && item && (
        <motion.div
          animate={{ opacity: 1 }}
          aria-label={item.caption}
          aria-modal
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/85 p-4 backdrop-blur-sm"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          role="dialog"
          transition={{ duration: 0.2, ease: easeOut }}
        >
          {/* Clicking outside the picture closes it; keyboard users have Escape and the close button. */}
          <button aria-hidden className="absolute inset-0 -z-10 cursor-default" onClick={onClose} tabIndex={-1} type="button" />
          <button
            aria-label={t.close}
            className="absolute top-3 inset-e-3 flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white outline-none hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            <XIcon className="size-4" />
          </button>
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="@container w-full max-w-110"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: easeOut }}
          >
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                animate={{ opacity: 1 }}
                className="@container"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                key={item.caption}
                transition={{ duration: 0.15 }}
              >
                <Art art={item} className="aspect-square w-full rounded-2xl" large />
              </motion.div>
            </AnimatePresence>
          </motion.div>
          <div className="flex items-center gap-3 text-white">
            <button
              aria-label={t.previous}
              className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/10 outline-none hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
              onClick={() => go(-1)}
              type="button"
            >
              <ChevronLeftIcon className="size-4 rtl:rotate-180" />
            </button>
            <span className="min-w-44 text-center text-sm">
              {item.caption}
              <span className="block text-white/60 text-xs tabular-nums">
                {interpolate(t.position, { n: (index ?? 0) + 1, total: items.length })}
              </span>
            </span>
            <button
              aria-label={t.next}
              className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/10 outline-none hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
              onClick={() => go(1)}
              type="button"
            >
              <ChevronRightIcon className="size-4 rtl:rotate-180" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SocialProfile(props: SocialProfileProps) {
  return (
    <ScreenBoundary name="SocialProfile">
      <SocialProfileScreen {...props} />
    </ScreenBoundary>
  );
}
