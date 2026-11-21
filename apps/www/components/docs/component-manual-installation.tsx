"use client";

import ReactIcon from "@workspace/ui/components/icons/react-icon";
import { Button } from "@workspace/ui/components/ui/button";
import { cn } from "@workspace/ui/lib/utils";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { CodeTabs } from "@/components/docs/code-tabs";
import { CodeBlock, Pre } from "@/components/docs/codeblock";
import {
  DynamicCodeBlock,
  isCodeBlockCached,
} from "@/components/docs/dynamic-codeblock";

/** The package names back from a comma-joined key (package names have no commas). */
const fromKey = (key: string) => (key ? key.split(",") : undefined);

const getDepsCommands = (dependencies?: string[]) => {
  const packageNames = dependencies?.flatMap((dep) => {
    const trimmed = dep.trim();
    return trimmed ? [trimmed] : [];
  });
  if (!packageNames?.length) {
    return;
  }

  return {
    npm: `npm install ${packageNames.join(" ")}`,
    pnpm: `pnpm add ${packageNames.join(" ")}`,
    yarn: `yarn add ${packageNames.join(" ")}`,
    bun: `bun add ${packageNames.join(" ")}`,
  };
};

const getRegistryDepsCommands = (dependencies?: string[]) => {
  const quotedDependencies = dependencies
    ?.flatMap((dep) => {
      const trimmed = dep.trim();
      if (!trimmed) {
        return [];
      }
      if (trimmed.startsWith("https://ui.soralabs.studio/r/")) {
        return [trimmed.replace("https://ui.soralabs.studio/r/", "@soralabs/")];
      }
      if (trimmed.startsWith("https://ui.soralabs.io.vn/r/")) {
        return [trimmed.replace("https://ui.soralabs.io.vn/r/", "@soralabs/")];
      }
      if (trimmed.startsWith("https://")) {
        return [`"${trimmed}"`];
      }
      return [trimmed];
    })
    .join(" ");

  if (!quotedDependencies) {
    return;
  }

  return {
    npm: `npx shadcn@latest add ${quotedDependencies}`,
    pnpm: `pnpm dlx shadcn@latest add ${quotedDependencies}`,
    yarn: `yarn dlx shadcn@latest add ${quotedDependencies}`,
    bun: `bun x --bun shadcn@latest add ${quotedDependencies}`,
  };
};

export interface ManualInstallFile {
  content?: string;
  highlightedHtml?: string;
  path: string;
  target?: string;
}

export interface RegistryFileGroupConfig {
  description?: string;
  files: string[];
  title: string;
}

export interface ManualFileGroup {
  description?: string;
  files: ManualInstallFile[];
  title: string;
}

export interface ComponentManualInstallationProps {
  afterSteps?: ReactNode;
  beforeSteps?: ReactNode;
  children?: ReactNode;
  code?: string;
  dependencies?: string[];
  devDependencies?: string[];
  fileGroups?: RegistryFileGroupConfig[];
  files?: ManualInstallFile[];
  html?: string;
  isActive?: boolean;
  path?: string;
  registryDependencies?: string[];
  shouldRenderCode?: boolean;
}

interface ManualCodeViewerProps {
  code?: string;
  html?: string;
  isActive?: boolean;
  path?: string;
  shouldRenderCode?: boolean;
}

const getExpandButtonContent = (isReady: boolean, isOpen: boolean) => {
  if (!isReady) {
    return "Loading...";
  }
  return isOpen ? "Collapse" : "Expand";
};

const getCollapsedHtml = (fullHtml: string, maxLines = 10): string => {
  const parts = fullHtml.split('<span class="line">');
  if (parts.length <= maxLines) {
    return fullHtml;
  }
  return `${parts.slice(0, maxLines).join('<span class="line">')}</code></pre>`;
};

const ManualCodeViewer = ({
  code,
  html,
  isActive = true,
  path,
  shouldRenderCode = true,
}: ManualCodeViewerProps) => {
  const [isOpened, setIsOpened] = useState(false);
  const [isDynamicReady, setIsDynamicReady] = useState(() =>
    Boolean(code && isCodeBlockCached("tsx", code))
  );
  const prefersReducedMotion = useReducedMotion();
  const prevCodeRef = useRef(code);

  const isCodeReady = Boolean(html) || isDynamicReady;

  const collapsedHtml = useMemo(() => {
    if (!html) {
      return;
    }
    return getCollapsedHtml(html, 10);
  }, [html]);

  const activeHtml = isOpened ? html : collapsedHtml;

  // Collapses again when this tab is no longer active.
  if (!isActive && isOpened) {
    setIsOpened(false);
  }

  useEffect(() => {
    if (prevCodeRef.current !== code) {
      prevCodeRef.current = code;
      setIsDynamicReady(Boolean(code && isCodeBlockCached("tsx", code)));
      setIsOpened(false);
    }
  }, [code]);

  let codeBlockNode: ReactNode;
  if (activeHtml) {
    codeBlockNode = (
      <CodeBlock
        className="my-0 rounded-xl border-0"
        code={code}
        icon={<ReactIcon />}
        title={path}
      >
        <div
          className="w-full text-sm [&_pre]:p-4 [&_pre]:focus-visible:outline-none"
          // oxlint-disable-next-line react/no-danger -- pre-highlighted code html generated at build time
          dangerouslySetInnerHTML={{ __html: activeHtml }}
          data-code-block
        />
      </CodeBlock>
    );
  } else if (code === undefined || !shouldRenderCode) {
    codeBlockNode = (
      <CodeBlock
        allowCopy={false}
        className="my-0 rounded-xl border-0"
        icon={<ReactIcon />}
        title={path}
      >
        <Pre
          className="text-muted-foreground flex items-center justify-center"
          style={{ minHeight: "128px" }}
        >
          <span className="text-sm">Loading...</span>
        </Pre>
      </CodeBlock>
    );
  } else {
    codeBlockNode = (
      <DynamicCodeBlock
        className="my-0 rounded-xl border-0"
        code={code}
        icon={<ReactIcon />}
        lang="tsx"
        loadingMinHeight={128}
        onLoaded={() => setIsDynamicReady(true)}
        title={path}
      />
    );
  }

  return (
    <div className="border-border/60 relative overflow-hidden rounded-xl border">
      <motion.div
        animate={{ height: isOpened && isCodeReady ? "auto" : 128 }}
        className="overflow-hidden rounded-xl"
        initial={false}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
        }
      >
        <div className="[&_.fd-codeblock]:my-0 [&_.fd-codeblock]:rounded-xl [&_.fd-codeblock]:border-0 [&_code]:pb-16 [&_pre]:my-0 [&_pre]:max-h-162.5 [&_pre]:p-4 [&_pre]:focus-visible:outline-none">
          {codeBlockNode}
        </div>
      </motion.div>

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center pb-3 transition-[height,background] duration-300",
          isOpened && isCodeReady
            ? "from-background/90 via-background/40 h-16 bg-linear-to-t to-transparent"
            : "from-background via-background/80 h-24 bg-linear-to-t to-transparent"
        )}
      >
        <Button
          className="border-border/60 bg-background/95 hover:bg-accent pointer-events-auto h-7 rounded-full border px-3 text-xs shadow-xs disabled:cursor-not-allowed disabled:opacity-70"
          disabled={!isCodeReady}
          onClick={() => {
            if (isCodeReady) {
              setIsOpened(!isOpened);
            }
          }}
          type="button"
          variant="secondary"
        >
          {getExpandButtonContent(isCodeReady, isOpened)}
        </Button>
      </div>
    </div>
  );
};

const resolveFileGroups = (
  files: ManualInstallFile[],
  groupConfigs?: RegistryFileGroupConfig[]
): ManualFileGroup[] | null => {
  if (groupConfigs && groupConfigs.length > 0) {
    const assignedFiles = new Set<ManualInstallFile>();
    const groups: ManualFileGroup[] = [];

    for (const config of groupConfigs) {
      const matched = files.filter((f) => {
        if (assignedFiles.has(f)) {
          return false;
        }
        const filename = f.path.split("/").pop();
        const targetname = f.target?.split("/").pop();
        return config.files.some(
          (pattern) =>
            pattern === f.path ||
            pattern === f.target ||
            pattern === filename ||
            pattern === targetname ||
            f.path.endsWith(`/${pattern}`) ||
            Boolean(f.target?.endsWith(`/${pattern}`))
        );
      });

      if (matched.length > 0) {
        for (const m of matched) {
          assignedFiles.add(m);
        }
        groups.push({
          title: config.title,
          description: config.description,
          files: matched,
        });
      }
    }

    const remaining = files.filter((f) => !assignedFiles.has(f));
    if (remaining.length > 0) {
      groups.push({
        title: "Internal implementation",
        files: remaining,
      });
    }

    return groups.length > 0 ? groups : null;
  }

  // Automatic smart grouping when files >= 4 and no custom groups specified
  if (files.length >= 4) {
    const [mainFile] = files;
    if (!mainFile) {
      return null;
    }
    return [
      {
        title: "Main component",
        files: [mainFile],
      },
      {
        title: "Internal implementation",
        files: files.slice(1),
      },
    ];
  }

  return null;
};

interface ManualFilesListProps {
  fileGroups: ManualFileGroup[] | null;
  files: ManualInstallFile[];
  isActive: boolean;
  shouldRenderCode: boolean;
}

const ManualFilesList = ({
  fileGroups,
  files,
  isActive,
  shouldRenderCode,
}: ManualFilesListProps) => {
  if (fileGroups) {
    return (
      <div className="flex flex-col gap-6">
        {fileGroups.map((group) => (
          <div className="flex flex-col gap-2.5" key={group.title}>
            <div className="flex flex-col gap-0.5">
              <span className="text-foreground text-sm tracking-tight">
                {group.title}
              </span>
              {group.description && (
                <p className="text-muted-foreground text-xs">
                  {group.description}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {group.files.map((file) => (
                <ManualCodeViewer
                  code={file.content}
                  html={file.highlightedHtml}
                  isActive={isActive}
                  key={file.path}
                  path={file.target || file.path}
                  shouldRenderCode={shouldRenderCode}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {files.map((file) => (
        <ManualCodeViewer
          code={file.content}
          html={file.highlightedHtml}
          isActive={isActive}
          key={file.path}
          path={file.target || file.path}
          shouldRenderCode={shouldRenderCode}
        />
      ))}
    </div>
  );
};

/** An install step for one kind of dependency; nothing when there are none. */
const DependencyStep = ({
  codes,
  title,
}: {
  codes: Record<string, string> | null | undefined;
  title: string;
}) =>
  codes ? (
    <Step>
      <h4 className="pt-1 pb-4">{title}</h4>
      <CodeTabs codes={codes} />
    </Step>
  ) : null;

export const ComponentManualInstallation = ({
  path,
  dependencies,
  devDependencies,
  registryDependencies,
  code,
  html,
  fileGroups,
  files,
  isActive = true,
  beforeSteps,
  afterSteps,
  children,
  shouldRenderCode = true,
}: ComponentManualInstallationProps) => {
  const depsKey = dependencies?.join(",") ?? "";
  const devDepsKey = devDependencies?.join(",") ?? "";
  const regDepsKey = registryDependencies?.join(",") ?? "";

  // Recomputed from the joined names, so equal arrays reuse the same commands.
  const depsCommands = useMemo(
    () => getDepsCommands(fromKey(depsKey)),
    [depsKey]
  );
  const devDepsCommands = useMemo(
    () => getDepsCommands(fromKey(devDepsKey)),
    [devDepsKey]
  );
  const registryDepsCommands = useMemo(
    () => getRegistryDepsCommands(fromKey(regDepsKey)),
    [regDepsKey]
  );

  const isMultiFile = files !== undefined && files.length > 1;
  const fileGroupsResolved = useMemo(
    () => (isMultiFile ? resolveFileGroups(files, fileGroups) : null),
    [isMultiFile, files, fileGroups]
  );

  return (
    <div className="mt-0 [&_h4]:mt-0!">
      <Steps>
        {beforeSteps}

        <DependencyStep
          codes={depsCommands}
          title="Install the following dependencies:"
        />

        <DependencyStep
          codes={devDepsCommands}
          title="Install the following dev dependencies:"
        />

        <DependencyStep
          codes={registryDepsCommands}
          title="Install the following registry dependencies:"
        />

        {(code !== undefined || Boolean(path) || files?.length) && (
          <Step>
            <h4 className="pt-1 pb-4">
              {isMultiFile
                ? "Create each file below at the path shown in its header:"
                : "Copy and paste the following code into your project:"}
            </h4>
            {isMultiFile ? (
              <ManualFilesList
                fileGroups={fileGroupsResolved}
                files={files}
                isActive={isActive}
                shouldRenderCode={shouldRenderCode}
              />
            ) : (
              <ManualCodeViewer
                code={code}
                html={html}
                isActive={isActive}
                key={path || "manual-viewer"}
                path={path}
                shouldRenderCode={shouldRenderCode}
              />
            )}
          </Step>
        )}

        <Step>
          <h4 className="pt-1 pb-4">
            Update the import paths to match your project setup.
          </h4>
        </Step>

        {children}
        {afterSteps}
      </Steps>
    </div>
  );
};
