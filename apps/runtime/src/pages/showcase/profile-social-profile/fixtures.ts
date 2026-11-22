// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type {
  SocialArt,
  SocialPost,
  SocialStreak,
  SocialSuggestion,
  SocialUser,
} from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-10-22T15:00:00Z";

export const getSocialProfile: SocialUser = {
  name: "Wren Halloway",
  handle: "wrenmakes",
  bio: "Illustrator and type nerd. Drawing one letter a day for all of 2026. Running @nightjar.studio with two cats and a lot of tracing paper.",
  location: "Lisbon",
  website: "wrenhalloway.studio",
  joinedAt: "2019-03-04",
  following: 312,
  followers: 18402,
  posts: 1204,
  verified: true,
  followsYou: true,
};

export const listPosts: SocialPost[] = [
  {
    id: "p1",
    pinned: true,
    text: "Day 297 of #letteraday: a lowercase g that took four tries. The ear kept wanting to be a question mark. Prints of the whole alphabet go up in December.",
    at: "2026-10-22T09:00:00Z",
    media: [{ glyph: "g", hue: "amber", caption: "Day 297 · lowercase g" }],
    replies: 48,
    reposts: 212,
    likes: 2318,
    views: "41K",
  },
  {
    id: "p2",
    text: "Hot take: kerning is just vibes with a ruler.",
    at: "2026-10-22T12:00:00Z",
    replies: 96,
    reposts: 140,
    likes: 842,
    views: "18K",
  },
  {
    id: "p3",
    text: "Wrote up how I pull colour palettes out of the old matchbox labels my grandad kept in a biscuit tin. Five palettes, free to use.",
    at: "2026-10-20T16:00:00Z",
    link: {
      domain: "wrenhalloway.studio",
      title: "Palettes from the matchbox drawer",
      hue: "orange",
    },
    replies: 22,
    reposts: 88,
    likes: 604,
    views: "12K",
  },
  {
    id: "p4",
    text: "Studio window at 7am, and the same view at 7pm. I should be drawing but look at it.",
    at: "2026-10-18T16:00:00Z",
    media: [
      { glyph: "", hue: "rose", caption: "Morning" },
      { glyph: "", hue: "indigo", caption: "Dusk" },
    ],
    replies: 31,
    reposts: 45,
    likes: 1290,
    views: "22K",
    liked: true,
  },
  {
    id: "p5",
    text: "Reminder that @mira.draws is running a free lettering session on Sunday. Bring a pencil and low expectations, that’s the whole vibe.",
    at: "2026-10-16T16:00:00Z",
    replies: 9,
    reposts: 64,
    likes: 377,
    views: "8.1K",
  },
];

export const listReplies: SocialPost[] = [
  {
    id: "r1",
    replyTo: {
      name: "Mira Castell",
      handle: "mira.draws",
      text: "What pens are you using for the ink studies? They look so soft.",
      hue: "teal",
    },
    text: "A 0.3 fineliner for outlines and a brush pen that’s about 80% dried out. The dry one is the secret.",
    at: "2026-10-22T14:00:00Z",
    replies: 4,
    reposts: 3,
    likes: 129,
    views: "2.4K",
  },
  {
    id: "r2",
    replyTo: {
      name: "Otto Brennan",
      handle: "ottotype",
      text: "Serif or sans for a bakery that’s been open since 1962?",
      hue: "sky",
    },
    text: "Chunky slab, slightly too tight, like it was hand-painted on the window by someone in a hurry. Bakeries deserve swagger.",
    at: "2026-10-21T16:00:00Z",
    replies: 12,
    reposts: 8,
    likes: 301,
    views: "5.6K",
  },
  {
    id: "r3",
    replyTo: {
      name: "Priya Nair",
      handle: "priyanair",
      text: "Do you plan the whole alphabet or wing it day by day?",
      hue: "fuchsia",
    },
    text: "Wing it, then quietly redraw the ones that don’t match. Q has been redrawn six times. Q knows what it did.",
    at: "2026-10-19T16:00:00Z",
    replies: 6,
    reposts: 2,
    likes: 188,
    views: "3.1K",
  },
];

export const listMedia: SocialArt[] = [
  { glyph: "g", hue: "amber", caption: "Day 297 · lowercase g" },
  { glyph: "&", hue: "violet", caption: "Day 290 · ampersand" },
  { glyph: "R", hue: "teal", caption: "Day 284 · capital R" },
  { glyph: "Q", hue: "rose", caption: "Day 276 · Q, sixth attempt" },
  { glyph: "a", hue: "sky", caption: "Day 268 · double-storey a" },
  { glyph: "M", hue: "orange", caption: "Day 259 · capital M" },
  { glyph: "?", hue: "emerald", caption: "Day 251 · question mark" },
  { glyph: "k", hue: "fuchsia", caption: "Day 243 · lowercase k" },
  { glyph: "S", hue: "indigo", caption: "Day 237 · capital S" },
];

export const listSuggestions: SocialSuggestion[] = [
  {
    name: "Mira Castell",
    handle: "mira.draws",
    hue: "teal",
    note: "Follows you",
  },
  {
    name: "Otto Brennan",
    handle: "ottotype",
    hue: "sky",
    note: "Type designer",
  },
  {
    name: "Nightjar Studio",
    handle: "nightjar.studio",
    hue: "indigo",
    note: "Wren’s studio",
  },
];

export const mutuals = [
  "Mira Castell",
  "Otto Brennan",
  "Priya Nair",
  "Jonah Ifeanyi",
];

/** The last 60 days of the letter-a-day habit, oldest first. */
export const streak: SocialStreak = {
  title: "Letter a day",
  done: 297,
  total: 365,
  note: "The last 60 days. Seven skipped, all of them Mondays.",
  days: Array.from({ length: 60 }, (_, i) =>
    i > 51
      ? "future"
      : i === 51
        ? "today"
        : i % 7 === 3 && i < 49
          ? "skipped"
          : "done"
  ),
};

export const footerLinks = [
  { label: "Terms", href: "#terms" },
  { label: "Privacy", href: "#privacy" },
  { label: "Cookies", href: "#cookies" },
  { label: "Accessibility", href: "#accessibility" },
];
export const copyright = "© 2026 Ripple";
