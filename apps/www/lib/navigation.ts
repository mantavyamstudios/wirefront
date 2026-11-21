import manifest from "@/lib/flows/flows.manifest.json";

import {
  COMMUNITY_ISSUES_URL,
  CONTACT_EMAIL,
  GITHUB_PROFILE_URL,
  GITHUB_REPO_URL,
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

/** One link per flow category, scrolling `/flows` to that category's heading. */
const FLOW_CATEGORY_LINKS: NavItem[] = manifest.categories.map((category) => ({
  label: category.title,
  href: `/flows#${category.slug}`,
}));

/**
 * Landing menu "Flows" column: one link per category.
 */
export const NAV_FLOWS: NavItem[] = FLOW_CATEGORY_LINKS;

/**
 * Landing menu "Explore" column items
 */
export const NAV_EXPLORE: NavItem[] = [
  { label: "All Flows", href: "/flows" },
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
    id: "flows",
    title: "Flows",
    links: [{ label: "All Flows", href: "/flows" }, ...FLOW_CATEGORY_LINKS],
  },
  {
    id: "documentation",
    title: "Documentation",
    links: [
      { label: "Introduction", href: "/docs" },
      { label: "Using a flow", href: "/docs/installation" },
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
    href: `${GITHUB_REPO_URL}/blob/main/LICENSE.md`,
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
    label: "devesh",
    href: GITHUB_PROFILE_URL,
    external: true,
    shape: "",
  },
  {
    label: "mishra",
    href: X_PROFILE_URL,
    external: true,
    shape: "round",
  },
];
