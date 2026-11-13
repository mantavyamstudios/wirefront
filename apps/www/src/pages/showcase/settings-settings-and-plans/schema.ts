// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const SettingsTab = z.enum(["workspace", "members", "keys", "billing"]).meta({ id: "SettingsTab" });
export type SettingsTab = z.infer<typeof SettingsTab>;
export const MemberRole = z.enum(["owner", "admin", "member", "viewer"]).meta({ id: "PlansMemberRole" });
export type MemberRole = z.infer<typeof MemberRole>;
export const KeyScope = z.enum(["read", "write", "admin"]).meta({ id: "KeyScope" });
export type KeyScope = z.infer<typeof KeyScope>;

export const WorkspaceSettings = z
  .object({
    name: z.string().trim().min(1, "Give your workspace a name."),
    slug: z.string().regex(/^[a-z0-9](?:[a-z0-9-]{1,30})[a-z0-9]$/, "Use 3–32 letters, numbers or dashes."),
    region: z.string(),
  })
  .meta({ id: "WorkspaceSettings" });
export type WorkspaceSettings = z.infer<typeof WorkspaceSettings>;

export const WorkspacePreferences = z
  .object({ agents: z.boolean(), sso: z.boolean(), digest: z.boolean() })
  .meta({ id: "WorkspacePreferences" });
export type WorkspacePreferences = z.infer<typeof WorkspacePreferences>;

export const PlansMember = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
    role: MemberRole,
    lastActiveAt: z.iso.datetime().nullable(),
    invited: z.boolean(),
  })
  .meta({ id: "PlansMember" });
export type PlansMember = z.infer<typeof PlansMember>;

/** A key as listed: never its secret. */
export const PlansKey = z
  .object({ id: z.string(), name: z.string(), prefix: z.string(), last4: z.string().length(4), scope: KeyScope, createdAt: z.iso.datetime(), lastUsedAt: z.iso.datetime().nullable() })
  .meta({ id: "PlansKey" });
export type PlansKey = z.infer<typeof PlansKey>;

export const PlansPlan = z
  .object({ id: z.string(), name: z.string(), pricePerSeat: z.number().min(0), blurb: z.string() })
  .meta({ id: "PlansPlan" });
export type PlansPlan = z.infer<typeof PlansPlan>;

export const PlansUsage = z
  .object({
    id: z.string(),
    label: z.string(),
    used: z.number().min(0),
    limit: z.number().positive(),
    /** Expected by the end of the cycle; shows the projection and overage. */
    projected: z.number().optional(),
    unit: z.string().optional(),
  })
  .meta({ id: "PlansUsage" });
export type PlansUsage = z.infer<typeof PlansUsage>;

export const PlansInvoice = z
  .object({ id: z.string(), number: z.string(), issuedAt: z.iso.date(), amount: z.number(), status: z.enum(["paid", "due", "failed"]), url: z.url().optional() })
  .meta({ id: "PlansInvoice" });
export type PlansInvoice = z.infer<typeof PlansInvoice>;

export const SettingsAndPlansData = z
  .object({
    workspace: WorkspaceSettings,
    regions: z.array(z.object({ value: z.string(), label: z.string() })),
    preferences: WorkspacePreferences,
    /** When a scheduled deletion takes effect; null when none is scheduled. */
    deletionScheduledFor: z.iso.datetime().nullable(),
    members: z.array(PlansMember),
    seatLimit: z.int().min(1),
    keys: z.array(PlansKey),
    plans: z.array(PlansPlan),
    currentPlanId: z.string(),
    /** ISO 4217 code all amounts are in. */
    currency: z.string().length(3),
    /** End of the current cycle: renewal, usage reset and the next invoice. */
    renewsAt: z.iso.date(),
    usage: z.array(PlansUsage),
    /** Price per 1,000 runs over the limit. */
    overagePer1k: z.number().min(0),
    card: z.object({ brand: z.string(), last4: z.string().length(4), expMonth: z.int(), expYear: z.int(), holder: z.string() }).nullable(),
    billingEmail: z.email().nullable(),
    invoices: z.array(PlansInvoice),
  })
  .meta({ id: "SettingsAndPlansData" });
export type SettingsAndPlansData = z.infer<typeof SettingsAndPlansData>;

export const InviteInput = z.object({ email: z.email(), role: MemberRole.exclude(["owner"]) }).meta({ id: "PlansInviteInput" });
export type InviteInput = z.infer<typeof InviteInput>;
export const CreateKeyInput = z.object({ name: z.string().trim().min(1).max(60), scope: KeyScope }).meta({ id: "PlansCreateKeyInput" });
export type CreateKeyInput = z.infer<typeof CreateKeyInput>;
export const KeyWithSecret = z.object({ key: PlansKey, secret: z.string() }).meta({ id: "PlansKeyWithSecret" });
export type KeyWithSecret = z.infer<typeof KeyWithSecret>;

const IdParams = z.object({ id: z.string() });

/** The backend operations this screen calls. */
export const api = defineApi({
  getSettings: { method: "GET", path: "/workspace/settings", summary: "Workspace, members, keys and billing", response: SettingsAndPlansData },
  saveWorkspace: { method: "PATCH", path: "/workspace", summary: "Rename, change the URL or move the data region", body: WorkspaceSettings, errors: { 409: "That URL is taken" } },
  savePreferences: { method: "PUT", path: "/workspace/preferences", summary: "Workspace-wide defaults", body: WorkspacePreferences },
  scheduleDeletion: {
    method: "POST",
    path: "/workspace/deletion",
    summary: "Delete the workspace after a 7-day grace period",
    response: z.object({ scheduledFor: z.iso.datetime() }),
  },
  cancelDeletion: { method: "DELETE", path: "/workspace/deletion", summary: "Cancel a scheduled deletion" },
  invite: { method: "POST", path: "/workspace/invites", summary: "Invite someone", body: InviteInput, response: PlansMember, errors: { 402: "No free seats" } },
  resendInvite: { method: "POST", path: "/workspace/invites/{id}/resend", summary: "Send the invite again", params: IdParams },
  changeRole: { method: "PATCH", path: "/workspace/members/{id}", summary: "Change a member's role", params: IdParams, body: z.object({ role: MemberRole }) },
  removeMember: { method: "DELETE", path: "/workspace/members/{id}", summary: "Remove a member or revoke an invite", params: IdParams },
  createKey: { method: "POST", path: "/workspace/keys", summary: "Create a key; the response holds its secret once", body: CreateKeyInput, response: KeyWithSecret },
  revokeKey: { method: "DELETE", path: "/workspace/keys/{id}", summary: "Revoke a key", params: IdParams },
  changePlan: { method: "POST", path: "/billing/plan", summary: "Switch plans; prorated from today", body: z.object({ planId: z.string() }) },
  retryPayment: { method: "POST", path: "/billing/invoices/{id}/pay", summary: "Charge the card again for a failed invoice", params: IdParams },
});
