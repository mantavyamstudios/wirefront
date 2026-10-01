import {
  ArrowDownLeftIcon,
  ArrowDownToLineIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  RefreshCcwIcon,
  SearchIcon,
} from "lucide-react";
import { Badge } from "@orbit/ui/badge";
import { Button } from "@orbit/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@orbit/ui/input-group";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@orbit/ui/pagination";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@orbit/ui/select";
import { Separator } from "@orbit/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@orbit/ui/table";

type Direction = "in" | "out";
type Method = "card" | "ach" | "wire" | "wallet";

interface Tx {
  id: string;
  date: string;
  description: string;
  counterparty: string;
  amount: number;
  direction: Direction;
  method: Method;
  status: "succeeded" | "pending" | "refunded" | "failed";
  fee?: number;
}

const TXS: Tx[] = [
  { id: "tx_8412c", date: "Apr 26 · 09:18", description: "Customer payment", counterparty: "Halcyon Ventures", amount: 9900, direction: "in", method: "wire", status: "succeeded", fee: 9.9 },
  { id: "tx_8411a", date: "Apr 26 · 08:42", description: "Stripe payout", counterparty: "Stripe → Mercury ••2841", amount: 18_240, direction: "out", method: "ach", status: "pending" },
  { id: "tx_8410f", date: "Apr 25 · 22:01", description: "Subscription renewal", counterparty: "Foundry Labs", amount: 480, direction: "in", method: "card", status: "succeeded", fee: 14.7 },
  { id: "tx_8409d", date: "Apr 25 · 16:55", description: "AWS infrastructure", counterparty: "Amazon Web Services", amount: 2_120, direction: "out", method: "card", status: "succeeded" },
  { id: "tx_8408b", date: "Apr 25 · 11:32", description: "Refund", counterparty: "Atlas Studio", amount: 320, direction: "out", method: "card", status: "refunded" },
  { id: "tx_8407e", date: "Apr 24 · 18:09", description: "Customer payment", counterparty: "Northwind Co.", amount: 1_250, direction: "in", method: "card", status: "succeeded", fee: 38.5 },
  { id: "tx_8406c", date: "Apr 24 · 09:14", description: "Failed charge", counterparty: "Brightline Inc.", amount: 6_420, direction: "in", method: "card", status: "failed" },
  { id: "tx_8405a", date: "Apr 23 · 20:27", description: "Wallet top-up", counterparty: "Coinbase Pay", amount: 1_500, direction: "in", method: "wallet", status: "succeeded", fee: 4.5 },
];

const STATUS_TONE: Record<Tx["status"], string> = {
  succeeded: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  refunded: "border-border bg-muted text-muted-foreground",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
};

const METHOD_LABEL: Record<Method, string> = {
  card: "Card",
  ach: "ACH",
  wire: "Wire",
  wallet: "Wallet",
};

const ACCOUNTS = [
  { label: "All accounts", value: "all" },
  { label: "Operating", value: "op" },
  { label: "Reserve", value: "reserve" },
];
const DIRECTIONS = [
  { label: "In + Out", value: "all" },
  { label: "Incoming", value: "in" },
  { label: "Outgoing", value: "out" },
];
const RANGES = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Custom…", value: "custom" },
];

const inflow = TXS.filter((t) => t.direction === "in" && t.status === "succeeded").reduce((a, b) => a + b.amount, 0);
const outflow = TXS.filter((t) => t.direction === "out" && t.status === "succeeded").reduce((a, b) => a + b.amount, 0);

export function TableTransactionsShowcasePage() {
  return (
    <div className="min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-heading text-xl">Transactions</h1>
            <p className="text-muted-foreground text-sm">
              Mercury · Operating account · last 7 days
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" variant="ghost" aria-label="Refresh" className="pointer-coarse:h-10">
              <RefreshCcwIcon />
              <span className="max-sm:sr-only">Refresh</span>
            </Button>
            <Button size="sm" variant="outline" aria-label="Export CSV" className="pointer-coarse:h-10">
              <ArrowDownToLineIcon />
              CSV
            </Button>
          </div>
        </header>

        <div className="mb-4 grid grid-cols-1 gap-2 min-[480px]:grid-cols-3 sm:gap-3">
          <SummaryTile label="Inflow" amount={inflow} tone="positive" />
          <SummaryTile label="Outflow" amount={outflow} tone="negative" />
          <SummaryTile label="Net" amount={inflow - outflow} tone="neutral" />
        </div>

        <div className="rounded-xl border bg-card shadow-xs/5">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 border-b p-3">
            <InputGroup className="w-full sm:w-64">
              <InputGroupAddon>
                <SearchIcon className="size-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput placeholder="Search description, ID, counterparty…" />
            </InputGroup>

            <Separator orientation="vertical" className="mx-1 h-6 max-sm:hidden" />

            <Select items={ACCOUNTS} defaultValue="op">
              <SelectTrigger className="w-36 max-sm:w-[calc(50%-0.25rem)] pointer-coarse:h-10" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {ACCOUNTS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>

            <Select items={DIRECTIONS} defaultValue="all">
              <SelectTrigger className="w-32 max-sm:w-[calc(50%-0.25rem)] pointer-coarse:h-10" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {DIRECTIONS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>

            <Select items={RANGES} defaultValue="7d">
              <SelectTrigger className="w-40 max-sm:w-[calc(50%-0.25rem)] pointer-coarse:h-10" size="sm">
                <CalendarIcon className="text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {RANGES.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>

            <span className="ms-auto font-mono text-[11px] text-muted-foreground">
              8 results
            </span>
          </div>

          {/*
            Priority columns: phones see Description (date, counterparty and
            status folded in) and Amount; Date and Status return at sm,
            Counterparty at lg, Method at xl.
          */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-4 max-sm:hidden">Date</TableHead>
                <TableHead className="max-sm:ps-4">Description</TableHead>
                <TableHead className="max-lg:hidden">Counterparty</TableHead>
                <TableHead className="max-xl:hidden">Method</TableHead>
                <TableHead className="max-sm:hidden">Status</TableHead>
                <TableHead className="pe-4 text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TXS.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="ps-4 text-muted-foreground tabular-nums max-sm:hidden">{t.date}</TableCell>
                  <TableCell className="w-full max-w-0 max-sm:ps-4 sm:w-auto sm:max-w-none">
                    <div className="flex items-center gap-2">
                      <div
                        className={
                          "flex size-7 shrink-0 items-center justify-center rounded-full " +
                          (t.direction === "in"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground")
                        }
                        aria-hidden
                      >
                        {t.direction === "in" ? (
                          <ArrowDownLeftIcon className="size-3.5" />
                        ) : (
                          <ArrowUpRightIcon className="size-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{t.description}</div>
                        <div className="truncate font-mono text-muted-foreground text-xs">
                          <span className="sm:hidden">{t.date} · </span>
                          {t.id}
                        </div>
                        <div className="truncate text-muted-foreground text-xs lg:hidden">{t.counterparty}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-lg:hidden">{t.counterparty}</TableCell>
                  <TableCell className="max-xl:hidden">
                    <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                      {METHOD_LABEL[t.method]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-sm:hidden">
                    <Badge variant="outline" className={"capitalize " + STATUS_TONE[t.status]}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pe-4 text-right">
                    <div
                      className={
                        "font-mono tabular-nums " +
                        (t.status === "failed" || t.status === "refunded"
                          ? "text-muted-foreground line-through"
                          : t.direction === "in"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-foreground")
                      }
                    >
                      {t.direction === "in" ? "+" : "−"}${t.amount.toLocaleString()}.00
                    </div>
                    {t.fee ? (
                      <div className="font-mono text-[10px] text-muted-foreground">
                        fee ${t.fee.toFixed(2)}
                      </div>
                    ) : null}
                    {t.status !== "succeeded" ? (
                      <Badge variant="outline" size="sm" className={"mt-1 capitalize sm:hidden " + STATUS_TONE[t.status]}>
                        {t.status}
                      </Badge>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Footer pagination */}
          <div className="flex flex-col items-center gap-2 border-t p-3 sm:flex-row sm:justify-between">
            <span className="text-muted-foreground text-xs">
              Showing <span className="text-foreground tabular-nums">1–8</span> of 412
            </span>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  amount,
  tone,
}: {
  label: string;
  amount: number;
  tone: "positive" | "negative" | "neutral";
}) {
  const sign = tone === "negative" ? "−" : tone === "positive" ? "+" : amount < 0 ? "−" : "+";
  const cls =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "negative"
        ? "text-foreground"
        : "text-foreground";
  return (
    <div className="flex items-baseline justify-between gap-2 rounded-xl border bg-card px-4 py-3 shadow-xs/5 min-[480px]:block min-[480px]:p-4">
      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
        {label}
      </div>
      <div className={"font-heading font-semibold text-xl tabular-nums min-[480px]:mt-1.5 lg:text-2xl " + cls}>
        {sign}${Math.abs(amount).toLocaleString()}
      </div>
    </div>
  );
}
