import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/ui/breadcrumb";

import Link from "@/components/site-link";

import { useBlocksSection } from "./blocks-section-context";

interface ComponentPageDocsBreadcrumbProps {
  className?: string;
  title?: string;
}

export const ComponentPageDocsBreadcrumb = ({
  className,
  title,
}: ComponentPageDocsBreadcrumbProps) => {
  const section = useBlocksSection();
  return (
    <div className={className}>
      <Breadcrumb className="flex h-full items-center">
        <BreadcrumbList className="flex h-full flex-nowrap items-center gap-1.5 text-[15px] leading-none font-normal tracking-[-0.01em] text-zinc-500 dark:text-zinc-400">
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="text-inherit hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <Link href={section.basePath}>{section.label}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="opacity-50" />
          <BreadcrumbItem>
            {title ? (
              <BreadcrumbPage className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                {title}
              </BreadcrumbPage>
            ) : (
              <div className="bg-accent h-4 w-28 rounded-md motion-safe:animate-pulse" />
            )}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};
