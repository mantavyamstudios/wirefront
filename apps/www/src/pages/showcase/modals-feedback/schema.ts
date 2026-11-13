// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const FeedbackKind = z.enum(["bug", "idea", "praise"]).meta({ id: "FeedbackKind" });
export type FeedbackKind = z.infer<typeof FeedbackKind>;

/** What "Send feedback" sends (a screenshot, when attached, goes as a separate file part). */
export const FeedbackInput = z
  .object({
    kind: FeedbackKind,
    message: z.string().trim().min(1, "Tell us a little more first.").max(5000),
    includeLogs: z.boolean(),
  })
  .meta({ id: "FeedbackInput" });
export type FeedbackInput = z.infer<typeof FeedbackInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  sendFeedback: {
    method: "POST",
    path: "/feedback",
    summary: "Send feedback to the product team (multipart/form-data: the fields, plus an optional \"screenshot\" file)",
    body: FeedbackInput,
  },
});
