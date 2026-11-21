import manifest from "@/lib/screens/screens.manifest.json";

import {
  COMMUNITY_ISSUES_URL,
  CONTACT_EMAIL,
  GITHUB_PROFILE_URL,
  GITHUB_REPO_URL,
  STUDIO_URL,
  X_PROFILE_URL,
} from "./site";

export interface NavItem {
  external?: boolean;
  href: string;
  label: string;
}

export interface NavSocialItem {
  href: string;
  label: string;
  shape?: "round" | "square" | "";
  type: "github" | "x" | "community";
}

export interface FooterColumn {
  id: string;
  links: NavItem[];
  title: string;
}

export interface FooterLegalLink extends NavItem {
  shape: "round" | "square";
}

export interface FooterCreatorLink extends NavItem {
  shape?: "round" | "";
}

/** One link per group (`/{group}`), in display order. */
const SCREEN_GROUP_LINKS: NavItem[] = manifest.groups.map((group) => ({
  label: group.title,
  href: `/${group.slug}`,
}));

/**
 * Landing menu "Screens" column: one link per group.
 */
export const NAV_SCREENS: NavItem[] = SCREEN_GROUP_LINKS;

/**
 * Landing menu "Explore" column items
 */
export const NAV_EXPLORE: NavItem[] = [
  { label: "All Screens", href: "/screens" },
  { label: "Documentation", href: "/docs" },
  { label: "Pricing", href: "/pricing" },
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Terms of Service", href: "/legal/terms" },
];

/**
 * Social media links displayed in navigation drawer
 */
export const NAV_SOCIALS: NavSocialItem[] = [
  { label: "GitHub", href: GITHUB_REPO_URL, type: "github", shape: "round" },
  { label: "X", href: X_PROFILE_URL, type: "x", shape: "" },
  {
    label: "Issues",
    href: COMMUNITY_ISSUES_URL,
    type: "community",
    shape: "round",
  },
];

/**
 * Footer link columns
 */
export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    id: "screens",
    title: "Screens",
    links: [{ label: "All Screens", href: "/screens" }, ...SCREEN_GROUP_LINKS],
  },
  {
    id: "documentation",
    title: "Documentation",
    links: [
      { label: "Introduction", href: "/docs" },
      { label: "Installing a screen", href: "/docs/installation" },
      { label: "Wiring a screen", href: "/docs/wiring" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    id: "connect",
    title: "Connect",
    links: [
      { label: "GitHub", href: GITHUB_REPO_URL, external: true },
      { label: "X", href: X_PROFILE_URL, external: true },
      { label: "Report an Issue", href: COMMUNITY_ISSUES_URL, external: true },
      { label: "Email", href: `mailto:${CONTACT_EMAIL}`, external: true },
    ],
  },
];

/**
 * Footer bottom legal pills
 */
export const FOOTER_LEGAL_LINKS: FooterLegalLink[] = [
  {
    label: "License",
    href: `${GITHUB_REPO_URL}/blob/main/LICENSE`,
    external: true,
    shape: "square",
  },
  {
    label: "Terms",
    href: "/legal/terms",
    shape: "round",
  },
  {
    label: "Privacy",
    href: "/legal/privacy",
    shape: "square",
  },
  {
    label: "Issues",
    href: COMMUNITY_ISSUES_URL,
    external: true,
    shape: "round",
  },
];

/**
 * Footer creators attribution
 */
export const FOOTER_CREATORS: FooterCreatorLink[] = [
  {
    label: "mantavyam",
    href: GITHUB_PROFILE_URL,
    external: true,
    shape: "",
  },
  {
    label: "studios",
    href: STUDIO_URL,
    external: true,
    shape: "round",
  },
];
