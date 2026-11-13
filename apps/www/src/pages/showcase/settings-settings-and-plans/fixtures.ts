// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { KeyWithSecret, PlansMember, SettingsAndPlansData } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-10-27T12:00:00.000Z";
export const domain = "ridgeline.app";
const ago = (minutes: number) => new Date(Date.parse(now) - minutes * 60_000).toISOString();

/** What the mocks return for `getSettings`. */
export const getSettings: SettingsAndPlansData = {
  workspace: { name: "Ridgeline", slug: "ridgeline", region: "eu-central" },
  regions: [
    { value: "us-east", label: "US East · Virginia" },
    { value: "eu-central", label: "EU Central · Frankfurt" },
    { value: "ap-northeast", label: "AP Northeast · Tokyo" },
  ],
  preferences: { agents: true, sso: false, digest: true },
  deletionScheduledFor: null,
  members: [
    { id: "m1", name: "Ada Lindqvist", email: "ada@ridgeline.app", role: "owner", lastActiveAt: ago(0), invited: false },
    { id: "m2", name: "Theo Marsh", email: "theo@ridgeline.app", role: "admin", lastActiveAt: ago(12), invited: false },
    { id: "m3", name: "Priya Raman", email: "priya@ridgeline.app", role: "member", lastActiveAt: ago(120), invited: false },
    { id: "m4", name: "Jonah Feld", email: "jonah@ridgeline.app", role: "member", lastActiveAt: ago(1500), invited: false },
    { id: "m5", name: "Sara Whitlock", email: "sara@ridgeline.app", role: "viewer", lastActiveAt: ago(5760), invited: false },
  ],
  seatLimit: 10,
  keys: [
    { id: "k1", name: "Production server", prefix: "rl_test_", last4: "Kd1f", scope: "write", createdAt: "2026-08-02T10:00:00.000Z", lastUsedAt: ago(3) },
    { id: "k2", name: "CI deploys", prefix: "rl_test_", last4: "h8C4", scope: "read", createdAt: "2026-09-18T10:00:00.000Z", lastUsedAt: ago(60) },
    { id: "k3", name: "Analytics export", prefix: "rl_test_", last4: "j9B2", scope: "read", createdAt: "2026-10-01T10:00:00.000Z", lastUsedAt: null },
  ],
  plans: [
    { id: "starter", name: "Starter", pricePerSeat: 0, blurb: "3 seats, 2k runs" },
    { id: "team", name: "Team", pricePerSeat: 24, blurb: "10 seats, 25k runs" },
    { id: "scale", name: "Scale", pricePerSeat: 59, blurb: "Unlimited seats, 250k runs, SSO" },
  ],
  currentPlanId: "team",
  currency: "USD",
  renewsAt: "2026-11-14",
  usage: [
    { id: "runs", label: "Agent runs", used: 18420, limit: 25000, projected: 26300 },
    { id: "seats", label: "Seats", used: 5, limit: 10 },
    { id: "storage", label: "Storage", used: 43.6, limit: 50, unit: "GB" },
  ],
  overagePer1k: 4,
  card: { brand: "Visa", last4: "4417", expMonth: 9, expYear: 2028, holder: "Ada Lindqvist" },
  billingEmail: "billing@ridgeline.app",
  invoices: [
    { id: "in10", number: "INV-2026-0010", issuedAt: "2026-10-14", amount: 120, status: "due", url: "https://invoice.example.com/INV-2026-0010" },
    { id: "in09", number: "INV-2026-0009", issuedAt: "2026-09-14", amount: 120, status: "paid", url: "https://invoice.example.com/INV-2026-0009" },
    { id: "in08", number: "INV-2026-0008", issuedAt: "2026-08-14", amount: 96, status: "failed", url: "https://invoice.example.com/INV-2026-0008" },
    { id: "in07", number: "INV-2026-0007", issuedAt: "2026-07-14", amount: 96, status: "paid", url: "https://invoice.example.com/INV-2026-0007" },
  ],
};

/** What the mocks return for `invite`. */
export const invite: PlansMember = { id: "m_new", name: "sam@ridgeline.app", email: "sam@ridgeline.app", role: "member", lastActiveAt: null, invited: true };

/** What the mocks return for `createKey`. */
export const createKey: KeyWithSecret = {
  key: { id: "k_new", name: "Staging worker", prefix: "rl_test_", last4: "Wq7e", scope: "read", createdAt: now, lastUsedAt: null },
  secret: "rl_test_Xb4Nm8Rt2Kv6Lp9Hd3Wq7e",
};

/** What the mocks return for `scheduleDeletion`. */
export const scheduleDeletion = { scheduledFor: "2026-11-03T12:00:00.000Z" };
