// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client"

import type * as React from "react"
import { OTPField as OTPFieldPrimitive } from "@base-ui/react/otp-field"

import { cn } from "../../lib/utils"

/** One-time-code input built on Base UI's OTP field (render one OTPFieldInput per digit). */
function OTPField({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof OTPFieldPrimitive.Root> & { size?: "default" | "lg" }) {
  return (
    <OTPFieldPrimitive.Root
      data-slot="otp-field"
      data-size={size}
      className={cn("group/otp flex items-center gap-2 has-disabled:opacity-50", className)}
      {...props}
    />
  )
}

function OTPFieldInput({ className, ...props }: React.ComponentProps<typeof OTPFieldPrimitive.Input>) {
  return (
    <OTPFieldPrimitive.Input
      data-slot="otp-field-input"
      className={cn(
        "size-9 group-data-[size=lg]/otp:size-11 group-data-[size=lg]/otp:text-lg rounded-lg border border-input bg-transparent text-center font-mono text-base tabular-nums transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30",
        className,
      )}
      {...props}
    />
  )
}

function OTPFieldSeparator({ className, ...props }: React.ComponentProps<typeof OTPFieldPrimitive.Separator>) {
  return (
    <OTPFieldPrimitive.Separator
      data-slot="otp-field-separator"
      className={cn("h-0.5 w-2 rounded-full bg-border", className)}
      {...props}
    />
  )
}

export { OTPField, OTPFieldInput, OTPFieldSeparator }
