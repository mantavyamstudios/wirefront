"use client";

import { useState } from "react";

import Link from "@/components/site-link";

import { PRICING_FAQ_ITEMS } from "./pricing-config";

const FaqAnswer = ({ content, title }: { content: string; title: string }) => {
  if (title === "Can I use the screens in commercial apps?") {
    return (
      <p className="pricing-faq__answer p-m">
        Yes. The MIT License allows personal and commercial use; keep the
        copyright and license notice with the code. See the{" "}
        <Link href="/docs/license">License</Link> page.
      </p>
    );
  }

  if (title === "How do I install a screen?") {
    return (
      <p className="pricing-faq__answer p-m">
        Run the shadcn CLI command on the screen&apos;s page, then pass your own
        data in as props. Full steps are in{" "}
        <Link href="/docs/installation">Installing a screen</Link>.
      </p>
    );
  }

  return <p className="pricing-faq__answer p-m">{content}</p>;
};

export const PricingFaq = () => {
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenAccordion((prev) => (prev === index ? null : index));
  };

  return (
    <section className="pricing-faq" id="faq">
      <div className="is--md-m container">
        <div className="pricing-faq__header">
          <p className="eyebrow">FAQ</p>
          <h2 className="h-s">Questions about pricing</h2>
        </div>

        <div className="pricing-faq__list" data-accordion-close-siblings="true">
          {PRICING_FAQ_ITEMS.map((item, index) => {
            const isOpen = openAccordion === index;
            return (
              <div
                className="group w-full border-t border-neutral-400 last:border-b"
                data-accordion-status={isOpen ? "active" : "not-active"}
                key={item.title}
              >
                {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions -- Accordion Toggle */}
                <div
                  className="flex min-h-14 cursor-pointer items-center justify-between py-(--gap-m)"
                  data-accordion-toggle=""
                  data-hover=""
                  onClick={() => toggleAccordion(index)}
                >
                  <h4 className="h-xs">{item.title}</h4>
                  <svg
                    className="size-[0.625em] shrink-0 rotate-0 items-center justify-center transition-transform duration-(--duration-default) ease-(--cubic-default) group-data-[accordion-status=active]:rotate-315"
                    fill="none"
                    viewBox="0 0 13 13"
                    width="100%"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>Toggle</title>
                    <path
                      d="M5.96149 12.0996V6.99217H0.839844V5.20705H5.96149V0.0996094H7.74294V5.20705H12.8398V6.99217H7.74294V12.0996H5.96149Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="relative grid grid-rows-[0fr] overflow-hidden transition-[grid-template-rows] duration-(--duration-default) ease-(--cubic-default) group-data-[accordion-status=active]:grid-rows-[1fr]">
                  <div className="relative flex h-[100000%] flex-col overflow-hidden">
                    <div className="pb-(--gap-l)">
                      <FaqAnswer content={item.content} title={item.title} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
