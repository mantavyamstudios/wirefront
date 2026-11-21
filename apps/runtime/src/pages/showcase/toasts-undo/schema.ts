// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { defineApi } from "@wirefront/ui/wirefront/api";

/** No backend operations: call notifyUndo() after a reversible change; its undo is yours. */
export const api = defineApi({});
