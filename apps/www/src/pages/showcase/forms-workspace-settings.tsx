import { useState } from "react";
import {
  CreditCardIcon,
  KeyIcon,
  PuzzleIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldAlertIcon,
  UploadIcon,
  UsersIcon,
} from "lucide-react";
import { Button } from "@orbit/ui/button";
import { Input } from "@orbit/ui/input";
import { Label } from "@orbit/ui/label";
import { Separator } from "@orbit/ui/separator";
import { Switch } from "@orbit/ui/switch";

const NAV = [
  { icon: SettingsIcon, label: "General", active: true },
  { icon: UsersIcon, label: "Members" },
  { icon: CreditCardIcon, label: "Billing" },
  { icon: KeyIcon, label: "API keys" },
  { icon: PuzzleIcon, label: "Integrations" },
  { icon: ScrollTextIcon, label: "Audit log" },
];

export function FormsWorkspaceSettingsShowcasePage() {
  const [name, setName] = useState("Acme inc.");
  const [slug, setSlug] = useState("acme");
  const [dirty, setDirty] = useState(false);

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto min-h-svh max-w-5xl md:grid md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Mobile: sticky, horizontally scrollable section tabs. md+: side nav. */}
        <aside className="sticky top-0 z-20 border-b border-border/60 bg-background/95 px-4 py-2 backdrop-blur md:static md:border-r md:border-b-0 md:bg-transparent md:py-8 md:backdrop-blur-none">
          <div className="hidden font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em] md:block">
            Workspace
          </div>
          <div className="mt-1 hidden truncate font-heading text-lg md:block">{name}</div>
          <ul aria-label="Settings sections" className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:mt-6 md:flex-col md:gap-0.5 md:overflow-visible md:px-0">
            {NAV.map(({ icon: Icon, label, active }) => (
              <li key={label} className="shrink-0">
                <button
                  type="button"
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm transition-colors pointer-coarse:min-h-11 ${
                    active
                      ? "bg-foreground/[0.06] text-foreground"
                      : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4 opacity-70" />
                  {label}
                </button>
              </li>
            ))}
            <li className="shrink-0 md:mt-3">
              <button
                type="button"
                className="flex w-full items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/[0.06] pointer-coarse:min-h-11"
              >
                <ShieldAlertIcon className="size-4 opacity-70" />
                Danger zone
              </button>
            </li>
          </ul>
        </aside>

        <main className="min-w-0 px-4 pt-8 pb-32 sm:px-6 md:pt-12 lg:px-10">
          <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border/60 pb-6">
            <div>
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
                Settings · General
              </div>
              <h1 className="mt-1 font-heading text-2xl">General</h1>
              <p className="mt-1 text-muted-foreground text-sm">
                Workspace identity, region, and default behaviours.
              </p>
            </div>
          </header>

          <Section title="Identity" hint="Visible to anyone with access.">
            <div className="flex items-center gap-4">
              <div className="size-14 shrink-0 rounded-lg bg-gradient-to-br from-primary/40 to-primary/10 ring-1 ring-border/60" />
              <div className="flex-1">
                <Button size="sm" variant="outline" type="button">
                  <UploadIcon />
                  Upload avatar
                </Button>
                <p className="mt-1.5 text-muted-foreground text-xs">
                  PNG or SVG, 1024×1024 max.
                </p>
              </div>
            </div>

            <Field label="Name" htmlFor="ws-name">
              <Input
                id="ws-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setDirty(true);
                }}
                nativeInput
              />
            </Field>

            <Field label="Slug" htmlFor="ws-slug" hint="Used in URLs.">
              <div className="flex h-9 items-center gap-1 rounded-lg border border-input bg-background px-3 font-mono text-sm focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/24 pointer-coarse:h-11">
                <span className="shrink-0 text-muted-foreground">orbit.so/</span>
                <input
                  id="ws-slug"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setDirty(true);
                  }}
                  className="min-w-0 flex-1 bg-transparent outline-none"
                />
              </div>
            </Field>
          </Section>

          <Separator className="my-10" />

          <Section
            title="Region"
            hint="Defaults applied to new members and exports."
          >
            <Field label="Timezone" htmlFor="ws-tz">
              <NativeSelect
                id="ws-tz"
                defaultValue="utc-5"
                onChange={() => setDirty(true)}
              >
                <option value="utc-8">Pacific (UTC−8)</option>
                <option value="utc-5">Eastern (UTC−5)</option>
                <option value="utc">UTC</option>
                <option value="utc+1">Central European (UTC+1)</option>
                <option value="utc+9">Japan (UTC+9)</option>
              </NativeSelect>
            </Field>
            <Field label="Date format" htmlFor="ws-fmt">
              <NativeSelect
                id="ws-fmt"
                defaultValue="ymd"
                onChange={() => setDirty(true)}
              >
                <option value="ymd">YYYY-MM-DD</option>
                <option value="dmy">DD/MM/YYYY</option>
                <option value="mdy">MM/DD/YYYY</option>
              </NativeSelect>
            </Field>
          </Section>

          <Separator className="my-10" />

          <Section title="Defaults">
            <SwitchRow
              title="Public sign-up"
              description="Anyone with a workspace email can request access."
              defaultChecked
              onChange={() => setDirty(true)}
            />
            <SwitchRow
              title="Two-factor for admins"
              description="Require a second factor for owner and admin roles."
              defaultChecked
              onChange={() => setDirty(true)}
            />
            <SwitchRow
              title="Show project IDs"
              description="Display the short ID next to project names everywhere."
              onChange={() => setDirty(true)}
            />
          </Section>
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <div role="status" className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.3em]">
            {dirty ? "Unsaved changes" : "All saved"}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setDirty(false)}
              disabled={!dirty}
              className="pointer-coarse:h-11"
            >
              Discard
            </Button>
            <Button size="sm" type="button" disabled={!dirty} className="pointer-coarse:h-11">
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-[160px_minmax(0,1fr)] md:gap-y-6 lg:grid-cols-[180px_minmax(0,1fr)]">
      <div>
        <h2 className="font-medium text-sm">{title}</h2>
        {hint ? (
          <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
            {hint}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

function NativeSelect({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={`h-9 w-full appearance-none rounded-lg pointer-coarse:h-11 border border-input bg-background pl-3 pr-9 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/24 ${className ?? ""}`}
        {...props}
      />
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 opacity-60"
      >
        <polyline points="4 6 8 10 12 6" />
      </svg>
    </div>
  );
}

function SwitchRow({
  title,
  description,
  defaultChecked,
  onChange,
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
  onChange?: () => void;
}) {
  return (
    // The whole row is the label, so the hit area isn't just the 20px switch.
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-border/60 bg-background/40 px-4 py-3 sm:gap-6">
      <div className="min-w-0">
        <div className="font-medium text-sm">{title}</div>
        <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">
          {description}
        </p>
      </div>
      <Switch
        className="mt-0.5 shrink-0"
        defaultChecked={defaultChecked}
        onCheckedChange={() => onChange?.()}
      />
    </label>
  );
}
