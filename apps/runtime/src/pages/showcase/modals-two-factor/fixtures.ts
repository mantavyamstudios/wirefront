// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { TotpEnrollment } from "./schema";

/**
 * A QR-shaped placeholder for the showcase: finder patterns and noise, not a
 * scannable code. Your server renders the real one from the otpauth URL.
 */
function placeholderQr() {
  const size = 25;
  const finder = (x: number, y: number) => (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8);
  const noise = (x: number, y: number) => {
    let h = Math.imul((x + 1) ^ 0x9e3779b1, 0x85ebca77) ^ Math.imul(y + 1, 0xc2b2ae35);
    h = Math.imul(h ^ (h >>> 13), 0x27d4eb2f);
    return ((h ^ (h >>> 16)) >>> 0) % 100 < 47;
  };
  const cells: string[] = [];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!finder(x, y) && noise(x, y)) cells.push(`M${x} ${y}h1v1h-1z`);
  const eye = (x: number, y: number) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 ${size + 2} ${size + 2}"><rect x="-1" y="-1" width="${size + 2}" height="${size + 2}" fill="#fff"/><path fill="#000" fill-rule="evenodd" d="${cells.join("")}${eye(0, 0)}${eye(size - 7, 0)}${eye(0, size - 7)}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Demo data for the showcase, the generated mocks and tests. A placeholder secret, not a real credential. */
export const startTotpEnrollment: TotpEnrollment = {
  secret: "H7K39F2NP8L4RTYQ",
  otpauthUrl: "otpauth://totp/Orbit:you@example.com?secret=H7K39F2NP8L4RTYQ&issuer=Orbit",
  qrCodeUrl: placeholderQr(),
  recoveryCodes: ["ZQX-PT4-9KH", "BMC-W2L-31R", "VEY-RF8-Q2A", "JTH-HM5-LD9", "WPN-S62-XB7", "DKE-9F3-VNL", "GRY-7XP-MK2", "TRC-J21-AZ4"],
};

export const account = "you@example.com";
