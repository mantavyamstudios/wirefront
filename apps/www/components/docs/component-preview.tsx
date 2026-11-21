"use client";

import ReactIcon from "@workspace/ui/components/icons/react-icon";
import { Button } from "@workspace/ui/components/ui/button";
import { cn } from "@workspace/ui/lib/utils";
import { ExternalLink, Fullscreen, Loader } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

import { index, loadComponentHtml, loadComponentSource } from "@/__registry__";
import { CodeBlock, Pre } from "@/components/docs/codeblock";
import { ComponentWrapper } from "@/components/docs/component-wrapper";
import { DynamicCodeBlock } from "@/components/docs/dynamic-codeblock";
import { RefreshButton } from "@/components/docs/refresh";
import { Tweakpane } from "@/components/docs/tweakpane";
import type { Binds } from "@/components/docs/tweakpane";
import { flattenFirstLevel, unwrapValues } from "@/lib/registry/demo-props";
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsHighlight,
  TabsHighlightItem,
  TabsList,
  TabsTrigger,
} from "@/registry/primitives/animate/tabs";

interface ComponentPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  bigScreen?: boolean;
  /** Registry demo item for the Code tab (defaults to `demo-{name}` when present). */
  demo?: string;
  /** Short description rendered below the preview frame. */
  description?: string;
  iframe?: boolean;
  name: string;
}

const UI_FRAMEWORK_PREFIX = /^(?:base|radix)-/u;

type RegistryIndexEntry = (typeof index)[string];

const isCanonicalDemoForItem = (demoName: string, depName: string): boolean => {
  const strippedDep = depName.replace(UI_FRAMEWORK_PREFIX, "");
  return (
    demoName === depName ||
    demoName === `demo-${depName}` ||
    demoName === `demo-${strippedDep}`
  );
};

const resolveDemoProps = (name: string): Record<string, unknown> => {
  const entry = index[name] as RegistryIndexEntry | undefined;
  const direct = entry?.component?.demoProps;
  if (direct && Object.keys(direct).length > 0) {
    return direct;
  }

  const demoEntry = index[`demo-${name}`] as RegistryIndexEntry | undefined;
  const fromDemo = demoEntry?.component?.demoProps;
  if (fromDemo && Object.keys(fromDemo).length > 0) {
    return fromDemo;
  }

  for (const dep of entry?.registryDependencies ?? []) {
    if (isCanonicalDemoForItem(name, dep)) {
      const inherited = (index[dep] as RegistryIndexEntry | undefined)
        ?.component?.demoProps;
      if (inherited && Object.keys(inherited).length > 0) {
        return inherited;
      }
    }
  }

  return {};
};

/** Usage example source for the Code tab; preview still uses `name`. */
const resolveUsageCodeEntry = (
  previewName: string,
  explicitDemo?: string
): RegistryIndexEntry | undefined => {
  if (explicitDemo) {
    const entry = index[explicitDemo] as RegistryIndexEntry | undefined;
    if (entry?.hasSource || entry?.files?.length) {
      return entry;
    }
  }

  const autoDemoName = `demo-${previewName}`;
  const autoEntry = index[autoDemoName] as RegistryIndexEntry | undefined;
  if (autoEntry?.hasSource || autoEntry?.files?.length) {
    return autoEntry;
  }

  return index[previewName] as RegistryIndexEntry | undefined;
};

/** The demo's source: pre-highlighted HTML, then raw code, then a loading placeholder. */
const UsageCodeBlock = ({
  staticHtml,
  staticContent,
  title,
  minHeight,
}: {
  staticHtml: string | null;
  staticContent: string | null;
  title: string;
  minHeight: number;
}): ReactNode => {
  if (staticHtml) {
    return (
      <CodeBlock
        className="my-0 rounded-none border-0"
        code={staticContent ?? undefined}
        icon={<ReactIcon />}
        title={title}
      >
        <div
          className="w-full text-sm [&_pre]:my-0 [&_pre]:bg-transparent [&_pre]:p-4 [&_pre]:focus-visible:outline-none"
          // oxlint-disable-next-line react/no-danger -- pre-highlighted code html generated at build time
          dangerouslySetInnerHTML={{ __html: staticHtml }}
          data-code-block
        />
      </CodeBlock>
    );
  }
  if (staticContent) {
    return (
      <DynamicCodeBlock
        code={staticContent}
        icon={<ReactIcon />}
        lang="tsx"
        loadingMinHeight={minHeight}
        title={title}
      />
    );
  }
  return (
    <CodeBlock
      allowCopy={false}
      className="my-0 rounded-none border-0"
      icon={<ReactIcon />}
      title={title}
    >
      <Pre
        className="text-muted-foreground flex items-center justify-center gap-2"
        style={{ minHeight: `${minHeight}px` }}
      >
        <Loader aria-hidden className="size-4 animate-spin" />
        <span className="text-sm">Loading code…</span>
      </Pre>
    </CodeBlock>
  );
};

/** A demo's source and highlighted HTML; a failure is logged and the Code tab loads it when opened. */
const fetchSource = async (
  sourceName: string
): Promise<[string | null, string | null]> => {
  try {
    const [code, html] = await Promise.all([
      loadComponentSource(sourceName),
      loadComponentHtml(sourceName),
    ]);
    return [code ?? null, html ?? null];
  } catch (error) {
    console.warn(
      `[component preview] couldn't preload the source of ${sourceName}; the Code tab loads it when opened`,
      error
    );
    return [null, null];
  }
};

export const ComponentPreview = ({
  name,
  demo,
  description,
  className,
  iframe = false,
  bigScreen = false,
  ...props
}: ComponentPreviewProps) => {
  const [binds, setBinds] = useState<Binds | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [activeTab, setActiveTab] = useState("preview");
  const [staticContent, setStaticContent] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [staticHtml, setStaticHtml] = useState<string | null>(null);
  const previousPropsSnapshot = useRef<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(previewRef, {
    margin: "200px 0px",
    once: true,
  });

  const demoPropsConfig = useMemo(() => resolveDemoProps(name), [name]);

  // The Tweakpane controls start from the demo's configured props.
  const [lastPropsConfig, setLastPropsConfig] = useState<
    typeof demoPropsConfig | null
  >(null);
  if (lastPropsConfig !== demoPropsConfig) {
    setLastPropsConfig(demoPropsConfig);
    setBinds(
      Object.keys(demoPropsConfig).length === 0
        ? null
        : (demoPropsConfig as Binds)
    );
  }
  const componentProps = useMemo(
    () => (binds ? unwrapValues(binds) : null),
    [binds]
  );

  const usageCodeMeta = useMemo(() => {
    const entry = resolveUsageCodeEntry(name, demo);
    const file = entry?.files?.[0];
    const sourceName = entry?.name ?? demo ?? `demo-${name}`;

    return {
      sourceName,
      title: file?.target?.split("/").pop() ?? `${demo ?? `demo-${name}`}.tsx`,
    };
  }, [name, demo]);

  const { sourceName } = usageCodeMeta;
  const [hasOpenedCode, setHasOpenedCode] = useState(false);
  const shouldRenderCode = hasOpenedCode || activeTab === "code";
  const previewPaneRef = useRef<HTMLDivElement>(null);
  const [previewHeight, setPreviewHeight] = useState(496);

  // A different source starts with no preloaded code.
  const [lastSourceName, setLastSourceName] = useState(sourceName);
  if (lastSourceName !== sourceName) {
    setLastSourceName(sourceName);
    setStaticContent(null);
    setStaticHtml(null);
  }

  const hasSource = staticContent !== null && staticHtml !== null;
  const applySource = useCallback(
    ([code, html]: [string | null, string | null]) => {
      if (code) {
        setStaticContent(code);
      }
      if (html) {
        setStaticHtml(html);
      }
    },
    []
  );
  const preloadSource = useCallback(async () => {
    if (hasSource || !sourceName) {
      return;
    }
    applySource(await fetchSource(sourceName));
  }, [sourceName, hasSource, applySource]);

  // Preloads once the preview scrolls near, so the Code tab opens at once.
  useEffect(() => {
    if (!isInView || hasSource || !sourceName) {
      return;
    }
    let cancelled = false;
    const load = async () => {
      const source = await fetchSource(sourceName);
      if (!cancelled) {
        applySource(source);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isInView, hasSource, sourceName, applySource]);

  if (activeTab === "code" && !hasOpenedCode) {
    setHasOpenedCode(true);
  }

  useEffect(() => {
    const el = previewPaneRef.current;
    if (!el) {
      return;
    }
    const updateHeight = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) {
        setPreviewHeight(Math.round(h));
      }
    };
    // The observer reports the first size as soon as it starts observing.
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const preview = useMemo(() => {
    if (!isInView) {
      return null;
    }

    const Component = index[name]?.component;
    const initialProps =
      Object.keys(demoPropsConfig).length === 0
        ? null
        : unwrapValues(demoPropsConfig);

    if (!Component) {
      console.error(`Component with name "${name}" not found in registry.`);
      return (
        <p className="text-muted-foreground text-sm">
          Component{" "}
          <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm">
            {name}
          </code>{" "}
          not found in registry.
        </p>
      );
    }

    const resolvedProps = flattenFirstLevel<Record<string, unknown>>(
      componentProps ?? initialProps ?? {}
    );

    return <Component {...resolvedProps} key={JSON.stringify(resolvedProps)} />;
  }, [name, componentProps, demoPropsConfig, isInView]);

  useEffect(() => {
    if (componentProps === null) {
      return;
    }

    const snapshot = JSON.stringify(componentProps);

    if (previousPropsSnapshot.current === null) {
      previousPropsSnapshot.current = snapshot;
      return;
    }

    if (previousPropsSnapshot.current === snapshot) {
      return;
    }

    previousPropsSnapshot.current = snapshot;
    setPreviewKey((current) => current + 1);
  }, [componentProps]);

  const codeBlockNode = (
    <UsageCodeBlock
      minHeight={previewHeight}
      staticContent={staticContent}
      staticHtml={staticHtml}
      title={usageCodeMeta.title}
    />
  );

  return (
    <div
      className={cn("not-prose my-4 w-full lg:max-w-[120ch]", className)}
      ref={previewRef}
      {...props}
    >
      <div
        className="border-border/50 relative overflow-hidden rounded-2xl border"
        id="component-preview"
      >
        <Tabs
          className="w-full gap-0"
          onValueChange={setActiveTab}
          value={activeTab}
        >
          <div
            className="border-border/50 flex h-11 items-center justify-between border-b px-3"
            id="component-preview-tab-list"
          >
            <TabsList className="flex items-center gap-0.5">
              <TabsHighlight
                className="bg-muted h-full rounded-md"
                containerClassName="flex"
                mode="parent"
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <TabsHighlightItem value="preview">
                  <TabsTrigger
                    className="text-muted-foreground data-[state=active]:text-foreground relative z-10 h-7 rounded-md px-3 text-sm transition-colors"
                    value="preview"
                  >
                    Preview
                  </TabsTrigger>
                </TabsHighlightItem>
                {usageCodeMeta.sourceName ? (
                  <TabsHighlightItem value="code">
                    <TabsTrigger
                      className="text-muted-foreground data-[state=active]:text-foreground relative z-10 h-7 rounded-md px-3 text-sm transition-colors"
                      onFocus={preloadSource}
                      onMouseEnter={preloadSource}
                      value="code"
                    >
                      Code
                    </TabsTrigger>
                  </TabsHighlightItem>
                ) : null}
              </TabsHighlight>
            </TabsList>
          </div>

          <TabsContents>
            <TabsContent
              animate={{ opacity: 1 }}
              className="relative h-full"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              value="preview"
            >
              <div className="relative" ref={previewPaneRef}>
                {/* top actions */}
                <div className="absolute top-0 right-2 z-10 flex h-12 items-center justify-end gap-1.5 px-2 sm:right-6">
                  <RefreshButton
                    onRefresh={() => setPreviewKey((prev) => prev + 1)}
                  />

                  <Button
                    aria-label="Open full page example"
                    className="hover:bg-foreground/5 dark:hover:bg-foreground/10 rounded-lg bg-transparent"
                    onClick={() =>
                      window.open(
                        `/examples/${name}`,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                    size="icon-sm"
                    title="Open full page example"
                    variant="ghost"
                  >
                    <ExternalLink size={14} />
                  </Button>

                  {iframe ? (
                    <Button
                      asChild
                      className="flex items-center rounded-lg"
                      size="icon-sm"
                      variant="neutral"
                    >
                      <motion.button
                        whileHover={
                          prefersReducedMotion ? undefined : { scale: 1.05 }
                        }
                      >
                        <Fullscreen aria-label="fullscreen-btn" size={14} />
                      </motion.button>
                    </Button>
                  ) : null}
                </div>

                {/* top dashed */}
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute top-12 left-0 h-px w-full"
                >
                  <line
                    className="text-border"
                    stroke="currentColor"
                    strokeDasharray="8 4"
                    strokeWidth="1"
                    x1="0"
                    x2="100%"
                    y1="0"
                    y2="0"
                  />
                </svg>
                {/* left dashed */}
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 left-6 hidden h-full w-px sm:block"
                >
                  <line
                    className="text-border"
                    stroke="currentColor"
                    strokeDasharray="8 4"
                    strokeWidth="1"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="100%"
                  />
                </svg>
                {/* right dashed */}
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 right-6 hidden h-full w-px sm:block"
                >
                  <line
                    className="text-border"
                    stroke="currentColor"
                    strokeDasharray="8 4"
                    strokeWidth="1"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="100%"
                  />
                </svg>

                {/* preview area */}
                <div className="px-0 pt-12 pb-6 sm:px-6">
                  <ComponentWrapper
                    bigScreen={bigScreen}
                    iframe={iframe}
                    key={previewKey}
                    name={name}
                  >
                    {isInView ? (
                      <Suspense
                        fallback={
                          <div className="text-muted-foreground flex items-center text-sm">
                            <Loader className="mr-2 size-4 animate-spin" />
                            Loading...
                          </div>
                        }
                      >
                        {preview}
                      </Suspense>
                    ) : (
                      <div className="text-muted-foreground flex min-h-50 items-center justify-center text-sm">
                        <Loader className="mr-2 size-4 animate-spin" />
                        Loading...
                      </div>
                    )}
                  </ComponentWrapper>
                </div>

                {/* tweakpane & separator — only shown when props exist */}
                <AnimatePresence>
                  {binds ? (
                    <>
                      {/* bottom dashed separator */}
                      <svg aria-hidden="true" className="block h-px w-full">
                        <line
                          className="text-border"
                          stroke="currentColor"
                          strokeDasharray="8 4"
                          strokeWidth="1"
                          x1="0"
                          x2="100%"
                          y1="0"
                          y2="0"
                        />
                      </svg>
                      <motion.div
                        animate={{ opacity: 1, height: "auto" }}
                        className="overflow-hidden"
                        exit={{ opacity: 0, height: 0 }}
                        initial={{ opacity: 0, height: 0 }}
                        key="tweakpane"
                        transition={
                          prefersReducedMotion
                            ? { duration: 0 }
                            : {
                                type: "spring",
                                stiffness: 400,
                                damping: 20,
                              }
                        }
                      >
                        <div className="w-full px-3 py-4 sm:px-6">
                          <Tweakpane
                            binds={binds}
                            initialBinds={demoPropsConfig as Binds}
                            onBindsChange={setBinds}
                            onReset={() => {
                              setBinds(demoPropsConfig as Binds);
                              setPreviewKey((prev) => prev + 1);
                            }}
                          />
                        </div>
                      </motion.div>
                    </>
                  ) : null}
                </AnimatePresence>
              </div>
            </TabsContent>

            {usageCodeMeta.sourceName ? (
              <TabsContent
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                value="code"
              >
                {shouldRenderCode ? (
                  <div className="relative w-full overflow-hidden **:data-[slot=codeblock-viewport]:max-h-125 [&_.fd-codeblock]:my-0 [&_.fd-codeblock]:rounded-none [&_.fd-codeblock]:border-0">
                    {codeBlockNode}
                  </div>
                ) : null}
              </TabsContent>
            ) : null}
          </TabsContents>
        </Tabs>
      </div>

      {description ? (
        <div className="flex items-center justify-center pt-3 text-center">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default ComponentPreview;
