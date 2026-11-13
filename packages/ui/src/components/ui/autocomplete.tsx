// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client"

import type * as React from "react"
import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete"
import { XIcon } from "lucide-react"

import { cn } from "../../lib/utils"

/** Free-text input with filtered suggestions (Base UI Autocomplete). */
const Autocomplete = AutocompletePrimitive.Root

function AutocompleteInput({
  className,
  startAddon,
  showClear = false,
  ...props
}: AutocompletePrimitive.Input.Props & {
  /** Icon or text shown before the input, e.g. a search icon. */
  startAddon?: React.ReactNode
  /** Show a button that clears the input. */
  showClear?: boolean
}) {
  return (
    <div
      data-slot="autocomplete-input-group"
      className="relative flex h-8 w-full items-center rounded-lg border border-input bg-transparent transition-colors has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50 dark:bg-input/30"
    >
      {startAddon ? (
        <span className="pointer-events-none flex shrink-0 items-center ps-2.5 text-muted-foreground [&_svg:not([class*='size-'])]:size-4">
          {startAddon}
        </span>
      ) : null}
      <AutocompletePrimitive.Input
        data-slot="autocomplete-input"
        className={cn(
          "h-full w-full min-w-0 bg-transparent px-2.5 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        {...props}
      />
      {showClear ? (
        <AutocompletePrimitive.Clear
          aria-label="Clear"
          className="me-1 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 outline-none [&_svg]:size-3.5"
        >
          <XIcon />
        </AutocompletePrimitive.Clear>
      ) : null}
    </div>
  )
}

function AutocompletePopup({
  className,
  sideOffset = 4,
  align = "start",
  children,
  ...props
}: AutocompletePrimitive.Popup.Props &
  Pick<AutocompletePrimitive.Positioner.Props, "side" | "sideOffset" | "align" | "alignOffset">) {
  return (
    <AutocompletePrimitive.Portal>
      <AutocompletePrimitive.Positioner className="isolate z-50 outline-none" sideOffset={sideOffset} align={align}>
        <AutocompletePrimitive.Popup
          data-slot="autocomplete-popup"
          className={cn(
            "max-h-(--available-height) w-(--anchor-width) min-w-32 origin-(--transform-origin) overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        >
          {children}
        </AutocompletePrimitive.Popup>
      </AutocompletePrimitive.Positioner>
    </AutocompletePrimitive.Portal>
  )
}

function AutocompleteList({ className, ...props }: AutocompletePrimitive.List.Props) {
  return <AutocompletePrimitive.List data-slot="autocomplete-list" className={cn("outline-none", className)} {...props} />
}

function AutocompleteItem({ className, ...props }: AutocompletePrimitive.Item.Props) {
  return (
    <AutocompletePrimitive.Item
      data-slot="autocomplete-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function AutocompleteGroup({ className, ...props }: AutocompletePrimitive.Group.Props) {
  return <AutocompletePrimitive.Group data-slot="autocomplete-group" className={className} {...props} />
}

function AutocompleteGroupLabel({ className, ...props }: AutocompletePrimitive.GroupLabel.Props) {
  return (
    <AutocompletePrimitive.GroupLabel
      data-slot="autocomplete-group-label"
      className={cn("px-2 py-1.5 text-xs font-medium text-muted-foreground", className)}
      {...props}
    />
  )
}

function AutocompleteEmpty({ className, ...props }: AutocompletePrimitive.Empty.Props) {
  return (
    <AutocompletePrimitive.Empty
      data-slot="autocomplete-empty"
      className={cn("px-2 py-4 text-center text-sm text-muted-foreground empty:hidden", className)}
      {...props}
    />
  )
}

const AutocompleteCollection = AutocompletePrimitive.Collection

export {
  Autocomplete,
  AutocompleteCollection,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
}
