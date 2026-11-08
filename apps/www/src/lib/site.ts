// Public origin of the deployed site, used for canonical, Open Graph and
// Twitter URLs. Set VITE_SITE_URL (e.g. https://wirefront.example) at build
// time; without it these URLs stay relative to whatever host serves the app.
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "").replace(/\/$/, "");

export const SITE_NAME = "Wirefront";
export const SITE_TITLE = "Wirefront — production-ready UI screens built on coss-ui";
export const SITE_DESCRIPTION =
  "200 responsive UI screens built on coss-ui, all on the shadcn registry. Press 'c' on any design to see and copy the source.";
export const SITE_AUTHOR = "Mantavyam Studios";

export const LINKS = {
  repo: "https://github.com/mantavyamstudios/wirefront",
  studioGithub: "https://github.com/mantavyamstudios",
  github: "https://github.com/mantavyam",
  website: "https://mantavyam.com",
  booking: "https://cal.com/mantavyam/business",
} as const;
