import { ArrowDownToLineIcon, FilterIcon, PlusIcon } from "lucide-react";
import { Badge } from "@orbit/ui/badge";
import { Button } from "@orbit/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@orbit/ui/table";

type Status = "paid" | "open" | "overdue" | "void";

interface Invoice {
  number: string;
  customer: string;
  email: string;
  issued: string;
  due: string;
  status: Status;
  amount: number;
}

const INVOICES: Invoice[] = [
  { number: "INV-2871", customer: "Foundry Labs", email: "ar@foundrylabs.io", issued: "Apr 18", due: "Apr 30", status: "open", amount: 4800 },
  { number: "INV-2870", customer: "Northwind Co.", email: "billing@northwind.co", issued: "Apr 12", due: "Apr 22", status: "paid", amount: 1250 },
  { number: "INV-2869", customer: "Halcyon Ventures", email: "ops@halcyon.vc", issued: "Mar 28", due: "Apr 11", status: "overdue", amount: 9900 },
  { number: "INV-2868", customer: "Atlas Studio", email: "hi@atlasstudio.co", issued: "Mar 22", due: "—", status: "void", amount: 320 },
  { number: "INV-2867", customer: "Brightline Inc.", email: "ap@brightline.io", issued: "Mar 18", due: "Apr 02", status: "paid", amount: 6420 },
  { number: "INV-2866", customer: "Quayside Partners", email: "team@quayside.co", issued: "Mar 14", due: "Apr 14", status: "open", amount: 12_780 },
  { number: "INV-2865", customer: "Granite & Co.", email: "books@granite.co", issued: "Mar 10", due: "Mar 24", status: "paid", amount: 980 },
];

const STATUS: Record<Status, { label: string; className: string; dot: string }> = {
  paid: {
    label: "Paid",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  open: {
    label: "Open",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  overdue: {
    label: "Overdue",
    className: "border-destructive/20 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  void: {
    label: "Void",
    className: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
};

const total = INVOICES.reduce((acc, inv) => acc + (inv.status === "void" ? 0 : inv.amount), 0);

export function TableInvoicesShowcasePage() {
  return (
    <div className="min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <h1 className="font-heading text-xl">Invoices</h1>
            <p className="text-muted-foreground text-sm">
              {INVOICES.length} of 142 · April 2026
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" aria-label="Filter" className="pointer-coarse:h-10">
              <FilterIcon />
              <span className="max-sm:sr-only">Filter</span>
            </Button>
            <Button size="sm" variant="outline" aria-label="Export" className="pointer-coarse:h-10">
              <ArrowDownToLineIcon />
              <span className="max-sm:sr-only">Export</span>
            </Button>
            <Button size="sm" className="pointer-coarse:h-10">
              <PlusIcon />
              New invoice
            </Button>
          </div>
        </header>

        {/*
          Priority columns: phones see Customer + Amount (invoice no., due date
          and status move into those cells); Invoice/Status return at sm,
          Issued/Due at md.
        */}
        <div className="rounded-xl border bg-card shadow-xs/5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-4 max-sm:hidden">Invoice</TableHead>
                <TableHead className="max-sm:ps-4">Customer</TableHead>
                <TableHead className="max-md:hidden">Issued</TableHead>
                <TableHead className="max-md:hidden">Due</TableHead>
                <TableHead className="max-sm:hidden">Status</TableHead>
                <TableHead className="pe-4 text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {INVOICES.map((inv) => {
                const s = STATUS[inv.status];
                const badge = (
                  <Badge variant="outline" className={"gap-1.5 " + s.className}>
                    <span className={"size-1.5 rounded-full " + s.dot} />
                    {s.label}
                  </Badge>
                );
                return (
                  <TableRow key={inv.number}>
                    <TableCell className="ps-4 font-mono text-sm max-sm:hidden">{inv.number}</TableCell>
                    <TableCell className="w-full max-w-0 max-sm:ps-4 sm:w-auto sm:max-w-none">
                      <div className="truncate font-medium">{inv.customer}</div>
                      <div className="truncate text-muted-foreground text-xs">{inv.email}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-muted-foreground md:hidden">
                        <span className="sm:hidden">{inv.number} · </span>due {inv.due}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-md:hidden">{inv.issued}</TableCell>
                    <TableCell className="text-muted-foreground max-md:hidden">{inv.due}</TableCell>
                    <TableCell className="max-sm:hidden">{badge}</TableCell>
                    <TableCell className="pe-4 text-right font-mono tabular-nums">
                      {inv.status === "void" ? (
                        <span className="text-muted-foreground line-through">${inv.amount.toLocaleString()}</span>
                      ) : (
                        <>${inv.amount.toLocaleString()}.00</>
                      )}
                      <div className="mt-1 flex justify-end font-sans sm:hidden">{badge}</div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              {/* One footer row per breakpoint so colSpan matches the visible columns. */}
              {([
                [1, "sm:hidden"],
                [3, "max-sm:hidden md:hidden"],
                [5, "max-md:hidden"],
              ] as const).map(([span, cls]) => (
                <TableRow key={span} className={cls}>
                  <TableCell className="ps-4" colSpan={span}>
                    Outstanding <span className="max-sm:hidden">(excludes voids)</span>
                  </TableCell>
                  <TableCell className="pe-4 text-right font-mono tabular-nums">
                    ${total.toLocaleString()}.00
                  </TableCell>
                </TableRow>
              ))}
            </TableFooter>
          </Table>
        </div>
      </div>
    </div>
  );
}
