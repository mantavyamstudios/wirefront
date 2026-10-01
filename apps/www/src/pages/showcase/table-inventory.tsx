import { ArrowUpDownIcon, PlusIcon, ShoppingBagIcon } from "lucide-react";
import { Badge } from "@orbit/ui/badge";
import { Button } from "@orbit/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@orbit/ui/table";

interface Product {
  sku: string;
  name: string;
  variant: string;
  category: string;
  price: number;
  stock: number;
  capacity: number;
  thumb: string;
  bg: string;
}

const PRODUCTS: Product[] = [
  { sku: "FRJ-001", name: "Dune buggy mug", variant: "12oz · Sand", category: "Drinkware", price: 24, stock: 124, capacity: 200, thumb: "◐", bg: "from-amber-300/40 to-orange-500/30" },
  { sku: "FRJ-014", name: "Field hoodie", variant: "Heavyweight · Moss", category: "Apparel", price: 92, stock: 38, capacity: 150, thumb: "▲", bg: "from-emerald-400/40 to-teal-600/30" },
  { sku: "FRJ-022", name: "Pocket notebook", variant: "Hardcover · Bone", category: "Stationery", price: 18, stock: 6, capacity: 80, thumb: "▭", bg: "from-stone-300/50 to-stone-500/30" },
  { sku: "FRJ-031", name: "Foldable lantern", variant: "USB-C · Night", category: "Hardware", price: 64, stock: 0, capacity: 50, thumb: "◇", bg: "from-indigo-400/40 to-violet-600/30" },
  { sku: "FRJ-040", name: "Ceramic planter", variant: "Med · Dune", category: "Home", price: 38, stock: 72, capacity: 100, thumb: "◯", bg: "from-rose-300/40 to-rose-600/30" },
  { sku: "FRJ-052", name: "Slate playing cards", variant: "Dual deck", category: "Games", price: 14, stock: 410, capacity: 500, thumb: "▷", bg: "from-zinc-400/40 to-zinc-700/30" },
];

function stockTone(p: Product): { label: string; cls: string; barCls: string } {
  if (p.stock === 0) return { label: "Out of stock", cls: "border-destructive/30 text-destructive", barCls: "bg-destructive" };
  if (p.stock < 10) return { label: "Low stock", cls: "border-amber-500/30 text-amber-700 dark:text-amber-400", barCls: "bg-amber-500" };
  return { label: "In stock", cls: "border-emerald-500/30 text-emerald-700 dark:text-emerald-400", barCls: "bg-emerald-500" };
}

export function TableInventoryShowcasePage() {
  return (
    <div className="min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <h1 className="flex items-center gap-2 font-heading text-xl">
              <ShoppingBagIcon className="size-5 text-muted-foreground" />
              Inventory
            </h1>
            <p className="text-muted-foreground text-sm">
              6 of 124 products · Field & Range
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" className="pointer-coarse:h-10">
              <ArrowUpDownIcon />
              <span className="sm:hidden">Stock low → high</span>
              <span className="max-sm:hidden">Sort: Stock low → high</span>
            </Button>
            <Button size="sm" className="pointer-coarse:h-10">
              <PlusIcon />
              Product
            </Button>
          </div>
        </header>

        {/*
          Priority columns: phones see Product (stock folded in) + Price; Stock
          returns at sm, SKU at md, Category at lg.
        */}
        <div className="rounded-xl border bg-card shadow-xs/5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-4">Product</TableHead>
                <TableHead className="max-md:hidden">SKU</TableHead>
                <TableHead className="max-lg:hidden">Category</TableHead>
                <TableHead className="max-sm:hidden">Stock</TableHead>
                <TableHead className="pe-4 text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PRODUCTS.map((p) => {
                const tone = stockTone(p);
                const pct = Math.min(100, Math.round((p.stock / p.capacity) * 100));
                return (
                  <TableRow key={p.sku}>
                    <TableCell className="w-full max-w-0 ps-4 sm:w-auto sm:max-w-none">
                      <div className="flex items-center gap-3">
                        <div
                          className={
                            "flex size-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br font-medium text-foreground/70 text-lg ring-1 ring-border/60 " +
                            p.bg
                          }
                          aria-hidden
                        >
                          {p.thumb}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{p.name}</div>
                          <div className="truncate text-muted-foreground text-xs">{p.variant}</div>
                          <div className="mt-1.5 sm:hidden">
                            <StockMeter p={p} pct={pct} tone={tone} />
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground text-xs max-md:hidden">{p.sku}</TableCell>
                    <TableCell className="text-muted-foreground max-lg:hidden">{p.category}</TableCell>
                    <TableCell className="max-sm:hidden">
                      <StockMeter p={p} pct={pct} tone={tone} />
                    </TableCell>
                    <TableCell className="pe-4 text-right font-mono tabular-nums">
                      ${p.price.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function StockMeter({
  p,
  pct,
  tone,
}: {
  p: Product;
  pct: number;
  tone: ReturnType<typeof stockTone>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <div
        role="meter"
        aria-label={`${p.name} stock`}
        aria-valuenow={p.stock}
        aria-valuemin={0}
        aria-valuemax={p.capacity}
        className="h-1.5 w-20 overflow-hidden rounded-full bg-muted lg:w-32"
      >
        <div className={"h-full " + tone.barCls} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-xs tabular-nums">
        {p.stock}
        <span className="text-muted-foreground/60">/{p.capacity}</span>
      </span>
      <Badge variant="outline" size="sm" className={tone.cls}>
        {tone.label}
      </Badge>
    </div>
  );
}
