// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const LocalePrefs = z
  .object({
    /** BCP 47 tag, e.g. "en-GB". */
    language: z.string(),
    /** IANA time zone, e.g. "Europe/Berlin". */
    timeZone: z.string(),
    firstDay: z.enum(["sun", "mon", "sat"]),
    dateFormat: z.enum(["mdy-slash", "dmy-slash", "iso", "med"]),
    timeFormat: z.enum(["h12", "h24"]),
    /** ISO 4217 code, e.g. "EUR". */
    currency: z.string().length(3),
    numberFormat: z.enum(["us", "eu", "fr"]),
  })
  .meta({ id: "LocalePrefs" });
export type LocalePrefs = z.infer<typeof LocalePrefs>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getLocalePrefs: { method: "GET", path: "/me/locale", summary: "The signed-in user's language and formatting preferences", response: LocalePrefs },
  saveLocalePrefs: { method: "PUT", path: "/me/locale", summary: "Save language and formatting preferences", body: LocalePrefs },
});
