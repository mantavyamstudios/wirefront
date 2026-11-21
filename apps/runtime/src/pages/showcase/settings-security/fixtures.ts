// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Passkey, SecurityOverview } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-20T09:00:00Z";
const ago = (minutes: number) => new Date(Date.parse(now) - minutes * 60_000).toISOString();

export const getSecurity: SecurityOverview = {
  twoFactor: { enabled: true, method: "Authenticator app · paired with 1Password", lastVerifiedAt: ago(120) },
  passkeys: [
    { id: "mbp", name: "MacBook Pro", kind: "computer", detail: "Chrome · macOS Sequoia", lastUsedAt: ago(12) },
    { id: "iphone", name: "iPhone 15 Pro", kind: "phone", detail: "Safari · iOS 18.4", lastUsedAt: ago(60 * 24) },
    { id: "yubikey", name: "YubiKey 5C", kind: "security-key", detail: "Hardware key · USB-C", lastUsedAt: ago(60 * 24 * 3) },
    { id: "ipad", name: 'iPad Pro 11"', kind: "phone", detail: "Safari · iPadOS 18", lastUsedAt: ago(60 * 24 * 14) },
  ],
  sessions: [
    { id: "current", location: "Auckland, NZ", browser: "Chrome 132", os: "macOS", kind: "computer", ip: "203.97.42.18", lastActiveAt: now, current: true },
    { id: "s2", location: "Auckland, NZ", browser: "Safari 18", os: "iOS", kind: "phone", ip: "111.69.224.7", lastActiveAt: ago(120), current: false },
    { id: "s3", location: "Wellington, NZ", browser: "Firefox 132", os: "macOS", kind: "computer", ip: "118.92.5.41", lastActiveAt: ago(60 * 12), current: false },
    { id: "s4", location: "Sydney, AU", browser: "Chrome 131", os: "Windows 11", kind: "computer", ip: "60.241.18.222", lastActiveAt: ago(60 * 24 * 3), current: false },
    { id: "s5", location: "Berlin, DE", browser: "Arc 1.62", os: "macOS", kind: "computer", ip: "94.134.88.9", lastActiveAt: ago(60 * 24 * 12), current: false },
  ],
  recoveryCodesLeft: 8,
};

export const getRecoveryCodes = ["4F2A-9XK7-LM3D", "8H2C-PQ4Z-T1NV", "B9R5-WYK2-JD7E", "C3M8-VL6P-HX4Q", "K7N1-ZB9R-FT2W", "P4S6-DX3J-MV8L", "Q8E2-NH5K-RY9A", "X1U7-AC6T-BG3F"];
export const regenerateRecoveryCodes = ["7T2B-QW9M-ZK4D", "H6N3-LP8R-XC2V", "M1J5-TB7Q-WE9K", "R4V8-YC2N-PD6L", "S9K2-HF5X-JM3B", "U3D7-NA1W-QT8R", "W8L4-EZ6P-BK2C", "Z5G9-RM3T-VY7H"];
export const addPasskey: Passkey = { id: "new", name: "New passkey", kind: "computer", detail: "Chrome · macOS", lastUsedAt: null };
