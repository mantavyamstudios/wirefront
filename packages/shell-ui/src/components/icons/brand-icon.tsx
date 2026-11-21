import { cn } from "@workspace/ui/lib/utils";

const sizes = {
  xs: "size-5.5",
  sm: "size-7",
  md: "size-8",
  lg: "size-12",
  xl: "size-14",
};

/** Enterprise UI Playground "Slot tile" mark (brand/svg/mark-ink.svg). */
export const BRAND_LOGO_PATH =
  "M12 2H36C41.52 2 46 6.48 46 12V36C46 41.52 41.52 46 36 46H12C6.48 46 2 41.52 2 36V12C2 6.48 6.48 2 12 2ZM11 8C9.9 8 9 8.9 9 10V28C9 29.1 9.9 30 11 30H19C20.1 30 21 29.1 21 28V25H27V38C27 39.1 27.9 40 29 40H37C38.1 40 39 39.1 39 38V20C39 18.9 38.1 18 37 18H29C27.9 18 27 18.9 27 20H21V10C21 8.9 20.1 8 19 8Z";

/** The mark's own box, tight around the tile. */
export const BRAND_LOGO_VIEWBOX = "2 2 44 44";

export function BrandIcon({
  size = "sm",
  className,
  ...props
}: {
  size?: keyof typeof sizes;
  className?: string;
} & React.ComponentProps<"svg">) {
  return (
    <svg
      className={cn(sizes[size], className)}
      fill="currentColor"
      viewBox={BRAND_LOGO_VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>Enterprise UI Playground</title>
      <path d={BRAND_LOGO_PATH} />
    </svg>
  );
}

export default BrandIcon;
