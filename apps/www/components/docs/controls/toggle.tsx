"use client";

import { cn } from "@workspace/ui/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";

export interface ControlToggleProps {
  className?: string;
  label: string;
  onChange: (value: boolean) => void;
  value: boolean;
}

const PILL_CLASS =
  "dialkit-segmented-pill absolute inset-0 rounded-[6px] bg-black/12 shadow-xs dark:bg-white/16";

/** One option: a native radio, visually hidden, under the segment's label. */
const ToggleOption = ({
  checked,
  label,
  layoutId,
  name,
  onSelect,
  reducedMotion,
}: {
  checked: boolean;
  label: string;
  layoutId: string;
  name: string;
  onSelect: () => void;
  reducedMotion: boolean;
}) => (
  <label
    className={cn(
      "dialkit-segmented-button relative z-10 flex h-7.5 min-w-12 cursor-pointer items-center justify-center rounded-[6px] px-3.5 text-[13px] leading-none font-medium transition-colors select-none",
      "has-focus-visible:ring-ring/50 has-focus-visible:ring-2",
      checked
        ? "text-(--dial-text-primary)"
        : "text-(--dial-text-label) hover:text-(--dial-text-primary)"
    )}
  >
    <input
      checked={checked}
      className="sr-only"
      name={name}
      onChange={onSelect}
      type="radio"
    />
    {checked ? (
      <motion.div
        className={PILL_CLASS}
        layoutId={`toggle-pill-${layoutId}`}
        style={{ zIndex: -1 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 500, damping: 35 }
        }
      />
    ) : null}
    {label}
  </label>
);

/** An Off / On choice made of two native radios; arrow keys move between them. */
export const ControlToggle = ({
  label,
  value,
  onChange,
  className,
}: ControlToggleProps) => {
  const layoutId = useId();
  const labelId = `${layoutId}-label`;
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <div
      className={cn(
        "dialkit-labeled-control flex h-9.5 w-full items-center justify-between rounded-(--dial-radius,8px) bg-(--dial-surface) px-3 text-[13px]",
        className
      )}
    >
      <span
        className="dialkit-labeled-control-label font-medium text-(--dial-text-label) select-none"
        id={labelId}
      >
        {label}
      </span>

      <div
        aria-labelledby={labelId}
        className="dialkit-segmented relative inline-flex h-8.5 items-center rounded-xl bg-black/5 p-0.5 select-none dark:bg-white/6"
        role="radiogroup"
      >
        <ToggleOption
          checked={!value}
          label="Off"
          layoutId={layoutId}
          name={layoutId}
          onSelect={() => onChange(false)}
          reducedMotion={reducedMotion}
        />
        <ToggleOption
          checked={value}
          label="On"
          layoutId={layoutId}
          name={layoutId}
          onSelect={() => onChange(true)}
          reducedMotion={reducedMotion}
        />
      </div>
    </div>
  );
};
