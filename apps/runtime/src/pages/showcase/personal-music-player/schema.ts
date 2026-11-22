// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const CoverArt = z.enum([
  "sunset",
  "ocean",
  "forest",
  "dusk",
  "citrus",
  "rose",
  "aurora",
  "slate",
]);
export type CoverArt = z.infer<typeof CoverArt>;

export const LyricLine = z
  .object({ /** Seconds from the start. */ time: z.number(), text: z.string() })
  .meta({ id: "LyricLine" });
export type LyricLine = z.infer<typeof LyricLine>;

export const MusicTrack = z
  .object({
    id: z.string(),
    title: z.string(),
    artist: z.string(),
    album: z.string(),
    /** Seconds. */ duration: z.number(),
    /** Generated cover style. */ art: CoverArt,
    lyrics: z.array(LyricLine).optional(),
  })
  .meta({ id: "MusicTrack" });
export type MusicTrack = z.infer<typeof MusicTrack>;

export const MusicPlaylist = z
  .object({
    id: z.string(),
    name: z.string(),
    art: CoverArt,
    trackIds: z.array(z.string()),
  })
  .meta({ id: "MusicPlaylist" });
export type MusicPlaylist = z.infer<typeof MusicPlaylist>;

/** The backend operations this screen calls. Audio itself plays in the builder's media element. */
export const api = defineApi({
  listTracks: {
    method: "GET",
    path: "/music/tracks",
    summary: "Tracks in the library",
    response: z.array(MusicTrack),
  },
  listPlaylists: {
    method: "GET",
    path: "/music/playlists",
    summary: "Your playlists",
    response: z.array(MusicPlaylist),
  },
  listLikedTracks: {
    method: "GET",
    path: "/music/liked",
    summary: "Ids of liked tracks",
    response: z.array(z.string()),
  },
  setLiked: {
    method: "PUT",
    path: "/music/liked/{trackId}",
    summary: "Like or unlike a track",
    params: z.object({ trackId: z.string() }),
    body: z.object({ liked: z.boolean() }),
  },
});
