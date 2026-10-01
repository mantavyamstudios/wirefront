import { useState } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  CircleDotIcon,
  PackageIcon,
  TruckIcon,
} from "lucide-react";
import { Badge } from "@orbit/ui/badge";
import { Button } from "@orbit/ui/button";
import { Checkbox } from "@orbit/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@orbit/ui/table";

type Stage = "ordered" | "packed" | "shipped" | "delivered";

interface Order {
  id: string;
  customer: string;
  items: number;
  total: number;
  stage: Stage;
  carrier: string;
  eta: string;
  selected?: boolean;
}

const STAGES: { key: Stage; label: string; icon: typeof CheckIcon }[] = [
  { key: "ordered", label: "Ordered", icon: CircleDotIcon },
  { key: "packed", label: "Packed", icon: PackageIcon },
  { key: "shipped", label: "Shipped", icon: TruckIcon },
  { key: "delivered", label: "Delivered", icon: CheckIcon },
];

const ORDERS: Order[] = [
  { id: "#A-2841", customer: "Saoirse Walsh", items: 3, total: 184.5, stage: "delivered", carrier: "DHL", eta: "Apr 22" },
  { id: "#A-2840", customer: "Marcus Rivera", items: 1, total: 32.0, stage: "shipped", carrier: "UPS", eta: "Apr 27", selected: true },
  { id: "#A-2839", customer: "Lin Wei", items: 5, total: 412.9, stage: "shipped", carrier: "FedEx", eta: "Apr 28", selected: true },
  { id: "#A-2838", customer: "Pavel Doronin", items: 2, total: 96.0, stage: "packed", carrier: "USPS", eta: "Apr 29" },
  { id: "#A-2837", customer: "Aiyana Curtis", items: 1, total: 19.5, stage: "ordered", carrier: "—", eta: "Apr 30" },
  { id: "#A-2836", customer: "Daichi Watanabe", items: 4, total: 240.0, stage: "delivered", carrier: "DHL", eta: "Apr 21" },
];

const stageIndex = (s: Stage) => STAGES.findIndex((x) => x.key === s);
const stageLabel = (s: Stage) => STAGES[stageIndex(s)]!.label;

export function TableOrdersShowcasePage() {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(ORDERS.filter((o) => o.selected).map((o) => o.id)),
  );
  const selectedCount = selected.size;
  const allSelected = selectedCount === ORDERS.length;
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const bulkActions = (
    <>
      <Button size="xs" variant="ghost" className="pointer-coarse:h-10">Mark shipped</Button>
      <Button size="xs" variant="ghost" className="pointer-coarse:h-10">Print labels</Button>
    </>
  );

  return (
    <div
      className={`min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-12 ${
        selectedCount > 0 ? "max-sm:pb-28" : ""
      }`}
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <h1 className="font-heading text-xl">Orders</h1>
            <p className="text-muted-foreground text-sm">
              Card-variant table · 6 of 248
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedCount > 0 ? (
              <div className="hidden items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 shadow-xs/5 sm:flex">
                <span className="text-sm">{selectedCount} selected</span>
                <span className="text-muted-foreground/40">·</span>
                {bulkActions}
              </div>
            ) : null}
            <Button size="sm" variant="outline" className="pointer-coarse:h-10">
              Sort by date
              <ChevronDownIcon />
            </Button>
          </div>
        </header>

        {/*
          Priority columns: phones see select, Order (customer + ETA folded in)
          and Total (+ stage). Customer and a text status return at sm, Items at
          md, the stage tracker and Carrier at lg.
        */}
        <Table variant="card">
          <TableHeader>
            <TableRow>
              <TableHead>
                <Checkbox
                  aria-label="Select all"
                  checked={allSelected}
                  indeterminate={selectedCount > 0 && !allSelected}
                  onCheckedChange={() =>
                    setSelected(allSelected ? new Set() : new Set(ORDERS.map((o) => o.id)))
                  }
                />
              </TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="max-sm:hidden">Customer</TableHead>
              <TableHead className="max-md:hidden">Items</TableHead>
              <TableHead className="max-sm:hidden">Status</TableHead>
              <TableHead className="max-lg:hidden">Carrier</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ORDERS.map((o) => {
              const isSelected = selected.has(o.id);
              return (
                <TableRow key={o.id} data-state={isSelected ? "selected" : undefined}>
                  <TableCell>
                    {/* The label widens the hit area to the whole cell on touch. */}
                    <label className="-m-2.5 flex cursor-pointer p-2.5 pointer-coarse:-m-3.5 pointer-coarse:p-3.5">
                      <Checkbox
                        aria-label={`Select ${o.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggle(o.id)}
                      />
                    </label>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">{o.id}</div>
                    <div className="font-medium text-sm sm:hidden">{o.customer}</div>
                    <div className="text-muted-foreground text-xs tabular-nums">ETA {o.eta}</div>
                  </TableCell>
                  <TableCell className="font-medium max-sm:hidden">{o.customer}</TableCell>
                  <TableCell className="max-md:hidden">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {o.items} item{o.items === 1 ? "" : "s"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-sm:hidden">
                    <span className="lg:hidden">
                      <StageLabel stage={o.stage} />
                    </span>
                    <span className="max-lg:hidden">
                      <StageTrack stage={o.stage} />
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-lg:hidden">{o.carrier}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    ${o.total.toFixed(2)}
                    <div className="mt-1 flex justify-end font-sans sm:hidden">
                      <StageLabel stage={o.stage} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Phones: bulk actions dock to the bottom while rows are selected. */}
      {selectedCount > 0 ? (
        <div
          role="toolbar"
          aria-label="Bulk actions"
          className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-2 border-t bg-background/95 px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg backdrop-blur sm:hidden"
        >
          <span className="text-sm">{selectedCount} selected</span>
          <div className="flex items-center gap-1">{bulkActions}</div>
        </div>
      ) : null}
    </div>
  );
}

function StageLabel({ stage }: { stage: Stage }) {
  const done = stage === "delivered";
  return (
    <Badge
      variant="outline"
      className={done ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-400" : ""}
    >
      {stageLabel(stage)}
    </Badge>
  );
}

function StageTrack({ stage }: { stage: Stage }) {
  const idx = stageIndex(stage);
  return (
    <div className="flex items-center gap-1.5" aria-label={`Stage: ${stageLabel(stage)}`}>
      {STAGES.map((s, i) => {
        const Icon = s.icon;
        const reached = i <= idx;
        const current = i === idx;
        return (
          <div key={s.key} className="flex items-center gap-1.5">
            <div
              className={
                "flex size-5 items-center justify-center rounded-full border text-[10px] " +
                (current
                  ? "border-primary bg-primary text-primary-foreground"
                  : reached
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-border bg-muted text-muted-foreground/60")
              }
              aria-label={s.label}
              title={s.label}
            >
              <Icon className="size-3" />
            </div>
            {i < STAGES.length - 1 ? (
              <div
                className={
                  "h-px w-3 " + (i < idx ? "bg-emerald-500/40" : "bg-border")
                }
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
