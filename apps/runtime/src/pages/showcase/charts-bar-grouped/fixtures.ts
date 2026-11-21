// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { PeriodComparison } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const getPeriodComparison: PeriodComparison = {
  series: [
    { id: "y2024", label: "2024" },
    { id: "y2025", label: "2025" },
    { id: "y2026", label: "2026" },
  ],
  rows: [
    { label: "Q1", values: { y2024: 124000, y2025: 186000, y2026: 254000 } },
    { label: "Q2", values: { y2024: 142000, y2025: 218000, y2026: 312000 } },
    { label: "Q3", values: { y2024: 168000, y2025: 244000, y2026: 378000 } },
    { label: "Q4", values: { y2024: 191000, y2025: 281000, y2026: null } },
  ],
};
