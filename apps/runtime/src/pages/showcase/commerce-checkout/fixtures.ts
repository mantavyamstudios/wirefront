// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { CheckoutCountry, CheckoutItem, CheckoutShipping } from "./schema";

/** The demo clock. */
export const now = "2026-10-24T10:00:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const storeName = "Hearth Goods";
export const taxRate = 0.0825;
/** A card number that passes the format check; the demo takes no payment. */
export const testCard = "4242 4242 4242 4242";

export const getCart: CheckoutItem[] = [
  { id: "i1", name: "Speckled stoneware mug", variant: "Oat · 350 ml", price: 28, qty: 2, art: "mug" },
  { id: "i2", name: "Waxed canvas tote", variant: "Moss", price: 64, qty: 1, art: "tote" },
  { id: "i3", name: "Cedar & smoke candle", variant: "220 g", price: 32, qty: 1, art: "candle" },
];

export const listShippingOptions: CheckoutShipping[] = [
  { id: "standard", label: "Standard", eta: "Thu 29 Oct – Mon 2 Nov", price: 0, icon: "standard" },
  { id: "express", label: "Express", eta: "Tue 27 Oct", price: 9, icon: "express" },
  { id: "next", label: "Next day", eta: "Mon 26 Oct, order in 3h", price: 18, icon: "next" },
];

export const countries: CheckoutCountry[] = [
  { code: "US", name: "United States", regions: ["California", "Colorado", "Illinois", "Massachusetts", "New York", "Oregon", "Texas", "Washington"], regionLabel: "State", postPattern: "^\\d{5}(-\\d{4})?$", postLabel: "ZIP code", postHint: "5 digits, like 97205" },
  { code: "CA", name: "Canada", regions: ["Alberta", "British Columbia", "Manitoba", "Nova Scotia", "Ontario", "Quebec"], regionLabel: "Province", postPattern: "^[A-Za-z]\\d[A-Za-z] ?\\d[A-Za-z]\\d$", postLabel: "Postal code", postHint: "Like K1A 0B1" },
  { code: "GB", name: "United Kingdom", postPattern: "^[A-Za-z]{1,2}\\d[A-Za-z\\d]? ?\\d[A-Za-z]{2}$", postLabel: "Postcode", postHint: "Like SW1A 1AA" },
  { code: "AU", name: "Australia", regions: ["New South Wales", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia"], regionLabel: "State", postPattern: "^\\d{4}$", postLabel: "Postcode", postHint: "4 digits" },
];

export const applyPromo = { code: "HEARTH10", percentOff: 0.1 };
export const placeOrder = { orderNo: "HG-48213" };
