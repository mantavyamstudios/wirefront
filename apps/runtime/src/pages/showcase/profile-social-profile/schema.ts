// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const SocialHue = z.enum(["amber", "rose", "violet", "teal", "sky", "orange", "emerald", "indigo", "fuchsia"]);
export type SocialHue = z.infer<typeof SocialHue>;

/** Artwork drawn from a glyph and a colour (an empty glyph draws a landscape scene). */
export const SocialArt = z.object({ glyph: z.string(), hue: SocialHue, caption: z.string() }).meta({ id: "SocialArt" });
export type SocialArt = z.infer<typeof SocialArt>;

export const SocialPost = z
  .object({
    id: z.string(),
    text: z.string(),
    /** When it was posted (ISO 8601). */
    at: z.string(),
    pinned: z.boolean().optional(),
    media: z.array(SocialArt).optional(),
    link: z.object({ domain: z.string(), title: z.string(), hue: SocialHue }).optional(),
    replyTo: z.object({ name: z.string(), handle: z.string(), text: z.string(), hue: SocialHue }).optional(),
    replies: z.number().int(),
    reposts: z.number().int(),
    likes: z.number().int(),
    views: z.string(),
    liked: z.boolean().optional(),
    reposted: z.boolean().optional(),
    bookmarked: z.boolean().optional(),
  })
  .meta({ id: "SocialPost" });
export type SocialPost = z.infer<typeof SocialPost>;

export const SocialUser = z
  .object({
    name: z.string(),
    handle: z.string(),
    bio: z.string(),
    location: z.string().optional(),
    website: z.string().optional(),
    /** When they joined (ISO date). */
    joinedAt: z.string(),
    following: z.number().int(),
    followers: z.number().int(),
    posts: z.number().int(),
    verified: z.boolean().optional(),
    followsYou: z.boolean().optional(),
  })
  .meta({ id: "SocialUser" });
export type SocialUser = z.infer<typeof SocialUser>;

export const SocialSuggestion = z.object({ name: z.string(), handle: z.string(), hue: SocialHue, note: z.string() }).meta({ id: "SocialSuggestion" });
export type SocialSuggestion = z.infer<typeof SocialSuggestion>;

export const SocialStreak = z
  .object({ title: z.string(), done: z.number().int(), total: z.number().int(), note: z.string().optional(), days: z.array(z.enum(["done", "skipped", "today", "future"])) })
  .meta({ id: "SocialStreak" });
export type SocialStreak = z.infer<typeof SocialStreak>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getSocialProfile: { method: "GET", path: "/users/{handle}", summary: "A public profile", params: z.object({ handle: z.string() }), response: SocialUser },
  listPosts: { method: "GET", path: "/users/{handle}/posts", summary: "Their posts, newest first", params: z.object({ handle: z.string() }), response: z.array(SocialPost) },
  listReplies: { method: "GET", path: "/users/{handle}/replies", summary: "Their replies, newest first", params: z.object({ handle: z.string() }), response: z.array(SocialPost) },
  listMedia: { method: "GET", path: "/users/{handle}/media", summary: "Their media", params: z.object({ handle: z.string() }), response: z.array(SocialArt) },
  listSuggestions: { method: "GET", path: "/suggestions", summary: "Accounts to follow", response: z.array(SocialSuggestion) },
  setFollowing: { method: "PUT", path: "/users/{handle}/follow", summary: "Follow or unfollow", params: z.object({ handle: z.string() }), body: z.object({ following: z.boolean() }) },
  setNotify: { method: "PUT", path: "/users/{handle}/notify", summary: "Turn post notifications on or off", params: z.object({ handle: z.string() }), body: z.object({ notify: z.boolean() }) },
  setMuted: { method: "PUT", path: "/users/{handle}/mute", summary: "Mute or unmute", params: z.object({ handle: z.string() }), body: z.object({ muted: z.boolean() }) },
  reactToPost: {
    method: "PUT",
    path: "/posts/{id}/reaction",
    summary: "Like, repost or bookmark a post (or undo it)",
    params: z.object({ id: z.string() }),
    body: z.object({ kind: z.enum(["like", "repost", "bookmark"]), on: z.boolean() }),
  },
});
