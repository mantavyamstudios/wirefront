// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client"

import type * as React from "react"
import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { SearchIcon } from "lucide-react"

import { cn } from "../../lib/utils"

/**
 * Command menu: a searchable, keyboard-navigable list built on Base UI
 * Autocomplete rendered inline (`inline open`), optionally inside a dialog.
 */
function Command({
  className,
  children,
  ...props
}: Omit<AutocompletePrimitive.Root.Props<unknown>, "inline" | "open"> & { className?: string }) {
  return (
    <AutocompletePrimitive.Root inline open autoHighlight {...props}>
      <div
        data-slot="command"
        className={cn("flex size-full flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground", className)}
      >
        {children}
      </div>
    </AutocompletePrimitive.Root>
  )
}

function CommandInput({ className, ...props }: AutocompletePrimitive.Input.Props) {
  return (
    <div data-slot="command-input-wrapper" className="flex h-11 shrink-0 items-center gap-2 border-b px-3">
      <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
      <AutocompletePrimitive.Input
        data-slot="command-input"
        className={cn(
          "h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({ className, ...props }: AutocompletePrimitive.List.Props) {
  return (
    <AutocompletePrimitive.List
      data-slot="command-list"
      className={cn("max-h-80 scroll-py-1 overflow-y-auto overscroll-contain p-1 outline-none", className)}
      {...props}
    />
  )
}

function CommandEmpty({ className, ...props }: AutocompletePrimitive.Empty.Props) {
  return (
    <AutocompletePrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm text-muted-foreground empty:hidden", className)}
      {...props}
    />
  )
}

function CommandGroup({ className, ...props }: AutocompletePrimitive.Group.Props) {
  return <AutocompletePrimitive.Group data-slot="command-group" className={cn("py-1", className)} {...props} />
}

function CommandGroupLabel({ className, ...props }: AutocompletePrimitive.GroupLabel.Props) {
  return (
    <AutocompletePrimitive.GroupLabel
      data-slot="command-group-label"
      className={cn("px-2 py-1.5 text-xs font-medium text-muted-foreground", className)}
      {...props}
    />
  )
}

const CommandCollection = AutocompletePrimitive.Collection

function CommandItem({ className, ...props }: AutocompletePrimitive.Item.Props) {
  return (
    <AutocompletePrimitive.Item
      data-slot="command-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function CommandShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn("ms-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  )
}

function CommandFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-footer"
      className={cn("flex shrink-0 items-center gap-2 border-t px-3 py-2 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

const CommandDialog = DialogPrimitive.Root

function CommandDialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="command-dialog-trigger" {...props} />
}

function CommandDialogPopup({ className, children, ...props }: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
      <DialogPrimitive.Popup
        data-slot="command-dialog"
        className={cn(
          "fixed top-[15%] left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Title className="sr-only">Command menu</DialogPrimitive.Title>
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

export {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandDialogTrigger,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
}
