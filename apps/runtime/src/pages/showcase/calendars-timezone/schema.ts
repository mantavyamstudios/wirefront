// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** A preset window, in home-zone hours. */
export const QuickPick = z.object({ id: z.string(), label: z.string(), start: z.number().min(0).max(23), hours: z.number().min(1).max(8) }).meta({ id: "QuickPick" });
export type QuickPick = z.infer<typeof QuickPick>;

/** The chosen meeting window. */
export const MeetingWindow = z.object({ start: z.string(), end: z.string() }).meta({ id: "MeetingWindow" });
export type MeetingWindow = z.infer<typeof MeetingWindow>;

/** The backend operations this screen calls: none; zones and the picked window go to callbacks. */
export const api = defineApi({});
