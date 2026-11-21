// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import Link from "next/link";
import type { ReactNode } from "react";

import { CodeBlock } from "@/components/docs/codeblock";
import { ComponentInstallation } from "@/components/docs/component-installation";
import { DocsTypeTable } from "@/components/docs/docs-type-table";
import type { ScreenDetail } from "@/lib/screens/data";
import type { DocProp, ScreenDoc } from "@/lib/screens/docs";
import { highlightCode } from "@/lib/shiki";
import { GITHUB_REPO_URL } from "@/lib/site";

const STATE_NOTES: Record<string, string> = {
  ready: "The screen with its data.",
  loading:
    'Skeletons in place of the data, while your request is in flight (`status="loading"`).',
  empty:
    "What the screen shows when there is nothing to list yet (an empty list or no results).",
  error:
    'A message and a retry, when the data failed to load (`status="error"`, `error`, `onRetry`).',
  forbidden: "The screen when the viewer may not see it at all.",
};

const Code = ({ children }: { children: ReactNode }) => (
  <code className="bg-muted/50 text-foreground rounded-md px-1 py-0.5 font-mono text-xs">
    {children}
  </code>
);

const Section = ({
  children,
  id,
  title,
}: {
  children: ReactNode;
  id: string;
  title: string;
}) => (
  <section className="flex flex-col">
    <h2 id={id}>{title}</h2>
    {children}
  </section>
);

const typeTable = (fields: DocProp[]) =>
  Object.fromEntries(
    fields.map((field) => [
      field.name,
      {
        type: field.type,
        required: field.required,
        default: field.default,
        description: field.description,
      },
    ])
  );

/** A plain table in the docs column's style. */
const Table = ({ head, rows }: { head: string[]; rows: ReactNode[][] }) => (
  <div className="not-prose border-border my-4 w-full max-w-full min-w-0 overflow-x-auto rounded-xl border">
    <table className="text-muted-foreground w-full border-collapse text-sm">
      <thead>
        <tr className="border-border bg-muted/30 border-b">
          {head.map((cell) => (
            <th
              className="text-foreground px-3 py-2.5 text-left font-medium"
              key={cell}
            >
              {cell}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          // oxlint-disable-next-line react/no-array-index-key -- rows are static, generated at build time
          <tr
            className="border-border border-b align-top last:border-b-0"
            key={index}
          >
            {row.map((cell, cellIndex) => (
              // oxlint-disable-next-line react/no-array-index-key -- cells are static, generated at build time
              <td className="px-3 py-2.5" key={cellIndex}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/**
 * A screen's reference docs, read from its code at build time
 * (scripts/screen-docs.ts): installation, a usage example that typechecks,
 * its props, backend contract, data types, states, copy and dependencies.
 */
export const ScreenReference = async ({
  detail,
  doc,
}: {
  detail: ScreenDetail;
  doc: ScreenDoc;
}) => {
  const usageHtml = await highlightCode(doc.usage, "tsx");
  const folder = doc.files[0]?.split("/").slice(0, -1).join("/") ?? "";
  const required = doc.props.filter((p) => p.required).map((p) => p.name);
  const actions = doc.props.filter((p) => p.type.startsWith("Action<"));
  const sourceUrl = `${GITHUB_REPO_URL}/tree/main/apps/runtime/src/pages/showcase/${detail.files[0]?.split("/")[0] ?? ""}`;

  return (
    <>
      <Section id="installation" title="Installation">
        <ComponentInstallation name={detail.registry} />
      </Section>

      <Section id="usage" title="Usage">
        <p>
          The CLI writes the screen to <Code>{folder}/</Code>. Render{" "}
          <Code>{doc.component}</Code> with your data; this example uses the
          screen&apos;s fixtures in place of your API&apos;s responses
          {actions.length > 0
            ? ", and each action is where you call your backend"
            : ""}
          .
        </p>
        <CodeBlock
          className="my-0 rounded-xl"
          code={doc.usage}
          title="usage.tsx"
        >
          <div
            className="w-full text-sm [&_pre]:p-4 [&_pre]:focus-visible:outline-none"
            // oxlint-disable-next-line react/no-danger -- pre-highlighted code html generated at build time
            dangerouslySetInnerHTML={{ __html: usageHtml }}
            data-code-block
          />
        </CodeBlock>
        <p>
          Wrap your app once in <Code>WirefrontProvider</Code> for your
          router&apos;s links, toasts, locale, currency, copy and permissions.{" "}
          <Link href="/docs/wiring">Wiring a screen</Link> covers the provider,
          actions and errors.
        </p>
      </Section>

      {doc.props.length > 0 ? (
        <Section id="props" title="Props">
          <p>
            {required.length > 0 ? (
              <>
                Required:{" "}
                {required.map((name, i) => (
                  <span key={name}>
                    {i > 0 ? ", " : null}
                    <Code>{name}</Code>
                  </span>
                ))}
                .{" "}
              </>
            ) : null}
            Every <Code>Action</Code> returns a promise: resolve with nothing or{" "}
            <Code>ok(data)</Code>, or with{" "}
            <Code>fail(message, fieldErrors)</Code>, or throw; the screen shows
            pending, success and the error itself. An optional action you leave
            out hides its control.
          </p>
          <DocsTypeTable type={typeTable(doc.props)} />
        </Section>
      ) : null}

      {doc.api.length > 0 ? (
        <Section id="backend-contract" title="Backend contract">
          <p>
            The operations <Code>api</Code> in <Code>schema.ts</Code> declares:
            the endpoints your backend answers. Request and response types are
            the zod schemas below, so the same schemas validate on your server.
          </p>
          <Table
            head={["Operation", "Endpoint", "Request", "Response"]}
            rows={doc.api.map((op) => [
              <div className="flex flex-col gap-1" key="op">
                <Code>{op.name}</Code>
                {op.description ? (
                  <span className="text-xs">{op.description}</span>
                ) : null}
                {op.errors.map((e) => (
                  <span className="text-xs" key={e.status}>
                    {e.status}: {e.description}
                  </span>
                ))}
              </div>,
              <Code key="endpoint">
                {op.method} {op.path}
              </Code>,
              <div className="flex flex-col gap-1" key="request">
                {op.params ? (
                  <span>
                    params <Code>{op.params}</Code>
                  </span>
                ) : null}
                {op.query ? (
                  <span>
                    query <Code>{op.query}</Code>
                  </span>
                ) : null}
                {op.request ? (
                  <span>
                    body <Code>{op.request}</Code>
                  </span>
                ) : null}
                {op.params || op.query || op.request ? null : "-"}
              </div>,
              op.response ? (
                <Code key="response">{op.response}</Code>
              ) : (
                "204 No Content"
              ),
            ])}
          />
        </Section>
      ) : null}

      {doc.types.length > 0 ? (
        <Section id="data-types" title="Data types">
          <p>
            Exported from <Code>schema.ts</Code>, each as a zod schema and the
            TypeScript type it infers.
          </p>
          {doc.types.map((type) => (
            <div key={type.name}>
              <h3 id={`type-${type.name.toLowerCase()}`}>{type.name}</h3>
              {type.description ? <p>{type.description}</p> : null}
              {type.alias ? (
                <p>
                  <Code>{type.alias}</Code>
                </p>
              ) : (
                <DocsTypeTable type={typeTable(type.fields)} />
              )}
            </div>
          ))}
        </Section>
      ) : null}

      {detail.states.length > 0 ? (
        <Section id="states" title="States">
          <p>
            The screen renders each of these itself. Switch between them with
            the state control under the preview.
          </p>
          <ul>
            {detail.states.map((state) => (
              <li key={state}>
                <strong>{state}</strong>: {STATE_NOTES[state] ?? ""}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {doc.messages ? (
        <Section id="copy" title="Copy">
          <p>
            Every string the screen shows. Override any of them with{" "}
            <Code>WirefrontProvider messages</Code>, keyed{" "}
            <Code>{`${doc.messages.namespace}.<key>`}</Code>; placeholders in
            braces are filled in by the screen.
          </p>
          <Table
            head={["Key", "Default"]}
            rows={doc.messages.entries.map((entry) => [
              <Code key="key">{`${doc.messages?.namespace}.${entry.key}`}</Code>,
              entry.value,
            ])}
          />
        </Section>
      ) : null}

      {doc.permissions.length > 0 ? (
        <Section id="permissions" title="Permissions">
          <p>
            The screen asks <Code>WirefrontProvider can</Code> before it shows
            these controls; return false to hide them.
          </p>
          <ul>
            {doc.permissions.map((p) => (
              <li key={`${p.action}:${p.resource ?? ""}`}>
                <Code>
                  {p.resource
                    ? `can("${p.action}", "${p.resource}")`
                    : `can("${p.action}")`}
                </Code>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section id="dependencies" title="Dependencies">
        <p>The shadcn CLI installs these along with the screen&apos;s files.</p>
        <Table
          head={["Kind", "Installed"]}
          rows={[
            [
              "npm packages",
              doc.npmDependencies.length
                ? doc.npmDependencies.flatMap((d, i) => [
                    ...(i ? [" "] : []),
                    <Code key={d}>{d}</Code>,
                  ])
                : "-",
            ],
            [
              "shadcn/ui components",
              doc.registryDependencies.length
                ? doc.registryDependencies.flatMap((d, i) => [
                    ...(i ? [" "] : []),
                    <Code key={d}>{d}</Code>,
                  ])
                : "-",
            ],
            [
              "Files",
              <div className="flex flex-col gap-1" key="files">
                {doc.files.map((f) => (
                  <Code key={f}>{f}</Code>
                ))}
              </div>,
            ],
          ]}
        />
      </Section>

      <Section id="quality" title="Quality">
        <ul>
          <li>
            Typechecked under the strictest template settings; its fixtures
            satisfy its schemas.
          </li>
          <li>
            Opened in a real browser at phone and desktop widths in every state
            it declares: no runtime or console errors and zero axe accessibility
            violations (WCAG 2.1 A and AA).
          </li>
          <li>
            Responsive audit at 375, 768, 1024 and 1440 pixels wide, tap targets
            included; reduced motion is respected.
          </li>
          <li>
            Installed by the shadcn CLI into fresh Next.js, Vite and TanStack
            Start apps, which then typecheck and build.
          </li>
          <li>
            Source:{" "}
            <a href={sourceUrl}>
              apps/runtime/src/pages/showcase/{detail.files[0]?.split("/")[0]}
            </a>
            .
          </li>
        </ul>
      </Section>
    </>
  );
};
