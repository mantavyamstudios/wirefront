import { cn } from "@workspace/ui/lib/utils";
import { Loader } from "lucide-react";

/** A spinning loader announced as "Loading" (`<output>` is a status region). */
const Spinner = ({ className, ...props }: React.ComponentProps<"svg">) => (
  <output aria-label="Loading" className="inline-flex">
    <Loader
      aria-hidden
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  </output>
);

export { Spinner };
