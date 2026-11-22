// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { SsoConfig, SsoProvider, SsoTestResult } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const listSsoProviders: SsoProvider[] = [
  {
    id: "okta",
    name: "Okta",
    description: "Enterprise IdP with SAML 2.0 + SCIM provisioning.",
    inProgressStep: 2,
  },
  {
    id: "google",
    name: "Google Workspace",
    description: "Sign in with corporate Google accounts.",
  },
  {
    id: "azure",
    name: "Azure AD",
    description: "Microsoft Entra ID via SAML or OIDC.",
  },
  {
    id: "saml",
    name: "Generic SAML",
    description: "Any SAML 2.0 compliant identity provider.",
  },
];

export const getSsoConfig: SsoConfig = {
  providerId: "okta",
  acsUrl: "https://app.example.com/api/auth/saml/acme/callback",
  audienceUri: "urn:example:saml:acme",
  mappings: [
    { id: "m1", source: "email", target: "email", required: true },
    { id: "m2", source: "firstName", target: "first_name" },
    { id: "m3", source: "lastName", target: "last_name" },
    { id: "m4", source: "groups", target: "groups" },
  ],
  targetFields: [
    { value: "email", label: "user.email" },
    { value: "first_name", label: "user.firstName" },
    { value: "last_name", label: "user.lastName" },
    { value: "full_name", label: "user.fullName" },
    { value: "groups", label: "user.groups" },
    { value: "role", label: "user.role" },
    { value: "department", label: "user.department" },
    { value: "ignore", label: "(ignore)" },
  ],
  activeSessions: 17,
  enforced: false,
};

export const testSso: SsoTestResult = {
  attributes: {
    nameId: "ada@acme.com",
    email: "ada@acme.com",
    firstName: "Ada",
    lastName: "Lovelace",
    groups: ["engineering", "admins"],
    sessionIndex: "_2f9c…7e1a",
  },
  mapped: 4,
  total: 4,
};
