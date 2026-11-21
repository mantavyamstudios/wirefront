import type { FlowDetail } from "@/lib/flows/data";

const DEVICE_LABELS: Record<string, string> = {
  camera: "Camera",
  location: "Location",
  maps: "Maps",
  microphone: "Microphone",
  photos: "Photo library",
};

/** Source facts for one subflow, from the generated flows manifest. */
export function FlowFacts({ detail }: { detail: FlowDetail }) {
  const rows: [string, string][] = [
    ["Entry widget", detail.entry],
    ["Source", `apps/runtime/lib/flows/${detail.dir}`],
    ["Dart files", String(detail.files)],
    [
      "Packages",
      detail.packages.length > 0
        ? detail.packages.join(", ")
        : "Flutter SDK only",
    ],
  ];

  return (
    <section className="flex flex-col gap-3">
      <h2 id="flow-details">Flow details</h2>
      <dl className="border-border/60 divide-border/60 divide-y overflow-hidden rounded-xl border text-sm">
        {rows.map(([label, value]) => (
          <div
            className="grid grid-cols-[9rem_1fr] gap-4 px-4 py-2.5"
            key={label}
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-foreground/80 min-w-0 font-mono text-[13px] break-words">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {detail.deviceApis.length > 0 ? (
        <p className="text-muted-foreground text-sm">
          Uses{" "}
          {detail.deviceApis.map((api) => DEVICE_LABELS[api] ?? api).join(", ")}
          . Your browser will ask for permission, and some features behave
          differently on the web than on a phone.
        </p>
      ) : null}
    </section>
  );
}
