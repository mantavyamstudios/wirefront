import Link from "@/components/site-link";
import manifest from "@/lib/flows/flows.manifest.json";

const FLOW_COUNT = manifest.categories.reduce(
  (count, category) => count + category.subflows.length,
  0
);

/** Landing strip: one link per flow category. */
export function SponsorSection() {
  return (
    <section
      className="text-foreground !pt-0 pb-20 md:pb-28"
      data-theme-section="light"
    >
      <div className="is--md-m container">
        <div className="flex w-full flex-col items-center justify-center text-center">
          {/* Title */}
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center">
            <h2 className="!m-0 text-center !text-3xl !leading-[1.15] !font-normal tracking-[-0.04em] sm:!text-4xl sm:!leading-[1.12] md:!text-5xl md:!leading-[1.08] lg:!text-[56px] lg:!leading-[1.06]">
              {FLOW_COUNT} flows across {manifest.categories.length} categories
            </h2>
          </div>

          {/* Divider 1: Supported by */}
          <div className="mx-auto mt-12 flex h-3 w-full max-w-xl items-center justify-center gap-3 md:mt-16">
            <svg
              className="w-full"
              fill="none"
              height="2"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Divider left</title>
              <rect
                height="1"
                stroke="currentColor"
                strokeDasharray="3 2"
                strokeOpacity="0.18"
                width="100%"
                x="1.08008"
                y="1.3877"
              />
            </svg>
            <p className="!m-0 flex min-w-fit font-mono text-xs tracking-[0.18em] uppercase opacity-40">
              Browse by category
            </p>
            <svg
              className="w-full"
              fill="none"
              height="2"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Divider right</title>
              <rect
                height="1"
                stroke="currentColor"
                strokeDasharray="3 2"
                strokeOpacity="0.18"
                width="100%"
                x="1.08008"
                y="1.3877"
              />
            </svg>
          </div>

          {/* Category links: each glides to its heading on /flows. */}
          <ul className="!my-10 flex w-full !list-none flex-wrap items-center justify-center gap-x-6 gap-y-3 !p-0 md:!my-12 md:gap-x-10">
            {manifest.categories.map((category) => (
              <li key={category.slug}>
                <Link
                  className="flex items-baseline gap-2 !no-underline transition-opacity duration-200 hover:opacity-50"
                  href={`/flows#${category.slug}`}
                >
                  <span className="text-lg tracking-[-0.02em] md:text-2xl">
                    {category.title}
                  </span>
                  <span className="font-mono text-xs opacity-40">
                    {category.subflows.length}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Divider 2: Bottom line */}
          <div className="mx-auto flex h-3 w-full max-w-xl items-center justify-center">
            <svg
              className="w-full"
              fill="none"
              height="2"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Divider bottom</title>
              <rect
                height="1"
                stroke="currentColor"
                strokeDasharray="3 2"
                strokeOpacity="0.18"
                width="100%"
                x="1.08008"
                y="1.3877"
              />
            </svg>
          </div>

          {/* Bottom CTA */}
          <div className="group mt-8 flex cursor-pointer flex-col items-center justify-center gap-1.5 text-center text-sm transition-all ease-in-out sm:flex-row md:mt-10 md:text-base">
            <p className="!m-0 opacity-40">
              Every flow runs live in your browser
            </p>
            <Link
              className="flex cursor-pointer items-center gap-1 pl-1 !font-medium !no-underline opacity-70 transition-opacity hover:opacity-100"
              href="/flows"
            >
              explore flows
              <span className="flex items-center transition-all ease-in-out group-hover:translate-x-1">
                <svg
                  aria-hidden="true"
                  className="lucide lucide-arrow-right size-4"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
