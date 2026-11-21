// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Movement } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const getArrMovement: Movement = {
  start: { label: "Q4 ARR", value: 1640000 },
  steps: [
    { id: "new", label: "New", value: 412000 },
    { id: "expansion", label: "Expansion", value: 184000 },
    { id: "reactivation", label: "Reactivation", value: 38000 },
    { id: "contraction", label: "Contraction", value: -94000 },
    { id: "churn", label: "Churn", value: -126000 },
  ],
  endLabel: "Q1 ARR",
};
