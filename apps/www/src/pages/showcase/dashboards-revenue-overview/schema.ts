// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** The period shown. The previous period of the same length is used for comparisons. */
export const RangeKey = z.enum(["7d", "30d", "90d", "12m"]).meta({ id: "RevenueRangeKey" });
export type RangeKey = z.infer<typeof RangeKey>;

/** What kind of event a moment is; sets its icon and colour. */
export const MomentKind = z.enum(["promo", "pricing", "partner", "incident"]).meta({ id: "MomentKind" });
export type MomentKind = z.infer<typeof MomentKind>;

/** One day's revenue, split by channel key. Amounts are in the provider's currency (major units). */
export const RevenueDay = z
  .object({
    date: z.iso.date(),
    byChannel: z.record(z.string(), z.number().nonnegative()),
  })
  .meta({ id: "RevenueDay" });
export type RevenueDay = z.infer<typeof RevenueDay>;

export const RevenueChannel = z.object({ key: z.string(), label: z.string() }).meta({ id: "RevenueChannel" });
export type RevenueChannel = z.infer<typeof RevenueChannel>;

/** Something that happened and is worth pinning on the line: a sale, a price change, an outage. */
export const RevenueMoment = z
  .object({
    id: z.string(),
    date: z.iso.date(),
    /** Last day, for moments that run over several days. */
    endDate: z.iso.date().optional(),
    kind: MomentKind,
    title: z.string(),
    /** A shorter title for the chart chip. */
    short: z.string().optional(),
    /** How the summary refers to it, e.g. "the spring sale". Moments without one aren't named in the summary. */
    phrase: z.string().optional(),
    note: z.string(),
    /** The channel it affected; its impact is then measured on that channel alone. */
    channel: z.string().optional(),
    /** Which chips win space on a crowded chart (higher first). */
    weight: z.number().optional(),
  })
  .meta({ id: "RevenueMoment" });
export type RevenueMoment = z.infer<typeof RevenueMoment>;

export const RevenueStoryData = z
  .object({
    channels: z.array(RevenueChannel),
    /** Consecutive days, oldest first. Send twice the longest range you offer so comparisons have a previous period. */
    days: z.array(RevenueDay),
    moments: z.array(RevenueMoment),
  })
  .meta({ id: "RevenueStoryData" });
export type RevenueStoryData = z.infer<typeof RevenueStoryData>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getRevenueStory: {
    method: "GET",
    path: "/revenue/story",
    summary: "Daily revenue by channel and the moments logged against it",
    response: RevenueStoryData,
  },
});
