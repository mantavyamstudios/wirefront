import { cn } from "@workspace/ui/lib/utils";
import Image from "next/image";

const sizes = {
  sm: "size-7",
  md: "size-8",
};

/**
 * The site mark: the owner's GitHub avatar, refreshed on every build
 * (scripts/fetch-avatar.mts).
 */
export const SiteLogo = ({
  className,
  size = "sm",
}: {
  className?: string;
  size?: keyof typeof sizes;
}) => (
  <Image
    alt="Wirefront"
    className={cn(
      "ring-border/60 shrink-0 rounded-lg object-cover ring-1",
      sizes[size],
      className
    )}
    height={128}
    src="/brand/avatar-128.jpg"
    width={128}
  />
);
