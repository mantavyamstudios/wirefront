// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { BrandColors, BrandLogo, Branding } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const defaultColors: BrandColors = { primary: "#0a0a0a", accent: "#8b5cf6", surface: "#ffffff", border: "#e4e4e7", foreground: "#0a0a0a" };

export const getBranding: Branding = {
  logos: { light: null, dark: null },
  colors: defaultColors,
  domain: { name: "workspace.acme.io", status: "pending", txtRecord: "_acme-verify=abc123def456" },
  email: { fromName: "Acme", replyTo: "noreply@acme.io" },
};

export const uploadLogo: BrandLogo = { url: "#logo", fileName: "acme-light.svg", bytes: 4300 };
export const verifyDomain = { status: "verified" as const };
export const presets = ["#0a0a0a", "#ffffff", "#fafafa", "#e4e4e7", "#71717a", "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b", "#22c55e", "#06b6d4"];
