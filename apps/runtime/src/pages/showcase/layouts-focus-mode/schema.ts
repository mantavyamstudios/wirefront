// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ReaderDocument = z.object({ id: z.string(), title: z.string(), href: z.string() }).meta({ id: "ReaderDocument" });
export type ReaderDocument = z.infer<typeof ReaderDocument>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listDocuments: { method: "GET", path: "/documents", summary: "The user's documents for the reader's sidebar", response: z.array(ReaderDocument) },
});
