"use client";

import { cn } from "@workspace/ui/lib/utils";

import { useIsClient } from "@/lib/use-is-client";

const Iframe = ({
  name,
  bigScreen = false,
}: {
  name: string;
  bigScreen?: boolean;
}) => {
  // Rendered after hydration only, as before; the page's own origin serves the example.
  const isClient = useIsClient();
  if (!isClient) {
    return null;
  }

  return (
    <iframe
      className={cn("h-125 rounded-md", bigScreen && "w-400")}
      sandbox="allow-scripts allow-forms allow-popups"
      src={`/examples/${name}`}
      title={name}
    />
  );
};

export default Iframe;
