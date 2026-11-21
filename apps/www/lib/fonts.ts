import { Inter } from "next/font/google";
import localFont from "next/font/local";

/**
 * Primary site font — Inter (variable, 100–900).
 * Used across the entire site (marketing, docs, components, playground).
 */
export const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
});

/**
 * Expressive handwriting accent font — Brisa Pro.
 * Used exclusively for playful cursive scribble annotations on marketing / hero sections.
 */
export const fontBrisaPro = localFont({
  src: "../public/fonts/brisa/BrisaPro-Regular.woff2",
  variable: "--font-brisa-pro",
  display: "swap",
  weight: "400",
  style: "normal",
  fallback: ["cursive", "sans-serif"],
});
