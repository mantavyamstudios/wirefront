import { CopyIcon, ExternalLinkIcon, ShieldCheckIcon } from "lucide-react";
import { Button } from "@orbit/ui/button";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@orbit/ui/dialog";
import { OTPField, OTPFieldInput, OTPFieldSeparator } from "@orbit/ui/otp-field";

const RECOVERY = [
  "ZQX-PT4-9KH",
  "BMC-W2L-31R",
  "VEY-RF8-Q2A",
  "JTH-HM5-LD9",
  "WPN-S62-XB7",
  "DKE-9F3-VNL",
  "GRY-7XP-MK2",
  "TRC-J21-AZ4",
];

// Placeholder setup key for the showcase — not a real credential. In an app
// this comes from your server when 2FA enrolment starts.
const DEMO_SETUP_KEY = ["H7K3", "9F2N", "P8L4", "RTYQ"];
const otpauthUrl = (key: string) =>
  `otpauth://totp/Orbit:you@example.com?${new URLSearchParams({ secret: key, issuer: "Orbit" })}`;

export function ModalsTwoFactorShowcasePage() {
  return (
    // Real Dialog; bottom sheet with a scrolling body on phones. Scanning a
    // QR on the same phone is impossible, so phones get an "Open authenticator"
    // deep link and the setup key first; the QR shows from sm up.
    <div className="relative min-h-svh bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-8 sm:px-10 sm:py-10">
        <div className="font-heading text-2xl">Security · Profile</div>
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>
          <ShieldCheckIcon />
          Enable 2FA
        </DialogTrigger>
        <DialogPopup>
          <DialogHeader className="flex-row items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600">
              <ShieldCheckIcon className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5 text-left">
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                Step 2 of 3
              </div>
              <DialogTitle className="text-base">Set up two-factor auth</DialogTitle>
            </div>
          </DialogHeader>

          <DialogPanel>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[160px_minmax(0,1fr)]">
              <div className="hidden rounded-lg border border-border/60 bg-background p-3 sm:block">
                <QrCode />
                <div className="mt-2 text-center font-mono text-[10px] text-muted-foreground">
                  Scan with Authenticator
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-sm leading-snug">
                  <span className="sm:hidden">
                    Open your authenticator app, or paste this setup key
                    manually.
                  </span>
                  <span className="max-sm:hidden">
                    Open your authenticator app and scan the code, or paste
                    this secret manually.
                  </span>
                </div>
                <Button
                  className="mt-3 w-full sm:hidden"
                  render={<a href={otpauthUrl(DEMO_SETUP_KEY.join(""))} />}
                >
                  <ExternalLinkIcon />
                  Open authenticator app
                </Button>
                <div className="mt-3 flex items-center gap-2 rounded-md border border-border/60 bg-background py-1 pr-1 pl-3">
                  <code className="min-w-0 flex-1 break-all font-mono text-sm">
                    {DEMO_SETUP_KEY.join(" ")}
                  </code>
                  <button
                    type="button"
                    aria-label="Copy setup key"
                    className="grid size-8 shrink-0 place-items-center rounded text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground pointer-coarse:size-10"
                  >
                    <CopyIcon className="size-3.5" />
                  </button>
                </div>

                <div className="mt-5">
                  <div id="tfa-code-label" className="mb-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                    Confirm with a 6-digit code
                  </div>
                  <OTPField length={6} defaultValue="3914" aria-labelledby="tfa-code-label">
                    <OTPFieldInput />
                    <OTPFieldInput />
                    <OTPFieldInput />
                    <OTPFieldSeparator />
                    <OTPFieldInput />
                    <OTPFieldInput />
                    <OTPFieldInput />
                  </OTPField>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-border/60 bg-muted/20 p-3 sm:p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                  Recovery codes
                </div>
                <button
                  type="button"
                  className="min-h-8 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] hover:text-foreground pointer-coarse:min-h-10"
                >
                  Download
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 rounded-md border border-border/60 bg-background p-3 sm:grid-cols-4">
                {RECOVERY.map((c) => (
                  <code
                    key={c}
                    className="rounded bg-muted/60 px-1.5 py-1 text-center font-mono text-[11px]"
                  >
                    {c}
                  </code>
                ))}
              </div>
              <p className="mt-2 text-muted-foreground text-xs">
                Save these somewhere safe. Each code can be used once if you
                lose access.
              </p>
            </div>
          </DialogPanel>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost" type="button" />}>Back</DialogClose>
            <Button type="button">Verify and continue</Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
      </div>
    </div>
  );
}

// Decorative QR — not scannable, but composed like a real one (3 finder
// patterns, 1 alignment pattern, ~47% data density via a hash that doesn't
// produce stripes). 25 modules ≈ a v2 QR — chunky enough to read at thumb size.
function QrCode() {
  const SIZE = 25;
  const ALIGN_X = SIZE - 6; // alignment center column
  const ALIGN_Y = SIZE - 6; // alignment center row

  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) ||
    (x >= SIZE - 8 && y < 8) ||
    (x < 8 && y >= SIZE - 8);

  const inAlignment = (x: number, y: number) =>
    x >= ALIGN_X - 2 &&
    x <= ALIGN_X + 2 &&
    y >= ALIGN_Y - 2 &&
    y <= ALIGN_Y + 2;

  const hash = (x: number, y: number): number => {
    let h = (x + 1) * 0x9e3779b1;
    h ^= (y + 1) * 0x85ebca77;
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    h = (h ^ (h >>> 16)) >>> 0;
    return h % 100;
  };

  const modules: { x: number; y: number }[] = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (inFinder(x, y) || inAlignment(x, y)) continue;
      if (hash(x, y) < 47) modules.push({ x, y });
    }
  }

  const FINDERS: [number, number][] = [
    [0, 0],
    [SIZE - 7, 0],
    [0, SIZE - 7],
  ];

  return (
    <div className="aspect-square w-full">
      <svg
        viewBox={`-1 -1 ${SIZE + 2} ${SIZE + 2}`}
        className="h-full w-full"
        aria-hidden
      >
        <rect
          x={-1}
          y={-1}
          width={SIZE + 2}
          height={SIZE + 2}
          className="fill-background"
        />

        {modules.map(({ x, y }) => (
          <rect
            key={`${x}-${y}`}
            x={x + 0.06}
            y={y + 0.06}
            width={0.88}
            height={0.88}
            rx={0.16}
            className="fill-foreground"
          />
        ))}

        {FINDERS.map(([fx, fy]) => (
          <g key={`${fx}-${fy}`}>
            <rect
              x={fx}
              y={fy}
              width={7}
              height={7}
              rx={1.6}
              className="fill-foreground"
            />
            <rect
              x={fx + 1}
              y={fy + 1}
              width={5}
              height={5}
              rx={1}
              className="fill-background"
            />
            <rect
              x={fx + 2}
              y={fy + 2}
              width={3}
              height={3}
              rx={0.55}
              className="fill-foreground"
            />
          </g>
        ))}

        <g>
          <rect
            x={ALIGN_X - 2}
            y={ALIGN_Y - 2}
            width={5}
            height={5}
            rx={1}
            className="fill-foreground"
          />
          <rect
            x={ALIGN_X - 1}
            y={ALIGN_Y - 1}
            width={3}
            height={3}
            rx={0.55}
            className="fill-background"
          />
          <rect
            x={ALIGN_X - 0.4}
            y={ALIGN_Y - 0.4}
            width={1.8}
            height={1.8}
            rx={0.3}
            className="fill-foreground"
          />
        </g>
      </svg>
    </div>
  );
}
