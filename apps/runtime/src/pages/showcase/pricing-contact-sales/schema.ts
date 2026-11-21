// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const SeatRange = z.enum(["50-100", "100-500", "500-1000", "1000+"]).meta({ id: "SeatRange" });
export type SeatRange = z.infer<typeof SeatRange>;

/** What "Request a call" sends. */
export const SalesInquiry = z
  .object({
    name: z.string().trim().min(1, "Tell us your name.").max(120),
    company: z.string().trim().min(1, "Which company are you with?").max(120),
    email: z.email("Enter a work email address."),
    seats: SeatRange,
    message: z.string().max(4000),
  })
  .meta({ id: "SalesInquiry" });
export type SalesInquiry = z.infer<typeof SalesInquiry>;

/** The backend operations this screen calls. */
export const api = defineApi({
  requestCall: { method: "POST", path: "/sales/inquiries", summary: "Ask sales to get in touch", body: SalesInquiry },
});
