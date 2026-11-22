// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const SsoProvider = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    /** Set while this provider's setup is part-way through (step 1–4). */
    inProgressStep: z.number().int().min(1).max(4).optional(),
  })
  .meta({ id: "SsoProvider" });
export type SsoProvider = z.infer<typeof SsoProvider>;

export const AttributeMapping = z
  .object({
    id: z.string(),
    /** The attribute name in the IdP's assertion. */
    source: z.string().trim().min(1, "Enter the attribute name."),
    /** One of the target field values, or "ignore". */
    target: z.string(),
    required: z.boolean().optional(),
  })
  .meta({ id: "AttributeMapping" });
export type AttributeMapping = z.infer<typeof AttributeMapping>;

export const SsoConfig = z
  .object({
    providerId: z.string(),
    /** Service-provider endpoints the admin pastes into their IdP. */
    acsUrl: z.string(),
    audienceUri: z.string(),
    mappings: z.array(AttributeMapping),
    /** Fields users can be mapped to, e.g. { value: "email", label: "user.email" }. */
    targetFields: z.array(z.object({ value: z.string(), label: z.string() })),
    /** Password sessions that enforcing SSO would revoke. */
    activeSessions: z.number().int().nonnegative(),
    enforced: z.boolean(),
  })
  .meta({ id: "SsoConfig" });
export type SsoConfig = z.infer<typeof SsoConfig>;

export const SsoTestResult = z
  .object({
    /** The attributes the IdP asserted for the test user. */
    attributes: z.record(z.string(), z.unknown()),
    mapped: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  })
  .meta({ id: "SsoTestResult" });
export type SsoTestResult = z.infer<typeof SsoTestResult>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listSsoProviders: {
    method: "GET",
    path: "/sso/providers",
    summary: "Identity providers you can connect",
    response: z.array(SsoProvider),
  },
  getSsoConfig: {
    method: "GET",
    path: "/sso/config",
    summary: "The SSO setup in progress",
    response: SsoConfig,
  },
  saveMappings: {
    method: "PUT",
    path: "/sso/config/mappings",
    summary: "Save the attribute mapping",
    body: z.array(AttributeMapping),
  },
  testSso: {
    method: "POST",
    path: "/sso/test",
    summary: "Run a test login and return the asserted attributes",
    response: SsoTestResult,
  },
  enforceSso: {
    method: "POST",
    path: "/sso/enforce",
    summary: "Require SSO for every member and revoke password sessions",
    errors: { 409: "Run a successful test first" },
  },
});
