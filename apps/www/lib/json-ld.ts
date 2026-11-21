import {
  CONTACT_EMAIL,
  GITHUB_PROFILE_URL,
  GITHUB_REPO_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

export const PUBLISHER_JSON_LD = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  email: CONTACT_EMAIL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/brand/avatar-192.jpg`,
    caption: `${SITE_NAME} logo`,
    width: 192,
    height: 192,
  },
  sameAs: [GITHUB_REPO_URL],
  slogan: "Ready-to-wire screens for any backend",
  knowsAbout: [
    "React",
    "shadcn/ui",
    "Tailwind CSS",
    "Responsive UI",
    "UI design",
  ],
  founder: {
    "@type": "Organization",
    name: "Mantavyam Studios",
    sameAs: [GITHUB_PROFILE_URL],
  },
} as const;

export const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "en",
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
    PUBLISHER_JSON_LD,
  ],
};
