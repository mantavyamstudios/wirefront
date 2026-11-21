import { getDocsPageJsonLd } from "@/lib/docs/docs-json-ld";
import type { Page } from "@/lib/docs/source";

export function DocsPageJsonLd({ page }: { page: Page }) {
  return (
    <>
      {getDocsPageJsonLd(page).map((schema) => (
        <script
          // oxlint-disable-next-line react/no-danger -- JSON-LD requires raw script injection
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replaceAll("<", "\\u003c"),
          }}
          key={schema["@type"]}
          type="application/ld+json"
        />
      ))}
    </>
  );
}
