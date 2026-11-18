// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `music-player`).
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@wirefront/ui/sheet";
import { Slider } from "@wirefront/ui/slider";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { GripVerticalIcon, HeartIcon, ListMusicIcon, MenuIcon, MicVocalIcon, PauseIcon, PlayIcon, Repeat1Icon, RepeatIcon, ShuffleIcon, SkipBackIcon, SkipForwardIcon, Volume1Icon, Volume2Icon, VolumeXIcon, XIcon } from "lucide-react";
import { AnimatePresence, type DragControls, motion, Reorder, useDragControls, useReducedMotion } from "motion/react";
import { type KeyboardEvent, type ReactNode, type RefObject, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CoverArt, MusicPlaylist, MusicTrack } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("musicPlayer.<key>"). */
export const MUSIC_PLAYER_MESSAGES = {
  seek: "Seek",
  seekValue: "{position} of {duration}",
  remaining: "-{time}",
  reorder: "Reorder {title}. Use arrow keys to move.",
  removeFromQueue: "Remove {title} from queue",
  pause: "Pause",
  play: "Play",
  noLyrics: "No lyrics for this one",
  noLyricsHint: "{artist} hasn’t shared lyrics for “{title}” yet.",
  nowPlaying: "Now playing",
  upNextSummary: "Up next · {count} songs, {minutes} min",
  clear: "Clear",
  queueEmpty: "Queue’s empty",
  queueEmptyHint: "Pick a playlist to keep the music going.",
  main: "Main",
  playlists: "Playlists",
  likedSongs: "Liked songs",
  songsOne: "1 song",
  songs: "{n} songs",
  byline: "{artist} · {album}",
  unlike: "Remove from liked songs",
  like: "Add to liked songs",
  shuffle: "Shuffle",
  previous: "Previous",
  next: "Next",
  repeat: "Repeat",
  repeatAll: "Repeat all",
  repeatOne: "Repeat one",
  mute: "Mute",
  unmute: "Unmute",
  volume: "Volume",
  library: "Library",
  openLibrary: "Open library",
  closeLibrary: "Close library",
  view: "View",
  pane_playing: "Playing",
  pane_queue: "Up next",
  pane_lyrics: "Lyrics",
  sidePanel: "Side panel",
};
type Messages = typeof MUSIC_PLAYER_MESSAGES;
type Pane = "playing" | "queue" | "lyrics";
type Repeat = "off" | "all" | "one";

export interface MusicPlayerProps {
  appName: string;
  tracks: MusicTrack[];
  playlists: MusicPlaylist[];
  /** Ids of liked tracks. */
  likedIds?: string[];
  /** Links in the library sidebar. */
  links?: { label: string; href: string; icon?: ReactNode; current?: boolean }[];
  /** The track shown first; defaults to the first track. */
  initialTrackId?: string;
  /** Playback position of the current track in seconds, from your media element. */
  position: number;
  /** Whether your media element is playing. */
  playing: boolean;
  /** Load and play this track from the start. Called whenever the current track changes. */
  onTrackChange: (trackId: string) => void;
  onPlayingChange: (playing: boolean) => void;
  /** Seek within the current track, in seconds. */
  onSeek: (seconds: number) => void;
  /** Volume from 0 to 100; 0 when muted. */
  onVolumeChange?: (volume: number) => void;
  /** Likes or unlikes a track; shows at once and is undone if this fails. The heart is hidden without it. */
  onToggleLike?: Action<{ trackId: string; liked: boolean }>;
  className?: string;
}

const spring = { type: "spring", stiffness: 520, damping: 46, mass: 1 } as const;
const easeOut = [0.23, 1, 0.32, 1] as const;
const press = "transition-[color,background-color,box-shadow,scale] duration-150 ease-out active:scale-[0.97]";
const ring = "outline-none focus-visible:ring-2 focus-visible:ring-ring";
const PANES: Pane[] = ["playing", "queue", "lyrics"];
const SIDE_PANES = ["lyrics", "queue"] as const;
const EQ_KEYS = ["a", "b", "c"];
const EQ_HEIGHTS = [0.6, 1, 0.75];
const SUN_RAYS = [
  [72, 34],
  [78, 24],
  [84, 15],
  [90, 7],
];
const STARS = [
  [18, 20],
  [34, 12],
  [80, 18],
  [62, 30],
  [12, 44],
  [88, 46],
];
const arts: Record<CoverArt, string> = {
  sunset: "from-category-3/35 via-category-7 to-category-4-strong",
  ocean: "from-category-1/35 via-category-1 to-category-8-strong",
  forest: "from-category-2/35 via-category-2 to-category-6-strong",
  dusk: "from-category-5/60 via-category-5-strong to-category-8-strong",
  citrus: "from-category-3/20 via-category-2/60 to-category-2",
  rose: "from-category-4/20 via-category-4/60 to-category-4-strong",
  aurora: "from-category-6/20 via-category-6 to-category-5-strong",
  slate: "from-muted-foreground via-muted-foreground to-muted-foreground",
};

function useReducedMotionAfterMount() {
  const prefers = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && Boolean(prefers);
}

function MotifShapes({ art }: { art: CoverArt }) {
  switch (art) {
    case "sunset":
      return (
        <>
          <circle className="fill-category-3/11" cx="50" cy="62" r="22" />
          <rect className="fill-category-4-strong/35" height="36" width="100" x="0" y="66" />
          {SUN_RAYS.map(([y = 0, w = 0]) => (
            <rect className="fill-category-3/6" height="1.6" key={y} rx="0.8" width={w} x={50 - w / 2} y={y} />
          ))}
        </>
      );
    case "ocean":
      return (
        <>
          {[52, 62, 72, 82].map((y) => (
            <path className="fill-none stroke-white/40" d={`M-5 ${y} Q 12 ${y - 7} 25 ${y} T 55 ${y} T 85 ${y} T 115 ${y}`} key={y} strokeWidth={2.2 - ((y - 52) / 10) * 0.3} />
          ))}
          <circle className="fill-white/70" cx="74" cy="26" r="7" />
        </>
      );
    case "forest":
      return (
        <>
          <path className="fill-black/25" d="M-10 100 L28 34 L66 100Z" />
          <path className="fill-white/15" d="M30 100 L64 44 L98 100Z" />
          <path className="fill-black/30" d="M55 100 L84 56 L113 100Z" />
        </>
      );
    case "dusk":
      return (
        <>
          {STARS.map(([x, y]) => (
            <circle className="fill-white/70" cx={x} cy={y} key={`${x}-${y}`} r="0.9" />
          ))}
          <circle className="fill-category-3/7" cx="58" cy="58" r="20" />
          <circle className="fill-category-5-strong" cx="66" cy="52" r="17" />
        </>
      );
    case "citrus":
      return (
        <>
          {[34, 26, 18, 10].map((r) => (
            <circle className="fill-none stroke-white/45" cx="36" cy="64" key={r} r={r} strokeWidth="1.6" />
          ))}
          <circle className="fill-category-3/10" cx="36" cy="64" r="5" />
        </>
      );
    case "rose":
      return (
        <>
          <path className="fill-white/20" d="M20 70c-8-22 10-44 32-40s34 26 22 42-46 20-54-2z" />
          <circle className="fill-none stroke-white/55" cx="50" cy="52" r="14" strokeWidth="1.5" />
        </>
      );
    case "aurora":
      return (
        <>
          <path className="fill-none stroke-white/35" d="M-5 40 C 25 20, 55 60, 105 30" strokeWidth="9" />
          <path className="fill-none stroke-category-2/8" d="M-5 58 C 30 38, 60 76, 105 50" strokeWidth="6" />
          <path className="fill-black/30" d="M0 100 L0 84 L18 76 L34 86 L52 72 L70 84 L86 74 L100 82 L100 100Z" />
        </>
      );
    case "slate":
      return (
        <>
          {[20, 40, 60, 80].map((v) => (
            <g key={v}>
              <line className="stroke-white/20" x1={v} x2={v} y1="0" y2="100" />
              <line className="stroke-white/20" x1="0" x2="100" y1={v} y2={v} />
            </g>
          ))}
          <rect className="fill-white/75" height="20" width="20" x="40" y="40" />
        </>
      );
  }
}

function Cover({ art, className }: { art: CoverArt; className?: string }) {
  return (
    <span aria-hidden className={cn("relative block shrink-0 overflow-hidden bg-linear-to-br", arts[art], className)}>
      <svg aria-hidden className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 100 100">
        <MotifShapes art={art} />
      </svg>
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-black/10 ring-inset dark:ring-white/10" />
    </span>
  );
}

/** Track length as m:ss. */
function clock(s: number) {
  const n = Math.max(0, Math.floor(s));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}

/** A stable, seeded waveform per track so it never changes between renders. */
function waveform(seed: string, n: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0;
  return Array.from({ length: n }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0;
    const grit = (h % 1000) / 1000;
    const swell = 0.55 + 0.45 * Math.sin((i / n) * Math.PI * 3.2 + (seed.length % 5));
    const v = 0.18 + 0.82 * (0.45 * swell + 0.55 * grit) * Math.min(1, (i + 2) / 5) * Math.min(1, (n - i + 1) / 5);
    return { key: `b${i}`, h: Math.max(0.12, Math.min(1, v)) };
  });
}

/** A seeded shuffle, so the same queue and shuffle count always give the same order. */
function seededShuffle<T>(list: T[], seed: number) {
  const copy = [...list];
  let h = seed >>> 0 || 1;
  for (let i = copy.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    const a = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = a;
  }
  return copy;
}

function EqBars({ playing, className }: { playing: boolean; className?: string }) {
  const reduce = useReducedMotionAfterMount();
  return (
    <span aria-hidden className={cn("flex h-3 items-end gap-[2px]", className)}>
      {EQ_KEYS.map((key, i) => {
        const h = EQ_HEIGHTS[i] ?? 1;
        return (
        <motion.span animate={playing && !reduce ? { scaleY: [h, 0.3, 1, 0.5, h] } : { scaleY: h * 0.6 }} className="h-3 w-[3px] origin-bottom rounded-full bg-current" key={key} transition={playing && !reduce ? { duration: 1.1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: i * 0.18 } : { duration: 0.2 }} />
        );
      })}
    </span>
  );
}

function Scrubber({ track, position, onSeek, t, bars = 72 }: { track: MusicTrack; position: number; onSeek: (s: number) => void; t: Messages; bars?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const heights = waveform(track.id, bars);
  const pct = Math.min(100, (position / track.duration) * 100);
  const at = (clientX: number) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return 0;
    return Math.min(1, Math.max(0, (clientX - box.left) / box.width));
  };
  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 15 : 5;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") onSeek(Math.min(track.duration - 1, position + step));
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") onSeek(Math.max(0, position - step));
    else if (e.key === "Home") onSeek(0);
    else if (e.key === "End") onSeek(track.duration - 1);
    else return;
    e.preventDefault();
  };
  const layer = (cls: string) => (
    <div className={cn("absolute inset-0 flex items-center gap-[2px]", cls)}>
      {heights.map((b) => (
        <span className="min-w-0 flex-1 rounded-full bg-current" key={b.key} style={{ height: `${Math.round(b.h * 100)}%` }} />
      ))}
    </div>
  );
  return (
    <div className="flex flex-col gap-1.5">
      <div
        aria-label={t.seek}
        aria-valuemax={Math.round(track.duration)}
        aria-valuemin={0}
        aria-valuenow={Math.round(position)}
        aria-valuetext={interpolate(t.seekValue, { position: clock(position), duration: clock(track.duration) })}
        className={cn("group/scrub relative h-12 cursor-pointer touch-none select-none rounded-md", ring, "focus-visible:ring-offset-4 focus-visible:ring-offset-background")}
        dir="ltr"
        onKeyDown={onKey}
        onPointerCancel={() => setDragging(false)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture?.(e.pointerId);
          setDragging(true);
          onSeek(at(e.clientX) * track.duration);
        }}
        onPointerLeave={() => setHover(null)}
        onPointerMove={(e) => {
          const f = at(e.clientX);
          if (dragging) onSeek(f * track.duration);
          if (e.pointerType === "mouse") setHover(f);
        }}
        onPointerUp={() => setDragging(false)}
        ref={ref}
        role="slider"
        tabIndex={0}
      >
        {layer("text-foreground/15")}
        {hover !== null ? layer("text-foreground/35") : null}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>
          {layer("text-foreground")}
        </div>
        {hover !== null ? (
          <div className="pointer-events-none absolute inset-0" style={{ clipPath: `inset(0 ${100 - hover * 100}% 0 0)` }}>
            {layer("text-foreground/35")}
          </div>
        ) : null}
        <span className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 rounded-full bg-foreground" style={{ left: `${pct}%` }} />
        {hover !== null ? (
          <span className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded-md border bg-popover px-1.5 py-0.5 font-medium text-popover-foreground text-xs tabular-nums shadow-md/5" style={{ left: `${hover * 100}%` }}>
            {clock(hover * track.duration)}
          </span>
        ) : null}
      </div>
      <div className="flex justify-between text-muted-foreground text-xs tabular-nums" dir="ltr">
        <span>{clock(position)}</span>
        <span>{interpolate(t.remaining, { time: clock(track.duration - position) })}</span>
      </div>
    </div>
  );
}

function QueueRow({ track, index, total, onPlay, onRemove, onMove, t }: { track: MusicTrack; index: number; total: number; onPlay: () => void; onRemove: () => void; onMove: (dir: -1 | 1) => void; t: Messages }) {
  const controls: DragControls = useDragControls();
  const reduce = useReducedMotionAfterMount();
  return (
    <Reorder.Item as="li" className="group/row relative flex items-center gap-1 rounded-xl bg-background pe-1 [&:has(:focus-visible)]:bg-accent" dragControls={controls} dragListener={false} exit={reduce ? { opacity: 0, transition: { duration: 0.12 } } : { opacity: 0, scale: 0.97, transition: { duration: 0.15, ease: easeOut } }} initial={false} layout={reduce ? undefined : "position"} transition={spring} value={track} whileDrag={{ scale: 1.02, boxShadow: "0 8px 24px -8px rgb(0 0 0 / 0.25)", zIndex: 10 }}>
      <button
        aria-label={interpolate(t.reorder, { title: track.title })}
        className={cn("flex h-12 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-muted-foreground hover:text-foreground active:cursor-grabbing", ring)}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" && index > 0) {
            e.preventDefault();
            onMove(-1);
          } else if (e.key === "ArrowDown" && index < total - 1) {
            e.preventDefault();
            onMove(1);
          }
        }}
        onPointerDown={(e) => controls.start(e)}
        type="button"
      >
        <GripVerticalIcon aria-hidden className="size-4" />
      </button>
      <button className={cn("flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg py-1.5 pe-1 text-start hover:bg-accent/60", ring, press, "active:scale-[0.99]")} onClick={onPlay} type="button">
        <Cover art={track.art} className="size-9 rounded-md" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{track.title}</span>
          <span className="truncate text-muted-foreground text-xs">{track.artist}</span>
        </span>
        <span className="text-muted-foreground text-xs tabular-nums">{clock(track.duration)}</span>
      </button>
      <button aria-label={interpolate(t.removeFromQueue, { title: track.title })} className={cn("relative flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground opacity-100 after:absolute after:-inset-1.5 after:content-[''] hover:bg-accent hover:text-foreground focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/row:opacity-100", ring)} onClick={onRemove} type="button">
        <XIcon aria-hidden className="size-3.5" />
      </button>
    </Reorder.Item>
  );
}

function MusicPlayerScreen({ appName, tracks, playlists, likedIds = [], links = [], initialTrackId, position, playing, onTrackChange, onPlayingChange, onSeek, onVolumeChange, onToggleLike, className }: MusicPlayerProps) {
  const t = useMessages("musicPlayer", MUSIC_PLAYER_MESSAGES);
  const reduce = useReducedMotionAfterMount();
  const volumeId = useId();
  const first = tracks.find((x) => x.id === initialTrackId) ?? tracks[0];
  const [current, setCurrent] = useState<MusicTrack | undefined>(first);
  const [queue, setQueue] = useState<MusicTrack[]>(() => tracks.filter((x) => x.id !== first?.id));
  const [history, setHistory] = useState<MusicTrack[]>([]);
  const [shuffle, setShuffle] = useState(false);
  const [shuffles, setShuffles] = useState(0);
  const [repeat, setRepeat] = useState<Repeat>("off");
  const [liked, setLiked] = useState(likedIds);
  const [syncedLiked, setSyncedLiked] = useState(likedIds);
  if (syncedLiked !== likedIds) {
    setSyncedLiked(likedIds);
    setLiked(likedIds);
  }
  const [volume, setVolume] = useState(72);
  const [muted, setMuted] = useState(false);
  const [side, setSide] = useState<"queue" | "lyrics">("lyrics");
  const [pane, setPane] = useState<Pane>("playing");
  const [direction, setDirection] = useState<1 | -1>(1);
  const [activePlaylist, setActivePlaylist] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const preShuffle = useRef<string[] | null>(null);
  const lyricsRef = useRef<HTMLDivElement>(null);
  const mobileLyricsRef = useRef<HTMLDivElement>(null);

  const goTo = (track: MusicTrack, rest: MusicTrack[], dir: 1 | -1 = 1, pushHistory = true) => {
    if (pushHistory && current) setHistory((h) => [...h, current]);
    setDirection(dir);
    setCurrent(track);
    setQueue(rest);
    onTrackChange(track.id);
  };
  const next = (auto = false) => {
    if (!current) return;
    if (auto && repeat === "one") {
      onSeek(0);
      return;
    }
    const [head, ...rest] = queue;
    if (head) goTo(head, rest);
    else if (repeat === "all" && history[0]) {
      setHistory([]);
      goTo(history[0], [...history.slice(1), current], 1, false);
    } else onPlayingChange(false);
  };
  const prev = () => {
    const last = history.at(-1);
    if (!current || position > 3 || !last) {
      onSeek(0);
      return;
    }
    setHistory((h) => h.slice(0, -1));
    goTo(last, [current, ...queue], -1, false);
  };

  // Move on when the media reaches the end of the track.
  const nextRef = useRef(next);
  nextRef.current = next;
  const ended = Boolean(current && playing && position >= current.duration);
  useEffect(() => {
    if (ended) nextRef.current(true);
  }, [ended]);

  const lyrics = current?.lyrics ?? [];
  const activeLine = lyrics.reduce((acc, l, i) => (l.time <= position ? i : acc), -1);
  // Keep the sung line centred whenever it, the track or the visible panel changes.
  const lyricsKey = `${activeLine}|${current?.id}|${side}|${pane}`;
  const lastLyricsKey = useRef("");
  useLayoutEffect(() => {
    if (lastLyricsKey.current === lyricsKey) return;
    lastLyricsKey.current = lyricsKey;
    for (const box of [lyricsRef.current, mobileLyricsRef.current]) {
      if (!box || box.offsetParent === null) continue;
      const line = box.querySelector<HTMLElement>(`[data-line="${activeLine}"]`);
      if (!line) continue;
      const top = line.offsetTop - box.clientHeight / 2 + line.clientHeight / 2;
      box.scrollTo?.({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
    }
  });

  const toggleShuffle = () => {
    if (!shuffle) {
      preShuffle.current = queue.map((x) => x.id);
      setQueue(seededShuffle(queue, shuffles + 1 + queue.length * 31));
      setShuffles((n) => n + 1);
    } else if (preShuffle.current) {
      const order = preShuffle.current;
      setQueue((q) => [...q].sort((a, b) => (order.indexOf(a.id) + 1 || 999) - (order.indexOf(b.id) + 1 || 999)));
    }
    setShuffle((s) => !s);
  };
  const playFromQueue = (index: number) => {
    const target = queue[index];
    if (!target || !current) return;
    setHistory((h) => [...h, current, ...queue.slice(0, index)]);
    goTo(target, queue.slice(index + 1), 1, false);
    onPlayingChange(true);
  };
  const playList = (id: string, ids: string[]) => {
    const list = ids.map((x) => tracks.find((tr) => tr.id === x)).filter((x): x is MusicTrack => Boolean(x));
    const [head, ...rest] = list;
    if (!head) return;
    setActivePlaylist(id);
    goTo(head, rest);
    onPlayingChange(true);
    setDrawer(false);
  };
  const move = (index: number, dir: -1 | 1) =>
    setQueue((q) => {
      const copy = [...q];
      const [item] = copy.splice(index, 1);
      if (item) copy.splice(index + dir, 0, item);
      return copy;
    });

  const like = useAction(onToggleLike ?? (async () => {}), {
    optimistic: ({ trackId, liked: on }) => {
      const set = (v: boolean) => setLiked((l) => (v ? [...l.filter((x) => x !== trackId), trackId] : l.filter((x) => x !== trackId)));
      set(on);
      return () => set(!on);
    },
  });
  const isLiked = current ? liked.includes(current.id) : false;
  const queueTime = queue.reduce((s, x) => s + x.duration, 0);
  const VolumeIcon = muted || volume === 0 ? VolumeXIcon : volume < 50 ? Volume1Icon : Volume2Icon;

  if (!current) return null;

  const playButton = (size: "lg" | "sm") => (
    <button
      aria-label={playing ? t.pause : t.play}
      className={cn("relative flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs/5 hover:bg-primary/90", ring, "focus-visible:ring-offset-2 focus-visible:ring-offset-background", press, "active:scale-[0.95]", size === "lg" ? "size-14" : "size-9")}
      onClick={() => {
        if (!playing && position >= current.duration) onSeek(0);
        onPlayingChange(!playing);
      }}
      type="button"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} className="flex" exit={{ opacity: 0, scale: 0.7, filter: "blur(2px)" }} initial={{ opacity: 0, scale: 0.7, filter: "blur(2px)" }} key={playing ? "pause" : "play"} transition={{ duration: 0.15, ease: easeOut }}>
          {playing ? <PauseIcon aria-hidden className={cn("fill-current", size === "lg" ? "size-6" : "size-4")} /> : <PlayIcon aria-hidden className={cn("fill-current", size === "lg" ? "ms-0.5 size-6" : "ms-px size-4")} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );

  const iconButton = (label: string, onClick: () => void, icon: ReactNode, active?: boolean, extra?: string) => (
    <button aria-label={label} aria-pressed={active} className={cn("relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-accent [&_svg]:size-5", ring, press, active === undefined || active ? "text-foreground" : "text-muted-foreground hover:text-foreground", extra)} onClick={onClick} type="button">
      {icon}
      {active ? <span aria-hidden className="absolute bottom-1 size-1 rounded-full bg-foreground" /> : null}
    </button>
  );

  const lyricsList = (refObj: RefObject<HTMLDivElement | null>, big?: boolean) =>
    lyrics.length === 0 ? (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
        <span aria-hidden className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <MicVocalIcon className="size-4.5" />
        </span>
        <span className="font-medium">{t.noLyrics}</span>
        <span className="text-pretty text-muted-foreground text-xs">{interpolate(t.noLyricsHint, { artist: current.artist, title: current.title })}</span>
      </div>
    ) : (
      <div className="relative h-full overflow-y-auto px-5 [mask-image:linear-gradient(to_bottom,transparent,#000_15%,#000_85%,transparent)] [scrollbar-width:none]" ref={refObj}>
        <ol className="flex flex-col gap-1 py-[45%]">
          {lyrics.map((l, i) => {
            const state = i === activeLine ? "now" : i < activeLine ? "past" : "next";
            return (
              <li data-line={i} key={l.time}>
                <button
                  aria-current={state === "now" ? "true" : undefined}
                  className={cn("w-full cursor-pointer text-pretty rounded-lg px-2 py-1.5 text-start font-semibold tracking-tight transition-colors duration-300 ease-out hover:text-foreground", ring, big ? "text-2xl" : "text-xl leading-snug", state === "now" && "text-foreground", state === "past" && "text-foreground/70", state === "next" && "text-foreground/85")}
                  onClick={() => {
                    onSeek(l.time);
                    onPlayingChange(true);
                  }}
                  type="button"
                >
                  {l.text}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    );

  const queueList = (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-1 pb-2">
        <span className="font-medium text-muted-foreground text-xs">{t.nowPlaying}</span>
        <div className="mt-1.5 flex items-center gap-3 rounded-xl bg-accent/60 p-1.5 pe-3">
          <Cover art={current.art} className="size-9 rounded-md" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium">{current.title}</span>
            <span className="truncate text-muted-foreground text-xs">{current.artist}</span>
          </span>
          <EqBars className="text-foreground" playing={playing} />
        </div>
      </div>
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <span className="font-medium text-muted-foreground text-xs tabular-nums">{interpolate(t.upNextSummary, { count: queue.length, minutes: Math.round(queueTime / 60) })}</span>
        {queue.length > 0 ? (
          <Button className={press} onClick={() => setQueue([])} size="xs" variant="ghost">
            {t.clear}
          </Button>
        ) : null}
      </div>
      {queue.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 pb-10 text-center">
          <span aria-hidden className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <ListMusicIcon className="size-4.5" />
          </span>
          <span className="font-medium">{t.queueEmpty}</span>
          <span className="text-pretty text-muted-foreground text-xs">{t.queueEmptyHint}</span>
        </div>
      ) : (
        <Reorder.Group axis="y" className="relative min-h-0 flex-1 overflow-y-auto px-2 pb-3" onReorder={setQueue} values={queue}>
          <AnimatePresence initial={false} mode="popLayout">
            {queue.map((x, i) => (
              <QueueRow index={i} key={x.id} onMove={(d) => move(i, d)} onPlay={() => playFromQueue(i)} onRemove={() => setQueue((q) => q.filter((y) => y.id !== x.id))} t={t} total={queue.length} track={x} />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}
    </div>
  );

  const songs = (n: number) => (n === 1 ? t.songsOne : interpolate(t.songs, { n }));
  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-3">
      <div className="flex items-center gap-2.5 px-1.5 pt-1">
        <span aria-hidden className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <EqBars className="text-primary-foreground" playing={false} />
        </span>
        <span className="font-heading font-semibold">{appName}</span>
      </div>
      {links.length ? (
        <nav aria-label={t.main} className="flex flex-col gap-0.5">
          {links.map((n) => (
            <WirefrontLink aria-current={n.current ? "page" : undefined} className={cn("flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-start [&_svg]:size-4 [&_svg]:opacity-80", ring, press, n.current ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")} href={n.href} key={n.href}>
              {n.icon ? (
                <span aria-hidden className="contents">
                  {n.icon}
                </span>
              ) : null}
              {n.label}
            </WirefrontLink>
          ))}
        </nav>
      ) : null}
      <div className="flex min-h-0 flex-col gap-1">
        <span className="px-2.5 font-medium text-muted-foreground text-xs">{t.playlists}</span>
        <button aria-current={activePlaylist === "liked" || undefined} className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg p-1.5 text-start hover:bg-accent", ring, press)} onClick={() => playList("liked", liked)} type="button">
          <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-md bg-linear-to-br from-category-4/60 to-category-5 text-white">
            <HeartIcon className="size-4 fill-current" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className={cn("truncate", activePlaylist === "liked" && "font-medium")}>{t.likedSongs}</span>
            <span className="text-muted-foreground text-xs tabular-nums">{songs(liked.length)}</span>
          </span>
          {activePlaylist === "liked" ? <EqBars className="me-1.5 text-foreground" playing={playing} /> : null}
        </button>
        {playlists.map((p) => (
          <button aria-current={activePlaylist === p.id || undefined} className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg p-1.5 text-start hover:bg-accent", ring, press)} key={p.id} onClick={() => playList(p.id, p.trackIds)} type="button">
            <Cover art={p.art} className="size-9 rounded-md" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className={cn("truncate", activePlaylist === p.id && "font-medium")}>{p.name}</span>
              <span className="text-muted-foreground text-xs tabular-nums">{songs(p.trackIds.length)}</span>
            </span>
            {activePlaylist === p.id ? <EqBars className="me-1.5 text-foreground" playing={playing} /> : null}
          </button>
        ))}
      </div>
    </div>
  );

  const nowPlaying = (
    <div className="flex w-full max-w-md flex-col gap-5 @3xl:gap-6">
      <div className="relative mx-auto aspect-square w-full max-w-[min(100%,300px)] @3xl:max-w-[320px]">
        <AnimatePresence initial={false}>
          <motion.div animate={{ opacity: 1 }} aria-hidden className="absolute inset-4 -z-10" exit={{ opacity: 0 }} initial={{ opacity: 0 }} key={current.id} transition={{ duration: 0.5, ease: "easeInOut" }}>
            <Cover art={current.art} className="size-full scale-110 rounded-full opacity-45 blur-3xl dark:opacity-35" />
          </motion.div>
        </AnimatePresence>
        <AnimatePresence custom={direction} initial={false} mode="popLayout">
          <motion.div animate={{ opacity: 1, x: 0, scale: playing ? 1 : 0.96 }} className="size-full" exit={reduce ? { opacity: 0 } : { opacity: 0, x: -direction * 32, scale: 0.94 }} initial={reduce ? { opacity: 0 } : { opacity: 0, x: direction * 32, scale: 0.94 }} key={current.id} transition={{ duration: 0.28, ease: easeOut }}>
            <Cover art={current.art} className="size-full rounded-2xl shadow-lg/15" />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div animate={{ opacity: 1, y: 0 }} className="flex min-w-0 flex-col gap-0.5" exit={{ opacity: 0, y: reduce ? 0 : -4, transition: { duration: 0.1, ease: easeOut } }} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }} key={current.id} transition={{ duration: 0.2, ease: easeOut }}>
              <h2 className="truncate font-heading font-semibold text-xl tracking-tight">{current.title}</h2>
              <p className="truncate text-muted-foreground">{interpolate(t.byline, { artist: current.artist, album: current.album })}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        {onToggleLike ? (
          <button aria-label={isLiked ? t.unlike : t.like} aria-pressed={isLiked} className={cn("flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-accent", ring, press, isLiked ? "text-category-4-foreground" : "text-muted-foreground hover:text-foreground")} onClick={() => like.run({ trackId: current.id, liked: !isLiked }, current.id)} type="button">
            <motion.span animate={isLiked && !reduce ? { scale: [1, 1.25, 1] } : { scale: 1 }} className="flex" key={String(isLiked)} transition={{ duration: 0.3, ease: easeOut }}>
              <HeartIcon aria-hidden className={cn("size-5", isLiked && "fill-current")} />
            </motion.span>
          </button>
        ) : null}
      </div>
      {like.error ? (
        <p className="-mt-3 text-destructive text-xs" role="alert">
          {like.error}
        </p>
      ) : null}

      <Scrubber onSeek={onSeek} position={position} t={t} track={current} />

      <div className="flex items-center justify-between">
        {iconButton(t.shuffle, toggleShuffle, <ShuffleIcon aria-hidden />, shuffle)}
        <div className="flex items-center gap-2">
          {iconButton(t.previous, prev, <SkipBackIcon aria-hidden className="fill-current rtl:-scale-x-100" />)}
          {playButton("lg")}
          {iconButton(t.next, () => next(), <SkipForwardIcon aria-hidden className="fill-current rtl:-scale-x-100" />)}
        </div>
        {iconButton(repeat === "one" ? t.repeatOne : repeat === "all" ? t.repeatAll : t.repeat, () => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")), repeat === "one" ? <Repeat1Icon aria-hidden /> : <RepeatIcon aria-hidden />, repeat !== "off")}
      </div>

      <div className="flex items-center gap-2 text-muted-foreground">
        {iconButton(
          muted ? t.unmute : t.mute,
          () => {
            onVolumeChange?.(muted ? volume : 0);
            setMuted((m) => !m);
          },
          <VolumeIcon aria-hidden className="!size-4.5" />,
          undefined,
          "size-8 text-muted-foreground",
        )}
        <span className="sr-only" id={volumeId}>
          {t.volume}
        </span>
        <Slider
          aria-labelledby={volumeId}
          className="flex-1 [&_[data-slot=slider-control]]:min-w-0"
          max={100}
          onValueChange={(v) => {
            const next = Array.isArray(v) ? (v[0] ?? 0) : (v as number);
            setVolume(next);
            setMuted(false);
            onVolumeChange?.(next);
          }}
          value={muted ? 0 : volume}
        />
        <span className="w-7 text-end text-xs tabular-nums">{muted ? 0 : volume}</span>
      </div>
    </div>
  );

  return (
    <div className={cn("@container relative isolate flex h-svh w-full overflow-hidden bg-background text-foreground text-sm", className)}>
      <aside className="hidden w-60 shrink-0 overflow-y-auto border-e bg-muted/40 @5xl:block">{sidebar}</aside>

      <Sheet onOpenChange={setDrawer} open={drawer}>
        <SheetContent className="w-72 max-w-[85%] gap-0 overflow-y-auto p-0" showCloseButton={false} side="left">
          <SheetTitle className="sr-only">{t.library}</SheetTitle>
          <Button aria-label={t.closeLibrary} className="absolute end-3 top-3" onClick={() => setDrawer(false)} size="icon-sm" variant="ghost">
            <XIcon />
          </Button>
          {sidebar}
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 px-3 @5xl:hidden">
          <Button aria-label={t.openLibrary} onClick={() => setDrawer(true)} size="icon-sm" variant="ghost">
            <MenuIcon />
          </Button>
          <span className="font-heading font-semibold">{appName}</span>
          <fieldset className="relative m-0 ms-auto flex h-8 min-w-0 items-center rounded-lg border-0 bg-muted p-0.5 @3xl:hidden">
            <legend className="sr-only">{t.view}</legend>
            {PANES.map((p) => (
              <button aria-pressed={pane === p} className={cn("relative flex h-7 cursor-pointer items-center rounded-md px-2.5 font-medium text-xs", ring)} key={p} onClick={() => setPane(p)} type="button">
                {pane === p ? <motion.span className="absolute inset-0 rounded-md bg-background shadow-xs/5 dark:bg-input" layoutId="mp-pane" transition={reduce ? { duration: 0 } : spring} /> : null}
                <span className={cn("relative transition-colors", pane === p ? "text-foreground" : "text-muted-foreground")}>{t[`pane_${p}`]}</span>
              </button>
            ))}
          </fieldset>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className={cn("min-w-0 flex-1 overflow-y-auto px-5 pt-4 pb-8 @3xl:flex @3xl:items-center @3xl:justify-center @3xl:px-8 @3xl:py-8", pane === "playing" ? "flex justify-center" : "hidden")}>{nowPlaying}</main>

          {pane !== "playing" ? (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col @3xl:hidden">
              <div className="min-h-0 flex-1">{pane === "queue" ? queueList : lyricsList(mobileLyricsRef, true)}</div>
            </div>
          ) : null}

          <aside className="hidden w-80 shrink-0 flex-col border-s @3xl:flex">
            <fieldset className="m-0 flex h-13 shrink-0 items-center gap-0.5 border-0 p-0 px-3">
              <legend className="sr-only">{t.sidePanel}</legend>
              {SIDE_PANES.map((p) => (
                <button aria-pressed={side === p} className={cn("relative flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 font-medium [&_svg]:size-4", ring)} key={p} onClick={() => setSide(p)} type="button">
                  {side === p ? <motion.span className="absolute inset-0 rounded-lg bg-accent" layoutId="mp-side" transition={reduce ? { duration: 0 } : spring} /> : null}
                  <span className={cn("relative flex items-center gap-1.5 transition-colors", side === p ? "text-foreground" : "text-muted-foreground")}>
                    {p === "lyrics" ? <MicVocalIcon aria-hidden /> : <ListMusicIcon aria-hidden />}
                    {t[`pane_${p}`]}
                    {p === "queue" ? <span className="text-muted-foreground text-xs tabular-nums">{queue.length}</span> : null}
                  </span>
                </button>
              ))}
            </fieldset>
            <div className="min-h-0 flex-1">{side === "queue" ? queueList : lyricsList(lyricsRef)}</div>
          </aside>
        </div>

        <AnimatePresence initial={false}>
          {pane !== "playing" ? (
            <motion.div animate={{ y: 0, opacity: 1 }} className="relative shrink-0 border-t bg-background @3xl:hidden" exit={{ y: 12, opacity: 0, transition: { duration: 0.15 } }} initial={reduce ? { opacity: 0 } : { y: 12, opacity: 0 }} transition={{ duration: 0.22, ease: easeOut }}>
              <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-muted">
                <span className="block h-full origin-left bg-primary transition-transform duration-250 ease-linear rtl:origin-right" style={{ transform: `scaleX(${Math.min(1, position / current.duration)})` }} />
              </span>
              <div className="flex items-center gap-3 px-3 py-2.5">
                <button className={cn("flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg text-start", ring)} onClick={() => setPane("playing")} type="button">
                  <Cover art={current.art} className="size-10 rounded-md" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{current.title}</span>
                    <span className="truncate text-muted-foreground text-xs">{current.artist}</span>
                  </span>
                </button>
                {playButton("sm")}
                {iconButton(t.next, () => next(), <SkipForwardIcon aria-hidden className="fill-current rtl:-scale-x-100" />)}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function MusicPlayer(props: MusicPlayerProps) {
  return (
    <ScreenBoundary name="MusicPlayer">
      <MusicPlayerScreen {...props} />
    </ScreenBoundary>
  );
}
