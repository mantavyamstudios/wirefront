// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { MusicPlaylist, MusicTrack } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const appName = "Murmur";
export const listLikedTracks = ["t2", "t6"];
/** Where the demo starts: the first track, 47 seconds in. */
export const startPosition = 47;

export const listTracks: MusicTrack[] = [
  {
    id: "t1",
    title: "Paper Lanterns",
    artist: "Wren & the Low Tide",
    album: "Harbour Lights",
    duration: 214,
    art: "sunset",
    lyrics: [
      { time: 0, text: "♪" },
      { time: 8, text: "Streetlights hum a song we never learned" },
      { time: 14, text: "Your coat still smells of rain and turning leaves" },
      { time: 20, text: "We count the windows burning on the hill" },
      { time: 26, text: "And name the ones still waiting up for us" },
      { time: 33, text: "Paper lanterns, drifting over water" },
      { time: 39, text: "Every little light a thing we didn't say" },
      { time: 45, text: "Paper lanterns, hold on a little longer" },
      { time: 51, text: "Till the tide comes in and carries them away" },
      { time: 60, text: "♪" },
      { time: 70, text: "The ferry horn is calling out the hour" },
      { time: 76, text: "You laugh the way you did when we were nine" },
      { time: 82, text: "I fold the evening up and keep it small" },
      { time: 88, text: "A pocket full of maybe, one of mine" },
      { time: 96, text: "Paper lanterns, drifting over water" },
      { time: 102, text: "Every little light a thing we didn't say" },
      { time: 108, text: "Paper lanterns, hold on a little longer" },
      { time: 114, text: "Till the tide comes in and carries them away" },
      { time: 124, text: "♪" },
      { time: 140, text: "And if the dark gets heavy, let it" },
      { time: 148, text: "We were never meant to hold the sky" },
      { time: 156, text: "Paper lanterns…" },
      { time: 164, text: "…carry us away" },
      { time: 176, text: "♪" },
    ],
  },
  {
    id: "t2",
    title: "Low Orbit",
    artist: "Pale Static",
    album: "Satellite Summer",
    duration: 187,
    art: "dusk",
    lyrics: [
      { time: 0, text: "♪" },
      { time: 12, text: "Radio static where your voice used to be" },
      { time: 19, text: "I keep the dial right where you left it" },
      { time: 26, text: "Low orbit, circling the kitchen light" },
      { time: 33, text: "Too far to land and too close to forget it" },
      { time: 44, text: "♪" },
      { time: 58, text: "Low orbit, low orbit" },
      { time: 64, text: "Spinning slow so I can see you twice" },
      { time: 76, text: "♪" },
    ],
  },
  {
    id: "t3",
    title: "Fieldnotes",
    artist: "Marisol Vega",
    album: "Green Hours",
    duration: 241,
    art: "forest",
  },
  {
    id: "t4",
    title: "Saltwater Radio",
    artist: "The Quiet Coast",
    album: "Long Weekend",
    duration: 198,
    art: "ocean",
  },
  {
    id: "t5",
    title: "Citrus Season",
    artist: "Bloom Arcade",
    album: "Sugar & Static",
    duration: 176,
    art: "citrus",
  },
  {
    id: "t6",
    title: "Velvet Hour",
    artist: "June Okafor",
    album: "Night Swim",
    duration: 229,
    art: "rose",
  },
  {
    id: "t7",
    title: "Northern Hearts",
    artist: "Atlas Frame",
    album: "Polar",
    duration: 263,
    art: "aurora",
  },
  {
    id: "t8",
    title: "Concrete Garden",
    artist: "Mono Theory",
    album: "Grey Matter",
    duration: 205,
    art: "slate",
  },
  {
    id: "t9",
    title: "Afterglow",
    artist: "Wren & the Low Tide",
    album: "Harbour Lights",
    duration: 192,
    art: "sunset",
  },
];

export const listPlaylists: MusicPlaylist[] = [
  {
    id: "p1",
    name: "Late night drives",
    art: "dusk",
    trackIds: ["t2", "t6", "t7", "t1", "t8"],
  },
  {
    id: "p2",
    name: "Sunday reset",
    art: "citrus",
    trackIds: ["t5", "t3", "t4", "t9"],
  },
  {
    id: "p3",
    name: "Deep focus",
    art: "slate",
    trackIds: ["t8", "t3", "t7", "t4"],
  },
  { id: "p4", name: "Harbour Lights", art: "sunset", trackIds: ["t1", "t9"] },
];

export const links = [
  { label: "Home", href: "#home", current: true },
  { label: "Browse", href: "#browse" },
  { label: "Radio", href: "#radio" },
];
