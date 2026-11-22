// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

const hex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour, e.g. #3b82f6.");

export const BrandColors = z
  .object({
    primary: hex,
    accent: hex,
    surface: hex,
    border: hex,
    foreground: hex,
  })
  .meta({ id: "BrandColors" });
export type BrandColors = z.infer<typeof BrandColors>;

export const BrandLogo = z
  .object({
    url: z.string(),
    fileName: z.string(),
    bytes: z.number().int().nonnegative(),
  })
  .meta({ id: "BrandLogo" });
export type BrandLogo = z.infer<typeof BrandLogo>;

export const DomainStatus = z
  .enum(["verified", "pending", "unset"])
  .meta({ id: "DomainStatus" });
export type DomainStatus = z.infer<typeof DomainStatus>;

export const EmailSender = z
  .object({
    fromName: z.string().trim().min(1, "Enter a from-name.").max(64),
    replyTo: z.email("Enter a valid email address."),
  })
  .meta({ id: "EmailSender" });
export type EmailSender = z.infer<typeof EmailSender>;

export const Branding = z
  .object({
    logos: z.object({
      light: BrandLogo.nullable(),
      dark: BrandLogo.nullable(),
    }),
    colors: BrandColors,
    domain: z.object({
      name: z.string(),
      status: DomainStatus,
      /** The TXT record value the customer adds to prove ownership. */
      txtRecord: z.string(),
    }),
    email: EmailSender,
  })
  .meta({ id: "Branding" });
export type Branding = z.infer<typeof Branding>;

export const DomainInput = z
  .object({
    name: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        /^([a-z0-9-]+\.)+[a-z]{2,}$/,
        "Enter a domain like workspace.yourcompany.com."
      ),
  })
  .meta({ id: "DomainInput" });
export type DomainInput = z.infer<typeof DomainInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getBranding: {
    method: "GET",
    path: "/workspace/branding",
    summary: "Logos, colours, custom domain and email sender",
    response: Branding,
  },
  uploadLogo: {
    method: "PUT",
    path: "/workspace/branding/logos/{variant}",
    summary: "Replace the light or dark logo (multipart SVG/PNG, max 2 MB)",
    params: z.object({ variant: z.enum(["light", "dark"]) }),
    response: BrandLogo,
  },
  saveColors: {
    method: "PUT",
    path: "/workspace/branding/colors",
    summary: "Save the colour palette",
    body: BrandColors,
  },
  saveDomain: {
    method: "PUT",
    path: "/workspace/branding/domain",
    summary: "Set the custom domain; it starts unverified",
    body: DomainInput,
    errors: { 409: "That domain is used by another workspace" },
  },
  verifyDomain: {
    method: "POST",
    path: "/workspace/branding/domain/verify",
    summary: "Check DNS for the TXT record now",
    response: z.object({ status: DomainStatus }),
  },
  saveEmailSender: {
    method: "PUT",
    path: "/workspace/branding/email",
    summary: "Save the email from-name and reply-to",
    body: EmailSender,
  },
});
